import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    TrendingDown,
    DollarSign,
    Bus,
    Ticket,
    UserPlus,
    AlertTriangle,
    ArrowUp,
    ArrowDown,
} from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_URL

const formatVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " ₫";

const formatRevenue = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "decimal", maximumFractionDigits: 0 }).format(n) + " vnđ";

// Cấu hình 4 thẻ (path + icon) – value/change lấy từ API
const METRIC_CONFIG = [
    {
        key: "revenue",
        title: "Tổng doanh thu",
        icon: DollarSign,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        path: "/admin/manage-revenue",
    },
    {
        key: "buses",
        title: "Xe đang hoạt động",
        icon: Bus,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        path: "/admin/manage-buses",
    },
    {
        key: "bookings",
        title: "Tổng đặt vé",
        icon: Ticket,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        path: "/admin/manage-revenue",
    },
    {
        key: "users",
        title: "Người dùng mới",
        icon: UserPlus,
        iconBg: "bg-green-100",
        iconColor: "text-green-600",
        path: "/admin/manage-users",
    },
];

type DashboardMetrics = {
    totalRevenue: number;
    totalRevenueChange: string;
    totalRevenueChangeUp: boolean;
    activeBuses: number;
    activeBusesChange: string;
    activeBusesChangeUp: boolean;
    totalBookings: number;
    totalBookingsChange: string;
    totalBookingsChangeUp: boolean;
    newUsers: number;
    newUsersChange: string;
    newUsersChangeUp: boolean;
};

type ActivityItem = {
    type: string;
    id: string;
    title: string;
    subtitle: string;
    createdAt: string | null;
};

type DashboardData = {
    metrics: DashboardMetrics;
    recentActivities: ActivityItem[];
    todaySummary: { totalThu: number; totalChi: number };
    profitChart: { name: string; thu: number; chi: number }[];
};

const getActivityIcon = (type: string) => {
    switch (type) {
        case "booking":
            return { Icon: Ticket, iconBg: "bg-violet-100", iconColor: "text-violet-600" };
        case "route":
            return { Icon: Bus, iconBg: "bg-blue-100", iconColor: "text-blue-600" };
        case "user":
            return { Icon: UserPlus, iconBg: "bg-green-100", iconColor: "text-green-600" };
        case "maintenance":
            return { Icon: AlertTriangle, iconBg: "bg-red-100", iconColor: "text-red-600" };
        default:
            return { Icon: Ticket, iconBg: "bg-gray-100", iconColor: "text-gray-600" };
    }
};

const defaultMetrics: DashboardMetrics = {
    totalRevenue: 0,
    totalRevenueChange: "0%",
    totalRevenueChangeUp: true,
    activeBuses: 0,
    activeBusesChange: "0 xe",
    activeBusesChangeUp: true,
    totalBookings: 0,
    totalBookingsChange: "0%",
    totalBookingsChangeUp: true,
    newUsers: 0,
    newUsersChange: "0%",
    newUsersChangeUp: true,
};

