import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderStatus = "pending" | "approved" | "cancelled";
type PaymentMethod = "cash" | "banking" | "momo";

interface Product {
    id: string;
    name: string;
    image: string;
    weight: string;
    quantity: number;
    price: number;
}

interface Order {
    id: string;
    orderId: string;
    date: string;
    status: OrderStatus;
    payment: PaymentMethod;
    // Sender
    senderName: string;
    senderAddress: string;
    senderEmail: string;
    senderPhone: string;
    // Receiver
    receiverName: string;
    receiverAddress: string;
    receiverEmail: string;
    receiverPhone: string;
    // Finance
    fee: number;
    discount: number;
    cargoType: string;
    products: Product[];
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockOrders: Order[] = [
    {
        id: "1", orderId: "#4152", date: "April 24, 2021", status: "pending",
        payment: "cash",
        senderName: "Dainne Russell", senderAddress: "FPT University", senderEmail: "dainne.ressell@gmail.com", senderPhone: "(671) 555-0110",
        receiverName: "Mike Tyson", receiverAddress: "157 Lê Duẩn, Huế", receiverEmail: "dainne.ressell@gmail.com", receiverPhone: "(671) 555-0110",
        fee: 150000, discount: 10, cargoType: "To nặng",
        products: [
            { id: "p1", name: "Vali", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=60&h=60&fit=crop", weight: "15kg", quantity: 1, price: 50000 },
            { id: "p2", name: "Thùng Carton lớn", image: "https://images.unsplash.com/photo-1605745341112-85968b19335b?w=60&h=60&fit=crop", weight: "50kg", quantity: 2, price: 50000 },
        ],
    },
    {
        id: "2", orderId: "#4153", date: "April 25, 2021", status: "approved",
        payment: "momo",
        senderName: "Nguyễn Văn An", senderAddress: "12 Trần Phú, Đà Nẵng", senderEmail: "nguyenan@gmail.com", senderPhone: "0901 234 567",
        receiverName: "Lê Thị Bích", receiverAddress: "45 Nguyễn Huệ, TP.HCM", receiverEmail: "lebich@gmail.com", receiverPhone: "0912 345 678",
        fee: 200000, discount: 5, cargoType: "Dễ vỡ",
        products: [
            { id: "p3", name: "Linh kiện điện tử", image: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=60&h=60&fit=crop", weight: "10kg", quantity: 3, price: 60000 },
        ],
    },
    {
        id: "3", orderId: "#4154", date: "April 26, 2021", status: "cancelled",
        payment: "banking",
        senderName: "Phạm Minh Tuấn", senderAddress: "88 Lê Lợi, Huế", senderEmail: "phamtuan@gmail.com", senderPhone: "0923 456 789",
        receiverName: "Trần Thị Mai", receiverAddress: "22 Phan Chu Trinh, Hội An", receiverEmail: "tranmai@gmail.com", receiverPhone: "0934 567 890",
        fee: 120000, discount: 0, cargoType: "Thực phẩm",
        products: [
            { id: "p4", name: "Thùng trái cây", image: "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=60&h=60&fit=crop", weight: "20kg", quantity: 2, price: 40000 },
            { id: "p5", name: "Quà tặng", image: "https://images.unsplash.com/photo-1513201099705-a9746072228c?w=60&h=60&fit=crop", weight: "5kg", quantity: 1, price: 40000 },
        ],
    },
    {
        id: "4", orderId: "#4155", date: "April 27, 2021", status: "pending",
        payment: "cash",
        senderName: "Hoàng Văn Đức", senderAddress: "33 Bạch Đằng, Đà Nẵng", senderEmail: "hoangduc@gmail.com", senderPhone: "0945 678 901",
        receiverName: "Võ Thị Hương", receiverAddress: "77 Hùng Vương, Quy Nhơn", receiverEmail: "vohuong@gmail.com", receiverPhone: "0956 789 012",
        fee: 180000, discount: 15, cargoType: "Quần áo",
        products: [
            { id: "p6", name: "Túi xách thời trang", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=60&h=60&fit=crop", weight: "3kg", quantity: 4, price: 30000 },
            { id: "p7", name: "Giày dép", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60&h=60&fit=crop", weight: "8kg", quantity: 2, price: 45000 },
        ],
    },
    {
        id: "5", orderId: "#4156", date: "April 28, 2021", status: "approved",
        payment: "momo",
        senderName: "Đinh Thị Lan", senderAddress: "55 Ngô Quyền, Hải Phòng", senderEmail: "dinhlan@gmail.com", senderPhone: "0967 890 123",
        receiverName: "Bùi Văn Hải", receiverAddress: "99 Trường Chinh, Hà Nội", receiverEmail: "buihai@gmail.com", receiverPhone: "0978 901 234",
        fee: 250000, discount: 20, cargoType: "Điện tử",
        products: [
            { id: "p8", name: "Laptop cũ", image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=60&h=60&fit=crop", weight: "5kg", quantity: 1, price: 200000 },
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const statusConfig: Record<OrderStatus, { label: string; pill: string; dot: string }> = {
    pending: { label: "Chờ duyệt", pill: "bg-yellow-100 text-yellow-700 border-yellow-200", dot: "bg-yellow-400" },
    approved: { label: "Đã duyệt", pill: "bg-green-100 text-green-700 border-green-200", dot: "bg-green-500" },
    cancelled: { label: "Đã hủy", pill: "bg-red-100 text-red-600 border-red-200", dot: "bg-red-500" },
};

const paymentLabel: Record<PaymentMethod, string> = {
    cash: "Tiền Mặt",
    banking: "Chuyển Khoản",
    momo: "MoMo",
};

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

// ─── Sub-components ───────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: OrderStatus }) => {
    const cfg = statusConfig[status];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.pill}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
        </span>
    );
};

// ─── Order Detail Modal ───────────────────────────────────────────────────────
const OrderDetailModal = ({
    order,
    onClose,
    onApprove,
    onCancel,
}: {
    order: Order;
    onClose: () => void;
    onApprove: (id: string) => void;
    onCancel: (id: string) => void;
}) => {
    const discountAmt = Math.round(order.fee * order.discount / 100);
    const total = order.fee - discountAmt;
    const productTotal = order.products.reduce((s, p) => s + p.price * p.quantity, 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Modal header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-2xl">
                    <div>
                        <h2 className="text-lg font-extrabold text-gray-900">Kiểm tra đơn hàng</h2>
                        <p className="text-sm text-gray-400 mt-0.5">
                            {order.date} &nbsp;•&nbsp;
                            <span className="font-semibold text-gray-600">{order.products.length} Products</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <button onClick={onClose} className="text-orange-500 font-bold text-sm hover:underline">
                            Đóng lại
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-5">
                    {/* Addresses + Order info */}
                    <div className="grid grid-cols-3 gap-4">
                        {/* Sender */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Địa chỉ nhận hàng</p>
                            <p className="font-bold text-gray-900">{order.senderName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{order.senderAddress}</p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                <p className="text-sm text-gray-700">{order.senderEmail}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Số điện thoại</p>
                                <p className="text-sm text-gray-700">{order.senderPhone}</p>
                            </div>
                        </div>

                        {/* Receiver */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Địa chỉ giao hàng</p>
                            <p className="font-bold text-gray-900">{order.receiverName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{order.receiverAddress}</p>
                            <div className="mt-3 space-y-1">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Email</p>
                                <p className="text-sm text-gray-700">{order.receiverEmail}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Số điện thoại</p>
                                <p className="text-sm text-gray-700">{order.receiverPhone}</p>
                            </div>
                        </div>

                        {/* Order summary */}
                        <div className="border border-gray-200 rounded-xl p-4">
                            <div className="flex justify-between mb-3">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
                                    <p className="font-bold text-gray-900">{order.orderId}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Thanh toán</p>
                                    <p className="font-bold text-gray-900">{paymentLabel[order.payment]}</p>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Chi phí:</span>
                                    <span className="font-semibold">{fmt(order.fee)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Khuyến mãi</span>
                                    <span className="font-semibold text-orange-500">{order.discount}%</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Loại hàng</span>
                                    <span className="font-semibold">{order.cargoType}</span>
                                </div>
                                <div className="flex justify-between border-t border-gray-100 pt-2 mt-1">
                                    <span className="font-bold text-gray-800">Tổng</span>
                                    <span className="font-extrabold text-green-600 text-base">{fmt(total)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Product table */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                                    <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Cân nặng</th>
                                    <th className="text-center px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Số lượng</th>
                                    <th className="text-right px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {order.products.map(p => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <img src={p.image} alt={p.name} className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                                                <span className="font-semibold text-gray-800">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{p.weight}</td>
                                        <td className="px-4 py-3 text-center text-gray-600">x{p.quantity}</td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(p.price * p.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50 border-t border-gray-200">
                                <tr>
                                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-700">Tổng sản phẩm:</td>
                                    <td className="px-4 py-3 text-right font-extrabold text-green-600">{fmt(productTotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    {/* Action buttons */}
                    {order.status === "pending" && (
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={() => onCancel(order.id)}
                                className="px-6 py-2.5 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-all shadow-sm hover:shadow-md"
                            >
                                Hủy Đơn
                            </button>
                            <button
                                onClick={() => onApprove(order.id)}
                                className="px-6 py-2.5 rounded-xl bg-green-500 text-white font-bold text-sm hover:bg-green-600 transition-all shadow-sm hover:shadow-md"
                            >
                                Duyệt Đơn
                            </button>
                        </div>
                    )}
                    {order.status === "approved" && (
                        <div className="flex justify-end pt-2">
                            <span className="px-5 py-2.5 rounded-xl bg-green-50 text-green-700 font-bold text-sm border border-green-200">
                                ✓ Đơn hàng đã được duyệt
                            </span>
                        </div>
                    )}
                    {order.status === "cancelled" && (
                        <div className="flex justify-end pt-2">
                            <span className="px-5 py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-sm border border-red-200">
                                ✗ Đơn hàng đã bị hủy
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PER_PAGE = 3;

export default function CargoOrderList() {
    const [orders, setOrders] = useState<Order[]>(mockOrders);
    const [selected, setSelected] = useState<Order | null>(null);
    const [page, setPage] = useState(1);
    const [filterStatus, setFilterStatus] = useState<OrderStatus | "all">("all");

    const filtered = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);
    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const currentData = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const handleApprove = (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "approved" } : o));
        setSelected(prev => prev?.id === id ? { ...prev, status: "approved" } : prev);
    };

    const handleCancel = (id: string) => {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: "cancelled" } : o));
        setSelected(prev => prev?.id === id ? { ...prev, status: "cancelled" } : prev);
    };

    // Stats
    const totalOrders = orders.length;
    const pendingCount = orders.filter(o => o.status === "pending").length;
    const approvedCount = orders.filter(o => o.status === "approved").length;
    const totalRevenue = orders.filter(o => o.status === "approved").reduce((s, o) => {
        const disc = Math.round(o.fee * o.discount / 100);
        return s + o.fee - disc;
    }, 0);

    return (
        <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Nunito', 'Segoe UI', sans-serif" }}>
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-extrabold text-gray-900">Danh sách hàng hóa</h1>
                        <p className="text-sm text-gray-400 mt-0.5">{totalOrders} đơn hàng tổng cộng</p>
                    </div>
                    <button className="px-5 py-2 rounded-xl bg-orange-500 text-white font-bold text-sm hover:bg-orange-600 transition-all">
                        + Thêm đơn mới
                    </button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">

                {/* ── Stats ──────────────────────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: "Tổng đơn", value: totalOrders, sub: "đơn hàng", bg: "bg-blue-50", border: "border-blue-200", val: "text-blue-600" },
                        { label: "Chờ duyệt", value: pendingCount, sub: "đơn", bg: "bg-yellow-50", border: "border-yellow-200", val: "text-yellow-600" },
                        { label: "Đã duyệt", value: approvedCount, sub: "đơn", bg: "bg-green-50", border: "border-green-200", val: "text-green-600" },
                        { label: "Doanh thu", value: fmt(totalRevenue), sub: "từ đã duyệt", bg: "bg-orange-50", border: "border-orange-200", val: "text-orange-600" },
                    ].map((s, i) => (
                        <div key={i} className={`rounded-2xl border ${s.border} ${s.bg} p-4`}>
                            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
                            <p className={`text-2xl font-black ${s.val}`}>{s.value}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ── Filter tabs ─────────────────────────────────────────── */}
                <div className="flex gap-2 flex-wrap">
                    {(["all", "pending", "approved", "cancelled"] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilterStatus(f); setPage(1); }}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${filterStatus === f
                                ? "bg-orange-500 text-white border-orange-500"
                                : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"}`}
                        >
                            {f === "all" ? "Tất cả" : statusConfig[f].label}
                            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-xs ${filterStatus === f ? "bg-white/20" : "bg-gray-100"}`}>
                                {f === "all" ? totalOrders : orders.filter(o => o.status === f).length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* ── Order list ──────────────────────────────────────────── */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <div className="col-span-2">Mã đơn</div>
                        <div className="col-span-3">Người gửi</div>
                        <div className="col-span-3">Người nhận</div>
                        <div className="col-span-2">Trạng thái</div>
                        <div className="col-span-2 text-right">Thao tác</div>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-gray-100">
                        {currentData.length === 0 ? (
                            <div className="py-16 text-center text-gray-400 text-sm">Không có đơn hàng nào</div>
                        ) : currentData.map(order => {
                            const disc = Math.round(order.fee * order.discount / 100);
                            const total = order.fee - disc;
                            return (
                                <div
                                    key={order.id}
                                    className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-orange-50/40 transition-colors items-center"
                                >
                                    <div className="col-span-2">
                                        <p className="font-bold text-gray-900">{order.orderId}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">{order.date}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="font-semibold text-gray-800 text-sm">{order.senderName}</p>
                                        <p className="text-xs text-gray-400 truncate">{order.senderAddress}</p>
                                    </div>
                                    <div className="col-span-3">
                                        <p className="font-semibold text-gray-800 text-sm">{order.receiverName}</p>
                                        <p className="text-xs text-gray-400 truncate">{order.receiverAddress}</p>
                                        <p className="text-xs font-bold text-green-600 mt-0.5">{fmt(total)}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <StatusBadge status={order.status} />
                                        <p className="text-xs text-gray-400 mt-1">{paymentLabel[order.payment]}</p>
                                    </div>
                                    <div className="col-span-2 flex justify-end gap-2">
                                        <button
                                            onClick={() => setSelected(order)}
                                            className="px-3 py-1.5 rounded-lg bg-orange-50 text-orange-600 text-xs font-bold border border-orange-200 hover:bg-orange-100 transition-colors"
                                        >
                                            Chi tiết
                                        </button>
                                        {order.status === "pending" && (
                                            <>
                                                <button
                                                    onClick={() => handleCancel(order.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-bold border border-red-200 hover:bg-red-100 transition-colors"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(order.id)}
                                                    className="px-3 py-1.5 rounded-lg bg-green-50 text-green-600 text-xs font-bold border border-green-200 hover:bg-green-100 transition-colors"
                                                >
                                                    Duyệt
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                            <p className="text-xs text-gray-400">
                                Trang {page} / {totalPages} &nbsp;•&nbsp; {filtered.length} đơn
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                                    disabled={page === 1}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${page === 1 ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700"}`}
                                >
                                    ← Trước
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-sm font-bold border transition-colors ${page === i + 1 ? "bg-orange-500 text-white border-orange-500" : "hover:bg-orange-50 text-gray-700"}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                                    disabled={page === totalPages}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold border transition-colors ${page === totalPages ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "hover:bg-orange-50 text-gray-700"}`}
                                >
                                    Sau →
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* ── Detail Modal ────────────────────────────────────────────── */}
            {selected && (
                <OrderDetailModal
                    order={orders.find(o => o.id === selected.id) || selected}
                    onClose={() => setSelected(null)}
                    onApprove={handleApprove}
                    onCancel={handleCancel}
                />
            )}
        </div>
    );
}