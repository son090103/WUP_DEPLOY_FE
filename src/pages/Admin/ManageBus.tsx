import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search as SearchIcon,
  X,
  Edit,
  Eye,
  Loader2,
  Bus,
  AlertCircle,
  CheckCircle,
  Wrench,
  Save,
  ChevronLeft,
} from "lucide-react";

type BusTypeModel = {
  _id?: string;
  name?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
};

type SeatColumn = {
  name: "LEFT" | "MIDDLE" | "RIGHT";
  seats_per_row: number;
};

type ColumnOverride = {
  column_name: "LEFT" | "MIDDLE" | "RIGHT";
  seats: number;
};

type RowOverride = {
  row_index: number;
  floor: number;
  column_overrides: ColumnOverride[];
  note?: string;
};

type SeatLayout = {
  template_name?: string;
  floors?: number;
  rows?: number;
  columns?: SeatColumn[];
  row_overrides?: RowOverride[];
  total_seats?: number;
};

type BusModel = {
  _id?: string;
  id?: string;
  license_plate?: string;
  bus_type_id?: BusTypeModel | string;
  seat_layout?: SeatLayout;
  total_seats?: number;
  seats?: number;
  status?: string;
  created_at?: string;
  [k: string]: unknown;
};

type ApiResponse<T = unknown> = {
  success?: boolean;
  message?: string;
  data?: T;
};

type BusRow = {
  id?: string;
  plate: string;
  type: string;
  typeId?: string;
  typeName?: string;
  seats: number;
  floors: number;
  rows: number;
  status: "Sẵn sàng" | "Bảo trì";
  raw?: BusModel;
};

// Form state for edit modal
type EditFormState = {
  license_plate: string;
  bus_type_id: string;
  status: "ACTIVE" | "MAINTENANCE";
};

const mapStatusToVn = (s?: string): "Sẵn sàng" | "Bảo trì" => {
  if (!s) return "Sẵn sàng";
  const up = String(s).toUpperCase();
  return up === "MAINTENANCE" ? "Bảo trì" : "Sẵn sàng";
};