const defaultChart = [
    { name: "T1", thu: 0, chi: 0 },
    { name: "T2", thu: 0, chi: 0 },
    { name: "T3", thu: 0, chi: 0 },
];

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("accessToken") ?? "";
                const res = await fetch(`${API_BASE}/api/admin/check/dashboard`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                const json = await res.json().catch(() => ({}));
                if (!res.ok) {
                    throw new Error(json.message || "Không tải được dữ liệu tổng quan");
                }
                if (json.success && json.data) {
                    setData(json.data);
                } else {
                    setData({
                        metrics: defaultMetrics,
                        recentActivities: [],
                        todaySummary: { totalThu: 0, totalChi: 0 },
                        profitChart: defaultChart,
                    });
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Lỗi không xác định");
                setData({
                    metrics: defaultMetrics,
                    recentActivities: [],
                    todaySummary: { totalThu: 0, totalChi: 0 },
                    profitChart: defaultChart,
                });
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    const m = data?.metrics ?? defaultMetrics;
    const activities = data?.recentActivities ?? [];
    const todaySummary = data?.todaySummary ?? { totalThu: 0, totalChi: 0 };
    const profitChart = data?.profitChart?.length ? data.profitChart : defaultChart;

    const metricCards = [
        {
            ...METRIC_CONFIG[0],
            value: formatRevenue(m.totalRevenue),
            change: m.totalRevenueChange,
            changeUp: m.totalRevenueChangeUp,
        },
        {
            ...METRIC_CONFIG[1],
            value: `${m.activeBuses} xe`,
            change: m.activeBusesChange,
            changeUp: m.activeBusesChangeUp,
        },
        {
            ...METRIC_CONFIG[2],
            value: `${m.totalBookings.toLocaleString("vi-VN")} lượt`,
            change: m.totalBookingsChange,
            changeUp: m.totalBookingsChangeUp,
        },
        {
            ...METRIC_CONFIG[3],
            value: `${m.newUsers.toLocaleString("vi-VN")} người`,
            change: m.newUsersChange,
            changeUp: m.newUsersChangeUp,
        },
    ];

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-[#1f2937]">Tổng quan hệ thống</h1>

            {error && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-800">
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                    Đang tải dữ liệu...
                </div>
            ) : (
                <>
                    {/* 4 thẻ chỉ số */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {metricCards.map((card) => {
                            const Icon = card.icon;
                            return (
                                <Link
                                    key={card.key}
                                    to={card.path}
                                    className="block bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_20px_rgba(255,87,34,0.25)] cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">{card.title}</p>
                                            <p className="text-lg font-bold text-[#1f2937]">{card.value}</p>
                                            <p
                                                className={`mt-2 flex items-center gap-1 text-sm font-medium ${card.changeUp ? "text-green-600" : "text-red-600"
                                                    }`}
                                            >
                                                {card.changeUp ? (
                                                    <ArrowUp size={14} />
                                                ) : (
                                                    <TrendingDown size={14} />
                                                )}
                                                {card.change}
                                            </p>
                                        </div>
                                        <div
                                            className={`p-2.5 rounded-lg ${card.iconBg} ${card.iconColor}`}
                                        >
                                            <Icon size={20} />
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Khối dưới: Biểu đồ (trái) + Hoạt động & Thu chi (phải) */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_20px_rgba(255,87,34,0.25)]">
                            <h3 className="text-sm font-semibold text-[#1f2937] mb-4">
                                Biểu đồ lợi tức
                            </h3>
                            <div className="h-[280px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={profitChart}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                        <XAxis
                                            dataKey="name"
                                            tick={{ fontSize: 12 }}
                                            stroke="#9ca3af"
                                        />
                                        <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
                                        <Tooltip
                                            formatter={(value: number | undefined) => (value != null ? value.toLocaleString("vi-VN") : "")}
                                            contentStyle={{
                                                borderRadius: "8px",
                                                border: "1px solid #e5e7eb",
                                            }}
                                        />
                                        <Legend />
                                        <Line
                                            type="monotone"
                                            dataKey="thu"
                                            name="Thu"
                                            stroke="#3b82f6"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="chi"
                                            name="Chi"
                                            stroke="#f97316"
                                            strokeWidth={2}
                                            dot={{ r: 3 }}
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_20px_rgba(255,87,34,0.25)]">
                                <h3 className="text-sm font-semibold text-[#1f2937] mb-4">
                                    Hoạt động gần đây
                                </h3>
                                <ul className="space-y-4">
                                    {activities.length === 0 ? (
                                        <li className="text-sm text-gray-500">Chưa có hoạt động</li>
                                    ) : (
                                        activities.slice(0, 6).map((item) => {
                                            const { Icon, iconBg, iconColor } = getActivityIcon(item.type);
                                            return (
                                                <li
                                                    key={item.id}
                                                    className="flex gap-3 rounded-lg py-1.5 px-2 -mx-2 transition-all duration-200 hover:bg-orange-50/70"
                                                >
                                                    <div
                                                        className={`shrink-0 p-1.5 rounded-lg ${iconBg} ${iconColor}`}
                                                    >
                                                        <Icon size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-[#1f2937]">
                                                            {item.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {item.subtitle}
                                                        </p>
                                                    </div>
                                                </li>
                                            );
                                        })
                                    )}
                                </ul>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_20px_rgba(255,87,34,0.25)]">
                                <h3 className="text-sm font-semibold text-[#1f2937] mb-4">
                                    Tóm tắt thu chi hôm nay
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-lg bg-green-50 border border-green-100 p-4 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_14px_rgba(255,87,34,0.2)]">
                                        <p className="text-xs font-medium text-green-700 mb-1">Tổng thu</p>
                                        <div className="flex items-center gap-1 text-green-700">
                                            <ArrowUp size={14} />
                                            <span className="font-bold">
                                                {formatVND(todaySummary.totalThu)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="rounded-lg bg-red-50 border border-red-100 p-4 transition-all duration-200 hover:border-[#FF5722] hover:shadow-[0_0_14px_rgba(255,87,34,0.2)]">
                                        <p className="text-xs font-medium text-red-700 mb-1">Tổng chi</p>
                                        <div className="flex items-center gap-1 text-red-700">
                                            <ArrowDown size={14} />
                                            <span className="font-bold">
                                                {formatVND(todaySummary.totalChi)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
