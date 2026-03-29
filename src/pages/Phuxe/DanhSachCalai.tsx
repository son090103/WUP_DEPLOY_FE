import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { user } from "../../model/user";



// ─── Types ────────────────────────────────────────────────────────────────────

interface AssistantShift {
    id: string;
    date: string;
    departureTime: string;
    arrivalTime: string;
    from: string;        // "Tên bến, Tỉnh"
    to: string;          // "Tên bến, Tỉnh"
    distance: string;
    duration: string;
    vehicle: string;
    vehicleType: string;
    licensePlate: string;
    totalSeats: number;
    mainDrivers: { name: string; phone: string; shiftStatus: string }[];
    tripStatus: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED";
    displayTime: string;
    displayRoute: string;
}

interface ShiftStats {
    totalShifts: number;
    scheduledShifts: number;
    runningShifts: number;
    completedShifts: number;
    totalHours: number;
    totalDistance: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TRIP_STATUS_CFG: Record<
    "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED",
    { label: string; pill: string; dot: string; progress: string }
> = {
    SCHEDULED: { label: "⏳ Sắp khởi hành", pill: "bg-yellow-100 text-yellow-700", dot: "bg-yellow-400", progress: "0%" },
    RUNNING: { label: "🚌 Đang di chuyển", pill: "bg-purple-100 text-purple-700", dot: "bg-purple-500", progress: "50%" },
    FINISHED: { label: "✓ Hoàn thành", pill: "bg-green-100 text-green-700", dot: "bg-green-500", progress: "100%" },
    CANCELLED: { label: "✗ Đã hủy", pill: "bg-red-100 text-red-700", dot: "bg-red-400", progress: "0%" },
};

const getTripCfg = (s: string) =>
    TRIP_STATUS_CFG[s as keyof typeof TRIP_STATUS_CFG] ?? TRIP_STATUS_CFG.SCHEDULED;

const VALID_TRIP = ["SCHEDULED", "RUNNING", "FINISHED", "CANCELLED"] as const;
const toTripStatus = (v: unknown): "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED" =>
    VALID_TRIP.includes(v as never)
        ? (v as "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED")
        : "SCHEDULED";

const makeAvatar = (name?: string) => {
    if (!name) return "?";
    return name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");
};

// ─── Sub Components ───────────────────────────────────────────────────────────

const StatusPill: React.FC<{ label: string; color: string }> = ({ label, color }) => (
    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${color}`}>{label}</span>
);

const InfoBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-0.5">{label}</p>
        <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
);

// ─── Main ─────────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL;

const AssistantShiftsPage: React.FC = () => {
    // ── Redux profile ────────────────────────────────────────────────────────
    const reduxUser = useSelector((state: RootState) => state.user.user as user);
    const avatar = makeAvatar(reduxUser?.name);

    // ── State ────────────────────────────────────────────────────────────────
    const [shifts, setShifts] = useState<AssistantShift[]>([]);
    const [stats, setStats] = useState<ShiftStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<
        "all" | "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED"
    >("all");

    const ITEMS_PER_PAGE = 5;
    const token = localStorage.getItem("accessToken");

    // ── Stats ────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) return;
        fetch(`${API_BASE}/api/assistant/check/shifts/stats`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then((r) => r.json())
            .then((d) => setStats(d.data ?? {
                totalShifts: 0, scheduledShifts: 0, runningShifts: 0,
                completedShifts: 0, totalHours: 0, totalDistance: 0,
            }))
            .catch(() => setStats({
                totalShifts: 0, scheduledShifts: 0, runningShifts: 0,
                completedShifts: 0, totalHours: 0, totalDistance: 0,
            }));
    }, [token]);

    // ── Shifts ───────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!token) { setLoading(false); return; }

        const run = async () => {
            try {
                setLoading(true);
                setError(null);

                const params = new URLSearchParams({
                    limit: ITEMS_PER_PAGE.toString(),
                    page: page.toString(),
                });
                if (statusFilter !== "all") params.append("status", statusFilter);

                const res = await fetch(
                    `${API_BASE}/api/assistant/check/getAllTripsForAssistants?${params}`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                console.log("[AssistantShifts] sample:", data.data?.[0]);

                if (data.success && Array.isArray(data.data)) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const valid: AssistantShift[] = data.data.map((s: any) => ({
                        id: String(s.id ?? s._id ?? ""),
                        date: s.date ?? "N/A",
                        departureTime: s.departureTime ?? "N/A",
                        arrivalTime: s.arrivalTime ?? "N/A",
                        // ✅ BE đã trả về "Tên bến, Tỉnh" — dùng thẳng
                        from: s.from ?? "N/A",
                        to: s.to ?? "N/A",
                        distance: s.distance ?? "N/A",
                        duration: s.duration ?? "N/A",
                        vehicle: s.vehicle ?? "N/A",
                        vehicleType: s.vehicleType ?? "N/A",
                        licensePlate: s.licensePlate ?? "N/A",
                        totalSeats: s.totalSeats ?? 0,
                        // ✅ BE dùng mainDrivers
                        mainDrivers: Array.isArray(s.mainDrivers)
                            ? s.mainDrivers.map((d: any) => ({
                                name: d.name ?? "N/A",
                                phone: d.phone ?? "",
                                shiftStatus: d.shiftStatus ?? "",
                            }))
                            : [],
                        tripStatus: toTripStatus(s.tripStatus ?? s.status),
                        displayTime: s.displayTime ?? "N/A",
                        displayRoute: s.displayRoute ?? "N/A",
                    }));
                    setShifts(valid);
                    setTotalPages(data.totalPages ?? 1);
                } else {
                    setShifts([]);
                    setTotalPages(1);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
                setShifts([]);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, [token, page, statusFilter]);

    // ── Loading / Error ──────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 border-4 border-gray-200 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-gray-600 font-semibold">Đang tải ca phụ xe...</p>
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

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gray-50">

            {/* Top bar — từ Redux */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
                            {avatar}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="font-bold text-gray-900 text-lg truncate">
                                {reduxUser?.name ?? "N/A"}
                            </h1>
                            <p className="text-sm text-gray-400">
                                📞 {reduxUser?.phone ?? "N/A"} &nbsp;·&nbsp; 🧑‍✈️ Phụ xe
                            </p>
                        </div>
                        {stats && (
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full font-bold text-xs">
                                    {stats.totalShifts} ca
                                </span>
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-bold text-xs">
                                    {Math.floor(stats.totalHours)}h
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                        {(
                            [
                                { label: "Tổng ca", value: stats.totalShifts, border: "border-gray-200", bg: "bg-white", text: "text-gray-900", sub: "ca phụ xe", labelColor: "text-gray-500" },
                                { label: "Sắp khởi hành", value: stats.scheduledShifts, border: "border-yellow-200", bg: "bg-yellow-50", text: "text-yellow-700", sub: "ca", labelColor: "text-yellow-600" },
                                { label: "Đang chạy", value: stats.runningShifts, border: "border-purple-200", bg: "bg-purple-50", text: "text-purple-700", sub: "ca", labelColor: "text-purple-600" },
                                { label: "Hoàn thành", value: stats.completedShifts, border: "border-green-200", bg: "bg-green-50", text: "text-green-700", sub: "ca", labelColor: "text-green-600" },
                                { label: "Tổng giờ", value: Math.floor(stats.totalHours), border: "border-indigo-200", bg: "bg-indigo-50", text: "text-indigo-700", sub: "giờ", labelColor: "text-indigo-600" },
                            ] as const
                        ).map(({ label, value, border, bg, text, sub, labelColor }) => (
                            <div key={label} className={`rounded-2xl border ${border} ${bg} p-4`}>
                                <p className={`text-xs mb-1 font-semibold ${labelColor}`}>{label}</p>
                                <p className={`text-2xl font-black ${text}`}>{value}</p>
                                <p className={`text-xs mt-0.5 ${text} opacity-50`}>{sub}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Filter */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {(
                        [
                            { key: "all", label: "📋 Tất cả" },
                            { key: "SCHEDULED", label: "⏳ Sắp khởi hành" },
                            { key: "RUNNING", label: "🚌 Đang chạy" },
                            { key: "FINISHED", label: "✓ Hoàn thành" },
                            { key: "CANCELLED", label: "✗ Đã hủy" },
                        ] as const
                    ).map(({ key, label }) => (
                        <button key={key}
                            onClick={() => { setStatusFilter(key); setPage(1); }}
                            className={`px-4 py-2 rounded-full font-semibold whitespace-nowrap transition-all text-sm ${statusFilter === key
                                ? "bg-purple-500 text-white shadow-md"
                                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                                }`}>
                            {label}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-3">
                    {shifts.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                            <p className="text-gray-500 text-lg font-semibold">😔 Chưa có ca phụ xe nào</p>
                        </div>
                    ) : shifts.map((shift) => {
                        const cfg = getTripCfg(shift.tripStatus);
                        const isOpen = expandedId === shift.id;

                        return (
                            <div key={shift.id}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">

                                <div className="p-4 space-y-3">

                                    {/* Time + Status */}
                                    <div className="flex items-start gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-3xl font-black text-gray-900">{shift.departureTime}</p>
                                                <span className="text-sm text-gray-400">→</span>
                                                <p className="text-3xl font-black text-gray-900">{shift.arrivalTime}</p>
                                            </div>
                                            {/* ✅ from / to hiện đúng "Bến xe X, Tỉnh Y" */}
                                            <p className="text-sm text-gray-600 font-medium mt-1">
                                                {shift.from}
                                            </p>
                                            <p className="text-sm text-gray-400 mt-0.5">
                                                → {shift.to}
                                            </p>
                                        </div>
                                        <StatusPill label={cfg.label} color={cfg.pill} />
                                    </div>

                                    {/* Progress bar */}
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${cfg.dot}`}
                                            style={{ boxShadow: "0 0 0 2px white, 0 0 0 4px currentColor" }} />
                                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 transition-all"
                                                style={{ width: cfg.progress }} />
                                        </div>
                                        <div className="w-3 h-3 rounded-full bg-purple-500 flex-shrink-0"
                                            style={{ boxShadow: "0 0 0 2px white, 0 0 0 4px rgb(168,85,247)" }} />
                                    </div>

                                    {/* Tags */}
                                    <div className="flex flex-wrap gap-2">
                                        <StatusPill label={`📅 ${shift.date}`} color="bg-gray-100 text-gray-600" />
                                        <StatusPill label={`⏱️ ${shift.duration}`} color="bg-purple-100 text-purple-700" />
                                        <StatusPill label={`📍 ${shift.distance}`} color="bg-blue-100 text-blue-700" />
                                        <StatusPill label={`🚌 ${shift.licensePlate}`} color="bg-yellow-100 text-yellow-700" />
                                    </div>

                                    {/* Vehicle + driver preview */}
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs text-gray-500">
                                            <p className="font-semibold">{shift.vehicleType}</p>
                                            <p>{shift.totalSeats} ghế</p>
                                        </div>
                                        {shift.mainDrivers[0] && (
                                            <div className="text-xs text-gray-500 text-right">
                                                <p className="font-semibold">🧑‍✈️ {shift.mainDrivers[0].name}</p>
                                                {shift.mainDrivers[0].phone && (
                                                    <p>{shift.mainDrivers[0].phone}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Expand */}
                                <div className="px-4 pb-3 flex justify-end border-t border-gray-100">
                                    <button onClick={() => setExpandedId(isOpen ? null : shift.id)}
                                        className="text-xs text-purple-500 font-semibold hover:text-purple-700 transition-colors">
                                        {isOpen ? "▲ Thu gọn" : "▼ Xem chi tiết"}
                                    </button>
                                </div>

                                {/* Expanded */}
                                {isOpen && (
                                    <div className="bg-gray-50 border-t border-gray-100 p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <InfoBox label="Điểm đi" value={shift.from} />
                                            <InfoBox label="Điểm đến" value={shift.to} />
                                            <InfoBox label="Khởi hành" value={shift.departureTime} />
                                            <InfoBox label="Đến nơi" value={shift.arrivalTime} />
                                            <InfoBox label="Loại xe" value={shift.vehicleType} />
                                            <InfoBox label="Biển số" value={shift.licensePlate} />
                                            <InfoBox label="Tổng ghế" value={shift.totalSeats.toString()} />
                                            <InfoBox label="Khoảng cách" value={shift.distance} />
                                        </div>

                                        {/* Tài xế */}
                                        {shift.mainDrivers.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                    Tài xế
                                                </p>
                                                {shift.mainDrivers.map((d, i) => (
                                                    <div key={i} className="bg-white rounded-xl p-3 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                                                            {d.phone && <p className="text-xs text-gray-400">📞 {d.phone}</p>}
                                                        </div>
                                                        {d.shiftStatus && (
                                                            <StatusPill
                                                                label={d.shiftStatus}
                                                                color="bg-blue-100 text-blue-700"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="flex gap-2">
                                            {shift.tripStatus === "SCHEDULED" && (
                                                <button className="flex-1 px-4 py-2.5 bg-purple-500 text-white text-sm font-semibold rounded-lg hover:bg-purple-600 transition-colors">
                                                    Bắt đầu ca
                                                </button>
                                            )}
                                            {shift.tripStatus === "RUNNING" && (
                                                <button className="flex-1 px-4 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-lg hover:bg-green-600 transition-colors">
                                                    Kết thúc ca
                                                </button>
                                            )}
                                            {shift.tripStatus === "FINISHED" && (
                                                <div className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-500 text-sm font-semibold rounded-lg text-center">
                                                    ✅ Đã hoàn thành
                                                </div>
                                            )}
                                            {shift.tripStatus === "CANCELLED" && (
                                                <div className="flex-1 px-4 py-2.5 bg-red-50 text-red-500 text-sm font-semibold rounded-lg text-center">
                                                    ✗ Chuyến đã hủy
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
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                }`}>
                            ← Trước
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === p ? "bg-purple-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-purple-50"
                                        }`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
                                }`}>
                            Sau →
                        </button>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pb-4">
                    <button className="px-6 py-2.5 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
                        Xuất danh sách
                    </button>
                    <button className="px-6 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-semibold hover:bg-purple-600 transition-colors shadow-sm">
                        In danh sách
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssistantShiftsPage;