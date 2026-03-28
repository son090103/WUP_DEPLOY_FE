import { useCallback, useEffect, useState } from "react";
import {
    Loader2, RefreshCw, AlertCircle, X,
    Truck, Bike, Package, FileText, Ruler, Weight,
    MapPin, Navigation, Clock, Bus, CreditCard,
    ChevronDown, ChevronUp,
} from "lucide-react";

/* ═══════════════ TYPES ═══════════════════════════════════════════ */
type ParcelHistoryItem = {
    _id: string;
    code: string;
    status: "RECEIVED" | "ON_BUS" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
    approval_status: "PENDING" | "APPROVED" | "REJECTED";
    item_category: "DOCUMENT" | "PARCEL" | "BICYCLE" | "MOTORCYCLE" | "OTHER";
    size_category: "SMALL" | "MEDIUM" | "LARGE" | null;
    weight_kg: number;
    volume_m3: number | null;
    volumetric_weight_kg: number | null;
    dimensions: { length_cm: number | null; width_cm: number | null; height_cm: number | null } | null;
    parcel_type: string | null;
    receiver_name: string;
    receiver_phone: string;
    total_price: number;
    payment_method: string;
    payment_status: "PENDING" | "PAID" | "REFUNDED" | "FAILED";
    pickup: { stop_order: number | null; name: string | null; province: string | null; location_name: string | null };
    dropoff: { stop_order: number | null; name: string | null; province: string | null; location_name: string | null };
    trip: {
        _id: string; departure_time: string; arrival_time: string; status: string;
        bus_type_name: string | null;
        route: { from: { name: string | null; province: string | null }; to: { name: string | null; province: string | null } };
    } | null;
    created_at: string;
};

type Pagination = { page: number; limit: number; total: number; totalPages: number };
type ItemCategory = "DOCUMENT" | "PARCEL" | "BICYCLE" | "MOTORCYCLE" | "OTHER";
type SizeCategory = "SMALL" | "MEDIUM" | "LARGE";

/* ═══════════════ CONFIG ══════════════════════════════════════════ */
const CATEGORY_META: Record<ItemCategory, { label: string; icon: React.ReactNode }> = {
    DOCUMENT: { label: "Giấy tờ / tài liệu", icon: <FileText size={13} /> },
    PARCEL: { label: "Hàng thông thường", icon: <Package size={13} /> },
    BICYCLE: { label: "Xe đạp", icon: <Bike size={13} /> },
    MOTORCYCLE: { label: "Xe máy", icon: <Truck size={13} /> },
    OTHER: { label: "Hàng cồng kềnh khác", icon: <Ruler size={13} /> },
};
const SIZE_META: Record<string, Record<SizeCategory, string>> = {
    BICYCLE: { SMALL: "Xe đạp mini", MEDIUM: "Xe đạp thường", LARGE: "Xe đạp thể thao" },
    MOTORCYCLE: { SMALL: "Xe ≤50cc / xe điện nhỏ", MEDIUM: "Xe 51–150cc", LARGE: "Xe >150cc" },
    OTHER: { SMALL: "Hàng nhỏ (<50cm/cạnh)", MEDIUM: "Hàng vừa", LARGE: "Hàng lớn" },
};
const PARCEL_STATUS_CFG: Record<string, { label: string; color: string; bar: string }> = {
    RECEIVED: { label: "Chờ xử lý", color: "bg-yellow-100 text-yellow-700 border-yellow-200", bar: "bg-yellow-400" },
    ON_BUS: { label: "Trên xe", color: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-400" },
    IN_TRANSIT: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700 border-indigo-200", bar: "bg-indigo-400" },
    DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700 border-green-200", bar: "bg-green-400" },
    CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-500 border-slate-200", bar: "bg-slate-300" },
};
const PAYMENT_STATUS_CFG: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ thanh toán", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    PAID: { label: "Đã thanh toán", color: "bg-green-100 text-green-700 border-green-200" },
    REFUNDED: { label: "Đã hoàn tiền", color: "bg-slate-100 text-slate-500 border-slate-200" },
    FAILED: { label: "Thanh toán lỗi", color: "bg-red-100 text-red-600 border-red-200" },
};

