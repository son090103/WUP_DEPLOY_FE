import { useState, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Loader2, AlertCircle, ArrowLeft, Users, Bus, MapPin, Clock,
    CheckCircle2, XCircle, UserCheck, UserX, ChevronRight, X,
    Navigation, Phone, Mail, CreditCard, Armchair, LogOut,
    Package, RefreshCw, Weight, PackageCheck, PackageX, Truck,
} from "lucide-react";

/* ═══════════════════════════════════════════════════════════════════
   TYPES
═══════════════════════════════════════════════════════════════════ */
interface StartEndInfo { city: string; specific_location: string; }
interface Driver {
    name: string; phone: string; status: string;
    shiftStart: string | null; shiftEnd: string | null;
    actualShiftStart: string | null; actualShiftEnd: string | null;
}
interface TripDetail {
    _id: string; departureTime: string; arrivalTime: string; date: string;
    departureLocation: string; departureProvince: string;
    arrivalLocation: string; arrivalProvince: string;
    duration: string; distance: number | null;
    vehicleType: string; licensePlate: string;
    totalSeats: number; totalSeatsBooked: number; totalPassengers: number;
    status: string; drivers: Driver[];
}
interface Passenger {
    _id: string;           // ID ảo dùng cho UI (key, loading state)
    order_id: string;      // ID thật của BookingOrder - dùng để gọi API PATCH
    passenger_name: string;
    passenger_phone: string;
    passenger_email: string | null;
    seat_labels: string[];
    total_price: number;
    order_status: "CREATED" | "PAID" | "CANCELLED";
    is_boarded: boolean;
    boarded_at: string | null;
    is_alighted: boolean;
    alighted_at: string | null;
    start_info: StartEndInfo;
    end_info: StartEndInfo;
    boarded_updated: boolean;
    created_at: string;
}
interface Parcel {
    _id: string;
    code: string;
    receiver_name: string;
    receiver_phone: string;
    weight_kg: number;
    parcel_type: string | null;
    total_price: number;
    status: "RECEIVED" | "ON_BUS" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
    approval_status: string;
    payment_method: string;
    payment_status: string;
    start_province: string;
    start_name: string;
    end_province: string;
    end_name: string;
    pickup_location: string | null;
    dropoff_location: string | null;
    created_at: string;
}

/* ═══════════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════════ */
const TRIP_STATUS: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Sắp khởi hành", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    RUNNING: { label: "Đang chạy", color: "bg-blue-100 text-blue-700 border-blue-200" },
    FINISHED: { label: "Hoàn thành", color: "bg-green-100 text-green-700 border-green-200" },
    CANCELLED: { label: "Đã hủy", color: "bg-red-100 text-red-600 border-red-200" },
};
const ORDER_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    CREATED: { label: "Chờ TT", color: "bg-yellow-100 text-yellow-700", icon: <Clock size={11} /> },
    PAID: { label: "Đã TT", color: "bg-green-100 text-green-700", icon: <CheckCircle2 size={11} /> },
    CANCELLED: { label: "Đã huỷ", color: "bg-slate-100 text-slate-500", icon: <XCircle size={11} /> },
};
const DRIVER_STATUS: Record<string, { label: string; color: string }> = {
    PENDING: { label: "Chờ", color: "bg-yellow-100 text-yellow-700" },
    RUNNING: { label: "Đang lái", color: "bg-blue-100 text-blue-700" },
    DONE: { label: "Xong", color: "bg-green-100 text-green-700" },
};
const PARCEL_STATUS: Record<string, { label: string; color: string; bar: string; rowBg: string }> = {
    RECEIVED: { label: "Chờ lên xe", color: "bg-yellow-100 text-yellow-700 border-yellow-200", bar: "bg-yellow-400", rowBg: "bg-gray-50" },
    ON_BUS: { label: "Trên xe", color: "bg-blue-100 text-blue-700 border-blue-200", bar: "bg-blue-400", rowBg: "bg-blue-50" },
    IN_TRANSIT: { label: "Đang giao", color: "bg-indigo-100 text-indigo-700 border-indigo-200", bar: "bg-indigo-400", rowBg: "bg-indigo-50" },
    DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700 border-green-200", bar: "bg-green-400", rowBg: "bg-green-50" },
    CANCELLED: { label: "Không nhận", color: "bg-slate-100 text-slate-500 border-slate-200", bar: "bg-slate-300", rowBg: "bg-gray-50 opacity-60" },
};

const API_BASE = import.meta.env.VITE_API_URL;

