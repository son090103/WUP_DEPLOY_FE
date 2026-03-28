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

type StopRef = {
  _id?: string;
  name?: string;
  type?: string;
  latitude?: number;
  longitude?: number;
  [k: string]: unknown;
};

type RouteModel = {
  _id?: string;
  start?: StopRef | string;
  end?: StopRef | string;
  start_id?: StopRef | string;
  stop_id?: StopRef | string;
  distance_km?: number;
  is_active?: boolean;
  created_at?: string;
  createdAt?: string;
  stops?: unknown[];
  [k: string]: unknown;
};

type RouteRow = {
  id?: string;
  code?: string;
  start: string;
  stop: string;
  distance_km: number;
  status: "Hoạt động" | "Tạm ngưng";
  created_at?: string;
  raw?: RouteModel;
};

type FormDataType = {
  distance_km: number;
  status: "Hoạt động" | "Tạm ngưng" | "";
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const extractMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;
  if (typeof payload.message === "string") return payload.message;
  if (
    isRecord(payload.data) &&
    typeof (payload.data as Record<string, unknown>).message === "string"
  )
    return (payload.data as Record<string, unknown>).message as string;
  return undefined;
};

const extractRouteArray = (payload: unknown): RouteModel[] => {
  if (Array.isArray(payload) && payload.every(isRecord))
    return payload as RouteModel[];
  if (!isRecord(payload)) return [];

  const p = payload as Record<string, unknown>;
  if (isRecord(p.data)) {
    const d = p.data as Record<string, unknown>;
    if (Array.isArray(d.routes) && d.routes.every(isRecord))
      return d.routes as RouteModel[];
    if (Array.isArray(d) && d.every(isRecord)) return d as RouteModel[];
  }
  if (Array.isArray(p.routes) && p.routes.every(isRecord))
    return p.routes as RouteModel[];
  if (Array.isArray(p.data) && p.data.every(isRecord))
    return p.data as RouteModel[];

  return [];
};

const mapStatusToVn = (v?: unknown): "Hoạt động" | "Tạm ngưng" => {
  if (v === undefined || v === null) return "Tạm ngưng";
  if (typeof v === "boolean") return v ? "Hoạt động" : "Tạm ngưng";
  const up = String(v).toUpperCase();
  if (up === "ACTIVE" || up === "ENABLED") return "Hoạt động";
  return "Tạm ngưng";
};

