import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
    Edit, X, Save, Loader2, ChevronLeft, ChevronRight,
    UserPlus, MapPin, Lock, User, ShieldCheck,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

/* ─────────────────────────── Types ─────────────────────────── */
type ApiResponse<T = unknown> = {
    success?: boolean;
    message?: string;
    data?: T;
};

type RoleOption = {
    _id: string;
    name: string;
    description?: string;
    isActive?: boolean;
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
    contact: string;
    role: string;
    roleId?: string;
    roleName?: string;
    status?: string;
    raw?: AccountModel;
};

type StopOption = {
    _id: string;
    name: string;
    province?: string;
};



const STATUS_OPTIONS = [
    { value: "active", label: "Hoạt động" },
    { value: "inactive", label: "Tạm khóa" },
    { value: "banned", label: "Chặn" },
];

const ROLE_NAMES_NEEDING_STOP = ["DRIVER", "BUS_ASSISTANT"];

/* ─────────────────────────── Helpers ───────────────────────── */
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
    if (Array.isArray(payload) && payload.every(isRecord)) return payload as AccountModel[];
    if (!isRecord(payload)) return [];
    const p = payload as Record<string, unknown>;
    if (isRecord(p.data)) {
        const d = p.data as Record<string, unknown>;
        if (Array.isArray(d.accounts) && d.accounts.every(isRecord)) return d.accounts as AccountModel[];
        if (Array.isArray(d) && (d as unknown[]).every(isRecord)) return d as AccountModel[];
    }
    if (Array.isArray(p.accounts) && p.accounts.every(isRecord)) return p.accounts as AccountModel[];
    if (Array.isArray(p.data) && (p.data as unknown[]).every(isRecord)) return p.data as AccountModel[];
    return [];
};

const getRoleDisplayName = (roleName: string): string => {
    const lower = (roleName ?? "").toLowerCase();
    if (lower.includes("customer") || lower.includes("khách")) return "Khách hàng";
    if (lower.includes("reception")) return "Lễ Tân";
    if (lower.includes("driver") && !lower.includes("assistant")) return "Tài xế";
    if (lower.includes("assistant") || lower.includes("lơ xe") || lower.includes("phụ xe")) return "Lơ xe";
    return roleName || "—";
};

const getRoleStyle = (roleName: string) => {
    const lower = (roleName ?? "").toLowerCase();
    if (lower.includes("customer") || lower.includes("khách")) return "bg-[#F3E5F5] text-violet-800";
    if (lower.includes("tài xế") || lower.includes("driver") || lower.includes("tài")) return "bg-[#FFF3E0] text-amber-800";
    if (lower.includes("lễ tân") || lower.includes("reception")) return "bg-[#E8F5E9] text-green-800";
    if (lower.includes("phụ") || lower.includes("lơ") || lower.includes("assistant")) return "bg-[#E3F2FD] text-blue-800";
    return "bg-gray-100 text-gray-700";
};

