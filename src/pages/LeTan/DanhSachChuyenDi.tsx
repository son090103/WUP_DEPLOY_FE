import React, { useEffect, useState } from "react";
import { Bus, MapPin, ChevronDown, ChevronUp, Phone, RefreshCw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface StopInfo { _id: string; stop_order: number; is_pickup: boolean; name: string; province: string; }
interface RouteInfo { _id: string; from: { name: string; province: string }; to: { name: string; province: string }; distance_km: number; stops: StopInfo[]; }
interface BusInfo { license_plate: string; type: string; total_seats: number; booked_seats: number; available_seats: number; }
interface DriverInfo { _id: string; name: string; phone: string; avatar: string | null; shift_start: string; shift_end: string; actual_shift_start: string | null; actual_shift_end: string | null; status: "PENDING" | "RUNNING" | "DONE"; }
interface AssistantInfo { _id: string; name: string; phone: string; avatar: string | null; }
interface OrderInfo { _id: string; passenger_name: string; passenger_phone: string; seat_labels: string[]; payment_method: string; payment_status: string; order_status: string; pickup: string; dropoff: string; }
interface TripData {
    _id: string; status: "SCHEDULED" | "RUNNING" | "FINISHED" | "CANCELLED";
    departure_time: string; arrival_time: string;
    actual_departure_time: string | null; actual_arrival_time: string | null;
    duration: string; route: RouteInfo; bus: BusInfo;
    drivers: DriverInfo[]; assistant: AssistantInfo | null; orders: OrderInfo[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTime = (d?: string | null) =>
    d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";

const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "--/--/----";

const avatarLetters = (name: string) =>
    name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("");

// ─── Sub Components ───────────────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL;
const TripStatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, string> = {
        SCHEDULED: "bg-yellow-100 text-yellow-700 border-yellow-200",
        RUNNING: "bg-green-100 text-green-700 border-green-200",
        FINISHED: "bg-gray-100 text-gray-600 border-gray-200",
        CANCELLED: "bg-red-100 text-red-600 border-red-200",
    };
    const labels: Record<string, string> = {
        SCHEDULED: "🕐 Sắp khởi hành",
        RUNNING: "🚌 Đang di chuyển",
        FINISHED: "✅ Đã hoàn thành",
        CANCELLED: "❌ Đã hủy",
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${cfg[status] || cfg.SCHEDULED}`}>
            {labels[status] || status}
        </span>
    );
};

const ShiftStatusDot: React.FC<{ status: string }> = ({ status }) => {
    const cfg: Record<string, string> = {
        PENDING: "bg-yellow-400",
        RUNNING: "bg-green-500 animate-pulse",
        DONE: "bg-gray-400",
    };
    return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${cfg[status] || "bg-gray-300"}`} />;
};

const PersonCard: React.FC<{ person: { name: string; phone: string; avatar: string | null }; role: string; shiftInfo?: string; status?: string }> = ({ person, role, shiftInfo, status }) => (
    <div className="flex items-center gap-3 bg-white rounded-xl p-3 border border-gray-100">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {person.avatar || avatarLetters(person.name)}
        </div>
        <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
                {status && <ShiftStatusDot status={status} />}
                <p className="font-semibold text-gray-900 text-sm truncate">{person.name}</p>
            </div>
            <p className="text-xs text-gray-400">{role}</p>
            {shiftInfo && <p className="text-xs text-orange-600 font-medium">{shiftInfo}</p>}
        </div>
        <a href={`tel:${person.phone}`} className="flex items-center gap-1 text-xs text-blue-600 font-semibold bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors flex-shrink-0">
            <Phone size={11} />
            {person.phone}
        </a>
    </div>
);

const SeatOccupancy: React.FC<{ bus: BusInfo }> = ({ bus }) => {
    const pct = bus.total_seats > 0 ? Math.round((bus.booked_seats / bus.total_seats) * 100) : 0;
    const color = pct >= 90 ? "bg-red-500" : pct >= 60 ? "bg-orange-500" : "bg-green-500";
    return (
        <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">Ghế: {bus.booked_seats}/{bus.total_seats}</span>
                <span className={`font-bold ${pct >= 90 ? "text-red-600" : pct >= 60 ? "text-orange-600" : "text-green-600"}`}>{pct}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex gap-3 text-xs">
                <span className="text-red-500 font-semibold">🔴 {bus.booked_seats} đã đặt</span>
                <span className="text-green-600 font-semibold">🟢 {bus.available_seats} còn trống</span>
            </div>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const ReceptionistPage: React.FC = () => {
    const [trips, setTrips] = useState<TripData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [expandedTab, setExpandedTab] = useState<Record<string, "crew" | "stops" | "orders">>({});
    const [statusFilter, setStatusFilter] = useState<"all" | "RUNNING" | "SCHEDULED">("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const token = localStorage.getItem("accessToken");
    const LIMIT = 8;

    const fetchTrips = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams({ page: page.toString(), limit: LIMIT.toString() });
            if (statusFilter !== "all") params.append("status", statusFilter);

            const res = await fetch(
                `${API_BASE}/api/receptionist/check/active-trips?${params}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.success) {
                setTrips(data.data);
                setTotalPages(data.totalPages || 1);
                setTotal(data.total || 0);
                setLastUpdated(new Date());
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Lỗi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTrips(); }, [page, statusFilter]);

    // Auto refresh mỗi 60s
    useEffect(() => {
        const interval = setInterval(fetchTrips, 60000);
        return () => clearInterval(interval);
    }, [page, statusFilter]);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
        if (!expandedTab[id]) setExpandedTab((prev) => ({ ...prev, [id]: "crew" }));
    };

    const setTab = (id: string, tab: "crew" | "stops" | "orders") =>
        setExpandedTab((prev) => ({ ...prev, [id]: tab }));

    const runningCount = trips.filter((t) => t.status === "RUNNING").length;
    const scheduledCount = trips.filter((t) => t.status === "SCHEDULED").length;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div>
                            <h1 className="text-xl font-black text-gray-900">🏨 Quản lý chuyến xe</h1>
                            <p className="text-xs text-gray-400 mt-0.5">
                                Cập nhật lúc {lastUpdated.toLocaleTimeString("vi-VN")} · {total} chuyến
                            </p>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Quick stats */}
                            <div className="flex items-center gap-2">
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full font-bold text-xs border border-green-200">
                                    🚌 {runningCount} đang đi
                                </span>
                                <span className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full font-bold text-xs border border-yellow-200">
                                    🕐 {scheduledCount} sắp đi
                                </span>
                            </div>
                            {/* Refresh */}
                            <button
                                onClick={fetchTrips}
                                disabled={loading}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50"
                            >
                                <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
                                Làm mới
                            </button>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-2 mt-3">
                        {([
                            { key: "all", label: "📋 Tất cả" },
                            { key: "RUNNING", label: "🚌 Đang đi" },
                            { key: "SCHEDULED", label: "🕐 Sắp đi" },
                        ] as const).map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => { setStatusFilter(key); setPage(1); }}
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${statusFilter === key ? "bg-orange-500 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 font-medium text-sm">
                        ❌ {error}
                    </div>
                )}

                {loading && trips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
                        <p className="text-gray-500 font-medium">Đang tải chuyến xe...</p>
                    </div>
                ) : trips.length === 0 ? (
                    <div className="text-center py-24">
                        <p className="text-gray-400 text-lg font-semibold">😔 Không có chuyến xe nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {trips.map((trip) => {
                            const isOpen = expandedId === trip._id;
                            const tab = expandedTab[trip._id] || "crew";
                            const activeDriver = trip.drivers.find((d) => d.status === "RUNNING");

                            return (
                                <div key={trip._id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${trip.status === "RUNNING" ? "border-green-300" : "border-gray-200"}`}>
                                    {/* Running indicator */}
                                    {trip.status === "RUNNING" && (
                                        <div className="h-1 bg-gradient-to-r from-green-400 to-green-500" />
                                    )}

                                    {/* Card Header */}
                                    <div className="p-4 lg:p-5">
                                        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                                            {/* Route info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                                    <TripStatusBadge status={trip.status} />
                                                    <span className="text-xs text-gray-400">#{trip._id.slice(-6).toUpperCase()}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="text-center">
                                                        <p className="text-2xl font-black text-gray-900">{fmtTime(trip.departure_time)}</p>
                                                        <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{trip.route.from.name}</p>
                                                        <p className="text-[10px] text-gray-400">{trip.route.from.province}</p>
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-center px-2">
                                                        <div className="flex items-center gap-1 w-full">
                                                            <div className="w-2.5 h-2.5 rounded-full border-2 border-green-500 bg-white flex-shrink-0" />
                                                            <div className="flex-1 h-0.5 bg-gradient-to-r from-green-400 to-orange-400" />
                                                            <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-white flex-shrink-0" />
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-600 mt-1">{trip.duration}</p>
                                                        <p className="text-[10px] text-gray-400">{trip.route.distance_km} km</p>
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-2xl font-black text-gray-900">{fmtTime(trip.arrival_time)}</p>
                                                        <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{trip.route.to.name}</p>
                                                        <p className="text-[10px] text-gray-400">{trip.route.to.province}</p>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-400 mt-1.5">📅 {fmtDate(trip.departure_time)}</p>
                                            </div>

                                            {/* Right: Bus + Driver quick info */}
                                            <div className="flex flex-col gap-2 lg:w-72 flex-shrink-0">
                                                {/* Bus */}
                                                <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                                    <Bus size={15} className="text-orange-500 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 truncate">{trip.bus.license_plate}</p>
                                                        <p className="text-[10px] text-gray-400">{trip.bus.type}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-xs font-black text-orange-600">{trip.bus.booked_seats}/{trip.bus.total_seats}</p>
                                                        <p className="text-[10px] text-gray-400">ghế</p>
                                                    </div>
                                                </div>

                                                {/* Active driver */}
                                                {(activeDriver || trip.drivers[0]) && (
                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                                            {avatarLetters((activeDriver || trip.drivers[0]).name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-800 truncate">{(activeDriver || trip.drivers[0]).name}</p>
                                                            <p className="text-[10px] text-gray-400">Tài xế · {(activeDriver || trip.drivers[0]).phone}</p>
                                                        </div>
                                                        <ShiftStatusDot status={(activeDriver || trip.drivers[0]).status} />
                                                    </div>
                                                )}

                                                {/* Assistant */}
                                                {trip.assistant && (
                                                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                                            {avatarLetters(trip.assistant.name)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-bold text-gray-800 truncate">{trip.assistant.name}</p>
                                                            <p className="text-[10px] text-gray-400">Phụ xe · {trip.assistant.phone}</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expand toggle */}
                                    <div className="border-t border-gray-100 px-4 py-2 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <span className="text-xs text-gray-400">{trip.orders.length} khách</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">{trip.route.stops.length} điểm dừng</span>
                                            <span className="text-gray-300">·</span>
                                            <span className="text-xs text-gray-400">{trip.drivers.length} tài xế</span>
                                        </div>
                                        <button
                                            onClick={() => toggleExpand(trip._id)}
                                            className="flex items-center gap-1 text-xs text-orange-500 font-semibold hover:text-orange-700"
                                        >
                                            {isOpen ? <><ChevronUp size={14} /> Thu gọn</> : <><ChevronDown size={14} /> Xem chi tiết</>}
                                        </button>
                                    </div>

                                    {/* Expanded section */}
                                    {isOpen && (
                                        <div className="border-t border-gray-100 bg-gray-50">
                                            {/* Tabs */}
                                            <div className="flex border-b border-gray-200 bg-white px-4">
                                                {([
                                                    { key: "crew", label: "👥 Tổ lái", count: trip.drivers.length + (trip.assistant ? 1 : 0) },
                                                    { key: "stops", label: "📍 Lộ trình", count: trip.route.stops.length },
                                                    { key: "orders", label: "🎫 Khách", count: trip.orders.length },
                                                ] as const).map(({ key, label, count }) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => setTab(trip._id, key)}
                                                        className={`px-4 py-3 text-xs font-bold border-b-2 transition-all ${tab === key ? "border-orange-500 text-orange-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
                                                    >
                                                        {label} <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${tab === key ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-500"}`}>{count}</span>
                                                    </button>
                                                ))}
                                            </div>

                                            <div className="p-4 space-y-3">
                                                {/* Tab: Tổ lái */}
                                                {tab === "crew" && (
                                                    <div className="space-y-2">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Tài xế</h4>
                                                        {trip.drivers.length === 0
                                                            ? <p className="text-xs text-gray-400 italic">Chưa có tài xế</p>
                                                            : trip.drivers.map((d, i) => (
                                                                <PersonCard
                                                                    key={d._id || i}
                                                                    person={d}
                                                                    role={`Tài xế · Ca ${fmtTime(d.shift_start)} - ${fmtTime(d.shift_end)}`}
                                                                    shiftInfo={d.actual_shift_start ? `✅ Bắt đầu lúc ${fmtTime(d.actual_shift_start)}` : undefined}
                                                                    status={d.status}
                                                                />
                                                            ))
                                                        }
                                                        {trip.assistant && (
                                                            <>
                                                                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-3">Phụ xe</h4>
                                                                <PersonCard person={trip.assistant} role="Phụ xe / Tiếp viên" />
                                                            </>
                                                        )}
                                                        {/* Bus detail */}
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-4 mb-3">Phương tiện</h4>
                                                        <div className="bg-white rounded-xl p-4 border border-gray-100 space-y-3">
                                                            <div className="flex items-center justify-between">
                                                                <div>
                                                                    <p className="font-bold text-gray-900 text-sm">{trip.bus.license_plate}</p>
                                                                    <p className="text-xs text-gray-400">{trip.bus.type}</p>
                                                                </div>
                                                                <Bus size={20} className="text-orange-400" />
                                                            </div>
                                                            <SeatOccupancy bus={trip.bus} />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tab: Lộ trình */}
                                                {tab === "stops" && (
                                                    <div>
                                                        {trip.route.stops.length === 0
                                                            ? <p className="text-xs text-gray-400 italic text-center py-6">Chưa có điểm dừng</p>
                                                            : (
                                                                <div className="relative">
                                                                    <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gradient-to-b from-green-400 to-orange-400" />
                                                                    <div className="space-y-3">
                                                                        {trip.route.stops.map((stop, idx) => (
                                                                            <div key={stop._id} className="relative pl-10">
                                                                                <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 bg-white text-xs font-black
                                                                                    ${idx === 0 ? "border-green-500 text-green-600" : idx === trip.route.stops.length - 1 ? "border-orange-500 text-orange-600" : "border-gray-300 text-gray-500"}`}>
                                                                                    {idx + 1}
                                                                                </div>
                                                                                <div className="bg-white rounded-xl p-3 border border-gray-100">
                                                                                    <div className="flex items-center justify-between gap-2">
                                                                                        <div>
                                                                                            <p className="font-bold text-gray-900 text-sm">{stop.name}</p>
                                                                                            <p className="text-xs text-gray-400">{stop.province}</p>
                                                                                        </div>
                                                                                        <div className="flex gap-1 flex-shrink-0">
                                                                                            {idx === 0 && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Xuất phát</span>}
                                                                                            {idx === trip.route.stops.length - 1 && <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-0.5 rounded-full">Điểm đến</span>}
                                                                                            {idx > 0 && idx < trip.route.stops.length - 1 && (
                                                                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${stop.is_pickup ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                                                                                                    {stop.is_pickup ? "Điểm đón" : "Điểm trả"}
                                                                                                </span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )
                                                        }
                                                    </div>
                                                )}

                                                {/* Tab: Khách */}
                                                {tab === "orders" && (
                                                    <div className="space-y-2">
                                                        {trip.orders.length === 0
                                                            ? <p className="text-xs text-gray-400 italic text-center py-6">Chưa có khách đặt vé</p>
                                                            : trip.orders.map((order) => (
                                                                <div key={order._id} className="bg-white rounded-xl p-3 border border-gray-100">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                                                                                {avatarLetters(order.passenger_name || "KH")}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="font-bold text-gray-900 text-sm truncate">{order.passenger_name}</p>
                                                                                <p className="text-xs text-gray-400">{order.passenger_phone}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                                                            <div className="flex gap-1 flex-wrap justify-end">
                                                                                {order.seat_labels.map((s) => (
                                                                                    <span key={s} className="bg-orange-100 text-orange-700 text-[10px] font-black px-2 py-0.5 rounded-lg">{s}</span>
                                                                                ))}
                                                                            </div>
                                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${order.payment_status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                                                {order.payment_status === "PAID" ? "✅ Đã thanh toán" : "⏳ Chờ thanh toán"}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    {(order.pickup !== "N/A" || order.dropoff !== "N/A") && (
                                                                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-4 text-xs text-gray-500">
                                                                            <span className="flex items-center gap-1"><MapPin size={10} className="text-green-500" /> {order.pickup}</span>
                                                                            <span className="flex items-center gap-1"><MapPin size={10} className="text-orange-500" /> {order.dropoff}</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        }
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6 bg-white rounded-2xl border border-gray-200 px-4 py-3">
                        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"}`}>
                            ← Trước
                        </button>
                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                                <button key={p} onClick={() => setPage(p)}
                                    className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${page === p ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-700 hover:bg-orange-50"}`}>
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-700"}`}>
                            Sau →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReceptionistPage;