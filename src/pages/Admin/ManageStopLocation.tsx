import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search as SearchIcon,
  MapPin,
  ChevronLeft,
  ChevronRight,
  X,
  Star,
  ToggleLeft,
  ToggleRight,

  Navigation,
  Plus,
} from "lucide-react";
import type { allStops } from "../../model/allStops";
import baseApiAuth from "../../api/auth";
import type { getAllStopLocation } from "../../model/getAllLocationOfStop";
import { CircleCheck, TriangleAlert } from "lucide-react";


type StopLocationModel = {
  _id: string;
  stop_id: string;
  location_name: string;
  address?: string;
  status?: boolean;
  is_active?: boolean;
  location_type?: "PICKUP" | "DROPOFF" | "BOTH";
  location?: { type?: string; coordinates?: number[] };
  created_at?: string;
};

type StopModel = {
  _id: string;
  province: string;
  stopLocation_id?: { _id?: string; location_name?: string } | string;
  is_active?: boolean;
  location?: { type?: string; coordinates?: number[] };
  created_at?: string;
};
interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

/* ──────────────────────── Helpers ──────────────────────── */

const API = "http://localhost:3000";
const token = () => localStorage.getItem("accessToken") ?? "";
const authHeaders = (): HeadersInit => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token()}`,
});

const locationTypeLabel: Record<string, string> = {
  PICKUP: "Điểm đón",
  DROPOFF: "Điểm trả",
  BOTH: "Đón & Trả",
};

/* ──────────────────────── Component ──────────────────────── */

const ManageStopLocation: React.FC = () => {
  const navigate = useNavigate();
  /* ---- state: stops ---- */
  const [stops, setStops] = useState<allStops[]>([]);
  const [loadingStops, setLoadingStops] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedStop, setSelectedStop] = useState<allStops | null>(null);
  const [mainLocId, setMainLocId] = useState("");
  /* ---- state: stop locations ---- */
  const [locations, setLocations] = useState<getAllStopLocation[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  /* ---- state: edit location modal ---- */
  const [editingLoc, setEditingLoc] = useState<StopLocationModel | null>(null);
  const [editForm, setEditForm] = useState({ location_name: "", address: "", location_type: "BOTH" as string });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  /* ---- state: update stopLocation_id modal ---- */
  const [showSetMain, setShowSetMain] = useState(false);

  const [savingMain, setSavingMain] = useState(false);

  /* ---- state: toggle stop status ---- */
  const [togglingStopStatus, setTogglingStopStatus] = useState(false);

  /* ---- pagination ---- */
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 12;

  // Hàm userEffect cho getAllStops
  useEffect(() => {
    getAllStops();
  }, [])

  // Hàm lấy tất cả các Stop ko co'status
  const getAllStops = async () => {
    try {
      const res = await baseApiAuth.get("/api/admin/check/getAllStopsNotFilter");
      console.log("Data : ", res.data);
      setStops(res.data);
    } catch (error) {
      console.error(error);
    }
  }
  const handleSelectStop = (stop: allStops) => {
    setSelectedStop(stop);
    // Auto set mainLocId từ stopLocation_id
    const ref = stop.stopLocation_id;
    if (ref && typeof ref === "object" && ref._id) {
      setMainLocId(ref._id);
    } else {
      setMainLocId("");
    }
  };
  // Hàm userEffect cho getAllStopLocationOfStops
  useEffect(() => {
    console.log("Id la", selectedStop?._id)
    if (selectedStop?._id) {
      getAllStopLocationOfStops(selectedStop._id);
    }
  }, [selectedStop]);
  // Hàm Lấy tất cả stoplocation thuộc stop
  const getAllStopLocationOfStops = async (stopId: string) => {
    try {
      const res = await baseApiAuth.get("/api/admin/check/getStopLocationOfStop", { params: { stop_id: stopId } });
      console.log("Data StopLocation: ", res.data);
      setLocations(res.data);
    } catch (error) {
      console.error(error);
    }
  }

  // Hàm update status của Stop
  const updateStopStatus = async (stopId: string) => {
    try {
      const res = await baseApiAuth.patch("/api/admin/check/updateStopStatus", null, { params: { stop_id: stopId } });
      console.log("Data Update: ", res.data);
      await getAllStops();
      setSelectedStop(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (error) {
      console.log(error);
    }
  }
  // Hàm update status của Stop
  const updateStopLocationStatus = async (stopLocationId: string) => {
    try {
      const res = await baseApiAuth.patch("/api/admin/check/updateStopLocationStatus", null, {
        params: { stopLocation_id: stopLocationId }
      });
      console.log("Data Update:", res.data);

      // Refresh lại danh sách locations
      if (selectedStop?._id) {
        await getAllStopLocationOfStops(selectedStop._id);
      }
    } catch (error) {
      console.log(error);
    }
  };
  // Hàm update main stop location cho stop
  const updateMainStopLocation = async (stopId: string, newStopLocationID: string) => {
    try {
      const res = await baseApiAuth.patch("/api/admin/check/updateMainStopLocation", null, { params: { stop_id: stopId, newStopLocation_id: newStopLocationID } });
      setShowSetMain(false);

      setNotice({
        type: "success",
        title: "Cập nhật thành công",
        message: res.data?.message || "Thông tin tuyến đã được lưu.",
      });
    } catch (error: any) {
      console.log(error);

      setShowSetMain(false);
      setNotice({
        type: "error",
        title: "Tạo tuyến thất bại",
        message:
          error.response?.data?.message ||
          "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    }
  }



  /* ──────────── Filtered stops ──────────── */
  const filteredStops = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return stops.filter((s) => {
      if (statusFilter === "active" && !s.is_active) return false;
      if (statusFilter === "inactive" && s.is_active !== false) return false;
      if (q && !s.province.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [stops, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStops.length / perPage));
  const pagedStops = filteredStops.slice((currentPage - 1) * perPage, currentPage * perPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  /* ──────────── Get main location name ──────────── */
  const getMainLocName = () => {
    const ref = selectedStop?.stopLocation_id;

    if (ref && typeof ref === "object" && ref.location_name) return ref.location_name;
    return "Chưa gán";
  };

  /* ================================================================
     RENDER
     ================================================================ */
  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
            <ChevronLeft size={25} strokeWidth={2.3} />
          </button>
          <div>
            <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý Stop & StopLocation</h1>
            <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
              Chọn tỉnh thành bên trái để xem và quản lý các vị trí đón/trả khách
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate("/admin/create-stop-location")}
          className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706]"
        >
          <Plus size={16} />
          Tạo vị trí mới
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Tổng tỉnh thành</p>
          <p className="mt-2 text-2xl font-black text-gray-900">{stops.length}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Đang hoạt động</p>
          <p className="mt-2 text-2xl font-black text-green-600">
            {stops.filter((s) => s.is_active !== false).length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-gray-500">Tạm ngưng</p>
          <p className="mt-2 text-2xl font-black text-red-500">
            {stops.filter((s) => s.is_active === false).length}
          </p>
        </div>
      </div>

      {/* MAIN LAYOUT: LEFT (Stop List) + RIGHT (Detail) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ============ LEFT PANEL: Stop list ============ */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search & filter */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 space-y-3">
            <div className="relative">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm tỉnh thành..."
                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <SearchIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="active">Hoạt động</option>
              <option value="inactive">Tạm ngưng</option>
            </select>
          </div>

          {/* Stop list */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            {loadingStops ? (
              <div className="p-8 text-center text-gray-400 text-sm">Đang tải...</div>
            ) : pagedStops.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">Không tìm thấy tỉnh thành</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pagedStops.map((stop) => {
                  const isSelected = selectedStop?._id === stop._id;
                  return (
                    <button
                      key={stop._id}
                      onClick={() => handleSelectStop(stop)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-200 ${isSelected
                        ? "bg-[#FFF4EB] border-l-4 border-l-[#FF5722]"
                        : "border-l-4 border-l-transparent hover:bg-gray-50"
                        }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isSelected ? "bg-orange-500 text-white" : "bg-orange-100 text-orange-500"
                          }`}
                      >
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 truncate">{stop.province}</div>
                        <div className="text-xs text-gray-400 mt-0.5 truncate">{getMainLocName()}</div>
                      </div>
                      <span
                        className={`flex-shrink-0 inline-flex w-2 h-2 rounded-full ${stop.is_active !== false ? "bg-green-500" : "bg-red-400"
                          }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                <span>
                  Trang {currentPage}/{totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded p-1 hover:bg-gray-100 disabled:opacity-40"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ============ RIGHT PANEL: Detail ============ */}
        <div className="lg:col-span-2">
          {!selectedStop ? (
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm flex flex-col items-center justify-center py-20 text-gray-400">
              <Navigation size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">Chọn một tỉnh thành để xem chi tiết</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Stop info card */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center">
                      <MapPin size={20} className="text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-gray-900">{selectedStop.province}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">ID: {selectedStop._id}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updateStopStatus(selectedStop._id)}
                    disabled={togglingStopStatus}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer disabled:opacity-50 ${selectedStop.is_active !== false
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-red-100 text-red-700 hover:bg-red-200"
                      }`}
                    title={selectedStop.is_active !== false ? "Click để tạm ngưng" : "Click để kích hoạt"}
                  >
                    {selectedStop.is_active !== false ? (
                      <ToggleRight size={16} />
                    ) : (
                      <ToggleLeft size={16} />
                    )}
                    {togglingStopStatus ? "Đang xử lý..." : selectedStop.is_active !== false ? "Hoạt động" : "Tạm ngưng"}
                  </button>
                </div>

                {/* Main StopLocation */}
                <div className="mt-4 flex items-center gap-3 p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <Star size={16} className="text-orange-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-orange-600 uppercase tracking-wide">Vị trí chính</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 truncate">
                      {getMainLocName()}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSetMain(true)}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 border border-orange-300 rounded-md px-3 py-1.5 hover:bg-orange-100 transition-colors"
                  >
                    Thay đổi
                  </button>
                </div>
              </div>

              {/* Location list */}
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Danh sách vị trí đón/trả</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{locations.length} vị trí</p>
                  </div>
                </div>

                {loadingLocations ? (
                  <div className="p-8 text-center text-gray-400 text-sm">Đang tải vị trí...</div>
                ) : locations.length === 0 ? (
                  <div className="p-8 text-center text-gray-400 text-sm">
                    Chưa có vị trí nào cho tỉnh thành này
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {locations.map((loc) => {
                      const isMain = mainLocId === loc._id;
                      return (
                        <div
                          key={loc._id}
                          className={`px-5 py-4 flex items-start gap-4 transition-all ${!loc.is_active ? "opacity-50" : ""
                            } ${isMain ? "bg-orange-50/50" : "hover:bg-gray-50"}`}
                        >
                          {/* Icon */}
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isMain ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {isMain ? <Star size={14} /> : <MapPin size={14} />}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-900 truncate">
                                {loc.location_name}
                              </span>
                              {isMain && (
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-orange-500 text-white uppercase">
                                  Chính
                                </span>
                              )}
                            </div>
                            {loc.address && (
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{loc.address}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${loc.location_type === "PICKUP"
                                  ? "bg-blue-100 text-blue-700"
                                  : loc.location_type === "DROPOFF"
                                    ? "bg-purple-100 text-purple-700"
                                    : "bg-gray-100 text-gray-600"
                                  }`}
                              >
                                {locationTypeLabel[loc.location_type ?? "BOTH"] ?? "Đón & Trả"}
                              </span>
                              <span
                                className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${loc.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                                  }`}
                              >
                                {loc.is_active ? "Hoạt động" : "Tạm ngưng"}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Toggle status */}
                            <button
                              onClick={() => updateStopLocationStatus(loc._id)}
                              title={loc.is_active ? "Tắt hoạt động" : "Bật hoạt động"}
                              className={`p-1.5 rounded-md transition-colors ${loc.is_active
                                ? "text-green-600 hover:bg-green-50"
                                : "text-gray-400 hover:bg-gray-100"
                                }`}
                            >
                              {loc.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ============ MODAL: Edit location ============ */}
      {editingLoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa vị trí</h3>
              <button onClick={() => setEditingLoc(null)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 p-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên vị trí</label>
                <input
                  value={editForm.location_name}
                  onChange={(e) => setEditForm({ ...editForm, location_name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                <input
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại vị trí</label>
                <select
                  value={editForm.location_type}
                  onChange={(e) => setEditForm({ ...editForm, location_type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="PICKUP">Điểm đón</option>
                  <option value="DROPOFF">Điểm trả</option>
                  <option value="BOTH">Đón & Trả</option>
                </select>
              </div>

              {saveError && (
                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{saveError}</div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setEditingLoc(null)}
                disabled={saving}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                disabled={saving}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ MODAL: Set main stopLocation ============ */}
      {showSetMain && selectedStop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-bold text-gray-900">
                Chọn vị trí chính cho{" "}
                <span className="text-orange-500">{selectedStop.province}</span>
              </h3>
              <button onClick={() => setShowSetMain(false)} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-3">
              {locations.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Chưa có vị trí nào</p>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {locations
                    .filter((l) => l.is_active)
                    .map((loc) => (
                      <label
                        key={loc._id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${mainLocId === loc._id
                          ? "border-orange-400 bg-orange-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        <input
                          type="radio"
                          name="mainLoc"
                          checked={mainLocId === loc._id}
                          onChange={() => setMainLocId(loc._id)}
                          className="accent-orange-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{loc.location_name}</p>
                          {loc.address && (
                            <p className="text-xs text-gray-400 truncate">{loc.address}</p>
                          )}
                        </div>
                        {mainLocId === loc._id && <Star size={14} className="text-orange-500 flex-shrink-0" />}
                      </label>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                onClick={() => setShowSetMain(false)}
                disabled={savingMain}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => updateMainStopLocation(selectedStop._id, mainLocId)}
                disabled={savingMain || !mainLocId}
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
              >
                Xác nhận
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

export default ManageStopLocation;
