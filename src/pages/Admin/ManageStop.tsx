import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Edit,
    ChevronLeft,
    ChevronRight,
    X,
    Search as SearchIcon,
    MapPin,
} from "lucide-react";

type StopLocationRef = {
    _id?: string;
    location_name?: string;
    address?: string;
    [k: string]: unknown;
};

type StopModel = {
    _id?: string;
    province?: string;
    stopLocation_id?: StopLocationRef | string;
    is_active?: boolean;
    location?: {
        type?: string;
        coordinates?: number[];
    };
    created_at?: string;
    [k: string]: unknown;
};

type StopRow = {
    id?: string;
    province: string;
    stopLocationId: string;
    stopLocationName: string;
    status: "Hoạt động" | "Tạm ngưng";
    created_at?: string;
    raw?: StopModel;
};

type StopLocationOption = {
    _id: string;
    location_name: string;
    address?: string;
};

type FormDataType = {
    stopLocation_id: string;
    status: "Hoạt động" | "Tạm ngưng" | "";
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null;

const mapStatusToVn = (v?: unknown): "Hoạt động" | "Tạm ngưng" => {
    if (v === undefined || v === null) return "Tạm ngưng";
    if (typeof v === "boolean") return v ? "Hoạt động" : "Tạm ngưng";
    const up = String(v).toUpperCase();
    if (up === "ACTIVE" || up === "ENABLED" || up === "TRUE") return "Hoạt động";
    return "Tạm ngưng";
};

const ManageStop: React.FC = () => {
    const navigate = useNavigate();
    const [stops, setStops] = useState<StopRow[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<
        "Tất cả" | "Hoạt động" | "Tạm ngưng"
    >("Tất cả");

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedStop, setSelectedStop] = useState<StopRow | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState<FormDataType>({
        stopLocation_id: "",
        status: "",
    });
    const [updating, setUpdating] = useState(false);
    const [updateError, setUpdateError] = useState<string | null>(null);

    const [stopLocations, setStopLocations] = useState<StopLocationOption[]>([]);
    const [loadingLocations, setLoadingLocations] = useState(false);

    const fetchStops = async (): Promise<void> => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("accessToken") ?? "";
            const url =
                `${api}/api/admin/check/stops?page=1&limit=200`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const parsed = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg =
                    (isRecord(parsed) && typeof parsed.message === "string"
                        ? parsed.message
                        : null) ?? "Không thể lấy danh sách tỉnh thành";
                throw new Error(msg);
            }

            const rawList: StopModel[] = Array.isArray(parsed)
                ? parsed
                : Array.isArray((parsed as Record<string, unknown>)?.data)
                    ? ((parsed as Record<string, unknown>).data as StopModel[])
                    : [];

            const normalized: StopRow[] = rawList.map((r) => {
                const slRef = r.stopLocation_id;
                let slId = "";
                let slName = "Chưa gán";
                if (isRecord(slRef)) {
                    slId = String((slRef as StopLocationRef)._id ?? "");
                    slName = String(
                        (slRef as StopLocationRef).location_name ?? "Chưa gán"
                    );
                } else if (typeof slRef === "string") {
                    slId = slRef;
                    slName = slRef;
                }

                return {
                    id: r._id,
                    province: r.province ?? "N/A",
                    stopLocationId: slId,
                    stopLocationName: slName,
                    status: mapStatusToVn(r.is_active),
                    created_at: r.created_at,
                    raw: r,
                };
            });

            setStops(normalized);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi không xác định");
        } finally {
            setLoading(false);
        }
    };

    const fetchStopLocations = async (stopId: string): Promise<void> => {
        setLoadingLocations(true);
        try {
            const token = localStorage.getItem("accessToken") ?? "";
            const url = `${api}/api/admin/check/getStopLocationOfStop?stop_id=${stopId}`;
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            const parsed = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error("Không lấy được danh sách điểm đón");

            const list: StopLocationOption[] = Array.isArray(parsed)
                ? parsed
                : Array.isArray((parsed as Record<string, unknown>)?.data)
                    ? ((parsed as Record<string, unknown>).data as StopLocationOption[])
                    : [];

            setStopLocations(list);
        } catch {
            setStopLocations([]);
        } finally {
            setLoadingLocations(false);
        }
    };

    useEffect(() => {
        fetchStops();
    }, []);

    const filteredStops = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return stops.filter((stop) => {
            if (activeTab === "Hoạt động" && stop.status !== "Hoạt động")
                return false;
            if (activeTab === "Tạm ngưng" && stop.status !== "Tạm ngưng")
                return false;
            if (!q) return true;
            const hay =
                `${stop.province} ${stop.stopLocationName} ${stop.id ?? ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [stops, activeTab, searchQuery]);

    const handleEdit = (stop: StopRow) => {
        setSelectedStop(stop);
        setFormData({
            stopLocation_id: stop.stopLocationId,
            status: stop.status,
        });
        setUpdateError(null);
        setIsModalOpen(true);
        if (stop.id) {
            fetchStopLocations(stop.id);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedStop(null);
        setUpdateError(null);
        setStopLocations([]);
    };
    const api = import.meta.env.VITE_API_URL
    const handleUpdate = async () => {
        if (!selectedStop?.id) return;
        setUpdating(true);
        setUpdateError(null);
        try {
            const token = localStorage.getItem("accessToken") ?? "";
            const payload: { stopLocation_id?: string; is_active?: boolean } = {};
            if (formData.stopLocation_id)
                payload.stopLocation_id = formData.stopLocation_id;
            if (formData.status)
                payload.is_active = formData.status === "Hoạt động";

            const res = await fetch(
                `${api}/api/admin/check/stops/${selectedStop.id}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                    body: JSON.stringify(payload),
                }
            );

            const parsed = await res.json().catch(() => ({}));
            if (!res.ok) {
                const msg =
                    (isRecord(parsed) && typeof parsed.message === "string"
                        ? parsed.message
                        : null) ?? "Cập nhật tỉnh thành thất bại";
                throw new Error(msg);
            }

            await fetchStops();
            closeModal();
        } catch (err) {
            setUpdateError(
                err instanceof Error ? err.message : "Lỗi khi cập nhật"
            );
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* HEADER */}
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
                    <ChevronLeft size={25} strokeWidth={2.3} />
                </button>
                <div>
                    <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
                        Quản lý tỉnh thành
                    </h1>
                    <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
                        Xem và quản lý các tỉnh thành và điểm đón chính
                    </p>
                </div>
            </div>

            {/* STATS */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                        Tổng số tỉnh thành
                    </p>
                    <p className="mt-3 text-2xl font-black text-gray-900">
                        {stops.length} Tỉnh
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                        Tỉnh hoạt động
                    </p>
                    <p className="mt-3 text-2xl font-black text-gray-900">
                        {stops.filter((s) => s.status === "Hoạt động").length} Tỉnh
                    </p>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-sm font-medium text-gray-900">
                        Tỉnh tạm ngưng
                    </p>
                    <p className="mt-3 text-2xl font-black text-gray-900">
                        {stops.filter((s) => s.status === "Tạm ngưng").length} Tỉnh
                    </p>
                </div>
            </div>

            {/* TABLE WRAPPER */}
            <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                {/* FILTER BAR */}
                <div className="flex flex-col gap-4 border-b border-gray-200 p-5 sm:flex-row sm:items-end sm:gap-6">
                    <div className="flex-1 max-w-md">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                            Tìm tỉnh thành
                        </label>
                        <div className="relative">
                            <input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm tên tỉnh thành..."
                                className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <SearchIcon
                                size={18}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />
                        </div>
                    </div>

                    <div className="w-full sm:w-40">
                        <label className="block text-sm font-medium text-gray-900 mb-1">
                            Trạng thái
                        </label>
                        <select
                            value={activeTab}
                            onChange={(e) =>
                                setActiveTab(
                                    e.target.value as
                                    | "Tất cả"
                                    | "Hoạt động"
                                    | "Tạm ngưng"
                                )
                            }
                            className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                            <option value="Tất cả">Tất cả</option>
                            <option value="Hoạt động">Hoạt động</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                        </select>
                    </div>
                </div>

                {/* TABLE */}
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            Đang tải danh sách tỉnh thành...
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-600 text-sm">
                            Lỗi: {error}
                        </div>
                    ) : (
                        <table className="w-full text-sm divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                        Tỉnh thành
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                        Điểm đón chính
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-900">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-3 text-right font-semibold text-gray-900">
                                        Hành động
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-gray-200">
                                {filteredStops.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center text-gray-400 text-sm"
                                        >
                                            Không có tỉnh thành phù hợp
                                        </td>
                                    </tr>
                                ) : (
                                    filteredStops.map((stop, idx) => (
                                        <tr
                                            key={stop.id ?? idx}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                        <MapPin
                                                            size={16}
                                                            className="text-orange-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-gray-900">
                                                            {stop.province}
                                                        </div>
                                                        <div className="text-xs text-gray-500 mt-0.5">
                                                            ID:{" "}
                                                            {stop.id
                                                                ?.substring(0, 8)
                                                                .toUpperCase() ??
                                                                "N/A"}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-gray-900">
                                                {stop.stopLocationName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${stop.status === "Hoạt động"
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-red-100 text-red-700"
                                                        }`}
                                                >
                                                    {stop.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => handleEdit(stop)}
                                                    className="text-gray-400 hover:text-orange-500 transition-colors p-1"
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

                {/* FOOTER */}
                <div className="border-t border-gray-200 px-6 py-3 text-xs text-gray-500 flex items-center justify-between">
                    <div>
                        Hiển thị 1–{Math.min(10, filteredStops.length)} của{" "}
                        {filteredStops.length} tỉnh thành
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                            disabled
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="rounded bg-orange-500 px-2 py-1 text-white font-medium">
                            1
                        </span>
                        <button
                            className="rounded p-1 hover:bg-gray-100 disabled:opacity-50"
                            disabled
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && selectedStop && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-bold text-gray-900">
                                Chỉnh sửa tỉnh:{" "}
                                <span className="text-orange-500">
                                    {selectedStop.province}
                                </span>
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6 p-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tỉnh thành
                                </label>
                                <input
                                    value={selectedStop.province}
                                    disabled
                                    className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2 text-sm text-gray-900"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Điểm đón chính (StopLocation)
                                </label>
                                {loadingLocations ? (
                                    <div className="text-sm text-gray-400 py-2">
                                        Đang tải danh sách điểm đón...
                                    </div>
                                ) : stopLocations.length > 0 ? (
                                    <select
                                        value={formData.stopLocation_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                stopLocation_id: e.target.value,
                                            })
                                        }
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option value="">-- Chọn điểm đón --</option>
                                        {stopLocations.map((loc) => (
                                            <option key={loc._id} value={loc._id}>
                                                {loc.location_name}
                                                {loc.address
                                                    ? ` - ${loc.address}`
                                                    : ""}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        value={formData.stopLocation_id}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                stopLocation_id: e.target.value,
                                            })
                                        }
                                        placeholder="Nhập StopLocation ID"
                                        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    />
                                )}
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
                                            status: e.target
                                                .value as FormDataType["status"],
                                        })
                                    }
                                    className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                >
                                    <option value="Hoạt động">Hoạt động</option>
                                    <option value="Tạm ngưng">Tạm ngưng</option>
                                </select>
                            </div>

                            {updateError && (
                                <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
                                    {updateError}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                            <button
                                onClick={closeModal}
                                disabled={updating}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdate}
                                disabled={updating}
                                className="rounded-md bg-orange-500 px-4 py-2 text-sm text-white hover:opacity-90 disabled:opacity-50"
                            >
                                {updating ? "Đang lưu..." : "Lưu thay đổi"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManageStop;
