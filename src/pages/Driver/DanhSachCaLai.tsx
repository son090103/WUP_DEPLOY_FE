import React, { useState, useEffect } from "react";

interface DriverShift {
    id: string;
    tripId: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
    from: string;
    to: string;
    distance: string;
    vehicle: string;
    vehicleType: string;
    licensePlate: string;
    totalSeats: number;
    bookedSeats: number;
    shiftStart: string;
    shiftEnd: string;
    shiftStartTime: string;
    shiftEndTime: string;
    actualShiftStart: string | null;
    actualShiftEnd: string | null;
    actualShiftStartTime: string | null;
    actualShiftEndTime: string | null;
    shiftStatus: "PENDING" | "RUNNING" | "DONE";
    tripStatus: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED";
    duration: string;
    createdAt: string;
    displayTime: string;
    displayRoute: string;
}

interface DriverInfo {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
}

interface ShiftStats {
    totalShifts: number;
    pendingShifts: number;
    runningShifts: number;
    completedShifts: number;
    totalHours: number;
    totalDistance: number;
}

const StatusPill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>
        {label}
    </span>
);

const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
);
const API_BASE = import.meta.env.VITE_API_URL;
const DriverShiftsPage: React.FC = () => {
    const [shifts, setShifts] = useState<DriverShift[]>([]);
    const [stats, setStats] = useState<ShiftStats | null>(null);
    const [driver, setDriver] = useState<DriverInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<"all" | "PENDING" | "RUNNING" | "DONE">("all");

    const ITEMS_PER_PAGE = 5;
    const token = localStorage.getItem("accessToken");

    // Fetch driver profile
    useEffect(() => {
        if (!token) {
            setError("No authentication token found");
            setLoading(false);
            return;
        }
        const fetchDriver = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/common/check/getprofile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch driver profile");
                const data = await res.json();
                const d = data.data || data;
                const avatar = d.name
                    ? d.name.split(/\s+/).filter((w: string) => w.length > 0)
                        .map((w: string) => w[0].toUpperCase()).slice(0, 2).join("")
                    : "?";
                setDriver({
                    id: d._id || d.id || "",
                    name: d.name || "N/A",
                    phone: d.phone || "N/A",
                    avatar,
                });
            } catch (err) {
                console.error("Error fetching driver:", err);
            }
        };
        fetchDriver();
    }, [token]);

    // Fetch stats
    useEffect(() => {
        if (!token) return;
        const fetchStats = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/driver/check/shifts/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!res.ok) throw new Error("Failed to fetch stats");
                const data = await res.json();
                setStats(data.data || {
                    totalShifts: 0, pendingShifts: 0, runningShifts: 0,
                    completedShifts: 0, totalHours: 0, totalDistance: 0,
                });
            } catch {
                setStats({
                    totalShifts: 0, pendingShifts: 0, runningShifts: 0,
                    completedShifts: 0, totalHours: 0, totalDistance: 0,
                });
            }
        };
        fetchStats();
    }, [token]);

    // Fetch shifts
    useEffect(() => {
        if (!token) { setLoading(false); return; }
        const fetchShifts = async () => {
            try {
                setLoading(true);
                setError(null);
                const params = new URLSearchParams({
                    limit: ITEMS_PER_PAGE.toString(),
                    page: page.toString(),
                });
                if (statusFilter !== "all") params.append("status", statusFilter);

                const res = await fetch(
                    `${API_BASE}/api/driver/check/getAllTripsForDrivers?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (!res.ok) throw new Error(`Failed to fetch shifts: ${res.statusText}`);

                const data = await res.json();
                if (data.success && Array.isArray(data.data)) {
                    const validShifts: DriverShift[] = data.data.map((s: any) => ({
                        id: s.id || s._id || "",
                        tripId: s.tripId || s._id || "",
                        date: s.date || "N/A",
                        departureTime: s.departureTime || "N/A",
                        arrivalTime: s.arrivalTime || "N/A",
                        from: s.from || "N/A",
                        to: s.to || "N/A",
                        distance: s.distance || "N/A",
                        vehicle: s.vehicle || "N/A",
                        vehicleType: s.vehicleType || "N/A",
                        licensePlate: s.licensePlate || "N/A",
                        totalSeats: s.totalSeats || 0,
                        bookedSeats: s.bookedSeats || 0,
                        shiftStart: s.shiftStart || "",
                        shiftEnd: s.shiftEnd || "",
                        shiftStartTime: s.shiftStartTime || "N/A",
                        shiftEndTime: s.shiftEndTime || "N/A",
                        actualShiftStart: s.actualShiftStart || null,
                        actualShiftEnd: s.actualShiftEnd || null,
                        actualShiftStartTime: s.actualShiftStartTime || null,
                        actualShiftEndTime: s.actualShiftEndTime || null,
                        shiftStatus: (["PENDING", "RUNNING", "DONE"].includes(s.shiftStatus)
                            ? s.shiftStatus : "PENDING") as "PENDING" | "RUNNING" | "DONE",
                        tripStatus: (["SCHEDULED", "RUNNING", "FINISHED", "CANCELLED"].includes(s.tripStatus)
                            ? s.tripStatus : "SCHEDULED") as "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED",
                        duration: s.duration || "N/A",
                        createdAt: s.createdAt || "",
                        displayTime: s.displayTime || "N/A",
                        displayRoute: s.displayRoute || "N/A",
                    }));
                    setShifts(validShifts);
                    setTotalPages(data.totalPages || 1);
                } else {
                    setShifts([]);
                    setTotalPages(1);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load shifts");
                setShifts([]);
                setTotalPages(1);
            } finally {
                setLoading(false);
            }
        };
        fetchShifts();
    }, [token, page, statusFilter]);

    const getStatusConfig = (status: "PENDING" | "RUNNING" | "DONE") => ({
        PENDING: { pill: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400", label: "⏳ Chờ khởi hành" },
        RUNNING: { pill: "bg-blue-100 text-blue-700", dot: "bg-blue-500", label: "🚗 Đang chạy" },
        DONE: { pill: "bg-green-100 text-green-700", dot: "bg-green-500", label: "✓ Hoàn thành" },
    }[status]);

    const getTripStatusConfig = (status: string) => ({
        SCHEDULED: { label: "Sắp khởi hành", color: "bg-gray-100 text-gray-600" },
        RUNNING: { label: "Đang di chuyển", color: "bg-blue-100 text-blue-700" },
        FINISHED: { label: "Đã hoàn thành", color: "bg-green-100 text-green-700" },
        CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
    }[status] || { label: status, color: "bg-gray-100 text-gray-600" });

    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-gray-600 font-semibold">Đang tải ca lái...</p>
            </div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 max-w-md">
                <p className="text-red-700 font-bold">❌ {error}</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <button className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                                {driver?.avatar || "?"}
                            </div>
                            <div className="min-w-0 flex-1">
                                <h1 className="font-bold text-gray-900 text-lg truncate">{driver?.name || "N/A"}</h1>
                                <p className="text-sm text-gray-400">📞 {driver?.phone || "N/A"}</p>
                            </div>
                        </div>
                        {stats && (
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full font-bold text-xs">{stats.totalShifts} ca</span>
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-bold text-xs">{Math.floor(stats.totalHours)}h</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {[
                            { label: "Tổng ca", value: stats.totalShifts, sub: "ca lái", border: "border-gray-200", text: "text-gray-900", subText: "text-gray-400" },
                            { label: "Chờ khởi hành", value: stats.pendingShifts, sub: "ca", border: "border-yellow-200 bg-yellow-50", text: "text-yellow-700", subText: "text-yellow-500", labelColor: "text-yellow-600" },
                            { label: "Đang chạy", value: stats.runningShifts, sub: "ca", border: "border-blue-200 bg-blue-50", text: "text-blue-700", subText: "text-blue-500", labelColor: "text-blue-600" },
                            { label: "Hoàn thành", value: stats.completedShifts, sub: "ca", border: "border-green-200 bg-green-50", text: "text-green-700", subText: "text-green-500", labelColor: "text-green-600" },
                            { label: "Tổng giờ", value: Math.floor(stats.totalHours), sub: "giờ", border: "border-purple-200 bg-purple-50", text: "text-purple-700", subText: "text-purple-500", labelColor: "text-purple-600" },
                        ].map(({ label, value, sub, border, text, subText, labelColor }) => (
                            <div key={label} className={`bg - white rounded - 2xl border p - 4 ${border}`}>
                                <p className={`text - xs mb - 1 font - semibold ${labelColor || "text-gray-500"}`}>{label}</p>
                                <p className={`text - 2xl font - black ${text} `}>{value}</p>
                                <p className={`text - xs mt - 0.5 ${subText} `}>{sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(["all", "PENDING", "RUNNING", "DONE"] as const).map((s) => (
                        <button
                            key={s}
                            onClick={() => { setStatusFilter(s); setPage(1); }}
                            className={`px - 4 py - 2 rounded - full font - semibold whitespace - nowrap transition - all text - sm ${statusFilter === s
                                ? "bg-orange-500 text-white shadow-md"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                } `}
                        >
                            {s === "all" ? "📋 Tất cả" : getStatusConfig(s).label}
                        </button>
                    ))}
                </div>

                {/* Shifts List */}
                <div className="space-y-3">
                    {shifts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <p className="text-gray-500 text-lg font-semibold">😔 Chưa có ca lái nào</p>
                        </div>
                    ) : shifts.map((shift) => {
                        const statusConfig = getStatusConfig(shift.shiftStatus);
                        const tripStatusConfig = getTripStatusConfig(shift.tripStatus);
                        const isOpen = expandedId === shift.id;

                        return (
                            <div key={shift.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                                <div className="p-4 space-y-3">
                                    {/* Route & Time */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-3xl font-black text-gray-900">{shift.departureTime}</p>
                                                <span className="text-xs text-gray-400">→</span>
                                                <p className="text-3xl font-black text-gray-900">{shift.arrivalTime}</p>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium mt-1">
                                                {shift.from} → {shift.to}
                                            </p>
                                        </div>
                                        <StatusPill label={statusConfig.label} color={statusConfig.pill} />
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w - 3 h - 3 rounded - full ${statusConfig.dot} flex - shrink - 0`} />
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all"
                                                style={{
                                                    width: shift.shiftStatus === "DONE" ? "100%"
                                                        : shift.shiftStatus === "RUNNING" ? "50%" : "0%"
                                                }}
                                            />
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                                    </div>

                                    {/* Details Pills */}
                                    <div className="flex flex-wrap gap-2">
                                        <StatusPill label={`📅 ${shift.date} `} color="bg-gray-100 text-gray-600" />
                                        <StatusPill label={`⏱️ ${shift.duration} `} color="bg-orange-100 text-orange-700" />
                                        <StatusPill label={`📍 ${shift.distance} `} color="bg-blue-100 text-blue-700" />
                                        <StatusPill label={`🚌 ${shift.licensePlate} `} color="bg-yellow-100 text-yellow-700" />
                                    </div>

                                    {/* Vehicle & Trip Status */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs text-gray-500">
                                            <p className="font-semibold">{shift.vehicle}</p>
                                            <p>{shift.bookedSeats}/{shift.totalSeats} ghế</p>
                                        </div>
                                        <StatusPill label={tripStatusConfig.label} color={tripStatusConfig.color} />
                                    </div>
                                </div>

                                {/* Expand Button */}
                                <div className="px-4 pb-3 flex justify-end border-t border-gray-100">
                                    <button
                                        onClick={() => setExpandedId(isOpen ? null : shift.id)}
                                        className="text-xs text-orange-500 font-semibold hover:text-orange-700 transition-colors"
                                    >
                                        {isOpen ? "▲ Thu gọn" : "▼ Xem chi tiết"}
                                    </button>
                                </div>

                                {/* Expanded */}
                                {isOpen && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <InfoBox label="Ca bắt đầu (dự kiến)" value={shift.shiftStartTime} />
                                            <InfoBox label="Ca kết thúc (dự kiến)" value={shift.shiftEndTime} />
                                            {shift.actualShiftStartTime && (
                                                <InfoBox label="✅ Khởi hành thực tế" value={shift.actualShiftStartTime} />
                                            )}
                                            {shift.actualShiftEndTime && (
                                                <InfoBox label="✅ Kết thúc thực tế" value={shift.actualShiftEndTime} />
                                            )}
                                            <InfoBox label="Loại xe" value={shift.vehicle} />
                                            <InfoBox label="Tổng ghế" value={shift.totalSeats.toString()} />
                                        </div>
                                        <div className="flex gap-2">
                                            {shift.shiftStatus === "PENDING" && (
                                                <button className="flex-1 px-4 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors">
                                                    Bắt đầu
                                                </button>
                                            )}
                                            {shift.shiftStatus === "RUNNING" && (
                                                <button className="flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors">
                                                    Kết thúc
                                                </button>
                                            )}
                                            {shift.shiftStatus === "DONE" && (
                                                <div className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-lg text-center">
                                                    ✅ Đã hoàn thành
                                                </div>
                                            )}
                                            <button className="px-4 py-2.5 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-100 transition-colors">
                                                Chi tiết
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white rounded-2xl border border-gray-200 px-4 py-3 flex items-center justify-center gap-2">
                        <button
                            onClick={() => setPage(Math.max(1, page - 1))}
                            disabled={page === 1}
                            className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition - colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"} `}
                        >
                            ← Trước
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`w - 9 h - 9 rounded - lg text - sm font - bold transition - colors ${page === p ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-orange-50"} `}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setPage(Math.min(totalPages, page + 1))}
                            disabled={page === totalPages}
                            className={`px - 4 py - 2 rounded - lg text - sm font - semibold transition - colors ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"} `}
                        >
                            Sau →
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-4">
                    <button className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Xuất danh sách
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm">
                        In danh sách
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DriverShiftsPage;