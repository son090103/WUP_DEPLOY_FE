import React, { useEffect, useMemo, useState } from "react";
import {
  Edit,
  X,
  Search as SearchIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Bus,
  User as UserIcon,
  Calendar,
  Clock,
  MapPin,
  CircleCheck,
  TriangleAlert,
} from "lucide-react";
import baseAPIAuth from "../../api/auth";
import type { getBuses } from "../../model/getBuses";
import type { getDrivers } from "../../model/getAvailableDriver";
import type { getAssistants } from "../../model/getAvailableAssistant";

// ==================== TYPES ====================
interface Avatar {
  url: string;
  publicId: string;
}

interface User {
  _id: string;
  name: string;
  phone?: string;
  status?: string;
  isVerified?: boolean;
  deletedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
  avatar?: Avatar;
}

interface Stop {
  _id: string;
  name: string;
  type?: string;
  latitude?: number;
  longitude?: number;
}

interface Route {
  _id: string;
  start_id: Stop;
  stop_id: Stop;
  distance_km?: number;
  is_active?: boolean;
}

interface BusType {
  _id: string;
  name: string;
}

interface Bus {
  _id: string;
  license_plate?: string;
  bus_type_id?: BusType;
}

interface DriverShift {
  _id?: string;
  driver_id: User | string;
  shift_start: string;
  shift_end: string;
  actual_shift_start?: string | null;
  actual_shift_end?: string | null;
  status?: "PENDING" | "RUNNING" | "DONE";
}

interface Trip {
  _id: string;
  route_id?: Route;
  bus_id?: Bus;
  drivers: DriverShift[];
  assistant_id: User | null;
  departure_time: string;
  arrival_time: string;
  actual_departure_time?: string;
  actual_arrival_time?: string;
  scheduled_distance?: number;
  scheduled_duration: number;
  status: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED" | "UNASSIGNED";
  created_at: string;
}

interface ApiResponse<T = unknown> {
  success?: boolean;
  message?: string;
  data?: T;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
}
interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}
// ==================== HELPERS ====================
const extractMessage = (payload: unknown): string | undefined => {
  if (!payload || typeof payload !== "object") return undefined;
  const p = payload as Record<string, unknown>;
  if (typeof p.message === "string") return p.message;
  if (p.data && typeof p.data === "object") {
    const d = p.data as Record<string, unknown>;
    if (typeof d.message === "string") return d.message;
  }
  return undefined;
};

