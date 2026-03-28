import { useCallback, useEffect, useState } from "react";
import {
    TrendingUp, DollarSign, Package, Ticket,
    ArrowUpRight, ArrowDownLeft, Calendar,
    ChevronDown, Sparkles, BarChart3,
    PieChart as PieChartIcon, TableProperties,
    Zap, Crown, Loader2,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL;

/* ─── Types ─────────────────────────────────────────────── */
type TimeRange = "week" | "month" | "year";

interface RevenueItem {
    date: string;
    label: string;
    fullDate?: string;
    bookings: number;
    parcels: number;
    growth?: number;
    count?: number;
}

interface Summary {
    totalBookings: number;
    totalParcels: number;
    grandTotal: number;
    bookingPercent: number;
    count: number;
}

/* ─── Auth headers ──────────────────────────────────────── */
const authHeaders = () => {
    const t = localStorage.getItem("accessToken") ?? "";
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

/* ─── Helpers ───────────────────────────────────────────── */
const fmt = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(n);

const fmtShort = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
};

/* ─── Stat Card ─────────────────────────────────────────── */
const StatCard = ({ icon: Icon, label, value, unit, trend, subtext, gradient }: {
    icon: React.ElementType; label: string; value: string; unit?: string;
    trend: number; subtext?: string; gradient: string;
}) => {
    const isPositive = trend >= 0;
    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:shadow-orange-100/50 hover:-translate-y-1">
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${gradient} opacity-[0.04] group-hover:opacity-[0.08] transition-opacity`} />
            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${isPositive ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                        {isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownLeft className="w-3.5 h-3.5" />}
                        {Math.abs(trend)}%
                    </div>
                </div>
                <p className="text-[11px] uppercase tracking-wider font-semibold text-gray-400 mb-1">{label}</p>
                <p className="text-2xl font-extrabold text-gray-900 tracking-tight">{value}</p>
                {unit && <p className="text-xs text-gray-400 mt-1.5">{unit}</p>}
                {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
            </div>
        </div>
    );
};

/* ─── Custom Tooltip ────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: { color: string; name: string; value: number }[];
    label?: string;
}) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-2xl border border-gray-700/50">
            <p className="text-gray-300 text-xs font-medium mb-2">{label}</p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-gray-400 text-xs">{entry.name}:</span>
                    <span className="text-white text-xs font-bold">{fmt(entry.value)}</span>
                </div>
            ))}
        </div>
    );
};

/* ═══════════════════════════════════════════════════════════
   Main Component
═══════════════════════════════════════════════════════════ */
export default function RevenueDetail() {
    const [timeRange, setTimeRange] = useState<TimeRange>("month");
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);

    const [data, setData] = useState<RevenueItem[]>([]);
    const [summary, setSummary] = useState<Summary>({ totalBookings: 0, totalParcels: 0, grandTotal: 0, bookingPercent: 0, count: 0 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /* ── Fetch revenue ── */
    const fetchRevenue = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams({
                type: timeRange,
                year: String(selectedYear),
                month: String(selectedMonth),
            });
            const res = await fetch(`${API_BASE}/api/admin/check/revenue?${params}`, { headers: authHeaders() });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
            setData(json.data?.data ?? []);
            setSummary(json.data?.summary ?? { totalBookings: 0, totalParcels: 0, grandTotal: 0, bookingPercent: 0, count: 0 });
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Lỗi tải doanh thu");
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [timeRange, selectedYear, selectedMonth]);

    useEffect(() => { fetchRevenue(); }, [fetchRevenue]);

    /* ── Computed ── */
    const { totalBookings, totalParcels, grandTotal, bookingPercent } = summary;
    const parcelPercent = 100 - bookingPercent;
    const avgPer = data.length > 0 ? Math.round(grandTotal / data.length) : 0;
    const maxTotal = data.length > 0 ? Math.max(...data.map((d) => d.bookings + d.parcels)) : 0;
    const maxItem = data.find((d) => d.bookings + d.parcels === maxTotal);

    /* ── Labels ── */
    const getTimeRangeLabel = () => {
        if (timeRange === "week") return `Tuần (Tháng ${selectedMonth}/${selectedYear})`;
        if (timeRange === "month") return `Năm ${selectedYear}`;
        return "Tất cả năm";
    };
    const getChartTitle = () => {
        if (timeRange === "week") return `Doanh thu theo ngày - T${selectedMonth}/${selectedYear}`;
        if (timeRange === "month") return `Doanh thu theo tháng - ${selectedYear}`;
        return "Doanh thu theo năm";
    };
    const getTableTitle = () => {
        if (timeRange === "week") return { title: "Chi tiết theo ngày", subtitle: `Tháng ${selectedMonth}/${selectedYear}` };
        if (timeRange === "month") return { title: "Chi tiết theo tháng", subtitle: `Năm ${selectedYear}` };
        return { title: "Chi tiết theo năm", subtitle: "Tất cả năm" };
    };
    const getPeriodLabel = () => {
        if (timeRange === "year") return "Năm cao nhất";
        if (timeRange === "month") return "Tháng cao nhất";
        return "Ngày cao nhất";
    };
    const getAvgLabel = () => {
        if (timeRange === "year") return "Trung bình / Năm";
        if (timeRange === "month") return "Trung bình / Tháng";
        return "Trung bình / Ngày";
    };

    const chartData = data.map((d) => ({
        name: d.label,
        "Vé xe": d.bookings,
        "Hàng hóa": d.parcels,
        total: d.bookings + d.parcels,
        growth: d.growth,
    }));

    const tableInfo = getTableTitle();

    /* ── Trend tổng: so sánh nửa đầu vs nửa cuối ── */
    const half = Math.floor(data.length / 2);
    const firstHalf = data.slice(0, half).reduce((s, d) => s + d.bookings, 0);
    const secondHalf = data.slice(half).reduce((s, d) => s + d.bookings, 0);
    const overallTrend = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#f8f9fc]">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-gray-200/60">
                <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-200">
                                    <BarChart3 className="w-5 h-5 text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Doanh thu</h1>
                                {loading && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                            </div>
                            <p className="text-sm text-gray-500 flex items-center gap-1.5 ml-[52px]">
                                <Calendar className="w-3.5 h-3.5" />
                                {getTimeRangeLabel()}
                            </p>
                        </div>

                        <div className="flex items-end gap-3 flex-wrap">
                            {/* Năm */}
                            <div>
                                <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Năm</label>
                                <div className="relative">
                                    <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                                        className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 cursor-pointer transition-all">
                                        {[2023, 2024, 2025, 2026].map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            {/* Tháng — chỉ hiện khi type=week */}
                            {timeRange === "week" && (
                                <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1.5">Tháng</label>
                                    <div className="relative">
                                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                                            className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-white hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 cursor-pointer transition-all">
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                                                <option key={m} value={m}>Tháng {m}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            {/* Tab chọn kỳ */}
                            <div className="flex bg-gray-100 rounded-xl p-1 gap-0.5">
                                {(["week", "month", "year"] as TimeRange[]).map((t) => (
                                    <button key={t} onClick={() => setTimeRange(t)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${timeRange === t
                                            ? "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md shadow-orange-200"
                                            : "text-gray-500 hover:text-gray-700 hover:bg-white/60"}`}>
                                        {t === "week" ? "Tuần" : t === "month" ? "Tháng" : "Năm"}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">

                {/* Error */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-3.5 text-sm flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={fetchRevenue} className="text-xs font-semibold underline hover:no-underline">Thử lại</button>
                    </div>
                )}

                {/* Loading skeleton */}
                {loading && data.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-3 text-gray-400">
                        <Loader2 size={36} className="animate-spin text-orange-400" />
                        <p className="text-sm font-medium">Đang tải dữ liệu doanh thu...</p>
                    </div>
                ) : (
                    <>
                        {/* KPI Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                            <StatCard icon={DollarSign} label="Tổng Doanh thu" value={fmt(grandTotal)} trend={overallTrend} subtext={getTimeRangeLabel()} gradient="from-orange-400 to-amber-500" />
                            <StatCard icon={Ticket} label="Doanh thu Vé Xe" value={fmt(totalBookings)} unit={`${bookingPercent}% tổng doanh thu`} trend={overallTrend} gradient="from-orange-500 to-red-500" />
                            <StatCard icon={Package} label="Doanh thu Hàng Hóa" value={fmt(totalParcels)} unit={`${parcelPercent}% tổng doanh thu`} trend={0} gradient="from-blue-400 to-blue-600" />
                            <StatCard
                                icon={TrendingUp}
                                label={getAvgLabel()}
                                value={fmt(avgPer)}
                                trend={overallTrend}
                                subtext={`Cao nhất: ${maxItem?.label ?? "—"}`}
                                gradient="from-emerald-400 to-teal-500"
                            />
                        </div>

                        {/* Charts */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                            {/* Bar Chart */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 pt-6 pb-2 flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <BarChart3 className="w-4 h-4 text-orange-500" />
                                            <h2 className="text-lg font-bold text-gray-900">{getChartTitle()}</h2>
                                        </div>
                                        <p className="text-xs text-gray-400">
                                            {data.length > 0 ? `${data.length} kỳ — ${summary.count} đơn đặt vé` : "Chưa có dữ liệu"}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs">
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
                                            <span className="text-gray-500">Vé xe</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                                            <span className="text-gray-500">Hàng hóa</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-2 pb-4">
                                    {data.length === 0 ? (
                                        <div className="flex items-center justify-center h-[340px] text-gray-400 text-sm">
                                            Không có dữ liệu cho kỳ này
                                        </div>
                                    ) : (
                                        <ResponsiveContainer width="100%" height={340}>
                                            <BarChart data={chartData} barCategoryGap="20%">
                                                <defs>
                                                    <linearGradient id="gradBooking" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#FB923C" />
                                                        <stop offset="100%" stopColor="#EA580C" />
                                                    </linearGradient>
                                                    <linearGradient id="gradParcel" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#60A5FA" />
                                                        <stop offset="100%" stopColor="#2563EB" />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                                                    angle={timeRange === "year" ? 0 : -35}
                                                    textAnchor={timeRange === "year" ? "middle" : "end"}
                                                    height={timeRange === "year" ? 40 : 70} />
                                                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false}
                                                    tickFormatter={(v: number) => fmtShort(v)} />
                                                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(249,115,22,0.04)" }} />
                                                <Bar dataKey="Vé xe" fill="url(#gradBooking)" radius={[6, 6, 0, 0]} />
                                                <Bar dataKey="Hàng hóa" fill="url(#gradParcel)" radius={[6, 6, 0, 0]} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </div>

                            {/* Pie Chart */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="px-6 pt-6 pb-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <PieChartIcon className="w-4 h-4 text-blue-500" />
                                        <h2 className="text-lg font-bold text-gray-900">Phân bổ</h2>
                                    </div>
                                    <p className="text-xs text-gray-400">Tỷ lệ doanh thu theo loại</p>
                                </div>
                                <ResponsiveContainer width="100%" height={240}>
                                    <PieChart>
                                        <defs>
                                            <linearGradient id="pieOrange" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#FB923C" />
                                                <stop offset="100%" stopColor="#EA580C" />
                                            </linearGradient>
                                            <linearGradient id="pieBlue" x1="0" y1="0" x2="1" y2="1">
                                                <stop offset="0%" stopColor="#60A5FA" />
                                                <stop offset="100%" stopColor="#2563EB" />
                                            </linearGradient>
                                        </defs>
                                        <Pie
                                            data={[
                                                { name: "Vé xe", value: totalBookings || 1 },
                                                { name: "Hàng hóa", value: totalParcels || 0 },
                                            ]}
                                            cx="50%" cy="50%"
                                            innerRadius={55} outerRadius={90}
                                            paddingAngle={4} dataKey="value" strokeWidth={0}
                                        >
                                            <Cell fill="url(#pieOrange)" />
                                            <Cell fill="url(#pieBlue)" />
                                        </Pie>
                                        <Tooltip
                                            content={({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
                                                if (!active || !payload?.length) return null;
                                                const item = payload[0];
                                                return (
                                                    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-2xl border border-gray-700/50">
                                                        <p className="text-white text-xs font-bold">{item.name}</p>
                                                        <p className="text-gray-300 text-xs">{fmt(item.value)}</p>
                                                        <p className="text-orange-300 text-xs font-semibold">
                                                            {grandTotal > 0 ? ((item.value / grandTotal) * 100).toFixed(1) : 0}%
                                                        </p>
                                                    </div>
                                                );
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="px-6 pb-6 space-y-3">
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-orange-50/70">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-orange-600" />
                                            <span className="text-sm font-medium text-gray-700">Vé xe</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-gray-900">{bookingPercent}%</span>
                                            <p className="text-[10px] text-gray-400">{fmt(totalBookings)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600" />
                                            <span className="text-sm font-medium text-gray-700">Hàng hóa</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-extrabold text-gray-900">{parcelPercent}%</span>
                                            <p className="text-[10px] text-gray-400">{fmt(totalParcels)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Data Table */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
                            <div className="px-6 pt-6 pb-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <TableProperties className="w-4 h-4 text-gray-400" />
                                        <h2 className="text-lg font-bold text-gray-900">{tableInfo.title}</h2>
                                    </div>
                                    <p className="text-xs text-gray-400">{tableInfo.subtitle} — Phân tích chi tiết</p>
                                </div>
                                {loading && <Loader2 size={16} className="animate-spin text-orange-400" />}
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-y border-gray-100 bg-gray-50/60">
                                            <th className="text-left py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                                                {timeRange === "year" ? "Năm" : timeRange === "month" ? "Tháng" : "Ngày"}
                                            </th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">Vé xe</th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">Hàng hóa</th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">Tổng cộng</th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">Số đơn</th>
                                            <th className="text-right py-3 px-6 text-[10px] uppercase tracking-wider font-bold text-gray-400">Tăng trưởng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="py-12 text-center text-gray-400 text-sm">
                                                    Không có dữ liệu cho kỳ này
                                                </td>
                                            </tr>
                                        ) : data.map((item) => {
                                            const total = item.bookings + item.parcels;
                                            const isGrowth = (item.growth ?? 0) >= 0;
                                            const isMax = total === maxTotal && maxTotal > 0;
                                            return (
                                                <tr key={item.date}
                                                    className={`border-b border-gray-50 transition-colors hover:bg-orange-50/40 ${isMax ? "bg-orange-50/30" : ""}`}>
                                                    <td className="py-3.5 px-6">
                                                        <div className="flex items-center gap-2.5">
                                                            {isMax && <Crown className="w-3.5 h-3.5 text-orange-400" />}
                                                            <div>
                                                                <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                                                                {item.fullDate && <p className="text-[11px] text-gray-400">{item.fullDate}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-right py-3.5 px-6">
                                                        <span className="text-sm font-medium text-gray-700">{fmt(item.bookings)}</span>
                                                    </td>
                                                    <td className="text-right py-3.5 px-6">
                                                        <span className="text-sm font-medium text-gray-700">{fmt(item.parcels)}</span>
                                                    </td>
                                                    <td className="text-right py-3.5 px-6">
                                                        <span className={`text-sm font-bold ${isMax ? "text-orange-600" : "text-gray-900"}`}>{fmt(total)}</span>
                                                    </td>
                                                    <td className="text-right py-3.5 px-6">
                                                        <span className="text-sm text-gray-500">{item.count ?? 0}</span>
                                                    </td>
                                                    <td className="text-right py-3.5 px-6">
                                                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isGrowth ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-500"}`}>
                                                            {isGrowth ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                                                            {Math.abs(item.growth ?? 0)}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    {data.length > 0 && (
                                        <tfoot>
                                            <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                                                <td className="py-4 px-6 font-bold text-gray-900 text-sm">Tổng cộng</td>
                                                <td className="text-right py-4 px-6"><span className="font-bold text-orange-600">{fmt(totalBookings)}</span></td>
                                                <td className="text-right py-4 px-6"><span className="font-bold text-blue-600">{fmt(totalParcels)}</span></td>
                                                <td className="text-right py-4 px-6"><span className="font-extrabold text-gray-900 text-base">{fmt(grandTotal)}</span></td>
                                                <td className="text-right py-4 px-6"><span className="font-bold text-gray-700">{summary.count}</span></td>
                                                <td />
                                            </tr>
                                        </tfoot>
                                    )}
                                </table>
                            </div>
                        </div>

                        {/* Insight Cards */}
                        {data.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 p-6 text-white shadow-xl shadow-orange-200/40">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">{getPeriodLabel()}</p>
                                                <p className="text-3xl font-extrabold">{maxItem?.label ?? "—"}</p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold mb-2">{fmt(maxTotal)}</p>
                                        <div className="flex items-center gap-2 text-orange-100 text-sm">
                                            <ArrowUpRight className="w-4 h-4" />
                                            Cao hơn TB {fmt(maxTotal - avgPer)} ({avgPer > 0 ? Math.round(((maxTotal - avgPer) / avgPer) * 100) : 0}%)
                                        </div>
                                        {maxItem?.fullDate && <p className="text-orange-200/70 text-xs mt-3">{maxItem.fullDate}</p>}
                                    </div>
                                </div>

                                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white shadow-xl shadow-blue-200/40">
                                    <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                                    <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider mb-1">Loại doanh thu dẫn đầu</p>
                                                <p className="text-3xl font-extrabold">Vé Xe</p>
                                            </div>
                                            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
                                                <Crown className="w-5 h-5" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-bold mb-2">{fmt(totalBookings)}</p>
                                        <div className="flex items-center gap-2 text-blue-100 text-sm">
                                            <Sparkles className="w-4 h-4" />
                                            {bookingPercent}% tổng DT — {summary.count} đơn đặt vé
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}