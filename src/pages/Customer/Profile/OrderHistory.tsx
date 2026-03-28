import { useState, useEffect, useCallback } from "react";
import {
    Clock, Bus, CreditCard, Loader2, AlertCircle, RefreshCw,
    MapPin, UserCheck, LogOut, X, Building2, Hash,
} from "lucide-react";

/* ═══════════════ TYPES ═══════════════════════════════════════════ */
interface LocationInfo {
    city: string | null;
    specific_location: string | null;
}
interface OrderItem {
    _id: string;
    order_status: "CREATED" | "PAID" | "CANCELLED";
    total_price: number;
    seat_labels: string[];
    passenger_name: string;
    passenger_phone: string;
    passenger_email: string | null;
    created_at: string;
    start_info: LocationInfo | null;
    end_info: LocationInfo | null;
    is_boarded: boolean; boarded_at: string | null;
    is_alighted: boolean; alighted_at: string | null;
    trip: {
        _id: string; departure_time: string; arrival_time: string; status: string;
        bus_type_name: string | null;
        route: {
            from: { name: string | null; province: string | null };
            to: { name: string | null; province: string | null };
        };
    } | null;
    payment: {
        payment_method: "ONLINE" | "CASH_ON_BOARD";
        payment_status: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "REFUND_PENDING";
        amount: number;
        paid_at: string | null;
    } | null;
}
interface Pagination { page: number; limit: number; total: number; totalPages: number; }

/* ═══════════════ HELPERS ═════════════════════════════════════════ */
const fmtTime = (d?: string | null) =>
    d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----";
const fmtHHMM = (d?: string | null) =>
    d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : null;
const calcDuration = (s?: string | null, e?: string | null) => {
    if (!s || !e) return null;
    const diff = new Date(e).getTime() - new Date(s).getTime();
    if (diff <= 0) return null;
    const total = Math.floor(diff / 60000);
    const days = Math.floor(total / 1440), hrs = Math.floor((total % 1440) / 60), mins = total % 60;
    const parts: string[] = [];
    if (days) parts.push(`${days} ngày`);
    if (hrs) parts.push(`${hrs} giờ`);
    if (mins && !days) parts.push(`${mins} phút`);
    return parts.join(" ") || null;
};

/* ═══════════════ STATUS CONFIG ══════════════════════════════════ */
const ORDER_STATUS_CFG: Record<string, { label: string; cls: string; bar: string }> = {
    CREATED: { label: "Chờ thanh toán", cls: "bg-yellow-100 text-yellow-700 border border-yellow-300", bar: "bg-yellow-400" },
    PAID: { label: "Đã thanh toán", cls: "bg-green-100 text-green-700 border border-green-300", bar: "bg-green-400" },
    CANCELLED: { label: "Đã hủy", cls: "bg-slate-100 text-slate-500 border border-slate-300", bar: "bg-slate-300" },
};
const PAYMENT_STATUS_CFG: Record<string, { label: string; cls: string }> = {
    PENDING: { label: "Chờ thanh toán", cls: "text-yellow-600" },
    PAID: { label: "Đã thanh toán", cls: "text-green-600" },
    REFUNDED: { label: "Đã hoàn tiền", cls: "text-slate-500" },
    REFUND_PENDING: { label: "Đang hoàn tiền", cls: "text-blue-600" },
    FAILED: { label: "Thanh toán lỗi", cls: "text-red-600" },
};
const TRIP_STATUS_CFG: Record<string, { label: string; cls: string }> = {
    SCHEDULED: { label: "Sắp khởi hành", cls: "bg-blue-100 text-blue-700" },
    RUNNING: { label: "Đang chạy", cls: "bg-green-100 text-green-700" },
    FINISHED: { label: "Hoàn thành", cls: "bg-slate-100 text-slate-600" },
    CANCELLED: { label: "Đã hủy", cls: "bg-red-100 text-red-600" },
};
const PAYMENT_METHOD_LABEL: Record<string, string> = {
    CASH_ON_BOARD: "💵 Trả trên xe",
    ONLINE: "📱 Online",
};

// Danh sách ngân hàng phổ biến VN
const BANKS = [
    "Vietcombank (VCB)", "MB Bank", "Techcombank (TCB)", "BIDV",
    "VietinBank", "Agribank", "VPBank", "ACB", "Sacombank",
    "TPBank", "SeABank", "OCB", "HDBank", "VIB", "MSB",
    "SHB", "PVcomBank", "Eximbank", "BVBank", "Khác",
];

const API = import.meta.env.VITE_API_URL;

/* ═══════════════ CANCEL MODAL ═══════════════════════════════════
   Hiện khi order_status = PAID (đã thanh toán → cần nhập STK hoàn)
   Hoặc CREATED (chưa TT → hủy thẳng, không cần STK)
═══════════════════════════════════════════════════════════════════ */
function CancelModal({
    order, onClose, onDone,
}: {
    order: OrderItem;
    onClose: () => void;
    onDone: (orderId: string) => void;
}) {
    console.log("order là : ", order)
    const isPaid = order.payment?.payment_status === "PAID";
    const refundAmt = isPaid ? Math.round((order.payment?.amount ?? 0) * 0.7) : 0;

    const [bankName, setBankName] = useState("");
    const [accountNum, setAccountNum] = useState("");
    const [accountName, setAccountName] = useState("");
    const [loading, setLoading] = useState(false);
    const [err, setErr] = useState("");

    const canSubmit = !isPaid || (bankName.trim() && accountNum.trim() && accountName.trim());

    const handleSubmit = async () => {
        setErr("");
        if (!canSubmit) { setErr("Vui lòng điền đầy đủ thông tin ngân hàng."); return; }
        setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API}/api/customer/check/orders/${order._id}/cancel`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(isPaid ? { bank_name: bankName, account_number: accountNum, account_name: accountName } : {}),
            });
            const json = await res.json();
            if (!res.ok) { setErr(json.message ?? "Không thể hủy vé."); return; }
            onDone(order._id);
            onClose();
        } catch { setErr("Lỗi kết nối. Vui lòng thử lại."); }
        finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
                {/* Header */}
                <div className={`px-6 py-5 flex items-start justify-between gap-4 flex-shrink-0 ${isPaid ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gradient-to-r from-slate-500 to-slate-600"}`}>
                    <div>
                        <p className="text-white font-black text-lg">Hủy vé</p>
                        <p className="text-white/80 text-sm mt-0.5">{order.passenger_name}</p>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Thông tin vé */}
                    <div className="bg-slate-50 rounded-2xl p-4 space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Ghế</span>
                            <div className="flex gap-1">
                                {order.seat_labels.map((s) => (
                                    <span key={s} className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md">🪑 {s}</span>
                                ))}
                            </div>
                        </div>
                        {order.trip && (
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500">Chuyến</span>
                                <span className="font-semibold">
                                    {order.trip.route.from.province} → {order.trip.route.to.province}
                                    · {fmtTime(order.trip.departure_time)}
                                </span>
                            </div>
                        )}
                        <div className="flex items-center justify-between">
                            <span className="text-slate-500">Tiền vé</span>
                            <span className="font-bold">{order.total_price.toLocaleString("vi-VN")}₫</span>
                        </div>
                    </div>

                    {/* Nếu đã thanh toán → hiện thông tin hoàn tiền + form STK */}
                    {isPaid ? (
                        <>
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-1 text-sm">
                                <p className="font-bold text-orange-700">Chính sách hoàn tiền</p>
                                <p className="text-slate-600">Bạn sẽ được hoàn <b>70%</b> số tiền đã thanh toán:</p>
                                <p className="text-2xl font-black text-orange-600 mt-1">
                                    {refundAmt.toLocaleString("vi-VN")}đ
                                </p>
                                <p className="text-xs text-slate-400">Trong 1–3 ngày làm việc sau khi lễ tân xử lý.</p>
                            </div>

                            {/* Form STK nhận hoàn */}
                            <div className="space-y-3">
                                <p className="text-sm font-bold text-slate-700">
                                    Nhập tài khoản nhận tiền hoàn <span className="text-red-500">*</span>
                                </p>

                                {/* Ngân hàng */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                        <Building2 size={12} className="inline mr-1" /> Ngân hàng
                                    </label>
                                    <select value={bankName} onChange={(e) => setBankName(e.target.value)}
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400">
                                        <option value="">Chọn ngân hàng</option>
                                        {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>

                                {/* STK */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                        <Hash size={12} className="inline mr-1" /> Số tài khoản
                                    </label>
                                    <input value={accountNum} onChange={(e) => setAccountNum(e.target.value)}
                                        placeholder="Nhập số tài khoản"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />
                                </div>

                                {/* Chủ TK */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">
                                        Tên chủ tài khoản
                                    </label>
                                    <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                                        placeholder="VD: NGUYEN VAN A"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                                    />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-slate-50 rounded-2xl p-4 text-sm text-slate-600">
                            Vé chưa được thanh toán — hủy sẽ không mất phí.
                        </div>
                    )}

                    {err && <p className="text-sm text-red-600">{err}</p>}
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
                    <button onClick={onClose} disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        Quay lại
                    </button>
                    <button onClick={handleSubmit} disabled={loading || !canSubmit}
                        className="rounded-xl bg-red-500 hover:bg-red-600 text-white px-5 py-2 text-sm font-bold transition disabled:opacity-60 flex items-center gap-2">
                        {loading ? <Loader2 size={15} className="animate-spin" /> : <X size={15} />}
                        {loading ? "Đang hủy…" : "Xác nhận hủy vé"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════ COMPONENT ══════════════════════════════════════ */
export default function OrderHistory() {
    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [cancelOrder, setCancelOrder] = useState<OrderItem | null>(null);

    const fetchOrders = useCallback(async (page: number) => {
        setError(null); setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { setError("Bạn chưa đăng nhập."); return; }
            const res = await fetch(`${API}/api/customer/check/getOrderHistory`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ page, limit: 10 }),
            });
            const json = await res.json();
            if (!res.ok) { setError(json.message || "Không thể tải lịch sử."); return; }
            setOrders(json.data || []);
            setPagination(json.pagination || { page, limit: 10, total: 0, totalPages: 1 });
        } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchOrders(currentPage); }, [currentPage, fetchOrders]);

    const handleCancelDone = (orderId: string) => {
        setOrders((prev) => prev.map((o) => o._id === orderId ? { ...o, order_status: "CANCELLED" } : o));
    };

    const pageNumbers = (): number[] => {
        const t = pagination.totalPages;
        if (t <= 5) return Array.from({ length: t }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, 5];
        if (currentPage >= t - 2) return [t - 4, t - 3, t - 2, t - 1, t];
        return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Lịch sử đặt vé</h1>
                        {!loading && pagination.total > 0 && (
                            <p className="text-sm text-slate-500 mt-0.5">{pagination.total} đơn đặt vé</p>
                        )}
                    </div>
                    <button onClick={() => fetchOrders(currentPage)} disabled={loading}
                        className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={36} className="animate-spin text-orange-500" />
                        <p className="text-slate-500 font-medium">Đang tải lịch sử...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <AlertCircle size={40} className="text-red-400" />
                        <p className="text-slate-600 font-semibold">{error}</p>
                        <button onClick={() => fetchOrders(currentPage)}
                            className="mt-2 px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">
                            Thử lại
                        </button>
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <Bus size={48} className="text-slate-300" />
                        <p className="text-slate-500 font-semibold text-lg">Chưa có đơn đặt vé nào</p>
                        <p className="text-slate-400 text-sm">Hãy đặt chuyến xe đầu tiên của bạn!</p>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const trip = order.trip;
                            const statusCfg = ORDER_STATUS_CFG[order.order_status] ?? ORDER_STATUS_CFG.CREATED;
                            const duration = calcDuration(trip?.departure_time, trip?.arrival_time);
                            const tripStCfg = trip ? (TRIP_STATUS_CFG[trip.status] ?? TRIP_STATUS_CFG.SCHEDULED) : null;
                            const pmtCfg = order.payment ? (PAYMENT_STATUS_CFG[order.payment.payment_status] ?? PAYMENT_STATUS_CFG.PENDING) : null;

                            const fromCity = order.start_info?.city || trip?.route?.from?.province || "—";
                            const fromDetail = order.start_info?.specific_location || trip?.route?.from?.name || null;
                            const toCity = order.end_info?.city || trip?.route?.to?.province || "—";
                            const toDetail = order.end_info?.specific_location || trip?.route?.to?.name || null;

                            const canCancel = order.order_status === "CREATED" || order.order_status === "PAID";

                            return (
                                <div key={order._id}
                                    className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-orange-100/60">
                                    <div className={`h-1 w-full ${statusCfg.bar}`} />
                                    <div className="p-6">

                                        {/* ── Route timeline ── */}
                                        <div className="flex items-center gap-4 mb-4 flex-wrap">
                                            <div className="text-center min-w-[56px]">
                                                <div className="text-xl font-black text-slate-800">{fmtTime(trip?.departure_time)}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{fromCity}</div>
                                            </div>
                                            <div className="flex flex-col items-center flex-1 min-w-[80px]">
                                                <div className="flex items-center w-full gap-1">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0" />
                                                    <div className="flex-1 h-0.5 bg-gradient-to-r from-green-500 to-orange-500" />
                                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0" />
                                                </div>
                                                <div className="text-xs text-slate-500 mt-1">{fmtDate(trip?.departure_time)}</div>
                                                {duration && <div className="text-[10px] font-semibold text-orange-500">{duration}</div>}
                                            </div>
                                            <div className="text-center min-w-[56px]">
                                                <div className="text-xl font-black text-slate-800">{fmtTime(trip?.arrival_time)}</div>
                                                <div className="text-[11px] text-slate-500 mt-0.5">{toCity}</div>
                                            </div>
                                            <div className="ml-auto flex flex-col items-end gap-1.5">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.cls}`}>{statusCfg.label}</span>
                                                {tripStCfg && (
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${tripStCfg.cls}`}>{tripStCfg.label}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* ── Điểm đón / trả ── */}
                                        <div className="flex gap-3 mb-4 bg-slate-50 rounded-xl p-3">
                                            <div className="flex-1 flex gap-2 items-start">
                                                <MapPin size={13} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Điểm đón</div>
                                                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{fromCity}</div>
                                                    {fromDetail && <div className="text-[11px] text-slate-500 mt-0.5">{fromDetail}</div>}
                                                </div>
                                            </div>
                                            <div className="w-px bg-slate-200 self-stretch mx-1" />
                                            <div className="flex-1 flex gap-2 items-start">
                                                <MapPin size={13} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                <div>
                                                    <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Điểm trả</div>
                                                    <div className="text-xs font-semibold text-slate-700 mt-0.5">{toCity}</div>
                                                    {toDetail && <div className="text-[11px] text-slate-500 mt-0.5">{toDetail}</div>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* ── Trạng thái lên / xuống xe ── */}
                                        {(order.is_boarded || order.is_alighted || order.order_status === "PAID") && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {order.is_boarded && !order.is_alighted && (
                                                    <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                                        <UserCheck size={12} /> Đã lên xe
                                                        {order.boarded_at && <span className="text-green-500">· {fmtHHMM(order.boarded_at)}</span>}
                                                    </span>
                                                )}
                                                {order.is_alighted && (
                                                    <>
                                                        <span className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                                            <UserCheck size={12} /> Đã lên xe
                                                            {order.boarded_at && <span className="text-green-500">· {fmtHHMM(order.boarded_at)}</span>}
                                                        </span>
                                                        <span className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] font-bold px-3 py-1 rounded-full">
                                                            <LogOut size={12} /> Đã xuống xe
                                                            {order.alighted_at && <span className="text-blue-500">· {fmtHHMM(order.alighted_at)}</span>}
                                                        </span>
                                                    </>
                                                )}
                                                {order.order_status === "PAID" && !order.is_boarded && !order.is_alighted && trip?.status === "SCHEDULED" && (
                                                    <span className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 text-slate-500 text-[11px] font-semibold px-3 py-1 rounded-full">
                                                        <UserCheck size={12} /> Chờ lên xe
                                                    </span>
                                                )}
                                            </div>
                                        )}

                                        {/* ── Detail row ── */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-4 border-t border-slate-100 text-sm">
                                            {order.seat_labels.length > 0 && (
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-slate-400 text-xs">🪑</span>
                                                    <div className="flex gap-1 flex-wrap">
                                                        {order.seat_labels.map((s) => (
                                                            <span key={s} className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md">{s}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <span className="text-xs font-semibold text-slate-700">{order.passenger_name}</span>
                                                <span className="text-slate-300">·</span>
                                                <span className="text-xs">{order.passenger_phone}</span>
                                            </div>
                                            {trip?.bus_type_name && (
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Bus size={13} className="text-slate-400" />
                                                    <span className="text-xs font-semibold">{trip.bus_type_name}</span>
                                                </div>
                                            )}
                                            {order.payment && (
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard size={13} className="text-slate-400" />
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {PAYMENT_METHOD_LABEL[order.payment.payment_method] ?? order.payment.payment_method}
                                                    </span>
                                                    {pmtCfg && <span className={`text-xs font-bold ${pmtCfg.cls}`}>· {pmtCfg.label}</span>}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5 text-slate-400">
                                                <Clock size={12} />
                                                <span className="text-xs">Đặt {fmtDate(order.created_at)}</span>
                                            </div>
                                            <div className="ml-auto font-black text-orange-600 text-base">
                                                {order.total_price.toLocaleString("vi-VN")}₫
                                            </div>

                                            {/* Nút hủy vé */}
                                            {canCancel && (
                                                <button onClick={() => setCancelOrder(order)}
                                                    className="flex items-center gap-1.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-3 py-1.5 transition">
                                                    <X size={12} /> Hủy vé
                                                </button>
                                            )}

                                            {/* Badge đang hoàn tiền */}
                                            {order.payment?.payment_status === "REFUND_PENDING" && (
                                                <span className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl">
                                                    <Loader2 size={12} className="animate-spin" /> Đang xử lý hoàn tiền
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-40">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        {pageNumbers().map((page) => (
                            <button key={page} onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold transition-all ${currentPage === page ? "bg-orange-500 text-white shadow-md shadow-orange-200" : "text-slate-600 hover:bg-slate-100"}`}>
                                {page}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))} disabled={currentPage === pagination.totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-40">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {cancelOrder && (
                <CancelModal
                    order={cancelOrder}
                    onClose={() => setCancelOrder(null)}
                    onDone={handleCancelDone}
                />
            )}
        </div>
    );
}