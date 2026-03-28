import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface TripItem {
    _id: string;
    departureTime: string;
    arrivalTime: string;
    date: string;
    departureLocation: string;   // Stop.name
    departurePovince: string;    // Stop.province
    arrivalLocation: string;     // Stop.name
    arrivalProvince: string;     // Stop.province
    duration: string;            // từ scheduled_duration (phút)
    distance: number | null;     // scheduled_distance || route.distance_km
    vehicleType: string;
    licensePlate: string;
    totalSeats: number;
    status: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED";
    drivers: { name: string; phone: string; status: string }[];
}

const STATUS_CFG: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Sắp khởi hành", color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    RUNNING: { label: "Đang chạy", color: "text-blue-600 bg-blue-50 border-blue-200" },
    FINISHED: { label: "Hoàn thành", color: "text-green-600 bg-green-50 border-green-200" },
    CANCELLED: { label: "Đã hủy", color: "text-red-500 bg-red-50 border-red-200" },
};
const API_BASE = import.meta.env.VITE_API_URL;
export function DanhSachChuyenDi() {
    const navigate = useNavigate();

    const [trips, setTrips] = useState<TripItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [statusFilter, setStatusFilter] = useState("all");

    const ITEMS_PER_PAGE = 3;
    const token = localStorage.getItem("accessToken");

    const fetchTrips = async (page: number, status: string) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({ page: page.toString(), limit: ITEMS_PER_PAGE.toString() });
            if (status !== "all") params.append("status", status);

            const res = await fetch(`${API_BASE}/api/assistant/check/trips?${params}`,
                { headers: { Authorization: `Bearer ${token}` } });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Lỗi tải dữ liệu");

            setTrips(json.data || []);
            setTotalPages(json.totalPages || 1);
            setTotal(json.total || 0);
        } catch (e: any) {
            setError(e.message || "Lỗi kết nối");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTrips(currentPage, statusFilter); }, [currentPage, statusFilter]);
    const handleFilter = (val: string) => { setStatusFilter(val); setCurrentPage(1); };

    return (
        <>
            {/* Header */}
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-gray-800">Danh sách chuyến lái</h1>
                    {!loading && total > 0 && <p className="text-sm text-gray-400 mt-0.5">{total} chuyến</p>}
                </div>
                <button onClick={() => fetchTrips(currentPage, statusFilter)} disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50">
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Làm mới
                </button>
            </div>

            {/* Filter */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
                {[
                    { val: "all", label: "📋 Tất cả" },
                    { val: "SCHEDULED", label: "⏳ Sắp khởi hành" },
                    { val: "RUNNING", label: "🚌 Đang chạy" },
                    { val: "FINISHED", label: "✓ Hoàn thành" },
                ].map(({ val, label }) => (
                    <button key={val} onClick={() => handleFilter(val)}
                        className={`px-4 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${statusFilter === val
                            ? "bg-orange-500 text-white shadow-sm"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-orange-50"
                            }`}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Loading */}
            {loading && (
                <div className="flex items-center justify-center py-20 gap-3">
                    <Loader2 size={30} className="animate-spin text-orange-500" />
                    <span className="text-gray-400 font-medium">Đang tải chuyến...</span>
                </div>
            )}

            {/* Error */}
            {!loading && error && (
                <div className="flex flex-col items-center py-16 gap-3 text-center">
                    <AlertCircle size={36} className="text-red-300" />
                    <p className="text-gray-500 font-semibold">{error}</p>
                    <button onClick={() => fetchTrips(currentPage, statusFilter)}
                        className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition-colors">
                        Thử lại
                    </button>
                </div>
            )}

            {/* Empty */}
            {!loading && !error && trips.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-2 text-center">
                    <p className="text-gray-400 font-semibold text-lg">Không có chuyến nào</p>
                </div>
            )}

            {/* Trip list */}
            {!loading && !error && trips.length > 0 && (
                <div className="space-y-6">
                    {trips.map((trip) => {
                        const stCfg = STATUS_CFG[trip.status] ?? STATUS_CFG.SCHEDULED;
                        return (
                            <div key={trip._id}
                                className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 p-6 border">

                                {/* Route */}
                                <div className="flex items-center justify-between">
                                    {/* Departure */}
                                    <div className="text-center min-w-[100px]">
                                        <div className="text-2xl font-bold">{trip.departureTime}</div>
                                        <div className="text-sm font-semibold text-gray-700 mt-0.5">{trip.departureLocation}</div>
                                        <div className="text-xs text-gray-400">{trip.departurePovince}</div>
                                    </div>

                                    {/* Line */}
                                    <div className="flex-1 px-6">
                                        <div className="flex items-center">
                                            <div className="w-4 h-4 bg-green-500 rounded-full flex-shrink-0" />
                                            <div className="flex-1 relative mx-2">
                                                <div className="h-[2px] bg-gray-200" />
                                                <div className="absolute inset-0 flex flex-col items-center justify-center -mt-5 text-xs text-gray-400 pointer-events-none">
                                                    <span className="font-semibold text-gray-600">{trip.duration}</span>
                                                    {trip.distance && <span>{trip.distance} km</span>}
                                                </div>
                                            </div>
                                            <div className="w-4 h-4 bg-orange-500 rounded-full flex-shrink-0" />
                                        </div>
                                    </div>

                                    {/* Arrival */}
                                    <div className="text-center min-w-[100px]">
                                        <div className="text-2xl font-bold">{trip.arrivalTime}</div>
                                        <div className="text-sm font-semibold text-gray-700 mt-0.5">{trip.arrivalLocation}</div>
                                        <div className="text-xs text-gray-400">{trip.arrivalProvince}</div>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between mt-6 pt-4 border-t flex-wrap gap-3">
                                    <div className="flex items-center gap-3 flex-wrap text-sm">
                                        <span className="text-gray-500">🚌 {trip.vehicleType}</span>
                                        {trip.licensePlate && trip.licensePlate !== "N/A" && (
                                            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{trip.licensePlate}</span>
                                        )}
                                        <span className="font-semibold text-green-600">📅 {trip.date}</span>
                                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${stCfg.color}`}>
                                            {stCfg.label}
                                        </span>
                                    </div>

                                    {/* Lái chính */}
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {trip.drivers.map((d, i) => (
                                            <span key={i} className="text-xs bg-orange-50 border border-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-semibold">
                                                🚗 {d.name}
                                            </span>
                                        ))}
                                    </div>

                                    <button
                                        onClick={() => navigate("/assistant/chitietchuyendi", { state: { tripId: trip._id } })}
                                        className="px-6 py-2 bg-gradient-to-r from-orange-400 to-orange-500 text-white font-semibold rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 text-sm">
                                        Chi tiết
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
                <div className="flex items-center justify-center space-x-2 mt-10 mb-8">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-40">❮</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button key={p} onClick={() => setCurrentPage(p)}
                            className={`w-10 h-10 flex items-center justify-center rounded-full font-semibold transition-all ${currentPage === p ? "bg-orange-500 text-white shadow-md" : "text-gray-600 hover:bg-gray-100"
                                }`}>{p}</button>
                    ))}
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-600 disabled:opacity-40">❯</button>
                </div>
            )}
        </>
    );
}