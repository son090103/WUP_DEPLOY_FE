import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Edit,
  ChevronLeft,
  ChevronRight,
  X,
  Save,
  Loader2,
  Search as SearchIcon,
  Plus,
} from "lucide-react";

type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type RoleRef = {
  _id?: string;
  name?: string;
  description?: string;
};

type AccountModel = {
  _id?: string;
  name?: string;
  phone?: string;
  email?: string;
  role?: RoleRef | string;
  status?: string;
  createdAt?: string;
  created_at?: string;
  [k: string]: unknown;
};

type UserRow = {
  id?: string;
  name: string;
  contact: string; // phone or email if present
  role: string;
  created_at?: string;
  raw?: AccountModel;
};

const getRoleStyle = (role: string) => {
  const lower = (role ?? "").toLowerCase();

  // Provide a broad, diverse palette for common role names.
  // Order matters: check more specific keywords first.
  if (lower.includes("admin")) {
    // red
    return "bg-red-100 text-red-800 border border-red-200";
  }
  if (
    lower.includes("tài xế") ||
    lower.includes("driver") ||
    lower.includes("tài")
  ) {
    // orange
    return "bg-orange-100 text-orange-800 border border-orange-200";
  }
  if (
    lower.includes("lễ tân") ||
    lower.includes("lê tân") ||
    lower.includes("reception")
  ) {
    // green
    return "bg-green-100 text-green-800 border border-green-200";
  }
  if (
    lower.includes("phụ xe") ||
    lower.includes("lơ xe") ||
    lower.includes("phụ") ||
    lower.includes("lơ")
  ) {
    // blue
    return "bg-blue-100 text-blue-800 border border-blue-200";
  }
  if (lower.includes("quản lý") || lower.includes("quản")) {
    // purple
    return "bg-violet-100 text-violet-800 border border-violet-200";
  }
  if (
    lower.includes("kế toán") ||
    lower.includes("thu chi") ||
    lower.includes("finance")
  ) {
    // yellow
    return "bg-yellow-100 text-yellow-800 border border-yellow-200";
  }
  if (
    lower.includes("kỹ thuật") ||
    lower.includes("ky thuat") ||
    lower.includes("tech")
  ) {
    // indigo
    return "bg-indigo-100 text-indigo-800 border border-indigo-200";
  }
  if (
    lower.includes("dịch vụ") ||
    lower.includes("service") ||
    lower.includes("support")
  ) {
    // teal
    return "bg-teal-100 text-teal-800 border border-teal-200";
  }
  if (lower.includes("bảo trì") || lower.includes("maintenance")) {
    // pink
    return "bg-pink-100 text-pink-800 border border-pink-200";
  }

  // Fallback neutral style for unknown roles
  return "bg-gray-100 text-gray-700 border border-gray-200";
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const extractMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;
  if (typeof payload.message === "string") return payload.message;
  if (isRecord(payload.data) && typeof payload.data.message === "string")
    return payload.data.message;
  return undefined;
};

const extractAccounts = (payload: unknown): AccountModel[] => {
  // payload can be an array or an object with data/accounts
  if (Array.isArray(payload)) {
    // shallow check: array of records
    if (payload.every(isRecord))
      return (payload as AccountModel[]).map((p) => p);
    return [];
  }
  if (!isRecord(payload)) return [];

  const p = payload as Record<string, unknown>;

  if (isRecord(p.data)) {
    const d = p.data as Record<string, unknown>;
    if (Array.isArray(d.accounts) && d.accounts.every(isRecord))
      return d.accounts as AccountModel[];
    if (Array.isArray(d) && d.every(isRecord)) return d as AccountModel[];
  }

  if (Array.isArray(p.accounts) && p.accounts.every(isRecord))
    return p.accounts as AccountModel[];

  if (Array.isArray(p.data) && p.data.every(isRecord))
    return p.data as AccountModel[];

  // fallback: empty
  return [];
};