const authHeaders = () => {
    const token = localStorage.getItem("accessToken") ?? "";
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

/* ─────────────────────────── Sub-components ────────────────── */
const Field: React.FC<{
    label: string;
    required?: boolean;
    icon?: React.ReactNode;
    children: React.ReactNode;
}> = ({ label, required, icon, children }) => (
    <div>
        <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-1.5">
            {icon && <span className="text-[#FF5722]">{icon}</span>}
            {label}
            {required && <span className="text-red-400 normal-case tracking-normal ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const inputCls =
    "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-4 py-3 text-sm font-semibold text-[#4a3426] placeholder-[#c4a88a] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20";

const selectCls =
    "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-4 py-3 text-sm font-semibold text-[#4a3426] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20 cursor-pointer";



const StatusBadge: React.FC<{ status?: string }> = ({ status }) => {
    const cfg =
        status === "active" ? { cls: "bg-green-50 text-green-700 border-green-200", dot: "bg-green-500", label: "Hoạt động" }
            : status === "inactive" ? { cls: "bg-amber-50 text-amber-700 border-amber-200", dot: "bg-amber-500", label: "Tạm khóa" }
                : { cls: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", label: "Chặn" };
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${cfg.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

/* ═══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════ */
const ManageUser: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [roles, setRoles] = useState<RoleOption[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    const [activeTab, setActiveTab] = useState<"list" | "search">("list");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: "", contact: "", roleId: "", roleName: "", status: "active",
    });
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);


    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addFormData, setAddFormData] = useState({
        name: "",
        phone: "",
        password: "",
        roleId: "",
        roleName: "",
        currentStopId: "",   // ObjectId của Stop – gửi thành current_stop_id
    });
    const [addError, setAddError] = useState<string | null>(null);
    const [creating, setCreating] = useState(false);

    const [stops, setStops] = useState<StopOption[]>([]);
    const [stopsLoading, setStopsLoading] = useState(false);

    const [statusUpdating, setStatusUpdating] = useState<Record<string, boolean>>({});

    /* ═══ Fetch roles ═══ */
    const fetchRoles = async () => {
        setRolesLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/roles`, { headers: authHeaders() });
            const parsed = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
            const list: RoleOption[] = Array.isArray(parsed.data) ? parsed.data as RoleOption[] : [];
            setRoles(list);
        } catch {
            setRoles([]);
        } finally {
            setRolesLoading(false);
        }
    };

    /* ═══ Fetch users ═══ */
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/accounts?page=1&limit=200`, { headers: authHeaders() });
            const parsed = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
            if (!res.ok) throw new Error(extractMessage(parsed) ?? "Không thể lấy danh sách người dùng");
            const rawAccounts = extractAccounts(parsed.data ?? parsed);
            const normalized: UserRow[] = rawAccounts.map((a) => {
                const roleObj = isRecord(a.role) ? (a.role as RoleRef) : null;
                const roleName = roleObj?.name ?? (typeof a.role === "string" ? a.role : "");
                const roleId = roleObj?._id ?? "";
                return {
                    id: a._id,
                    name: a.name ?? "N/A",
                    contact: typeof a.phone === "string" && a.phone.trim() ? a.phone : "—",
                    role: getRoleDisplayName(roleName),
                    roleId,
                    roleName,
                    status: a.status ?? "active",
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

    /* ═══ Fetch stops ═══ */
    const fetchStops = async () => {
        setStopsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/getAllStops`, { headers: authHeaders() });
            const data = await res.json();
            const list: StopOption[] =
                Array.isArray(data) ? data
                    : Array.isArray(data?.data) ? data.data
                        : Array.isArray(data?.data?.stops) ? data.data.stops : [];
            setStops(list);
        } catch {
            setStops([]);
        } finally {
            setStopsLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); fetchRoles(); }, []);

    /* ═══ Update status nhanh trên bảng ═══ */
    const handleStatusChange = async (userId: string, newStatus: string) => {
        setStatusUpdating((prev) => ({ ...prev, [userId]: true }));
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/accounts/${userId}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ status: newStatus }),
            });
            const parsed = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
            if (!res.ok) throw new Error(extractMessage(parsed) ?? "Cập nhật trạng thái thất bại");
            setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, status: newStatus } : u));
        } catch (err) {
            alert(err instanceof Error ? err.message : "Lỗi khi cập nhật trạng thái");
        } finally {
            setStatusUpdating((prev) => ({ ...prev, [userId]: false }));
        }
    };

    /* ═══ Filter / Paginate ═══ */
    const filteredUsers = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        if (!q) return users;
        return users.filter((u) =>
            (u.name?.toLowerCase() ?? "").includes(q) ||
            (u.contact?.toLowerCase() ?? "").includes(q) ||
            (u.role?.toLowerCase() ?? "").includes(q)
        );
    }, [users, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredUsers.length / itemsPerPage));
    const paginatedUsers = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredUsers.slice(start, start + itemsPerPage);
    }, [filteredUsers, currentPage]);



    const closeModal = () => { setIsModalOpen(false); setSelectedUser(null); setUpdateError(null); };

    const handleUpdate = async () => {
        if (!selectedUser?.id) return;
        setUpdating(true);
        setUpdateError(null);
        try {
            const payload: Record<string, string> = {};
            if (formData.name?.trim()) payload.name = formData.name.trim();
            if (formData.contact?.trim()) payload.phone = formData.contact.replace(/\D/g, "");
            if (formData.roleId?.trim()) payload.role = formData.roleId.trim();
            if (["active", "inactive", "banned"].includes(formData.status)) payload.status = formData.status;

            const res = await fetch(`${API_BASE}/api/admin/check/accounts/${selectedUser.id}`, {
                method: "PATCH", headers: authHeaders(), body: JSON.stringify(payload),
            });
            const parsed = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
            if (!res.ok) throw new Error(extractMessage(parsed) ?? "Cập nhật thất bại");
            await fetchUsers();
            closeModal();
        } catch (err) {
            setUpdateError(err instanceof Error ? err.message : "Lỗi khi cập nhật");
        } finally {
            setUpdating(false);
        }
    };

    /* ═══ Add handlers ═══ */
    const openAddModal = () => {
        setAddFormData({ name: "", phone: "", password: "", roleId: "", roleName: "", currentStopId: "" });
        setAddError(null);
        setIsAddModalOpen(true);
        fetchStops();
        if (roles.length === 0) fetchRoles();
    };

    const closeAddModal = () => { setIsAddModalOpen(false); setAddError(null); };

    /* ✅ Fix: gửi current_stop_id cho DRIVER / BUS_ASSISTANT */
    const handleCreateStaff = async () => {
        const { name, phone, password, roleId, roleName, currentStopId } = addFormData;

        // Validate
        if (!name?.trim()) { setAddError("Họ tên là bắt buộc"); return; }
        if (!phone?.trim()) { setAddError("Số điện thoại là bắt buộc"); return; }
        const phoneDigits = phone.replace(/\D/g, "");
        if (phoneDigits.length < 9 || phoneDigits.length > 11) {
            setAddError("Số điện thoại phải từ 9 đến 11 chữ số");
            return;
        }
        if (!password || password.length < 6) { setAddError("Mật khẩu phải có ít nhất 6 ký tự"); return; }
        if (!roleId) { setAddError("Vui lòng chọn vai trò"); return; }
        if (ROLE_NAMES_NEEDING_STOP.includes(roleName) && !currentStopId) {
            setAddError("Vui lòng chọn vị trí hiện tại cho tài xế / lơ xe");
            return;
        }

        setCreating(true);
        setAddError(null);
        try {
            // ✅ Body luôn có role là ObjectId
            // ✅ Chỉ thêm current_stop_id khi role cần stop VÀ có giá trị
            const body: Record<string, string> = {
                name: name.trim(),
                phone: phoneDigits,
                password,
                role: roleId,                        // ObjectId của Role
            };

            if (ROLE_NAMES_NEEDING_STOP.includes(roleName) && currentStopId) {
                body.current_stop_id = currentStopId;  // ObjectId của Stop
            }

            const res = await fetch(`${API_BASE}/api/admin/check/accounts`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });

            const parsed = (await res.json().catch(() => ({}))) as ApiResponse<unknown>;
            if (!res.ok) throw new Error(extractMessage(parsed) ?? "Tạo nhân sự thất bại");

            await fetchUsers();
            closeAddModal();
        } catch (err) {
            setAddError(err instanceof Error ? err.message : "Lỗi khi tạo nhân sự");
        } finally {
            setCreating(false);
        }
    };

    const needsStop = ROLE_NAMES_NEEDING_STOP.includes(addFormData.roleName);

    /* ═══════════════════════════════ RENDER ═══════════════════ */
    return (
        <>
            <style>{`
                .manage-user-phone .react-tel-input .form-control {
                    width: 100% !important; height: 48px !important;
                    background: #fffdfb !important; border: none !important;
                    font-size: 14px !important; font-weight: 600 !important;
                    color: #4a3426 !important; box-shadow: none !important;
                    padding-left: 52px !important;
                }
                .manage-user-phone .react-tel-input .flag-dropdown,
                .manage-user-phone .react-tel-input .selected-flag {
                    background: transparent !important; border: none !important;
                }
                .manage-user-phone .react-tel-input .selected-flag { padding-left: 10px !important; }
                .manage-user-phone .react-tel-input .selected-flag:hover,
                .manage-user-phone .react-tel-input .selected-flag:focus { background: transparent !important; }
                .manage-user-phone .react-tel-input .country-list {
                    border-radius: 12px !important;
                    box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
                    border: 1px solid #e6d5c3 !important; z-index: 9999 !important;
                }
                .manage-user-phone .react-tel-input .country-list .country:hover { background: #fff7ed !important; }
                .manage-user-phone .react-tel-input .country-list .country.highlight { background: #fff3e0 !important; }
            `}</style>

            <div className="space-y-6">
                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
                            <ChevronLeft size={25} strokeWidth={2.3} />
                        </button>
                        <div>
                            <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý phân quyền</h1>
                            <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">Quản lý danh sách và thiết lập giới hạn quyền truy cập hệ thống</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706] shrink-0"
                    >
                        <UserPlus size={17} />
                        Thêm nhân sự mới
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ── Left: Table ── */}
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="border-b border-gray-100 flex px-1 pt-1">
                            {(["list", "search"] as const).map((tab) => (
                                <button key={tab} type="button" onClick={() => setActiveTab(tab)}
                                    className={`px-5 py-3 text-sm font-medium transition-colors rounded-t-lg ${activeTab === tab
                                        ? "text-[#FF5722] border-b-2 border-[#FF5722] bg-orange-50/50"
                                        : "text-gray-500 hover:text-gray-700"}`}>
                                    {tab === "list" ? "Danh sách nhân sự" : "Tìm nhân sự"}
                                </button>
                            ))}
                        </div>

                        {activeTab === "search" && (
                            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50">
                                <input
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                    placeholder="Tìm theo tên, số điện thoại, vai trò..."
                                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                                />
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            {loading ? (
                                <div className="p-10 flex flex-col items-center gap-2 text-gray-400">
                                    <Loader2 size={22} className="animate-spin text-[#FF5722]" />
                                    <span className="text-sm">Đang tải danh sách...</span>
                                </div>
                            ) : error ? (
                                <div className="p-10 text-center text-red-500 text-sm">Lỗi: {error}</div>
                            ) : (
                                <>
                                    <table className="w-full text-sm border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                <th className="px-6 py-3.5">Tên</th>
                                                <th className="px-6 py-3.5">Số điện thoại</th>
                                                <th className="px-6 py-3.5">Vai trò</th>
                                                <th className="px-6 py-3.5">Trạng thái</th>
                                                <th className="px-6 py-3.5 text-center">Đổi trạng thái</th>
                                                <th className="px-6 py-3.5 w-12" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {paginatedUsers.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                                        Không tìm thấy nhân sự nào
                                                    </td>
                                                </tr>
                                            ) : paginatedUsers.map((u, idx) => (
                                                <tr key={u.id ?? idx} className="hover:bg-gray-50/80 transition-colors">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{u.name}</td>
                                                    <td className="px-6 py-4 text-gray-600">{u.contact}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${getRoleStyle(u.roleName ?? u.role)}`}>
                                                            {u.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <StatusBadge status={u.status} />
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        {statusUpdating[u.id ?? ""] ? (
                                                            <Loader2 size={14} className="animate-spin text-[#FF5722] mx-auto" />
                                                        ) : (
                                                            <select
                                                                value={u.status ?? "active"}
                                                                onChange={(e) => u.id && handleStatusChange(u.id, e.target.value)}
                                                                className={`text-xs font-semibold rounded-lg px-2 py-1.5 border outline-none cursor-pointer transition focus:ring-2 focus:ring-orange-200 ${u.status === "active"
                                                                    ? "bg-green-50 border-green-200 text-green-700"
                                                                    : u.status === "inactive"
                                                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                                                        : "bg-red-50 border-red-200 text-red-700"}`}
                                                            >
                                                                <option value="active">Hoạt động</option>
                                                                <option value="inactive">Tạm khóa</option>
                                                                <option value="banned">Chặn</option>
                                                            </select>
                                                        )}
                                                    </td>

                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>

                                    <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/40">
                                        <span className="text-xs text-gray-400">{filteredUsers.length} nhân sự</span>
                                        <div className="flex items-center gap-1">
                                            <button type="button"
                                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                                disabled={currentPage <= 1}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition">
                                                <ChevronLeft size={16} />
                                            </button>
                                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                                                <button key={p} type="button" onClick={() => setCurrentPage(p)}
                                                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${currentPage === p ? "bg-[#FF5722] text-white shadow-sm" : "text-gray-600 hover:bg-gray-200"}`}>
                                                    {p}
                                                </button>
                                            ))}
                                            <button type="button"
                                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                                disabled={currentPage >= totalPages}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition">
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ══ Modal: Thêm nhân sự ══ */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-[0_30px_60px_-25px_rgba(181,98,27,0.45)] border border-[#f2e5d8] w-full overflow-hidden" style={{ maxWidth: 600 }}>
                            <div className="px-8 pt-8 pb-6 border-b border-[#f2e5d8]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="w-11 h-11 bg-[#fff3e0] rounded-2xl flex items-center justify-center mb-3">
                                            <UserPlus size={22} className="text-[#FF5722]" />
                                        </div>
                                        <h3 className="text-xl font-black text-[#2f2118]">Thêm nhân sự mới</h3>
                                        <p className="text-sm text-[#7c5f4a] mt-0.5">Điền đầy đủ thông tin để tạo tài khoản nhân sự</p>
                                    </div>
                                    <button onClick={closeAddModal} className="p-2 rounded-xl text-[#b58460] hover:text-[#7c5f4a] hover:bg-[#fff3e0] transition">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="px-8 py-6 space-y-5 max-h-[60vh] overflow-y-auto">
                                <Field label="Họ tên" required icon={<User size={12} />}>
                                    <input type="text" value={addFormData.name}
                                        onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                                        placeholder="Nguyễn Văn A" className={inputCls} />
                                </Field>

                                <Field label="Số điện thoại" required>
                                    <div className="manage-user-phone rounded-lg border border-[#e6d5c3] bg-[#fffdfb] p-1 focus-within:border-[#f39a32] focus-within:ring-2 focus-within:ring-[#f39a32]/20 transition">
                                        <PhoneInput country={"vn"} value={addFormData.phone}
                                            onChange={(val) => setAddFormData({ ...addFormData, phone: val })}
                                            inputClass="!w-full !h-[44px] !bg-transparent !border-0 !text-[#4a3426] !font-semibold !text-sm"
                                            buttonClass="!bg-transparent !border-0" containerClass="!bg-transparent" />
                                    </div>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Mật khẩu" required icon={<Lock size={12} />}>
                                        <input type="password" value={addFormData.password}
                                            onChange={(e) => setAddFormData({ ...addFormData, password: e.target.value })}
                                            placeholder="Ít nhất 6 ký tự" className={inputCls} />
                                    </Field>

                                    <Field label="Vai trò" required icon={<ShieldCheck size={12} />}>
                                        {rolesLoading ? (
                                            <div className="flex items-center gap-2 px-4 py-3 border border-[#e6d5c3] rounded-lg bg-[#fffdfb] text-sm text-[#b58460]">
                                                <Loader2 size={14} className="animate-spin text-[#FF5722]" /> Đang tải...
                                            </div>
                                        ) : roles.length === 0 ? (
                                            <div className="px-4 py-3 border border-amber-200 rounded-lg bg-amber-50 text-sm text-amber-700">
                                                Không tải được vai trò
                                            </div>
                                        ) : (
                                            <select value={addFormData.roleId}
                                                onChange={(e) => {
                                                    const selected = roles.find((r) => r._id === e.target.value);
                                                    setAddFormData({
                                                        ...addFormData,
                                                        roleId: e.target.value,
                                                        roleName: selected?.name ?? "",
                                                        currentStopId: "", // reset stop khi đổi role
                                                    });
                                                }}
                                                className={selectCls}>
                                                <option value="">-- Chọn vai trò --</option>
                                                {roles.map((r) => (
                                                    <option key={r._id} value={r._id}>{getRoleDisplayName(r.name)}</option>
                                                ))}
                                            </select>
                                        )}
                                    </Field>
                                </div>

                                {/* ✅ Hiện khi chọn DRIVER hoặc BUS_ASSISTANT */}
                                {needsStop && (
                                    <Field label="Vị trí hiện tại (trạm dừng)" required icon={<MapPin size={12} />}>
                                        {stopsLoading ? (
                                            <div className="flex items-center gap-2 px-4 py-3 border border-[#e6d5c3] rounded-lg bg-[#fffdfb] text-sm text-[#b58460]">
                                                <Loader2 size={14} className="animate-spin text-[#FF5722]" /> Đang tải trạm dừng...
                                            </div>
                                        ) : (
                                            <select value={addFormData.currentStopId}
                                                onChange={(e) => setAddFormData({ ...addFormData, currentStopId: e.target.value })}
                                                className={selectCls}>
                                                <option value="">-- Chọn trạm dừng --</option>
                                                {stops.map((s) => (
                                                    <option key={s._id} value={s._id}>
                                                        {s.province ? `${s.province} – ` : ""}{s.name}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {stops.length === 0 && !stopsLoading && (
                                            <p className="mt-1.5 text-xs text-amber-600">Không tìm thấy trạm dừng nào</p>
                                        )}
                                    </Field>
                                )}

                                {addError && (
                                    <div className="flex items-start gap-2.5 bg-[#fff7ed] border border-[#f2d5b8] text-[#c2410c] text-sm px-4 py-3 rounded-xl">
                                        <X size={15} className="mt-0.5 shrink-0" />
                                        {addError}
                                    </div>
                                )}
                            </div>

                            <div className="px-8 pb-8 pt-5 border-t border-[#f2e5d8] flex gap-3">
                                <button onClick={closeAddModal} disabled={creating}
                                    className="flex-1 py-3 border border-[#e6d5c3] rounded-xl text-sm font-semibold text-[#7c5f4a] hover:bg-[#fff7ed] transition disabled:opacity-50">
                                    Hủy
                                </button>
                                <button onClick={handleCreateStaff} disabled={creating}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_18px_30px_-14px_rgba(216,113,28,0.7)] hover:opacity-90 transition disabled:opacity-50">
                                    {creating ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
                                    {creating ? "Đang tạo..." : "Tạo nhân sự"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ Modal: Chỉnh sửa nhân sự ══ */}
                {isModalOpen && selectedUser && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                        <div className="bg-white rounded-3xl shadow-[0_30px_60px_-25px_rgba(181,98,27,0.45)] border border-[#f2e5d8] w-full overflow-hidden" style={{ maxWidth: 560 }}>
                            <div className="px-8 pt-8 pb-6 border-b border-[#f2e5d8]">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="w-11 h-11 bg-[#fff3e0] rounded-2xl flex items-center justify-center mb-3">
                                            <Edit size={20} className="text-[#FF5722]" />
                                        </div>
                                        <h3 className="text-xl font-black text-[#2f2118]">Chỉnh sửa nhân sự</h3>
                                        <p className="text-sm font-semibold text-[#e8791c] mt-0.5">{selectedUser.name}</p>
                                    </div>
                                    <button onClick={closeModal} className="p-2 rounded-xl text-[#b58460] hover:text-[#7c5f4a] hover:bg-[#fff3e0] transition">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="px-8 py-6 space-y-5">
                                <Field label="Họ tên" icon={<User size={12} />}>
                                    <input type="text" value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className={inputCls} />
                                </Field>

                                <Field label="Số điện thoại">
                                    <div className="manage-user-phone rounded-lg border border-[#e6d5c3] bg-[#fffdfb] p-1 focus-within:border-[#f39a32] focus-within:ring-2 focus-within:ring-[#f39a32]/20 transition">
                                        <PhoneInput country={"vn"} value={formData.contact}
                                            onChange={(val) => setFormData({ ...formData, contact: val })}
                                            inputClass="!w-full !h-[44px] !bg-transparent !border-0 !text-[#4a3426] !font-semibold !text-sm"
                                            buttonClass="!bg-transparent !border-0" containerClass="!bg-transparent" />
                                    </div>
                                </Field>

                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="Vai trò" icon={<ShieldCheck size={12} />}>
                                        {rolesLoading ? (
                                            <div className="flex items-center gap-2 px-4 py-3 border border-[#e6d5c3] rounded-lg bg-[#fffdfb] text-sm text-[#b58460]">
                                                <Loader2 size={14} className="animate-spin text-[#FF5722]" /> Đang tải...
                                            </div>
                                        ) : (
                                            <select value={formData.roleId}
                                                onChange={(e) => {
                                                    const selected = roles.find((r) => r._id === e.target.value);
                                                    setFormData({ ...formData, roleId: e.target.value, roleName: selected?.name ?? "" });
                                                }}
                                                className={selectCls}>
                                                <option value="">-- Chọn vai trò --</option>
                                                {roles.map((r) => (
                                                    <option key={r._id} value={r._id}>{getRoleDisplayName(r.name)}</option>
                                                ))}
                                            </select>
                                        )}
                                    </Field>

                                    <Field label="Trạng thái">
                                        <select value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                            className={selectCls}>
                                            {STATUS_OPTIONS.map((o) => (
                                                <option key={o.value} value={o.value}>{o.label}</option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>

                                <div className={`text-xs px-4 py-3 rounded-xl border font-medium ${formData.status === "active"
                                    ? "bg-green-50 border-green-200 text-green-700"
                                    : formData.status === "inactive"
                                        ? "bg-amber-50 border-amber-200 text-amber-700"
                                        : "bg-red-50 border-red-200 text-red-700"}`}>
                                    {formData.status === "active" ? "✓  Tài khoản được phép đăng nhập bình thường"
                                        : formData.status === "inactive" ? "⏸  Tài khoản bị tạm khóa, không thể đăng nhập"
                                            : "✕  Tài khoản bị chặn hoàn toàn"}
                                </div>

                                {updateError && (
                                    <div className="flex items-start gap-2.5 bg-[#fff7ed] border border-[#f2d5b8] text-[#c2410c] text-sm px-4 py-3 rounded-xl">
                                        <X size={15} className="mt-0.5 shrink-0" />
                                        {updateError}
                                    </div>
                                )}
                            </div>

                            <div className="px-8 pb-8 pt-5 border-t border-[#f2e5d8] flex gap-3">
                                <button onClick={closeModal} disabled={updating}
                                    className="flex-1 py-3 border border-[#e6d5c3] rounded-xl text-sm font-semibold text-[#7c5f4a] hover:bg-[#fff7ed] transition disabled:opacity-50">
                                    Hủy
                                </button>
                                <button onClick={handleUpdate} disabled={updating}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_18px_30px_-14px_rgba(216,113,28,0.7)] hover:opacity-90 transition disabled:opacity-50">
                                    {updating ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                                    {updating ? "Đang lưu..." : "Lưu thay đổi"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default ManageUser;