const ManageRoute: React.FC = () => {
  const [routes, setRoutes] = useState<RouteRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    "Tất cả" | "Hoạt động" | "Tạm ngưng"
  >("Tất cả");

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRoute, setSelectedRoute] = useState<RouteRow | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    distance_km: 0,
    status: "",
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

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Hoạt động":
        return "bg-green-50 text-green-700 ring-1 ring-green-100";
      case "Tạm ngưng":
        return "bg-red-50 text-red-700 ring-1 ring-red-100";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const fetchRoutes = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const url =
        "http://localhost:3000/api/admin/check/routes?page=1&limit=200";
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const parsed = await res.json().catch(() => ({} as ApiResponse<unknown>));
      if (!res.ok) {
        const msg = extractMessage(parsed) ?? "Không thể lấy danh sách tuyến";
        throw new Error(msg);
      }

      const rawList = extractRouteArray(parsed);

      const normalized: RouteRow[] = rawList.map((r) => {
        const resolveStop = (v?: unknown): string => {
          if (!v) return "N/A";
          if (isRecord(v))
            return String(
              (v as Record<string, unknown>).name ??
                (v as Record<string, unknown>)._id ??
                "N/A"
            );
          return String(v);
        };

        const start = resolveStop(
          (r as RouteModel).start ?? (r as RouteModel).start_id
        );
        const stop = resolveStop(
          (r as RouteModel).end ?? (r as RouteModel).stop_id
        );
        const distance = Number((r as RouteModel).distance_km ?? 0) || 0;
        const created =
          (r as RouteModel).created_at ??
          (r as RouteModel).createdAt ??
          undefined;

        return {
          id: r._id,
          code: r._id,
          start,
          stop,
          distance_km: distance,
          status: mapStatusToVn((r as RouteModel).is_active),
          created_at: created,
          raw: r,
        };
      });

      setRoutes(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  // combined filtering: tab + search
  const filteredRoutes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return routes.filter((route) => {
      if (activeTab === "Hoạt động" && route.status !== "Hoạt động")
        return false;
      if (activeTab === "Tạm ngưng" && route.status !== "Tạm ngưng")
        return false;
      if (!q) return true;
      // search by start, stop or code
      const hay = `${route.start} ${route.stop} ${
        route.code ?? ""
      }`.toLowerCase();
      return hay.includes(q);
    });
  }, [routes, activeTab, searchQuery]);

  const handleAddNew = () => {
    // simple navigation to add page; adjust route if app uses router
    window.location.href = "/admin/routes/new";
  };

  const handleEdit = (route: RouteRow) => {
    setSelectedRoute(route);
    setFormData({ distance_km: route.distance_km, status: route.status });
    setUpdateError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRoute(null);
    setUpdateError(null);
  };

  const vnStatusToIsActive = (vn: string): boolean => vn === "Hoạt động";

  const handleUpdate = async () => {
    if (!selectedRoute?.id) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const payload: { distance_km?: number; is_active?: boolean } = {};
      if (typeof formData.distance_km === "number")
        payload.distance_km = formData.distance_km;
      if (formData.status)
        payload.is_active = vnStatusToIsActive(formData.status);

      const res = await fetch(
        `http://localhost:3000/api/admin/check/routes/${selectedRoute.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const parsed = await res.json().catch(() => ({} as ApiResponse<unknown>));
      if (!res.ok) {
        const msg = extractMessage(parsed) ?? "Cập nhật tuyến thất bại";
        throw new Error(msg);
      }

      await fetchRoutes();
      closeModal();
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Lỗi khi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  const fmtDate = (iso?: string): string => {
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
              Quản lý tuyến
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
            <div className="text-sm text-gray-500 mb-1">Tổng số tuyến</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">{routes.length}</span>
              <span className="text-green-600 text-sm font-medium">+0%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border">
            <div className="text-sm text-gray-500 mb-1">Hoạt động</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {routes.filter((r) => r.status === "Hoạt động").length}
              </span>
              <span className="text-green-600 text-sm font-medium">+0%</span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-md border">
            <div className="text-sm text-gray-500 mb-1">Tạm ngưng</div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold">
                {routes.filter((r) => r.status === "Tạm ngưng").length}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={handleAddNew}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
              title="Thêm tuyến xe mới"
            >
              <Plus size={16} />
              Thêm tuyến xe mới
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-3 bg-white rounded-xl shadow border p-5">
            <ul className="space-y-3">
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                📊 Tổng quan
              </li>
              <li className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                🔑 Quản lý phân quyền
              </li>
              <li className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 font-medium rounded-lg">
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
              <div className="flex items-center gap-4">
                {(["Tất cả", "Hoạt động", "Tạm ngưng"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 text-sm rounded-lg font-medium transition ${
                      activeTab === tab
                        ? "bg-orange-50 text-orange-600 ring-1 ring-orange-100"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2 w-full sm:w-80 shadow-sm">
                  <SearchIcon size={16} className="text-gray-500" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên tuyến, điểm đi hoặc điểm đến"
                    className="ml-3 w-full bg-transparent outline-none text-sm text-gray-700"
                  />
                </div>
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Xóa
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-8 text-center text-gray-600">
                  Đang tải danh sách tuyến...
                </div>
              ) : error ? (
                <div className="p-8 text-center text-red-600">Lỗi: {error}</div>
              ) : (
                <table className="w-full min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-50">
                    <tr className="text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      <th className="px-6 py-3">Đi - Đến</th>
                      <th className="px-6 py-3">Thời gian</th>
                      <th className="px-6 py-3">Khoảng cách (km)</th>
                      <th className="px-6 py-3">Trạng thái</th>
                      <th className="px-6 py-3 w-20" />
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-10 text-center text-gray-500"
                        >
                          Không có tuyến nào phù hợp
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route, idx) => (
                        <tr
                          key={route.id ?? idx}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-gray-700">
                            <div className="font-medium text-gray-900">
                              {route.start} → {route.stop}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Mã: {route.code ?? "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {fmtDate(route.created_at)}
                          </td>
                          <td className="px-6 py-4 text-gray-700">
                            {route.distance_km}
                          </td>
                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle(
                                route.status
                              )}`}
                            >
                              <span
                                className={`h-2 w-2 rounded-full ${
                                  route.status === "Hoạt động"
                                    ? "bg-green-500"
                                    : "bg-red-500"
                                }`}
                              />
                              {route.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleEdit(route)}
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
                Hiển thị 1–{Math.min(10, filteredRoutes.length)} của{" "}
                {filteredRoutes.length} tuyến
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  disabled
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="px-3 py-1 bg-orange-500 text-white rounded-md">
                  1
                </div>
                <button
                  className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50"
                  disabled
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedRoute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Chỉnh sửa tuyến:{" "}
                <span className="text-orange-600 font-medium">
                  {selectedRoute.start} → {selectedRoute.stop}
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
                  Đi - Đến
                </label>
                <input
                  type="text"
                  value={`${selectedRoute.start} → ${selectedRoute.stop}`}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Khoảng cách (km)
                </label>
                <input
                  type="number"
                  value={formData.distance_km}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      distance_km: Number(e.target.value) || 0,
                    })
                  }
                  min={0}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trạng thái
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as FormDataType["status"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-orange-200"
                >
                  <option value="Hoạt động">Hoạt động</option>
                  <option value="Tạm ngưng">Tạm ngưng</option>
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
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50"
                disabled={updating}
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

export default ManageRoute;