const ManageUser: React.FC = () => {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState<string>("");

  // Modal / form
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    contact: string;
    role: string;
  }>({
    name: "",
    contact: "",
    role: "",
  });
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // profile dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!profileRef.current) return;
      if (!(e.target instanceof Node)) return;
      if (!profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const url =
        "http://localhost:3000/api/admin/check/accounts?page=1&limit=200";
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      // typed parsed response to use ApiResponse and avoid unused declaration
      const parsed = (await res
        .json()
        .catch(() => ({} as unknown))) as ApiResponse<unknown>;
      if (!res.ok) {
        const msg =
          extractMessage(parsed) ?? "Không thể lấy danh sách người dùng";
        throw new Error(msg);
      }

      // accept both parsed.data (standard) or parsed itself when API returns array/object directly
      const rawAccounts = extractAccounts(parsed.data ?? parsed);
      const normalized: UserRow[] = rawAccounts.map((a) => {
        const roleName =
          typeof a.role === "string"
            ? a.role
            : isRecord(a.role)
            ? (a.role as RoleRef).name ?? "Không xác định"
            : "Không xác định";
        const contact =
          typeof a.phone === "string" && a.phone.trim() !== ""
            ? a.phone
            : typeof a.email === "string" && a.email.trim() !== ""
            ? a.email
            : "—";
        const created =
          (a.created_at as string) ?? (a.createdAt as string) ?? undefined;
        return {
          id: a._id,
          name: a.name ?? "N/A",
          contact,
          role: roleName ?? "Không xác định",
          created_at: created,
          raw: a,
        };
      });

      setUsers(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = u.name?.toLowerCase?.() ?? "";
      const contact = u.contact?.toLowerCase?.() ?? "";
      const role = u.role?.toLowerCase?.() ?? "";
      return name.includes(q) || contact.includes(q) || role.includes(q);
    });
  }, [users, searchTerm]);

  const handleEdit = (user: UserRow) => {
    setSelectedUser(user);
    setFormData({ name: user.name, contact: user.contact, role: user.role });
    setUpdateError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setUpdateError(null);
  };

  type UpdateAccountPayload = {
    name?: string;
    phone?: string;
    email?: string;
    role?: string;
  };

  const handleUpdate = async () => {
    if (!selectedUser?.id) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const payload: UpdateAccountPayload = {};
      if (formData.name && formData.name.trim() !== "")
        payload.name = formData.name.trim();
      if (formData.contact && formData.contact.trim() !== "") {
        const digits = String(formData.contact).replace(/\D/g, "");
        if (digits.length >= 7 && digits.length <= 15)
          payload.phone = formData.contact.trim();
        else payload.email = formData.contact.trim();
      }
      if (formData.role && formData.role.trim() !== "")
        payload.role = formData.role.trim();

      const res = await fetch(
        `http://localhost:3000/api/admin/check/accounts/${selectedUser.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      // typed parsed response to use ApiResponse
      const parsed = (await res
        .json()
        .catch(() => ({} as unknown))) as ApiResponse<unknown>;
      if (!res.ok) {
        const msg = extractMessage(parsed) ?? "Cập nhật thất bại";
        throw new Error(msg);
      }

      await fetchUsers();
      closeModal();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Lỗi khi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const fmtDate = (iso?: string) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(d.getTime())) return String(iso);
    return d.toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-extrabold text-orange-600 tracking-tight">
              BUSTRIP
            </div>
            <div className="hidden sm:block text-sm text-gray-500">
              Quản lý người dùng
            </div>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <button className="px-3 py-1 rounded-md text-gray-600 hover:bg-gray-50 transition-colors">
              Chế độ tối
            </button>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((s) => !s)}
                className="flex items-center gap-3 px-2 py-1 rounded-full hover:bg-gray-100 transition"
                aria-haspopup="true"
                aria-expanded={profileOpen}
                title="Tài khoản"
              >
                <div className="h-9 w-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-medium">
                  AD
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-sm font-medium text-gray-900">
                    Admin
                  </span>
                  <span className="text-xs text-gray-500">
                    admin@example.com
                  </span>
                </div>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50 py-2">
                  <div className="px-4 py-3 border-b">
                    <div className="text-sm font-medium text-gray-900">
                      Admin
                    </div>
                    <div className="text-xs text-gray-500">
                      admin@example.com
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      window.location.href = "/admin/profile";
                      setProfileOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Trang cá nhân
                  </button>
                  <button
                    onClick={() => {
                      localStorage.removeItem("accessToken");
                      window.location.reload();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-md border">
            <div className="text-sm text-gray-500 mb-1">Tổng số nhân sự</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{users.length}</span>
              <span className="text-green-600 text-sm font-medium">+0%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border">
            <div className="text-sm text-gray-500 mb-1">Admin</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {users.filter((u) => u.role.toLowerCase() === "admin").length}
              </span>
              <span className="text-purple-600 text-sm font-medium">+0%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border">
            <div className="text-sm text-gray-500 mb-1">Quản lý</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {
                  users.filter(
                    (u) =>
                      u.role.toLowerCase().includes("tân") ||
                      u.role.toLowerCase() === "quản lý"
                  ).length
                }
              </span>
              <span className="text-green-600 text-sm font-medium">+0%</span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => (window.location.href = "/admin/accounts/new")}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              title="Thêm nhân sự mới"
            >
              <Plus size={16} />
              Thêm nhân sự
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow border p-5">
            <ul className="space-y-3">
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                📊 Tổng quan
              </li>
              <li className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 font-medium rounded-lg">
                🔒 Quản lý phân quyền
              </li>
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                🚌 Quản lý tuyến xe
              </li>
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                🚍 Quản lý xe
              </li>
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                💰 Quản lý thu chi
              </li>
            </ul>
          </div>

          <div className="lg:col-span-9 bg-white rounded-xl shadow border overflow-hidden">
            <div className="border-b px-6 pt-5 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Danh sách nhân sự
                </h3>
                <p className="text-sm text-gray-500">
                  Quản lý tài khoản và phân quyền
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full sm:w-80 shadow-sm">
                  <SearchIcon size={16} className="text-gray-500" />
                  <input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Tìm tên, số điện thoại hoặc vai trò"
                    className="ml-3 w-full bg-transparent outline-none text-sm text-gray-700"
                  />
                </div>
                <button
                  onClick={() => setSearchTerm("")}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  Đang tải danh sách nhân sự...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">Lỗi: {error}</div>
              ) : (
                <table className="w-full min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <th className="px-6 py-3">Họ tên</th>
                      <th className="px-6 py-3">Liên hệ</th>
                      <th className="px-6 py-3">Vai Trò</th>
                      <th className="px-6 py-3 text-right w-24"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          Không tìm thấy nhân sự phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u, idx) => (
                        <tr
                          key={u.id ?? idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-gray-900">
                            {u.name}
                            <div className="text-xs text-gray-500 mt-1">
                              {fmtDate(u.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {u.contact}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getRoleStyle(
                                u.role
                              )}`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleEdit(u)}
                              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-white hover:bg-orange-500 transition"
                              title="Chỉnh sửa"
                            >
                              <Edit size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            <div className="px-6 py-4 border-t flex items-center justify-between text-sm text-gray-600">
              <div>
                Hiển thị 1–{Math.min(10, filteredUsers.length)} của{" "}
                {filteredUsers.length} người
              </div>
              <div className="flex items-center gap-1">
                <button
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft size={18} />
                </button>
                <button className="px-3 py-1 bg-orange-500 text-white rounded font-medium">
                  1
                </button>
                <button
                  className="px-3 py-1 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled
                >
                  2
                </button>
                <button
                  className="p-2 rounded hover:bg-gray-100 disabled:opacity-50"
                  disabled
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Chỉnh sửa:{" "}
                <span className="text-orange-600 font-medium">
                  {selectedUser.name}
                </span>
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-800"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ tên
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Liên hệ (số điện thoại hoặc email)
                </label>
                <input
                  type="text"
                  value={formData.contact}
                  onChange={(e) =>
                    setFormData({ ...formData, contact: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vai Trò
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="Admin">Admin</option>
                  <option value="Lê Tân">Lê Tân / Quản lý</option>
                  <option value="Tài xế">Tài xế</option>
                  <option value="Lơ xe">Lơ xe</option>
                  <option value="Không xác định">Không xác định</option>
                </select>
              </div>

              {updateError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {updateError}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button
                onClick={closeModal}
                disabled={updating}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg flex items-center gap-2 hover:shadow-lg disabled:opacity-50"
              >
                {updating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Đang lưu...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUser;