/* ═══════════════ HELPERS ═════════════════════════════════════════ */
const fmtCurrency = (n: number) => n.toLocaleString("vi-VN") + "đ";
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----";
const fmtDateTime = (d?: string) => d ? `${fmtTime(d)} · ${fmtDate(d)}` : "—";

const API = import.meta.env.VITE_API_URL;

/* ═══════════════ PARCEL HISTORY CARD ════════════════════════════ */
function ParcelHistoryCard({
    parcel, onCancel, canceling, onDetail,
}: {
    parcel: ParcelHistoryItem;
    onCancel: (id: string) => void;
    canceling: string | null;
    onDetail: (p: ParcelHistoryItem) => void;
}) {
    const [expanded, setExpanded] = useState(false);

    const cfg = PARCEL_STATUS_CFG[parcel.status] ?? PARCEL_STATUS_CFG.RECEIVED;
    const pmtCfg = PAYMENT_STATUS_CFG[parcel.payment_status] ?? PAYMENT_STATUS_CFG.PENDING;
    const catMeta = CATEGORY_META[parcel.item_category];
    const isVehicle = parcel.item_category === "BICYCLE" || parcel.item_category === "MOTORCYCLE";

    const pickupLabel = parcel.pickup.location_name ?? parcel.pickup.name ?? parcel.pickup.province ?? "—";
    const dropoffLabel = parcel.dropoff.location_name ?? parcel.dropoff.name ?? parcel.dropoff.province ?? "—";

    return (
        <div className="bg-white rounded-2xl shadow-md border border-orange-100/60 overflow-hidden">
            <div className={`h-1 ${cfg.bar}`} />
            <div className="p-5">

                {/* ── Top ── */}
                <div className="flex flex-wrap gap-3 items-start justify-between mb-4">
                    <div>
                        <p className="text-xs text-slate-400">Mã đơn</p>
                        <p className="text-sm font-black text-slate-800 font-mono">{parcel.code}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Tạo {fmtDate(parcel.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.color}`}>{cfg.label}</span>
                        {catMeta && (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                {catMeta.icon} {catMeta.label}
                                {parcel.size_category && ` · ${SIZE_META[parcel.item_category]?.[parcel.size_category] ?? parcel.size_category}`}
                            </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${pmtCfg.color}`}>{pmtCfg.label}</span>
                    </div>
                </div>

                {/* ── Tuyến ── */}
                {parcel.trip && (
                    <div className="flex items-center gap-2 py-2.5 px-3 mb-3 bg-orange-50/60 rounded-xl border border-orange-100">
                        <Bus size={13} className="text-orange-400 flex-shrink-0" />
                        <span className="text-xs font-bold text-slate-700">
                            {parcel.trip.route.from.province} → {parcel.trip.route.to.province}
                        </span>
                        <span className="text-slate-400 text-xs ml-auto whitespace-nowrap">
                            {fmtTime(parcel.trip.departure_time)} · {fmtDate(parcel.trip.departure_time)}
                        </span>
                    </div>
                )}

                {/* ── Điểm gửi / nhận ── */}
                <div className="flex gap-3 mb-4 bg-slate-50 rounded-xl p-3">
                    <div className="flex-1 flex gap-2 items-start min-w-0">
                        <MapPin size={13} className="text-green-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-green-600 uppercase tracking-wide">Điểm gửi</p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{pickupLabel}</p>
                            {parcel.pickup.location_name && parcel.pickup.province && (
                                <p className="text-[11px] text-slate-400">{parcel.pickup.province}</p>
                            )}
                        </div>
                    </div>
                    <div className="w-px bg-slate-200 self-stretch mx-1 flex-shrink-0" />
                    <div className="flex-1 flex gap-2 items-start min-w-0">
                        <Navigation size={13} className="text-orange-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">Điểm nhận</p>
                            <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{dropoffLabel}</p>
                            {parcel.dropoff.location_name && parcel.dropoff.province && (
                                <p className="text-[11px] text-slate-400">{parcel.dropoff.province}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Thông tin + giá ── */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-slate-700">
                        <span className="text-xs font-semibold">{parcel.receiver_name}</span>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-500">{parcel.receiver_phone}</span>
                    </div>
                    {!isVehicle && (
                        <div className="flex items-center gap-1 text-slate-500">
                            <Weight size={12} className="text-slate-400" />
                            <span className="text-xs font-semibold">
                                {parcel.weight_kg.toLocaleString()} kg
                                {parcel.volume_m3 ? ` · ${parcel.volume_m3} m³` : ""}
                            </span>
                        </div>
                    )}
                    {parcel.trip?.bus_type_name && (
                        <div className="flex items-center gap-1 text-slate-500">
                            <Bus size={12} className="text-slate-400" />
                            <span className="text-xs font-semibold">{parcel.trip.bus_type_name}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-1 text-slate-500">
                        <CreditCard size={12} className="text-slate-400" />
                        <span className="text-xs font-semibold">
                            {parcel.payment_method === "ONLINE" ? "📱 Online" : "💵 Trả trên xe"}
                        </span>
                    </div>
                    <div className="ml-auto font-black text-orange-600 text-base">
                        {fmtCurrency(parcel.total_price)}
                    </div>
                </div>

                {/* ── Expand ── */}
                {expanded && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 animate-in fade-in duration-200">
                        {parcel.parcel_type && <ERow label="Loại hàng" value={parcel.parcel_type} />}
                        {!isVehicle && parcel.dimensions?.length_cm && (
                            <ERow label="Kích thước" value={`${parcel.dimensions.length_cm} × ${parcel.dimensions.width_cm} × ${parcel.dimensions.height_cm} cm`} />
                        )}
                        {!isVehicle && parcel.volumetric_weight_kg && (
                            <ERow label="KL quy đổi" value={`${parcel.volumetric_weight_kg} kg`} />
                        )}
                        <ERow label="Duyệt" value={parcel.approval_status} />
                        {parcel.trip && <ERow label="Đến nơi" value={fmtDateTime(parcel.trip.arrival_time)} />}
                    </div>
                )}

                {/* ── Actions ── */}
                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <button onClick={() => setExpanded((v) => !v)}
                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-orange-600 transition">
                        {expanded ? <><ChevronUp size={14} /> Thu gọn</> : <><ChevronDown size={14} /> Xem chi tiết</>}
                    </button>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={() => onDetail(parcel)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-orange-200 bg-white px-4 py-2 text-xs font-semibold text-orange-600 hover:bg-orange-50 transition">
                            <Package size={13} /> Chi tiết đơn
                        </button>
                        {parcel.status === "RECEIVED" && (
                            <button onClick={() => onCancel(parcel._id)} disabled={canceling === parcel._id}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 transition disabled:opacity-50">
                                {canceling === parcel._id
                                    ? <><Loader2 className="animate-spin" size={13} /> Đang hủy…</>
                                    : <><X size={13} /> Hủy đơn</>}
                            </button>
                        )}
                        {parcel.status !== "RECEIVED" && parcel.status !== "CANCELLED" && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                                <Clock size={12} /> {cfg.label}
                            </span>
                        )}
                        {parcel.status === "CANCELLED" && (
                            <span className="text-xs font-semibold text-slate-400">Đơn đã hủy</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function ERow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 text-xs">
            <span className="text-slate-400 font-semibold uppercase flex-shrink-0">{label}</span>
            <span className="font-semibold text-slate-700 text-right">{value}</span>
        </div>
    );
}

/* ═══════════════ PARCEL DETAIL MODAL ════════════════════════════ */
function ParcelDetailModal({ parcel, onClose }: { parcel: ParcelHistoryItem; onClose: () => void }) {
    const cfg = PARCEL_STATUS_CFG[parcel.status] ?? PARCEL_STATUS_CFG.RECEIVED;
    const pmtCfg = PAYMENT_STATUS_CFG[parcel.payment_status] ?? PAYMENT_STATUS_CFG.PENDING;
    const isVehicle = parcel.item_category === "BICYCLE" || parcel.item_category === "MOTORCYCLE";

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-5 flex items-start justify-between gap-4 flex-shrink-0">
                    <div>
                        <p className="text-white font-black text-lg font-mono">{parcel.code}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">{cfg.label}</span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                {CATEGORY_META[parcel.item_category]?.label}
                                {parcel.size_category ? ` · ${SIZE_META[parcel.item_category]?.[parcel.size_category] ?? parcel.size_category}` : ""}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition flex-shrink-0">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    <MSection title="Người nhận">
                        <MRow label="Họ tên" value={parcel.receiver_name} />
                        <MRow label="Điện thoại" value={parcel.receiver_phone} />
                    </MSection>

                    <MSection title="Hàng hóa">
                        <MRow label="Loại hàng" value={CATEGORY_META[parcel.item_category]?.label ?? parcel.item_category} />
                        {parcel.size_category && (
                            <MRow label="Phân loại" value={SIZE_META[parcel.item_category]?.[parcel.size_category] ?? parcel.size_category} />
                        )}
                        {parcel.parcel_type && <MRow label="Mô tả" value={parcel.parcel_type} />}
                        {!isVehicle && <MRow label="Khối lượng" value={`${parcel.weight_kg.toLocaleString()} kg`} />}
                        {parcel.volume_m3 && <MRow label="Thể tích" value={`${parcel.volume_m3} m³`} />}
                        {parcel.volumetric_weight_kg && <MRow label="KL quy đổi" value={`${parcel.volumetric_weight_kg} kg`} />}
                        {parcel.dimensions?.length_cm && (
                            <MRow label="Kích thước" value={`${parcel.dimensions.length_cm} × ${parcel.dimensions.width_cm} × ${parcel.dimensions.height_cm} cm`} />
                        )}
                    </MSection>

                    <MSection title="Lộ trình">
                        <div className="space-y-3">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">A</div>
                                    <p className="text-xs font-bold text-green-700 uppercase">Điểm gửi</p>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 ml-7">
                                    {parcel.pickup.location_name ?? parcel.pickup.name ?? parcel.pickup.province ?? "—"}
                                </p>
                                {parcel.pickup.location_name && parcel.pickup.province && (
                                    <p className="text-xs text-slate-400 ml-7">{parcel.pickup.province}</p>
                                )}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-white text-[10px] font-black flex-shrink-0">B</div>
                                    <p className="text-xs font-bold text-orange-700 uppercase">Điểm nhận</p>
                                </div>
                                <p className="text-sm font-semibold text-slate-800 ml-7">
                                    {parcel.dropoff.location_name ?? parcel.dropoff.name ?? parcel.dropoff.province ?? "—"}
                                </p>
                                {parcel.dropoff.location_name && parcel.dropoff.province && (
                                    <p className="text-xs text-slate-400 ml-7">{parcel.dropoff.province}</p>
                                )}
                            </div>
                        </div>
                    </MSection>

                    {parcel.trip && (
                        <MSection title="Chuyến xe">
                            <MRow label="Tuyến" value={`${parcel.trip.route.from.province} → ${parcel.trip.route.to.province}`} />
                            <MRow label="Khởi hành" value={fmtDateTime(parcel.trip.departure_time)} />
                            <MRow label="Đến nơi" value={fmtDateTime(parcel.trip.arrival_time)} />
                            {parcel.trip.bus_type_name && <MRow label="Loại xe" value={parcel.trip.bus_type_name} />}
                        </MSection>
                    )}

                    <MSection title="Thanh toán">
                        <MRow label="Tổng tiền" value={fmtCurrency(parcel.total_price)} highlight />
                        <MRow label="Phương thức" value={parcel.payment_method === "ONLINE" ? "📱 Online" : "💵 Trả trên xe"} />
                        <MRow label="Trạng thái" value={pmtCfg.label} />
                    </MSection>

                    <MSection title="Thông tin đơn">
                        <MRow label="Duyệt" value={parcel.approval_status} />
                        <MRow label="Ngày tạo" value={fmtDateTime(parcel.created_at)} />
                    </MSection>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 flex justify-end flex-shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}

function MSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">{children}</div>
        </div>
    );
}
function MRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="flex items-start justify-between gap-4 text-sm">
            <span className="text-slate-500 flex-shrink-0">{label}</span>
            <span className={`font-semibold text-right ${highlight ? "text-orange-600 font-black text-base" : "text-slate-800"}`}>{value}</span>
        </div>
    );
}

/* ═══════════════ MAIN PAGE ═══════════════════════════════════════ */
export default function DatHangParcelOrder() {
    const [parcels, setParcels] = useState<ParcelHistoryItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [cancelingId, setCancelingId] = useState<string | null>(null);
    const [detailParcel, setDetailParcel] = useState<ParcelHistoryItem | null>(null);

    const fetchHistory = useCallback(async (page: number) => {
        setError(null); setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) { setError("Bạn cần đăng nhập."); return; }
            const res = await fetch(`${API}/api/customer/check/parcels?page=${page}&limit=10`,
                { headers: { Authorization: `Bearer ${token}` } });
            const json: { data?: ParcelHistoryItem[]; pagination?: Pagination; message?: string } = await res.json();
            if (!res.ok) { setError(json.message ?? "Không thể tải lịch sử."); return; }
            setParcels(json.data ?? []);
            setPagination(json.pagination ?? { page, limit: 10, total: 0, totalPages: 1 });
        } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchHistory(currentPage); }, [currentPage, fetchHistory]);

    const handleCancel = useCallback(async (parcelId: string) => {
        setCancelingId(parcelId);
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const res = await fetch(`${API}/api/customer/check/parcels/${parcelId}/cancel`,
                { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
            const json: { message?: string } = await res.json();
            if (!res.ok) { alert(json.message ?? "Không thể hủy."); return; }
            setParcels((prev) => prev.map((p) =>
                p._id === parcelId ? { ...p, status: "CANCELLED", payment_status: "REFUNDED" } : p
            ));
            if (detailParcel?._id === parcelId)
                setDetailParcel((prev) => prev ? { ...prev, status: "CANCELLED", payment_status: "REFUNDED" } : null);
        } catch { alert("Lỗi kết nối."); }
        finally { setCancelingId(null); }
    }, [detailParcel]);

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
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Lịch sử gửi hàng</h1>
                        {!loading && pagination.total > 0 && (
                            <p className="text-sm text-slate-500 mt-0.5">{pagination.total} đơn hàng</p>
                        )}
                    </div>
                    <button onClick={() => fetchHistory(currentPage)} disabled={loading}
                        className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={36} className="animate-spin text-orange-500" />
                        <p className="text-slate-500 font-medium">Đang tải lịch sử...</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <AlertCircle size={40} className="text-red-400" />
                        <p className="text-slate-600 font-semibold">{error}</p>
                        <button onClick={() => fetchHistory(currentPage)}
                            className="mt-2 px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600 transition">
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Empty */}
                {!loading && !error && parcels.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <Package size={48} className="text-slate-300" />
                        <p className="text-slate-500 font-semibold text-lg">Chưa có đơn gửi hàng</p>
                        <p className="text-slate-400 text-sm">Hãy đặt đơn gửi hàng đầu tiên của bạn.</p>
                    </div>
                )}

                {/* List */}
                {!loading && !error && parcels.length > 0 && (
                    <div className="space-y-4">
                        {parcels.map((parcel) => (
                            <ParcelHistoryCard
                                key={parcel._id}
                                parcel={parcel}
                                onCancel={handleCancel}
                                canceling={cancelingId}
                                onDetail={setDetailParcel}
                            />
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && pagination.totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-8">
                        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition disabled:opacity-40">
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
                            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 transition disabled:opacity-40">
                            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {/* Detail modal */}
            {detailParcel && (
                <ParcelDetailModal parcel={detailParcel} onClose={() => setDetailParcel(null)} />
            )}
        </div>
    );
}