const mapStatusToEn = (s: "Sẵn sàng" | "Bảo trì"): "ACTIVE" | "MAINTENANCE" => {
  return s === "Bảo trì" ? "MAINTENANCE" : "ACTIVE";
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isBusModel = (v: unknown): v is BusModel => {
  if (!isRecord(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.license_plate === "string" ||
    typeof r._id === "string" ||
    isRecord(r.seat_layout)
  );
};

const extractMessage = (payload: unknown): string | undefined => {
  if (!isRecord(payload)) return undefined;
  if (typeof payload.message === "string") return payload.message;
  if (isRecord(payload.data) && typeof payload.data.message === "string")
    return payload.data.message;
  return undefined;
};

const extractBusArray = (payload: unknown): BusModel[] => {
  if (Array.isArray(payload) && payload.every(isBusModel))
    return payload as BusModel[];

  if (!isRecord(payload)) return [];

  if (
    Array.isArray(payload.data) &&
    (payload.data as unknown[]).every(isBusModel)
  ) {
    return payload.data as BusModel[];
  }

  if (isRecord(payload.data)) {
    const nested = (payload.data as Record<string, unknown>).buses;
    if (Array.isArray(nested) && nested.every(isBusModel))
      return nested as BusModel[];
  }

  const direct = (payload as Record<string, unknown>).buses;
  if (Array.isArray(direct) && direct.every(isBusModel))
    return direct as BusModel[];

  return [];
};

const ManageBus: React.FC = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<BusRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  console.log("bus trong chương trình là : ", buses);
  const [activeTab, setActiveTab] = useState<"Tất cả" | "Sẵn sàng" | "Bảo trì">(
    "Tất cả"
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal state for viewing bus details
  const [selectedBus, setSelectedBus] = useState<BusRow | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Modal state for editing bus
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBus, setEditingBus] = useState<BusRow | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>({
    license_plate: "",
    bus_type_id: "",
    status: "ACTIVE",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  // Bus types for dropdown
  const [busTypes, setBusTypes] = useState<{ id: string; name: string }[]>([]);

  const getStatusStyle = (status: "Sẵn sàng" | "Bảo trì") =>
    status === "Sẵn sàng"
      ? "bg-green-50 text-green-700 ring-1 ring-green-200"
      : "bg-amber-50 text-amber-700 ring-1 ring-amber-200";

  const getStatusIcon = (status: "Sẵn sàng" | "Bảo trì") =>
    status === "Sẵn sàng" ? (
      <CheckCircle size={14} className="mr-1" />
    ) : (
      <Wrench size={14} className="mr-1" />
    );
  const api = import.meta.env.VITE_API_URL
  const fetchBuses = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const url =
        `${api}/api/admin/check/viewBuses?page=1&limit=200`;
      const res = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const parsed = await res.json().catch(() => ({} as ApiResponse<unknown>));

      if (!res.ok) {
        const msg = extractMessage(parsed) ?? "Không thể lấy danh sách xe";
        throw new Error(msg);
      }

      const rawList = extractBusArray(parsed);

      const normalized: BusRow[] = rawList.map((b) => {
        console.log("xe đã lấy từ api là : ", b);
        const typeObj = b.bus_type_id;
        const typeName =
          typeof typeObj === "object" && typeObj !== null
            ? (typeObj as BusTypeModel).name ?? "N/A"
            : typeof typeObj === "string"
              ? typeObj
              : "N/A";

        const typeId =
          typeof typeObj === "object" && typeObj !== null
            ? (typeObj as BusTypeModel)._id
            : typeof typeObj === "string"
              ? typeObj
              : undefined;

        const seats =
          Number(
            b?.seat_layout?.total_seats ?? b?.total_seats ?? b?.seats ?? 0
          ) || 0;

        const floors = b?.seat_layout?.floors ?? 1;
        const rows = b?.seat_layout?.rows ?? 0;

        console.log("trạng thái là : ", b.status);
        return {
          id: b._id ?? b.id,
          plate: b.license_plate ?? "N/A",
          type: typeName,
          typeId,
          typeName,
          seats,
          floors,
          rows,
          status: mapStatusToVn(b.status),
          raw: b,
        };
      });

      setBuses(normalized);

      // Extract bus types
      const typeMap = new Map<string, string>();
      rawList.forEach((b) => {
        const bt = b.bus_type_id;
        if (typeof bt === "object" && bt !== null) {
          const t = bt as BusTypeModel;
          if (t._id && t.name) typeMap.set(String(t._id), t.name);
        }
      });
      setBusTypes(
        Array.from(typeMap.entries()).map(([id, name]) => ({ id, name }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all bus types for dropdown
  const fetchBusTypes = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const res = await fetch(
        `${api}/api/admin/notcheck/BusType`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        const types = Array.isArray(data) ? data : data.data || [];
        setBusTypes(
          types.map((t: BusTypeModel) => ({
            id: t._id || "",
            name: t.name || "",
          }))
        );
      }
    } catch (err) {
      console.error("Error fetching bus types:", err);
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchBusTypes();
  }, []);

  const filteredBuses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return buses.filter((bus) => {
      if (activeTab !== "Tất cả" && bus.status !== activeTab) return false;
      if (!q) return true;
      return (
        `${bus.plate} ${bus.type} ${bus.seats}`.toLowerCase().indexOf(q) !== -1
      );
    });
  }, [buses, activeTab, searchQuery]);

  const handleAddNew = () => {
    navigate("/admin/create-coach");
  };

  // Open edit modal
  const handleEdit = (bus: BusRow): void => {
    setEditingBus(bus);
    setEditForm({
      license_plate: bus.plate,
      bus_type_id: bus.typeId || "",
      status: mapStatusToEn(bus.status),
    });
    setEditError(null);
    setEditSuccess(null);
    setIsEditModalOpen(true);
  };

  // Close edit modal
  const closeEditModal = (): void => {
    setIsEditModalOpen(false);
    setEditingBus(null);
    setEditError(null);
    setEditSuccess(null);
  };

  // Handle form input change
  const handleEditFormChange = (
    field: keyof EditFormState,
    value: string
  ): void => {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  };

  // Submit edit form
  const handleSaveEdit = async (): Promise<void> => {
    if (!editingBus?.id) return;

    // Validation
    if (!editForm.license_plate.trim()) {
      setEditError("Vui lòng nhập biển số xe");
      return;
    }
    if (!editForm.bus_type_id) {
      setEditError("Vui lòng chọn loại xe");
      return;
    }

    setSaving(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const token = localStorage.getItem("accessToken") ?? "";
      const res = await fetch(
        `${api}/api/admin/check/buses/${editingBus.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            license_plate: editForm.license_plate.trim().toUpperCase(),
            bus_type_id: editForm.bus_type_id,
            status: editForm.status,
          }),
        }
      );

      const parsed = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = extractMessage(parsed) ?? "Cập nhật xe thất bại";
        throw new Error(msg);
      }

      setEditSuccess("Cập nhật xe thành công!");

      // Refresh bus list
      await fetchBuses();

      // Close modal after 1.5s
      setTimeout(() => {
        closeEditModal();
      }, 1500);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setSaving(false);
    }
  };

  const handleView = (bus: BusRow): void => {
    setSelectedBus(bus);
    setIsViewModalOpen(true);
  };

  const closeViewModal = (): void => {
    setIsViewModalOpen(false);
    setSelectedBus(null);
  };

  // Render seat layout preview
  const renderSeatLayoutPreview = (bus: BusRow) => {
    const layout = bus.raw?.seat_layout;
    if (!layout) return <p className="text-gray-500">Không có dữ liệu</p>;

    const { floors = 1, rows = 0, columns = [], row_overrides = [] } = layout;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Template:</span>
            <span className="ml-2 font-medium">
              {layout.template_name || "N/A"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Số tầng:</span>
            <span className="ml-2 font-medium">{floors}</span>
          </div>
          <div>
            <span className="text-gray-500">Số hàng:</span>
            <span className="ml-2 font-medium">{rows}</span>
          </div>
          <div>
            <span className="text-gray-500">Tổng ghế:</span>
            <span className="ml-2 font-medium">{layout.total_seats || 0}</span>
          </div>
        </div>

        <div>
          <p className="text-gray-500 text-sm mb-2">Cấu hình cột:</p>
          <div className="flex gap-2 flex-wrap">
            {columns.map((col, idx) => (
              <span
                key={idx}
                className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm"
              >
                {col.name}: {col.seats_per_row} ghế/hàng
              </span>
            ))}
          </div>
        </div>

        {row_overrides && row_overrides.length > 0 && (
          <div>
            <p className="text-gray-500 text-sm mb-2">Hàng đặc biệt:</p>
            <div className="space-y-1">
              {row_overrides.map((override, idx) => (
                <div
                  key={idx}
                  className="text-sm bg-amber-50 text-amber-700 px-3 py-1 rounded"
                >
                  Hàng {override.row_index} (Tầng {override.floor}):
                  {override.column_overrides.map((co, i) => (
                    <span key={i} className="ml-2">
                      {co.column_name}={co.seats}
                    </span>
                  ))}
                  {override.note && (
                    <span className="ml-2 text-gray-500">
                      ({override.note})
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 bg-[#f9fafb] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
            <ChevronLeft size={25} strokeWidth={2.3} />
          </button>
          <div>
            <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý xe</h1>
            <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
              Xem và quản lý danh sách xe trong hệ thống
            </p>
          </div>
        </div>

        <button
          onClick={handleAddNew}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706]"
        >
          <Plus size={18} />
          Thêm xe mới
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Bus size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tổng số xe</p>
              <p className="text-2xl font-bold text-gray-900">{buses.length}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Sẵn sàng</p>
              <p className="text-2xl font-bold text-gray-900">
                {buses.filter((b) => b.status === "Sẵn sàng").length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <Wrench size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Bảo trì</p>
              <p className="text-2xl font-bold text-gray-900">
                {buses.filter((b) => b.status === "Bảo trì").length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Filter Bar */}
        <div className="flex flex-col gap-4 border-b border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-wrap">
            {(["Tất cả", "Sẵn sàng", "Bảo trì"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                  ? "bg-orange-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                  }`}
              >
                {tab}
                {tab !== "Tất cả" && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                    {tab === "Sẵn sàng"
                      ? buses.filter((b) => b.status === "Sẵn sàng").length
                      : buses.filter((b) => b.status === "Bảo trì").length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center rounded-lg border border-gray-200 bg-white px-3 py-2 w-full sm:w-auto">
              <SearchIcon size={16} className="text-gray-400" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm biển số, loại xe..."
                className="ml-2 bg-transparent text-sm outline-none w-full sm:w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE LIST (cards) - shown on small screens */}
        <div className="block md:hidden divide-y divide-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
              <span className="ml-3 text-gray-500">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bus size={48} className="mb-3 text-gray-300" />
              <p>Không tìm thấy xe nào</p>
            </div>
          ) : (
            filteredBuses.map((bus) => (
              <div key={bus.id} className="p-4 bg-white">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-500">Biển số</div>
                        <div className="font-semibold text-gray-900">
                          {bus.plate}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                            bus.status
                          )}`}
                        >
                          {getStatusIcon(bus.status)}
                          {bus.status}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>
                        <div className="text-xs text-gray-400">Loại xe</div>
                        <div className="font-medium text-gray-800">
                          {bus.type}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-400">Số ghế</div>
                        <div className="font-medium text-gray-800">
                          {bus.seats} chỗ
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-400">Cấu hình</div>
                        <div className="text-sm text-gray-600">
                          {bus.floors} tầng × {bus.rows} hàng
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleView(bus)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm border border-gray-200 hover:bg-gray-50"
                  >
                    <Eye size={16} /> Xem
                  </button>
                  <button
                    onClick={() => handleEdit(bus)}
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100"
                  >
                    <Edit size={16} /> Sửa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* DESKTOP / TABLE (hidden on small screens) */}
        <div className="hidden md:block overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-orange-500" />
              <span className="ml-3 text-gray-500">Đang tải...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12 text-red-500">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          ) : filteredBuses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bus size={48} className="mb-3 text-gray-300" />
              <p>Không tìm thấy xe nào</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Biển số xe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Loại xe
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Số ghế
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Cấu hình
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredBuses.map((bus) => (
                  <tr
                    key={bus.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-900">
                        {bus.plate}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{bus.type}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-700">{bus.seats} chỗ</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-500 text-sm">
                        {bus.floors} tầng × {bus.rows} hàng
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                          bus.status
                        )}`}
                      >
                        {getStatusIcon(bus.status)}
                        {bus.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleView(bus)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleEdit(bus)}
                          className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Chỉnh sửa"
                        >
                          <Edit size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* View Detail Modal */}
      {isViewModalOpen && selectedBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chi tiết xe
                </h3>
                <p className="text-sm text-gray-500">{selectedBus.plate}</p>
              </div>
              <button
                onClick={closeViewModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Biển số xe</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBus.plate}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Loại xe</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBus.type}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Số ghế</p>
                    <p className="font-semibold text-gray-900">
                      {selectedBus.seats} chỗ
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500 mb-1">Trạng thái</p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                        selectedBus.status
                      )}`}
                    >
                      {getStatusIcon(selectedBus.status)}
                      {selectedBus.status}
                    </span>
                  </div>
                </div>

                {/* Seat Layout */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Cấu hình ghế ngồi
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {renderSeatLayoutPreview(selectedBus)}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeViewModal}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  closeViewModal();
                  handleEdit(selectedBus);
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <Edit size={16} />
                Chỉnh sửa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingBus && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Chỉnh sửa xe
                </h3>
                <p className="text-sm text-gray-500">{editingBus.plate}</p>
              </div>
              <button
                onClick={closeEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Error Message */}
              {editError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                  <AlertCircle size={16} />
                  {editError}
                </div>
              )}

              {/* Success Message */}
              {editSuccess && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                  <CheckCircle size={16} />
                  {editSuccess}
                </div>
              )}

              <div className="space-y-4">
                {/* License Plate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biển số xe <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.license_plate}
                    onChange={(e) =>
                      handleEditFormChange(
                        "license_plate",
                        e.target.value.toUpperCase()
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                    placeholder="51B-123.45"
                  />
                </div>

                {/* Bus Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Loại xe <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editForm.bus_type_id}
                    onChange={(e) =>
                      handleEditFormChange("bus_type_id", e.target.value)
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                  >
                    <option value="">Chọn loại xe</option>
                    {busTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trạng thái
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) =>
                      handleEditFormChange(
                        "status",
                        e.target.value as "ACTIVE" | "MAINTENANCE"
                      )
                    }
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                  >
                    <option value="ACTIVE">Sẵn sàng</option>
                    <option value="MAINTENANCE">Bảo trì</option>
                  </select>
                </div>

                {/* Seat Layout Info (Read-only) */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">
                    Thông tin cấu hình ghế
                  </p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Số tầng:</span>
                      <span className="ml-1 font-medium">
                        {editingBus.floors}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Số hàng:</span>
                      <span className="ml-1 font-medium">
                        {editingBus.rows}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Tổng ghế:</span>
                      <span className="ml-1 font-medium">
                        {editingBus.seats}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    * Để thay đổi cấu hình ghế, vui lòng tạo xe mới
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button
                onClick={closeEditModal}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={saving}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBus;