/* ═══════════════════════════════════════════════════════════════════
   SHARED ATOMS
═══════════════════════════════════════════════════════════════════ */
function InfoRow({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
    return (
        <div className="flex items-start gap-3 py-3 border-b border-slate-100">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">{icon}</div>
            <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                <p className="text-sm font-semibold text-slate-800">{value}</p>
                {sub && <p className="text-xs text-slate-400">{sub}</p>}
            </div>
        </div>
    );
}

function LocationBox({ color, label, city, detail }: { color: "green" | "orange"; label: string; city?: string; detail?: string }) {
    const g = color === "green";
    return (
        <div className={`rounded-2xl overflow-hidden border-2 ${g ? "border-green-200" : "border-orange-200"}`}>
            <div className={`flex items-center gap-2 px-4 py-2.5 ${g ? "bg-green-50 border-b border-green-200" : "bg-orange-50 border-b border-orange-200"}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black flex-shrink-0 ${g ? "bg-green-500" : "bg-orange-500"}`}>
                    {g ? "A" : "B"}
                </div>
                <span className={`text-xs font-bold uppercase tracking-wider ${g ? "text-green-700" : "text-orange-700"}`}>{label}</span>
            </div>
            <div className="px-4 py-3 bg-white space-y-0.5">
                {city ? (
                    <>
                        <p className={`text-sm font-bold flex items-center gap-1.5 ${g ? "text-green-900" : "text-orange-900"}`}>
                            {g ? <MapPin size={13} className="text-green-500 flex-shrink-0" /> : <Navigation size={13} className="text-orange-500 flex-shrink-0" />}
                            {city}
                        </p>
                        {detail && <p className={`text-xs ml-5 ${g ? "text-green-600" : "text-orange-600"}`}>{detail}</p>}
                    </>
                ) : <p className="text-sm text-slate-400 italic">Chưa có thông tin</p>}
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   PASSENGER DETAIL MODAL
═══════════════════════════════════════════════════════════════════ */
function PassengerDetailModal({ passenger, onClose }: { passenger: Passenger; onClose: () => void }) {
    const stCfg = ORDER_STATUS[passenger.order_status] ?? ORDER_STATUS.CREATED;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-white font-black text-lg">{passenger.passenger_name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                                {stCfg.icon} {stCfg.label}
                            </span>
                            {passenger.is_boarded && !passenger.is_alighted && (
                                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-green-400/30 text-white">
                                    <UserCheck size={11} /> Đã lên xe
                                </span>
                            )}
                            {passenger.is_alighted && (
                                <span className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-400/30 text-white">
                                    <LogOut size={11} /> Đã xuống xe
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                        <X size={18} className="text-white" />
                    </button>
                </div>
                <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
                    <div className="flex items-center gap-2 flex-wrap">
                        {passenger.seat_labels.map((s) => (
                            <span key={s} className="flex items-center gap-1 bg-orange-500 text-white text-sm font-black px-3 py-1.5 rounded-xl">
                                <Armchair size={13} /> {s}
                            </span>
                        ))}
                    </div>
                    <InfoRow icon={<Phone size={15} />} label="Số điện thoại" value={passenger.passenger_phone || "—"} />
                    {passenger.passenger_email && <InfoRow icon={<Mail size={15} />} label="Email" value={passenger.passenger_email} />}
                    <InfoRow icon={<CreditCard size={15} />} label="Tổng tiền" value={`${passenger.total_price.toLocaleString("vi-VN")} ₫`} />
                    <LocationBox color="green" label="Điểm đón" city={passenger.start_info?.city} detail={passenger.start_info?.specific_location} />
                    <LocationBox color="orange" label="Điểm trả" city={passenger.end_info?.city} detail={passenger.end_info?.specific_location} />
                    {passenger.boarded_at && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-xl border border-green-200">
                            <UserCheck size={13} className="text-green-500" />
                            <span className="text-xs text-green-700 font-semibold">
                                Lên xe lúc: {new Date(passenger.boarded_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    )}
                    {passenger.alighted_at && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-200">
                            <LogOut size={13} className="text-blue-500" />
                            <span className="text-xs text-blue-700 font-semibold">
                                Xuống xe lúc: {new Date(passenger.alighted_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   PARCEL DETAIL MODAL (giữ nguyên)
═══════════════════════════════════════════════════════════════════ */
function ParcelDetailModal({ parcel, onClose }: { parcel: Parcel; onClose: () => void }) {
    const cfg = PARCEL_STATUS[parcel.status] ?? PARCEL_STATUS.RECEIVED;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
                <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-5 flex items-center justify-between">
                    <div>
                        <p className="text-white font-black text-lg font-mono">{parcel.code}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">{cfg.label}</span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white">{parcel.approval_status}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all">
                        <X size={18} className="text-white" />
                    </button>
                </div>
                <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto">
                    <InfoRow icon={<Users size={15} />} label="Người nhận" value={parcel.receiver_name} sub={parcel.receiver_phone} />
                    <InfoRow icon={<Weight size={15} />} label="Hàng hóa" value={`${parcel.weight_kg.toLocaleString()} kg`} sub={parcel.parcel_type ?? undefined} />
                    <InfoRow icon={<CreditCard size={15} />} label="Tổng tiền" value={`${parcel.total_price.toLocaleString("vi-VN")} ₫`} sub={`${parcel.payment_method} · ${parcel.payment_status}`} />
                    <LocationBox color="green" label="Điểm gửi" city={parcel.pickup_location ?? `${parcel.start_name} (${parcel.start_province})`} />
                    <LocationBox color="orange" label="Điểm nhận" city={parcel.dropoff_location ?? `${parcel.end_name} (${parcel.end_province})`} />
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */
export function ChiTietChuyenDi() {
    const location = useLocation();
    const navigate = useNavigate();
    const tripId = (location.state as { tripId?: string } | null)?.tripId;

    const [trip, setTrip] = useState<TripDetail | null>(null);
    const [passengers, setPassengers] = useState<Passenger[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [detailPassenger, setDetailPassenger] = useState<Passenger | null>(null);

    const [activeTab, setActiveTab] = useState<"passenger" | "parcel">("passenger");
    const [parcels, setParcels] = useState<Parcel[]>([]);
    const [parcelsLoading, setParcelsLoading] = useState(false);
    const [parcelsError, setParcelsError] = useState<string | null>(null);
    const [detailParcel, setDetailParcel] = useState<Parcel | null>(null);
    const [updatingParcelId, setUpdatingParcelId] = useState<string | null>(null);

    const token = localStorage.getItem("accessToken");

    /* ── Fetch trip + passengers ────────────────────────────────────── */
    useEffect(() => {
        if (!tripId) {
            setError("Không tìm thấy ID chuyến");
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await fetch(`${API_BASE}/api/assistant/check/trips/${tripId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const json = await res.json();
                if (!res.ok || !json.success) throw new Error(json.message || "Lỗi tải dữ liệu");

                setTrip(json.data.trip);
                setPassengers((json.data.passengers || []).map((p: any) => ({
                    ...p,
                    is_alighted: p.is_alighted ?? false,
                    alighted_at: p.alighted_at ?? null,
                    boarded_updated: p.is_boarded === true,
                })));
            } catch (e: unknown) {
                setError(e instanceof Error ? e.message : "Lỗi kết nối");
            } finally {
                setLoading(false);
            }
        })();
    }, [tripId, token]);

    /* ── Fetch parcels ──────────────────────────────────────────────── */
    const fetchParcels = useCallback(async () => {
        if (!tripId) return;
        setParcelsLoading(true);
        setParcelsError(null);
        try {
            const res = await fetch(`${API_BASE}/api/assistant/check/trips/${tripId}/parcels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const json: { success: boolean; data?: Parcel[]; message?: string } = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message ?? "Lỗi tải hàng hóa");
            setParcels(json.data ?? []);
        } catch (e: unknown) {
            setParcelsError(e instanceof Error ? e.message : "Lỗi kết nối");
        } finally {
            setParcelsLoading(false);
        }
    }, [tripId, token]);

    useEffect(() => {
        if (activeTab === "parcel") fetchParcels();
    }, [activeTab, fetchParcels]);

    /* ── Patch parcel status ────────────────────────────────────────── */
    const patchParcelStatus = async (parcelId: string, newStatus: Parcel["status"], key: string) => {
        if (updatingParcelId) return;
        setUpdatingParcelId(parcelId + key);
        try {
            const res = await fetch(`${API_BASE}/api/assistant/check/parcels/${parcelId}/status`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: newStatus }),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Cập nhật thất bại");
            setParcels((prev) => prev.map((p) => p._id === parcelId ? { ...p, status: newStatus } : p));
            setDetailParcel((prev) => prev?._id === parcelId ? { ...prev, status: newStatus } : prev);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi");
        } finally {
            setUpdatingParcelId(null);
        }
    };

    /* ── Patch passenger (ĐÃ SỬA CHO 1 NGƯỜI 1 GHẾ) ─────────────────── */
    const patchBoarded = async (orderId: string, rowId: string, body: object, patch: Partial<Passenger>) => {
        if (updatingId) return;
        setUpdatingId(rowId);                    // Dùng rowId (ID ảo) để hiển thị loading
        try {
            const res = await fetch(`${API_BASE}/api/assistant/check/bookings/${orderId}/boarded`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(body),
            });
            const json = await res.json();
            if (!res.ok || !json.success) throw new Error(json.message || "Cập nhật thất bại");

            setPassengers((prev) => prev.map((p) =>
                p._id === rowId ? { ...p, ...patch } : p
            ));
            setDetailPassenger((prev) =>
                prev?._id === rowId ? { ...prev, ...patch } : prev
            );
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi");
        } finally {
            setUpdatingId(null);
        }
    };

    const handleBoarded = (p: Passenger) =>
        patchBoarded(p.order_id, p._id, { is_boarded: true },
            { is_boarded: true, boarded_updated: true, boarded_at: new Date().toISOString(), is_alighted: false, alighted_at: null });

    const handleAbsent = (p: Passenger) =>
        patchBoarded(p.order_id, p._id, { is_boarded: false },
            { is_boarded: false, boarded_updated: true, boarded_at: null, is_alighted: false, alighted_at: null });

    const handleAlight = (p: Passenger) =>
        patchBoarded(p.order_id, p._id, { is_boarded: true, is_alighted: true },
            { is_boarded: true, boarded_updated: true, is_alighted: true, alighted_at: new Date().toISOString() });

    const handleUndoAbsent = (p: Passenger) =>
        patchBoarded(p.order_id, p._id, { is_boarded: true },
            { is_boarded: true, boarded_updated: true, boarded_at: new Date().toISOString(), is_alighted: false, alighted_at: null });

    /* ── Derived ─────────────────────────────────────────────────────── */
    const boardedCount = passengers.filter((p) => p.is_boarded).length;
    const notBoardedCount = passengers.filter((p) => !p.is_boarded && p.order_status !== "CANCELLED").length;
    const filtered = passengers.filter((p) =>
        p.passenger_name.toLowerCase().includes(search.toLowerCase()) ||
        p.passenger_phone.includes(search) ||
        p.seat_labels.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );
    const totalParcelWeight = parcels.reduce((s, p) => s + p.weight_kg, 0);
    const onBusCount = parcels.filter((p) => p.status === "ON_BUS").length;
    const deliveredCount = parcels.filter((p) => p.status === "DELIVERED").length;

    /* ── Guards ──────────────────────────────────────────────────────── */
    if (loading) return (
        <div className="flex items-center justify-center py-24 gap-3">
            <Loader2 size={30} className="animate-spin text-orange-500" />
            <span className="text-gray-400 font-medium">Đang tải chi tiết...</span>
        </div>
    );
    if (error || !trip) return (
        <div className="flex flex-col items-center py-20 gap-3 text-center">
            <AlertCircle size={36} className="text-red-300" />
            <p className="text-gray-500 font-semibold">{error || "Không tìm thấy chuyến"}</p>
            <button onClick={() => navigate(-1)} className="px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Quay lại</button>
        </div>
    );

    const tripStCfg = TRIP_STATUS[trip.status] ?? TRIP_STATUS.SCHEDULED;
    const canUpdate = ["SCHEDULED", "RUNNING"].includes(trip.status);

    return (
        <div className="space-y-6">
            {detailPassenger && <PassengerDetailModal passenger={detailPassenger} onClose={() => setDetailPassenger(null)} />}
            {detailParcel && <ParcelDetailModal parcel={detailParcel} onClose={() => setDetailParcel(null)} />}

            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-orange-600 transition-colors">
                <ArrowLeft size={16} /> Quay lại danh sách
            </button>

            {/* ── Trip card ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-5">
                <div className="flex items-start justify-between flex-wrap gap-3">
                    <h2 className="text-xl font-extrabold text-gray-800">Chi tiết chuyến</h2>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${tripStCfg.color}`}>{tripStCfg.label}</span>
                </div>
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="text-center min-w-[90px]">
                        <p className="text-3xl font-black text-gray-900">{trip.departureTime}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{trip.departureLocation}</p>
                        <p className="text-xs text-gray-400">{trip.departureProvince}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-4 min-w-[100px]">
                        <div className="flex items-center w-full gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
                            <div className="flex-1 h-px bg-gradient-to-r from-green-400 to-orange-400" />
                            <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="font-semibold text-gray-600">{trip.duration}</span>
                            {trip.distance && <><span>·</span><span>{trip.distance} km</span></>}
                        </div>
                    </div>
                    <div className="text-center min-w-[90px]">
                        <p className="text-3xl font-black text-gray-900">{trip.arrivalTime}</p>
                        <p className="text-sm font-semibold text-gray-700 mt-0.5">{trip.arrivalLocation}</p>
                        <p className="text-xs text-gray-400">{trip.arrivalProvince}</p>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: <Clock size={14} />, label: "Ngày", value: trip.date },
                        { icon: <Bus size={14} />, label: "Loại xe", value: trip.vehicleType },
                        { icon: <MapPin size={14} />, label: "Biển số", value: trip.licensePlate },
                        { icon: <Users size={14} />, label: "Ghế đã đặt", value: `${trip.totalSeatsBooked} / ${trip.totalSeats}` },
                    ].map(({ icon, label, value }) => (
                        <div key={label} className="bg-gray-50 rounded-2xl p-3">
                            <div className="flex items-center gap-1.5 text-gray-400 mb-1">{icon}<span className="text-xs">{label}</span></div>
                            <p className="font-bold text-gray-800 text-sm">{value}</p>
                        </div>
                    ))}
                </div>
                {trip.drivers.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-400 uppercase">Lái xe</p>
                        <div className="flex flex-wrap gap-2">
                            {trip.drivers.map((d, i) => {
                                const dCfg = DRIVER_STATUS[d.status] ?? DRIVER_STATUS.PENDING;
                                return (
                                    <div key={i} className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2">
                                        <span className="text-sm font-bold text-gray-800">🚗 {d.name}</span>
                                        {d.phone && <span className="text-xs text-gray-400">{d.phone}</span>}
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${dCfg.color}`}>{dCfg.label}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* ── Tab Panel ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-3xl border shadow-sm p-6 space-y-4">

                {/* Switcher */}
                <div className="flex items-center gap-2 flex-wrap">
                    {(["passenger", "parcel"] as const).map((tab) => {
                        const isActive = activeTab === tab;
                        const count = tab === "passenger" ? passengers.length : parcels.length > 0 ? parcels.length : null;
                        return (
                            <button key={tab} onClick={() => setActiveTab(tab)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all ${isActive ? "bg-orange-500 text-white shadow-md" : "bg-gray-100 text-gray-500 hover:bg-orange-50 hover:text-orange-600"
                                    }`}
                            >
                                {tab === "passenger" ? <Users size={15} /> : <Package size={15} />}
                                {tab === "passenger" ? "Khách hàng" : "Hàng hóa"}
                                {count !== null && (
                                    <span className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${isActive ? "bg-white/25 text-white" : "bg-gray-200 text-gray-500"}`}>
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* ═══ PASSENGER ════════════════════════════════════════════ */}
                {activeTab === "passenger" && (
                    <>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Users size={18} className="text-orange-500" />
                                <h3 className="text-lg font-extrabold text-gray-800">Danh sách hành khách</h3>
                                <span className="bg-orange-100 text-orange-700 text-xs font-black px-2 py-0.5 rounded-full">{passengers.length} người</span>
                            </div>
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm tên, SĐT, số ghế..."
                                className="px-4 py-2 rounded-xl border-2 border-gray-200 text-sm focus:outline-none focus:border-orange-400 w-52" />
                        </div>

                        {passengers.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl flex-wrap">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm font-bold text-green-700">Đã lên xe: {boardedCount}</span></div>
                                <div className="w-px h-4 bg-gray-300" />
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-gray-300" /><span className="text-sm font-bold text-gray-500">Chưa lên: {notBoardedCount}</span></div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
                                    <div className="h-full bg-gradient-to-r from-green-400 to-green-500 transition-all duration-500"
                                        style={{ width: `${Math.round((boardedCount / passengers.length) * 100)}%` }} />
                                </div>
                                <span className="text-xs font-black text-gray-500">{Math.round((boardedCount / passengers.length) * 100)}%</span>
                            </div>
                        )}

                        {filtered.length === 0 && (
                            <div className="py-12 text-center text-gray-400 font-semibold">
                                {passengers.length === 0 ? "Chưa có hành khách đặt vé" : "Không tìm thấy hành khách"}
                            </div>
                        )}

                        <div className="space-y-2">
                            {filtered.map((p, idx) => {
                                const stCfg = ORDER_STATUS[p.order_status] ?? ORDER_STATUS.CREATED;
                                const isCancelled = p.order_status === "CANCELLED";
                                const isUpdOn = updatingId === p._id + "_on";
                                const isUpdOff = updatingId === p._id + "_off";
                                const isUpdAlight = updatingId === p._id + "_alight";
                                const isUpdAny = isUpdOn || isUpdOff || isUpdAlight;
                                const showInit = canUpdate && !isCancelled && !p.boarded_updated;
                                const showOnBoard = canUpdate && !isCancelled && p.is_boarded && !p.is_alighted;
                                const showAlight = !isCancelled && p.is_boarded && p.is_alighted;
                                const showUndo = canUpdate && !isCancelled && p.boarded_updated && !p.is_boarded && !p.is_alighted;
                                return (
                                    <div key={p._id} className={`rounded-2xl transition-all border ${p.is_alighted ? "bg-blue-50 border-blue-200"
                                        : p.is_boarded ? "bg-green-50 border-green-200"
                                            : p.boarded_updated && !p.is_boarded ? "bg-red-50/60 border-red-100"
                                                : isCancelled ? "bg-gray-50 opacity-50 border-gray-100"
                                                    : "bg-gray-50 hover:bg-orange-50/40 border-transparent"
                                        }`}>
                                        <div className="flex items-center gap-3 p-4 flex-wrap">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0 ${p.is_alighted ? "bg-blue-200 text-blue-700" : p.is_boarded ? "bg-green-200 text-green-700"
                                                : p.boarded_updated && !p.is_boarded ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-600"
                                                }`}>
                                                {p.is_alighted ? <LogOut size={15} /> : p.is_boarded ? <UserCheck size={15} /> : p.boarded_updated ? <UserX size={15} /> : idx + 1}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-bold text-gray-800 truncate">{p.passenger_name}</p>
                                                <p className="text-xs text-gray-400">{p.passenger_phone}</p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-wrap">
                                                {p.seat_labels.map((s) => (
                                                    <span key={s} className={`text-[11px] font-black px-2 py-0.5 rounded-md ${p.is_alighted ? "bg-blue-500 text-white" : p.is_boarded ? "bg-green-500 text-white"
                                                        : p.boarded_updated && !p.is_boarded ? "bg-red-400 text-white" : "bg-orange-500 text-white"
                                                        }`}>{s}</span>
                                                ))}
                                            </div>
                                            <p className="font-black text-orange-600 text-sm whitespace-nowrap">{p.total_price.toLocaleString("vi-VN")}₫</p>
                                            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${stCfg.color}`}>{stCfg.icon} {stCfg.label}</span>
                                            <button onClick={() => setDetailPassenger(p)}
                                                className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-xl hover:bg-orange-100 transition-all active:scale-95">
                                                Chi tiết <ChevronRight size={12} />
                                            </button>
                                        </div>
                                        {(showInit || showOnBoard || showAlight || showUndo) && (
                                            <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                                                {showInit && (
                                                    <>
                                                        <button onClick={() => handleBoarded(p)} disabled={isUpdAny}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-green-400 bg-white text-green-600 hover:bg-green-500 hover:text-white transition-all disabled:opacity-60">
                                                            {isUpdOn ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />} Đã lên xe
                                                        </button>
                                                        <button onClick={() => handleAbsent(p)} disabled={isUpdAny}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-red-300 bg-white text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-60">
                                                            {isUpdOff ? <Loader2 size={13} className="animate-spin" /> : <UserX size={13} />} Vắng mặt
                                                        </button>
                                                    </>
                                                )}
                                                {showOnBoard && (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                            <UserCheck size={11} /> Đã lên xe
                                                            {p.boarded_at && <span className="text-green-500 ml-1">· {new Date(p.boarded_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
                                                        </span>
                                                        <button onClick={() => handleAlight(p)} disabled={isUpdAny}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-slate-300 bg-white text-slate-600 hover:bg-blue-50 hover:border-blue-400 hover:text-blue-600 transition-all disabled:opacity-60">
                                                            {isUpdAlight ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />} Xuống xe
                                                        </button>
                                                    </div>
                                                )}
                                                {showAlight && (
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                            <UserCheck size={11} /> Lên {p.boarded_at && <span className="ml-1 text-green-500">· {new Date(p.boarded_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
                                                        </span>
                                                        <span className="text-gray-300">→</span>
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                                            <LogOut size={11} /> Xuống {p.alighted_at && <span className="ml-1 text-blue-500">· {new Date(p.alighted_at).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>}
                                                        </span>
                                                    </div>
                                                )}
                                                {showUndo && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">
                                                            <UserX size={11} /> Vắng mặt
                                                        </span>
                                                        <button onClick={() => handleUndoAbsent(p)} disabled={isUpdAny}
                                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-slate-300 bg-white text-slate-600 hover:bg-green-50 hover:border-green-400 hover:text-green-600 transition-all disabled:opacity-60">
                                                            {isUpdOn ? <Loader2 size={13} className="animate-spin" /> : <UserCheck size={13} />} Hoàn tác
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {passengers.length > 0 && (
                            <div className="pt-3 border-t flex items-center justify-between text-sm flex-wrap gap-2">
                                <span className="text-gray-400">
                                    Tổng: <span className="font-bold text-gray-700">{passengers.length} hành khách</span>
                                    &nbsp;·&nbsp;<span className="font-bold text-green-600">{boardedCount} đã lên xe</span>
                                    &nbsp;·&nbsp;<span className="font-bold text-red-500">{notBoardedCount} vắng</span>
                                </span>
                                <span className="font-black text-orange-600">
                                    {passengers.filter((p) => p.order_status !== "CANCELLED").reduce((s, p) => s + p.total_price, 0).toLocaleString("vi-VN")}₫
                                </span>
                            </div>
                        )}
                    </>
                )}

                {/* ═══ PARCEL ═══════════════════════════════════════════════ */}
                {activeTab === "parcel" && (
                    <>
                        <div className="flex items-center justify-between flex-wrap gap-3">
                            <div className="flex items-center gap-2 flex-wrap">
                                <Package size={18} className="text-orange-500" />
                                <h3 className="text-lg font-extrabold text-gray-800">Danh sách hàng hóa</h3>
                                {parcels.length > 0 && (
                                    <span className="bg-orange-100 text-orange-700 text-xs font-black px-2 py-0.5 rounded-full">
                                        {parcels.length} kiện · {totalParcelWeight.toLocaleString()} kg
                                    </span>
                                )}
                            </div>
                            <button onClick={fetchParcels} disabled={parcelsLoading}
                                className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 border border-orange-200 bg-white px-3 py-1.5 rounded-full hover:bg-orange-50 disabled:opacity-50 transition">
                                <RefreshCw size={13} className={parcelsLoading ? "animate-spin" : ""} /> Làm mới
                            </button>
                        </div>

                        {/* Progress */}
                        {parcels.length > 0 && (
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl flex-wrap">
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-400" /><span className="text-sm font-bold text-blue-700">Trên xe: {onBusCount}</span></div>
                                <div className="w-px h-4 bg-gray-300" />
                                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-sm font-bold text-green-700">Đã giao: {deliveredCount}</span></div>
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden min-w-[80px]">
                                    <div className="h-full bg-gradient-to-r from-blue-400 to-green-400 transition-all duration-500"
                                        style={{ width: `${Math.round(((onBusCount + deliveredCount) / parcels.length) * 100)}%` }} />
                                </div>
                                <span className="text-xs font-black text-gray-500">{Math.round(((onBusCount + deliveredCount) / parcels.length) * 100)}%</span>
                            </div>
                        )}

                        {parcelsLoading ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <Loader2 size={28} className="animate-spin text-orange-500" />
                                <p className="text-sm text-gray-400">Đang tải danh sách hàng hóa...</p>
                            </div>
                        ) : parcelsError ? (
                            <div className="flex flex-col items-center py-14 gap-3 text-center">
                                <AlertCircle size={32} className="text-red-300" />
                                <p className="text-gray-500 font-semibold text-sm">{parcelsError}</p>
                                <button onClick={fetchParcels} className="px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600">Thử lại</button>
                            </div>
                        ) : parcels.length === 0 ? (
                            <div className="flex flex-col items-center py-14 gap-3 text-center">
                                <Package size={44} className="text-gray-200" />
                                <p className="text-gray-400 font-semibold">Chưa có hàng hóa nào trên chuyến này</p>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-2">
                                    {parcels.map((parcel) => {
                                        const cfg = PARCEL_STATUS[parcel.status] ?? PARCEL_STATUS.RECEIVED;
                                        const isCancelled = parcel.status === "CANCELLED";
                                        const isDelivered = parcel.status === "DELIVERED";
                                        const isOnBus = parcel.status === "ON_BUS";
                                        const isReceived = parcel.status === "RECEIVED";

                                        const isUpdOnBus = updatingParcelId === parcel._id + "_onbus";
                                        const isUpdDeliver = updatingParcelId === parcel._id + "_deliver";
                                        const isUpdNo = updatingParcelId === parcel._id + "_no";
                                        const isUpdAny = isUpdOnBus || isUpdDeliver || isUpdNo;

                                        return (
                                            <div key={String(parcel._id)}
                                                className={`rounded-2xl transition-all border overflow-hidden ${cfg.rowBg} ${isCancelled ? "border-slate-200" : isDelivered ? "border-green-200"
                                                    : isOnBus ? "border-blue-200" : "border-transparent hover:border-orange-200"
                                                    }`}
                                            >
                                                <div className={`h-1 ${cfg.bar}`} />
                                                <div className="flex items-center gap-3 p-4 flex-wrap">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDelivered ? "bg-green-200" : isOnBus ? "bg-blue-200"
                                                        : isCancelled ? "bg-slate-200" : "bg-amber-100"
                                                        }`}>
                                                        {isDelivered ? <PackageCheck size={15} className="text-green-600" />
                                                            : isCancelled ? <PackageX size={15} className="text-slate-500" />
                                                                : isOnBus ? <Truck size={15} className="text-blue-600" />
                                                                    : <Package size={15} className="text-amber-600" />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="font-black text-gray-800 font-mono text-sm">{parcel.code}</p>
                                                        <p className="text-xs text-gray-400">{parcel.receiver_name} · {parcel.receiver_phone}</p>
                                                    </div>
                                                    <span className="text-xs font-black px-2.5 py-1 rounded-xl bg-amber-100 text-amber-700 whitespace-nowrap">
                                                        {parcel.weight_kg.toLocaleString()} kg
                                                    </span>
                                                    <p className="font-black text-orange-600 text-sm whitespace-nowrap">{parcel.total_price.toLocaleString("vi-VN")}₫</p>
                                                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                                                    <span className="text-xs text-gray-400 hidden sm:inline whitespace-nowrap">
                                                        {parcel.pickup_location ?? parcel.start_province} → {parcel.dropoff_location ?? parcel.end_province}
                                                    </span>
                                                    <button onClick={() => setDetailParcel(parcel)}
                                                        className="flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 px-2.5 py-1.5 rounded-xl hover:bg-orange-100 transition-all active:scale-95 whitespace-nowrap">
                                                        Chi tiết <ChevronRight size={12} />
                                                    </button>
                                                </div>

                                                {/* Action row */}
                                                <div className="flex items-center gap-2 px-4 pb-3 flex-wrap">
                                                    {/* RECEIVED → 2 nút */}
                                                    {canUpdate && isReceived && (
                                                        <>
                                                            <button onClick={() => patchParcelStatus(parcel._id, "ON_BUS", "_onbus")} disabled={isUpdAny}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-blue-400 bg-white text-blue-600 hover:bg-blue-500 hover:text-white transition-all disabled:opacity-60">
                                                                {isUpdOnBus ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={13} />} Đã lên xe
                                                            </button>
                                                            <button onClick={() => patchParcelStatus(parcel._id, "CANCELLED", "_no")} disabled={isUpdAny}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-red-300 bg-white text-red-500 hover:bg-red-500 hover:text-white transition-all disabled:opacity-60">
                                                                {isUpdNo ? <Loader2 size={13} className="animate-spin" /> : <PackageX size={13} />} Không nhận được
                                                            </button>
                                                        </>
                                                    )}

                                                    {/* ON_BUS → badge + nút Trả hàng */}
                                                    {canUpdate && isOnBus && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                                                <Truck size={11} /> Đang trên xe
                                                            </span>
                                                            <button onClick={() => patchParcelStatus(parcel._id, "DELIVERED", "_deliver")} disabled={isUpdAny}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-green-400 bg-white text-green-600 hover:bg-green-500 hover:text-white transition-all disabled:opacity-60">
                                                                {isUpdDeliver ? <Loader2 size={13} className="animate-spin" /> : <PackageCheck size={13} />} Trả hàng
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* DELIVERED → 2 badge */}
                                                    {isDelivered && (
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                                                <Truck size={11} /> Đã lên xe
                                                            </span>
                                                            <span className="text-gray-300">→</span>
                                                            <span className="flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                                                                <PackageCheck size={11} /> Đã giao
                                                            </span>
                                                        </div>
                                                    )}

                                                    {/* CANCELLED → badge */}
                                                    {isCancelled && (
                                                        <span className="flex items-center gap-1 text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                                            <PackageX size={11} /> Không nhận được hàng
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <div className="pt-3 border-t flex items-center justify-between text-sm flex-wrap gap-2">
                                    <span className="text-gray-400">
                                        Tổng: <span className="font-bold text-gray-700">{parcels.length} kiện</span>
                                        &nbsp;·&nbsp;<span className="font-bold text-amber-600">{totalParcelWeight.toLocaleString()} kg</span>
                                        &nbsp;·&nbsp;<span className="font-bold text-blue-600">{onBusCount} trên xe</span>
                                        &nbsp;·&nbsp;<span className="font-bold text-green-600">{deliveredCount} đã giao</span>
                                    </span>
                                    <span className="font-black text-orange-600">
                                        {parcels.reduce((s, p) => s + p.total_price, 0).toLocaleString("vi-VN")}₫
                                    </span>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}