const fmtDate = (iso?: string): string => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleString("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const toLocalInputValue = (iso?: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

const fromLocalInputToIso = (val?: string): string | undefined => {
  if (!val) return undefined;
  const d = new Date(val);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
};

const statusToVn = (s?: string) => {
  if (!s) return "—";
  switch (s.toUpperCase()) {
    case "UNASSIGNED":
      return "Chưa gán";
    case "SCHEDULED":
      return "Đã lên lịch";
    case "RUNNING":
      return "Đang chạy";
    case "FINISHED":
      return "Kết thúc";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return s;
  }
};

const statusClass = (s?: string) => {
  if (!s) return "bg-gray-100 text-gray-700";
  switch (s.toUpperCase()) {
    case "RUNNING":
      return "bg-green-50 text-green-700 ring-1 ring-green-100";
    case "SCHEDULED":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-100";
    case "FINISHED":
      return "bg-gray-50 text-gray-700 ring-1 ring-gray-100";
    case "CANCELLED":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

// ==================== COMPONENT ====================
const ManageTrip: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });

  const [searchQuery, setSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<
    "Tất cả" | "Hoạt động" | "Đã lên lịch" | "Tạm ngừng" | "Chưa gán"
  >("Tất cả");

  const [selected, setSelected] = useState<Trip | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formDeparture, setFormDeparture] = useState<string>("");
  const [formArrival, setFormArrival] = useState<string>("");
  const [formStatus, setFormStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  // State cho gán xe, tài xế, phụ xe
  const [buses, setBuses] = useState<getBuses[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<getDrivers[]>([]);
  const [availableAssistants, setAvailableAssistants] = useState<getAssistants[]>([]);
  const [formBusId, setFormBusId] = useState<string>("");
  const [formDriverId, setFormDriverId] = useState<string>("");
  const [formAssistantId, setFormAssistantId] = useState<string>("");
  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // ==================== API ====================
  const fetchTrips = async (page: number = 1): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      let res = await fetch(
        `${API_BASE}/api/admin/check/trips?page=${page}&limit=${pagination.itemsPerPage}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      // fallback if route missing on backend
      if (res.status === 404) {
        res = await fetch(
          `/api/admin/trips?page=${page}&limit=${pagination.itemsPerPage}`,
          {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }
        );
      }

      const parsed = await res.json().catch(() => ({} as ApiResponse<unknown>));
      if (!res.ok) {
        throw new Error(
          extractMessage(parsed) ??
          `HTTP ${res.status}: Không thể lấy danh sách chuyến`
        );
      }

      // accept varied shapes
      let fetched: Trip[] = [];
      let paginationData: PaginationData = {
        currentPage: page,
        totalPages: 1,
        totalItems: 0,
        itemsPerPage: pagination.itemsPerPage,
      };

      // common shapes
      if (parsed && typeof parsed === "object") {
        const p = parsed as Record<string, unknown>;
        if (p.data && typeof p.data === "object") {
          const d = p.data as Record<string, unknown>;
          if (Array.isArray(d.trips)) {
            fetched = d.trips as Trip[];
            if (d.pagination && typeof d.pagination === "object") {
              const pg = d.pagination as Partial<PaginationData>;
              paginationData = { ...paginationData, ...pg } as PaginationData;
            }
          } else if (Array.isArray(d)) {
            fetched = d as unknown as Trip[];
            paginationData.totalItems = fetched.length;
            paginationData.totalPages = Math.ceil(
              fetched.length / paginationData.itemsPerPage
            );
          }
        } else if (Array.isArray(p.trips)) {
          fetched = p.trips as Trip[];
          if (p.pagination && typeof p.pagination === "object") {
            const pg = p.pagination as Partial<PaginationData>;
            paginationData = { ...paginationData, ...pg } as PaginationData;
          }
        } else if (Array.isArray(p)) {
          fetched = p as unknown as Trip[];
          paginationData.totalItems = fetched.length;
          paginationData.totalPages = Math.ceil(
            fetched.length / paginationData.itemsPerPage
          );
        }
      }

      setTrips(fetched);
      setPagination(paginationData);
      if (fetched.length === 0) {
        console.warn("No trips returned from API");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==================== FILTERS ====================
  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return trips.filter((trip) => {
      if (activeTab !== "Tất cả") {
        const want =
          activeTab === "Hoạt động"
            ? "RUNNING"
            : activeTab === "Đã lên lịch"
              ? "SCHEDULED"
              : activeTab === "Tạm ngừng"
                ? "FINISHED"
                : activeTab === "Chưa gán"
                  ? "UNASSIGNED"
                  : undefined;
        if (want && String(trip.status).toUpperCase() !== want) return false;
      }
      if (!q) return true;

      const routeName = `${trip.route_id?.start_id?.name ?? ""} → ${trip.route_id?.stop_id?.name ?? ""
        }`;
      const drivers = trip.drivers
        .map((d) => {
          const dr = d.driver_id as User;
          return (
            dr?.name ?? (typeof d.driver_id === "string" ? d.driver_id : "")
          );
        })
        .join(" ");
      const assistant = trip.assistant_id?.name ?? "";

      const hay =
        `${routeName} ${trip._id} ${drivers} ${assistant}`.toLowerCase();
      return hay.includes(q);
    });
  }, [trips, activeTab, searchQuery]);

  // ==================== FETCH AVAILABLE ====================
  const getAvailableBuses = async (trip: Trip) => {
    if (!trip.departure_time || !trip.arrival_time || !trip.route_id) return;
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getBuses", {
        params: {
          shift_start: new Date(trip.departure_time).toISOString(),
          shift_end: new Date(trip.arrival_time).toISOString(),
          start_stop_id: trip.route_id.start_id?._id,
          travel_duration: trip.scheduled_duration,
        },
      });
      console.log("Các xe đang rảnh: ", res.data);
      setBuses(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getAvailableDrivers = async (trip: Trip) => {
    if (!trip.departure_time || !trip.arrival_time || !trip.route_id) return;
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getAvailableDrivers", {
        params: {
          shift_start: new Date(trip.departure_time).toISOString(),
          shift_end: new Date(trip.arrival_time).toISOString(),
          start_stop_id: trip.route_id.start_id?._id,
          travel_duration: trip.scheduled_duration,
        },
      });
      console.log("Các tài xế đang rảnh: ", res.data);
      setAvailableDrivers(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const getAvailableAssistant = async (trip: Trip) => {
    if (!trip.departure_time || !trip.arrival_time || !trip.route_id) return;
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getAvailableAssistant", {
        params: {
          shift_start: new Date(trip.departure_time).toISOString(),
          shift_end: new Date(trip.arrival_time).toISOString(),
          start_stop_id: trip.route_id.start_id?._id,
        },
      });
      console.log("Các lơ xe đang rảnh: ", res.data);
      setAvailableAssistants(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  // ==================== MODAL ====================
  const openEdit = (trip: Trip) => {
    setSelected(trip);
    setFormDeparture(toLocalInputValue(trip.departure_time));
    setFormArrival(toLocalInputValue(trip.arrival_time));
    setFormStatus(trip.status ?? "SCHEDULED");
    setFormBusId(trip.bus_id?._id ?? "");
    setFormDriverId(
      trip.drivers.length > 0
        ? typeof trip.drivers[0].driver_id === "string"
          ? trip.drivers[0].driver_id
          : (trip.drivers[0].driver_id as User)._id
        : ""
    );
    setFormAssistantId(trip.assistant_id?._id ?? "");
    setUpdateError(null);
    setIsModalOpen(true);
    getAvailableBuses(trip);
    getAvailableDrivers(trip);
    getAvailableAssistant(trip);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelected(null);
    setUpdateError(null);
  };

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (formStatus) payload.status = formStatus;
      const depIso = fromLocalInputToIso(formDeparture);
      if (depIso) payload.departure_time = depIso;
      const arrIso = fromLocalInputToIso(formArrival);
      if (arrIso) payload.arrival_time = arrIso;
      if (formBusId) payload.bus_id = formBusId;
      if (formDriverId) {
        payload.drivers = [{
          driver_id: formDriverId,
          shift_start: depIso,
          shift_end: arrIso,
          status: "PENDING",
        }];
      }
      if (formAssistantId) payload.assistant_id = formAssistantId;

      const res = await baseAPIAuth.put(
        `/api/admin/check/trips/${selected._id}`,
        payload
      );

      setNotice({
        type: "success",
        title: "Cập nhật chuyến thành công",
        message: res.data?.message || "Thông tin chuyến đã được cập nhật.",
      });

      await fetchTrips(pagination.currentPage);
      closeModal();
    } catch (error: any) {
      setNotice({
        type: "error",
        title: "Cập nhật chuyến thất bại",
        message:
          error.response?.data?.message ||
          "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
      setUpdateError(error instanceof Error ? error.message : "Lỗi khi cập nhật");
    } finally {
      setUpdating(false);
    }
  };

  // ==================== STATS / PAGINATION ====================
  const countByStatus = (s: string) =>
    trips.filter((t) => String(t.status).toUpperCase() === s).length;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchTrips(newPage);
  };

  // ==================== RENDER ====================
  return (
    <div className="space-y-6 p-4 sm:p-6 bg-[#f9fafb] min-h-screen">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => window.history.back()} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
            <ChevronLeft size={25} strokeWidth={2.3} />
          </button>
          <div>
            <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
              Quản lý chuyến
            </h1>
            <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
              Xem và quản lý tất cả các chuyến đi
            </p>
          </div>
        </div>
        <button
          onClick={() => (window.location.href = "/admin/create-trips")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706]"
        >
          <Plus size={16} /> Thêm chuyến mới
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-[#6b7280]">
            Tổng số chuyến
          </p>
          <p className="mt-2 text-[28px] font-black text-[#111827]">
            {pagination.totalItems}
          </p>
        </div>
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-[#6b7280]">Đang chạy</p>
          <p className="mt-2 text-[28px] font-black text-green-600">
            {countByStatus("RUNNING")}
          </p>
        </div>
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-[#6b7280]">Đã lên lịch</p>
          <p className="mt-2 text-[28px] font-black text-blue-600">
            {countByStatus("SCHEDULED")}
          </p>
        </div>
        <div className="rounded-lg border border-[#dde2ea] bg-white p-5 shadow-sm">
          <p className="text-[13px] font-medium text-[#6b7280]">Kết thúc</p>
          <p className="mt-2 text-[28px] font-black text-gray-600">
            {countByStatus("FINISHED") + countByStatus("CANCELLED")}
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-[#dde2ea] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#dde2ea] p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(["Tất cả", "Hoạt động", "Đã lên lịch", "Tạm ngừng", "Chưa gán"] as const).map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${activeTab === tab
                      ? "bg-[#eb8a45] text-white shadow-sm"
                      : "text-[#6b7280] hover:bg-[#f3f4f6]"
                    }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-[#dde2ea] bg-white px-3 py-2 shadow-sm w-full sm:w-auto">
              <SearchIcon size={16} className="text-[#9ca3af]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm theo tuyến, tài xế, biển số..."
                className="ml-2 bg-transparent text-[13px] outline-none w-full sm:w-[240px]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-[13px] text-[#eb8a45] font-medium hover:underline"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#eb8a45] border-r-transparent"></div>
              <p className="mt-3 text-[14px] text-[#6b7280]">
                Đang tải danh sách chuyến...
              </p>
            </div>
          ) : error ? (
            <div className="p-12 text-center">
              <div className="mx-auto w-fit rounded-full bg-red-50 p-3">
                <X size={24} className="text-red-600" />
              </div>
              <p className="mt-3 text-[14px] font-medium text-red-600">
                {error}
              </p>
            </div>
          ) : (
            <table className="min-w-[900px] w-full text-[13px]">
              <thead className="bg-[#f9fafb] text-[#6b7280] border-b border-[#dde2ea]">
                <tr>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-left font-semibold">
                    Thông tin tuyến
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-left font-semibold">
                    Thông tin xe
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-left font-semibold">
                    Khởi hành
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-left font-semibold">
                    Kết thúc dự kiến
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-left font-semibold">
                    Tài xế & Phụ xe
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3 text-center font-semibold">
                    Trạng thái
                  </th>
                  <th className="px-3 py-3 sm:px-5 sm:py-3"></th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-12 sm:px-5 sm:py-16 text-center text-[#9ca3af]"
                    >
                      <Bus size={48} className="mx-auto mb-3 opacity-30" />
                      <p className="text-[14px] font-medium">
                        Không tìm thấy chuyến nào
                      </p>
                      <p className="text-[12px] mt-1">
                        Thử thay đổi bộ lọc hoặc tìm kiếm
                      </p>
                    </td>
                  </tr>
                ) : (
                  filtered.map((trip) => {
                    const routeName = `${trip.route_id?.start_id?.name ?? "N/A"
                      } → ${trip.route_id?.stop_id?.name ?? "N/A"}`;
                    const distance =
                      trip.route_id?.distance_km ??
                      trip.scheduled_distance ??
                      0;
                    const busType = trip.bus_id?.bus_type_id?.name ?? "N/A";
                    const licensePlate = trip.bus_id?.license_plate ?? "N/A";
                    const driverNames = trip.drivers
                      .map((d) => {
                        const dr = d.driver_id as User;
                        return (
                          dr?.name ??
                          (typeof d.driver_id === "string" ? d.driver_id : "—")
                        );
                      })
                      .join(", ");
                    const assistantName = trip.assistant_id?.name ?? "Không có";

                    return (
                      <tr
                        key={trip._id}
                        className="border-b border-[#dde2ea] hover:bg-[#f9fafb] transition-colors"
                      >
                        <td className="px-3 py-3 sm:px-5 sm:py-4 align-top">
                          <div className="font-semibold text-[#111827] mb-1">
                            {routeName}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#9ca3af]">
                            <MapPin size={12} />
                            <span>{distance} km</span>
                          </div>
                          <div className="text-[11px] text-[#9ca3af] mt-1">
                            Mã: {trip._id.slice(-12)}
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            <Bus size={14} className="text-[#6b7280]" />
                            <span className="font-medium text-[#111827]">
                              {busType}
                            </span>
                          </div>
                          <div className="text-[12px] text-[#6b7280]">
                            Biển số:{" "}
                            <span className="font-semibold">
                              {licensePlate}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar size={14} className="text-[#6b7280]" />
                            <span className="text-[12px] font-medium text-[#111827]">
                              {fmtDate(trip.departure_time)}
                            </span>
                          </div>
                          {trip.actual_departure_time && (
                            <div className="text-[11px] text-green-600">
                              Thực tế: {fmtDate(trip.actual_departure_time)}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 align-top">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-[#6b7280]" />
                            <span className="text-[12px] font-medium text-[#111827]">
                              {fmtDate(trip.arrival_time)}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#6b7280]">
                            {trip.scheduled_duration} phút
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 align-top">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <UserIcon size={12} className="text-[#6b7280]" />
                              <span className="text-[12px] font-medium text-[#111827]">
                                {driverNames}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#6b7280] ml-5">
                              Phụ xe: {assistantName}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 text-center align-top">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold ${statusClass(
                              trip.status
                            )}`}
                          >
                            {statusToVn(trip.status)}
                          </span>
                        </td>

                        <td className="px-3 py-3 sm:px-5 sm:py-4 text-center align-top">
                          <button
                            onClick={() => openEdit(trip)}
                            className="rounded-lg p-2 hover:bg-[#f3f4f6] transition-colors"
                            title="Chỉnh sửa chuyến"
                          >
                            <Edit size={16} className="text-[#6b7280]" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>

        <div className="border-t border-[#dde2ea] px-3 py-4 sm:px-5 sm:py-4 text-[13px] text-[#6b7280] flex flex-col sm:flex-row items-start sm:items-center justify-between bg-[#f9fafb] gap-3">
          <div className="font-medium text-sm w-full sm:w-auto">
            Hiển thị{" "}
            <span className="text-[#111827]">
              {(pagination.currentPage - 1) * pagination.itemsPerPage + 1}
            </span>{" "}
            –{" "}
            <span className="text-[#111827]">
              {Math.min(
                pagination.currentPage * pagination.itemsPerPage,
                pagination.totalItems
              )}
            </span>{" "}
            của <span className="text-[#111827]">{pagination.totalItems}</span>{" "}
            chuyến
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              className="rounded-lg p-2 hover:bg-white border border-[#dde2ea] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.currentPage === 1}
              onClick={() => handlePageChange(pagination.currentPage - 1)}
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1 overflow-x-auto">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === pagination.totalPages ||
                    Math.abs(p - pagination.currentPage) <= 1
                )
                .map((p, idx, arr) => (
                  <React.Fragment key={p}>
                    {idx > 0 && arr[idx - 1] !== p - 1 && (
                      <span className="px-2 text-[#9ca3af]">...</span>
                    )}
                    <button
                      onClick={() => handlePageChange(p)}
                      className={`min-w-[36px] rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${pagination.currentPage === p
                          ? "bg-[#eb8a45] text-white shadow-sm"
                          : "text-[#6b7280] hover:bg-white border border-transparent hover:border-[#dde2ea]"
                        }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            <button
              className="rounded-lg p-2 hover:bg-white border border-[#dde2ea] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={pagination.currentPage === pagination.totalPages}
              onClick={() => handlePageChange(pagination.currentPage + 1)}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {isModalOpen && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-full sm:max-w-2xl md:max-w-3xl overflow-hidden rounded-2xl sm:rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#dde2ea] bg-gradient-to-r from-[#eb8a45] to-[#d97a35] px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/20 p-2">
                  <Edit size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[16px] font-bold text-white">
                    Chỉnh sửa chuyến
                  </h3>
                  <p className="text-[12px] text-white/80 mt-0.5">
                    Cập nhật thông tin chuyến đi
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="rounded-full p-1.5 hover:bg-white/20 transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
              <div className="space-y-5">
                <div className="rounded-lg bg-[#f9fafb] p-4">
                  <h4 className="text-[13px] font-bold text-[#111827] mb-3">
                    Thông tin tuyến đường
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Tuyến
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-2.5">
                        <MapPin size={16} className="text-[#6b7280]" />
                        <input
                          value={`${selected.route_id?.start_id?.name ?? "N/A"
                            } → ${selected.route_id?.stop_id?.name ?? "N/A"}`}
                          disabled
                          className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Khoảng cách
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-2.5">
                        <MapPin size={16} className="text-[#6b7280]" />
                        <input
                          value={`${selected.route_id?.distance_km ??
                            selected.scheduled_distance ??
                            0
                            } km`}
                          disabled
                          className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#f9fafb] p-4">
                  <h4 className="text-[13px] font-bold text-[#111827] mb-3">
                    Thông tin xe
                  </h4>
                  <div>
                    <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                      Chọn xe
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-0.5">
                      <Bus size={16} className="text-[#6b7280]" />
                      <select
                        value={formBusId}
                        onChange={(e) => setFormBusId(e.target.value)}
                        className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium py-2.5 outline-none"
                      >
                        <option value="">Chưa gán xe</option>
                        {buses.map((bus) => (
                          <option key={bus._id} value={bus._id}>
                            {bus.license_plate ?? "N/A"} — {bus.bus_type_id?.name ?? "N/A"}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-[#f9fafb] p-4">
                  <h4 className="text-[13px] font-bold text-[#111827] mb-3">
                    Thông tin nhân sự
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Tài xế
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-0.5">
                        <UserIcon size={16} className="text-[#6b7280]" />
                        <select
                          value={formDriverId}
                          onChange={(e) => setFormDriverId(e.target.value)}
                          className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium py-2.5 outline-none"
                        >
                          <option value="">Chưa gán tài xế</option>
                          {availableDrivers.map((driver) => (
                            <option key={driver._id} value={driver._id}>
                              {driver.name} {driver.phone ? `— ${driver.phone}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Phụ xe
                      </label>
                      <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-0.5">
                        <UserIcon size={16} className="text-[#6b7280]" />
                        <select
                          value={formAssistantId}
                          onChange={(e) => setFormAssistantId(e.target.value)}
                          className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium py-2.5 outline-none"
                        >
                          <option value="">Không có</option>
                          {availableAssistants.map((assistant) => (
                            <option key={assistant._id} value={assistant._id}>
                              {assistant.name} {assistant.phone ? `— ${assistant.phone}` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-[#eb8a45]/20 bg-[#fef6f0] p-4">
                  <h4 className="text-[13px] font-bold text-[#eb8a45] mb-3 flex items-center gap-2">
                    <Clock size={16} />
                    Thời gian chuyến đi (có thể chỉnh sửa)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Thời gian khởi hành
                      </label>
                      <input
                        type="datetime-local"
                        value={formDeparture}
                        onChange={(e) => setFormDeparture(e.target.value)}
                        className="w-full rounded-lg border border-[#dde2ea] px-3 py-2.5 text-[13px]"
                      />
                    </div>
                    <div>
                      <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                        Thời gian kết thúc dự kiến
                      </label>
                      <input
                        type="datetime-local"
                        value={formArrival}
                        onChange={(e) => setFormArrival(e.target.value)}
                        className="w-full rounded-lg border border-[#dde2ea] px-3 py-2.5 text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="block text-[12px] font-medium text-[#374151] mb-1.5">
                      Thời gian dự kiến
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-[#dde2ea] bg-white px-3 py-2.5">
                      <Clock size={16} className="text-[#6b7280]" />
                      <input
                        value={`${selected.scheduled_duration} phút`}
                        disabled
                        className="flex-1 bg-transparent text-[13px] text-[#111827] font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border-2 border-[#eb8a45]/20 bg-[#fef6f0] p-4">
                  <h4 className="text-[13px] font-bold text-[#eb8a45] mb-3">
                    Trạng thái chuyến
                  </h4>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full rounded-lg border border-[#dde2ea] px-3 py-2.5 text-[13px] font-medium"
                  >
                    <option value="SCHEDULED">Đã lên lịch</option>
                    <option value="RUNNING">Đang chạy</option>
                    <option value="FINISHED">Kết thúc</option>
                    <option value="CANCELLED">Đã hủy</option>
                    <option value="UNASSIGNED">Chưa gán</option>
                  </select>
                </div>

                {updateError && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-3">
                    <X size={18} className="text-red-600 mt-0.5" />
                    <div>
                      <p className="text-[13px] font-semibold text-red-800">
                        Lỗi khi cập nhật
                      </p>
                      <p className="text-[12px] text-red-600 mt-1">
                        {updateError}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 border-t border-[#dde2ea] bg-[#f9fafb] px-4 sm:px-6 py-3 sm:py-4">
              <button
                onClick={closeModal}
                disabled={updating}
                className="w-full sm:w-auto rounded-lg border border-[#dde2ea] bg-white px-5 py-2.5 text-[13px] font-semibold text-[#374151] hover:bg-[#f3f4f6] disabled:opacity-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full sm:w-auto rounded-lg bg-[#eb8a45] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#d97a35] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Edit size={14} />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {notice ? (
        <>
          <style>{`
          @keyframes routeNoticeIn {
            0% {
              opacity: 0;
              transform: translateY(10px) scale(0.95);
            }
            70% {
              transform: translateY(-2px) scale(1.02);
            }
            100% {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes routeNoticeIcon {
            0% {
              transform: scale(0.4) rotate(-25deg);
              opacity: 0;
            }
            55% {
              transform: scale(1.18) rotate(8deg);
              opacity: 1;
            }
            80% {
              transform: scale(0.95) rotate(-4deg);
            }
            100% {
              transform: scale(1) rotate(0);
            }
          }

          @keyframes routeNoticePulse {
            0% {
              box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32);
            }
            100% {
              box-shadow: 0 0 0 16px rgba(16, 185, 129, 0);
            }
          }
        `}</style>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/35 px-4"
            onClick={() => setNotice(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.7)]"
              onClick={(event) => event.stopPropagation()}
              style={{
                animation:
                  notice.type === "success"
                    ? "routeNoticeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
                    : "routeNoticeIn 0.35s ease",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${notice.type === "success"
                    ? "bg-[#ecfdf3] text-[#16a34a]"
                    : "bg-[#fff7ed] text-[#ea580c]"
                    }`}
                  style={{
                    animation:
                      notice.type === "success"
                        ? "routeNoticePulse 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                        : undefined,
                  }}
                >
                  {notice.type === "success" ? (
                    <CircleCheck
                      size={20}
                      style={{
                        animation:
                          notice.type === "success"
                            ? "routeNoticeIcon 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
                            : undefined,
                      }}
                    />
                  ) : (
                    <TriangleAlert size={20} />
                  )}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-black text-[#111827]">
                    {notice.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#4b5563]">
                    {notice.message}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-lg bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default ManageTrip;
