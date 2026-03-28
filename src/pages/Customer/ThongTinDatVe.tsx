import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
    ArrowLeft, Armchair, MapPin, Navigation, Loader2, ArrowRight,
    X, Copy, CheckCircle, Clock, ChevronDown, ChevronUp, User, Users
} from "lucide-react";

/* ================= TYPES ================= */
type SeatStatus = "available" | "selected" | "booked";
type Seat = { id: string; floor: number; row: number; col: number; status: SeatStatus; label: string; };
type StopPoint = {
    _id: string; route_id: string; stop_order: number; is_pickup: boolean;
    stop_id: { _id: string; name: string; province: string; is_active: boolean; location: { type: string; coordinates: number[] }; };
};
type LocationPoint = {
    _id: string; stop_id: string; location_name: string; status: boolean;
    location_type: "PICKUP" | "DROPOFF"; is_active: boolean; location: { type: string; coordinates: number[] };
};
type PassengerInfo = { name: string; phone: string; email: string; };
type RootState = { user: { user: any } };

/* ================= CONFIG ================= */
const BANK_ACCOUNT: string = (import.meta as any).env?.VITE_BANK_ACCOUNT ?? "SO_TAI_KHOAN";
const BANK_NAME: string = (import.meta as any).env?.VITE_BANK_NAME ?? "MBBank";
const API_BASE = import.meta.env.VITE_API_URL;

/* ================= HELPERS ================= */
function decodeJwt(token: string): Record<string, any> | null {
    try { return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
    catch { return null; }
}
function makeTransferContent(orderId: string) { return `DATVE ${orderId}`; }

/* ================= QR IMAGE ================= */
function QRImage({ qrUrl, fallbackUrl }: { qrUrl: string; fallbackUrl: string; transferContent: string }) {
    const [src, setSrc] = useState(qrUrl);
    const [loaded, setLoaded] = useState(false);
    useEffect(() => { setSrc(qrUrl); setLoaded(false); }, [qrUrl]);
    return (
        <div className="relative w-52 h-52 flex items-center justify-center">
            {!loaded && <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-xl gap-2"><Loader2 size={28} className="animate-spin text-orange-400" /><span className="text-[11px] text-slate-400">Đang tạo QR...</span></div>}
            <img src={src} alt="QR" className={`w-52 h-52 object-contain rounded-xl transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
                onLoad={() => setLoaded(true)} onError={() => { if (src !== fallbackUrl) setSrc(fallbackUrl); else setLoaded(true); }} />
        </div>
    );
}

/* ================= QR MODAL ================= */
function QRModal({ orderId, amount, transferContent, onPaid, onClose }: { orderId: string; amount: number; transferContent: string; onPaid: () => void; onClose: () => void; }) {
    const [copied, setCopied] = useState<string | null>(null);
    const [status, setStatus] = useState<"waiting" | "paid" | "timeout">("waiting");
    const [elapsed, setElapsed] = useState(0);
    const TIMEOUT = 10 * 60;
    const onPaidRef = useRef(onPaid);
    useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);
    const qrUrl = `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_NAME}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact&download=false`;
    const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`BankName:${BANK_NAME}|Account:${BANK_ACCOUNT}|Amount:${amount}|Content:${transferContent}`)}&color=1a1a2e&bgcolor=ffffff&margin=10`;
    const copy = (text: string, key: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); }); };
    useEffect(() => {
        if (status !== "waiting") return;
        const interval = setInterval(async () => {
            try {
                const res = await fetch(`${API_BASE}/api/customer/check/payment-status/${orderId}`, { headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` } });
                const data = await res.json();
                if (data?.data?.payment_status === "PAID" || data?.data?.order_status === "PAID") { setStatus("paid"); clearInterval(interval); setTimeout(() => onPaidRef.current(), 1400); }
            } catch { }
        }, 3000);
        return () => clearInterval(interval);
    }, [orderId, status]);
    useEffect(() => {
        if (status !== "waiting") return;
        const t = setInterval(() => { setElapsed(e => { if (e + 1 >= TIMEOUT) { setStatus("timeout"); clearInterval(t); } return e + 1; }); }, 1000);
        return () => clearInterval(t);
    }, [status]);
    const remaining = TIMEOUT - elapsed;
    const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
    const ss = String(remaining % 60).padStart(2, "0");
    const pct = Math.round((elapsed / TIMEOUT) * 100);
    const infoRows = [
        { label: "Ngân hàng", value: BANK_NAME, key: "bank", icon: "🏦" },
        { label: "Số tài khoản", value: BANK_ACCOUNT, key: "acc", icon: "💳" },
        { label: "Số tiền", value: `${amount.toLocaleString("vi-VN")} ₫`, key: "amt", icon: "💰", accent: false },
        { label: "Nội dung CK", value: transferContent, key: "content", icon: "📝", accent: true },
    ];
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-3 lg:p-6">
            <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-[0_32px_80px_rgba(0,0,0,0.28)] overflow-hidden">
                <div className="relative bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
                    <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-2.5 mb-0.5"><div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-sm">📱</div><p className="text-white font-black text-lg">Quét mã chuyển khoản</p></div>
                        <p className="text-orange-100 text-xs font-medium">Hệ thống tự xác nhận sau khi nhận tiền</p>
                    </div>
                    <div className="relative z-10 flex items-center gap-2">
                        {status === "waiting" && <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5"><Clock size={13} className="text-white" /><span className="text-white font-black text-sm tabular-nums">{mm}:{ss}</span></div>}
                        <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-95"><X size={16} className="text-white" /></button>
                    </div>
                </div>
                {status === "waiting" && <div className="h-1 bg-orange-100"><div className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-1000" style={{ width: `${100 - pct}%` }} /></div>}
                {status === "paid" && <div className="flex items-center gap-3 bg-green-500 px-6 py-3"><CheckCircle size={20} className="text-white" /><span className="text-white font-black text-sm">Thanh toán thành công! Đang xác nhận vé... 🎉</span></div>}
                {status === "timeout" && <div className="flex items-center gap-3 bg-red-50 border-b border-red-100 px-6 py-3"><span className="text-lg">⏰</span><div><p className="text-sm font-bold text-red-600">Hết thời gian thanh toán</p><p className="text-xs text-red-400">Đơn vẫn được giữ — liên hệ hỗ trợ nếu đã chuyển khoản.</p></div></div>}
                <div className="flex flex-col sm:flex-row">
                    <div className="flex-shrink-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-orange-50/40 p-6 sm:w-[260px] border-b sm:border-b-0 sm:border-r border-slate-100">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg border-2 border-white" style={{ width: 200, height: 200 }}>
                            {status === "paid" && <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-green-500/95 rounded-2xl gap-2"><CheckCircle size={48} className="text-white" /><span className="text-white font-black text-sm">Đã thanh toán!</span></div>}
                            <QRImage qrUrl={qrUrl} fallbackUrl={fallbackQrUrl} transferContent={transferContent} />
                        </div>
                        <div className="mt-3 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-sm border border-slate-100"><span className="text-xs font-black text-slate-700">{BANK_NAME}</span><span className="text-[10px] text-slate-400">•</span><span className="text-xs font-mono font-bold text-slate-600">{BANK_ACCOUNT}</span></div>
                        {status === "waiting" && <div className="mt-3 flex items-center gap-1.5 text-slate-400 text-[11px]"><span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />Đang chờ xác nhận...</div>}
                    </div>
                    <div className="flex-1 flex flex-col justify-between p-5 gap-3">
                        <div className="space-y-2">
                            {infoRows.map(({ label, value, key, icon, accent }) => (
                                <div key={key} className={`flex items-center justify-between gap-2 rounded-2xl px-3.5 py-3 border ${accent ? "border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50" : "border-slate-100 bg-slate-50/70"}`}>
                                    <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5 mb-0.5"><span className="text-[11px]">{icon}</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span></div><p className={`text-sm font-black truncate leading-tight ${accent ? "text-orange-700" : "text-slate-800"}`}>{value}</p></div>
                                    <button onClick={() => copy(value, key)} className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-all active:scale-95 ${copied === key ? "bg-green-100 text-green-700 border border-green-200" : "bg-white border border-slate-200 text-slate-500 hover:border-orange-300 hover:text-orange-600 shadow-sm"}`}>
                                        {copied === key ? <><CheckCircle size={11} /> OK!</> : <><Copy size={11} /> Sao chép</>}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 flex items-center justify-between">
                            <div><p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Tổng cần chuyển</p><p className="text-white text-2xl font-black leading-tight">{amount.toLocaleString("vi-VN")} ₫</p></div>
                            <div className="text-right"><p className="text-orange-100 text-[10px] font-bold uppercase tracking-wider">Nội dung</p><p className="text-white text-xs font-black font-mono">{transferContent}</p></div>
                        </div>
                        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5">
                            <span className="text-amber-500 text-sm flex-shrink-0 mt-0.5">⚠️</span>
                            <p className="text-[11px] text-amber-700 font-medium leading-relaxed">Nhập <span className="font-black text-amber-800">đúng nội dung chuyển khoản</span> để hệ thống tự kích hoạt vé.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ================= CUSTOMER SECTION ================= */
type CustomerSectionProps = {
    splitMode: boolean;
    setSplitMode: (v: boolean) => void;
    selectedCount: number;
    seatList: string[];
    booker: PassengerInfo;
    setBooker: React.Dispatch<React.SetStateAction<PassengerInfo>>;
    passengers: PassengerInfo[];
    expandedCards: Record<number, boolean>;
    setExpandedCards: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
    updatePassenger: (index: number, field: keyof PassengerInfo, value: string) => void;
    handleEnableSplit: () => void;
    isFormValid: boolean;
};

function CustomerSection({
    splitMode, setSplitMode, selectedCount, seatList,
    booker, setBooker, passengers, expandedCards,
    setExpandedCards, updatePassenger, handleEnableSplit, isFormValid,
}: CustomerSectionProps) {
    return (
        <div className="mx-3 mt-3 lg:mx-0 lg:mt-0 bg-white rounded-2xl lg:rounded-lg shadow-lg border-2 border-orange-200 lg:border-orange-300 overflow-hidden">
            <div className="flex items-center justify-between px-4 lg:px-6 py-3.5 lg:py-4 bg-gradient-to-r from-orange-500 to-orange-600">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><User size={14} className="text-white" /></div>
                    <h2 className="text-base lg:text-lg font-bold text-white">Thông tin hành khách</h2>
                </div>
                {selectedCount > 1 && (
                    <button
                        onClick={() => splitMode ? setSplitMode(false) : handleEnableSplit()}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${splitMode ? "bg-white/20 text-white border-white/30 hover:bg-white/30" : "bg-white text-orange-600 border-transparent hover:bg-orange-50 shadow-sm"}`}
                    >
                        <Users size={13} />
                        {splitMode ? "Gộp lại" : "Thêm người"}
                    </button>
                )}
            </div>

            <div className="p-4 lg:p-6">
                {!splitMode && (
                    <div className="space-y-4">
                        <div className="flex items-start gap-3 px-4 py-3 bg-orange-50 border border-orange-200 rounded-xl">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <User size={15} className="text-orange-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-orange-800">Người đặt vé</p>
                                <p className="text-[11px] text-orange-600 mt-0.5 leading-relaxed">
                                    Áp dụng cho tất cả{" "}
                                    <span className="inline-flex items-center gap-1 font-black">
                                        {seatList.map((s: string) => (
                                            <span key={s} className="bg-orange-200 text-orange-800 px-1.5 py-0.5 rounded text-[10px]">{s}</span>
                                        ))}
                                    </span>
                                    {selectedCount > 1 && <>{" "}· Đặt cho nhiều người? Bấm <span className="font-black">"Thêm người"</span></>}
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="Nhập họ và tên" value={booker.name}
                                    onChange={e => setBooker(p => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                            </div>
                            <div>
                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                <input type="tel" placeholder="Nhập số điện thoại" value={booker.phone}
                                    onChange={e => setBooker(p => ({ ...p, phone: e.target.value }))}
                                    className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                            </div>
                        </div>
                        <div className="mt-4">
                            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email <span className="text-slate-400 font-normal">(nhận thông báo chuyến đi)</span></label>
                            <input type="email" placeholder="Nhập email để nhận xác nhận vé và nhắc lịch" value={booker.email}
                                onChange={e => setBooker(p => ({ ...p, email: e.target.value }))}
                                className="w-full px-3.5 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                        </div>
                    </div>
                )}

                {splitMode && (
                    <div className="space-y-3">
                        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-blue-50 border border-blue-200 rounded-xl mb-1">
                            <Users size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
                            <p className="text-[11px] text-blue-700 font-medium leading-relaxed">
                                Nhập thông tin riêng cho từng ghế. Ghế đầu tiên mặc định là người đặt.
                            </p>
                        </div>

                        {seatList.map((seatLabel: string, index: number) => {
                            const p = passengers[index] ?? { name: "", phone: "", email: "" };
                            const isExpanded = expandedCards[index] !== false;
                            const isFilled = !!(p.name.trim() && p.phone.trim());

                            return (
                                <div key={seatLabel} className={`rounded-2xl border-2 overflow-hidden transition-all duration-200 ${isFilled ? "border-green-200" : "border-slate-200"}`}>
                                    <button
                                        onClick={() => setExpandedCards(prev => ({ ...prev, [index]: !isExpanded }))}
                                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${isFilled ? "bg-green-50 hover:bg-green-100/60" : "bg-slate-50 hover:bg-slate-100/60"}`}
                                    >
                                        <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${isFilled ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"}`}>
                                            {isFilled ? <CheckCircle size={14} /> : index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg ${isFilled ? "bg-green-200 text-green-800" : "bg-orange-100 text-orange-700"}`}>Ghế {seatLabel}</span>
                                                {index === 0 && <span className="text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">Người đặt</span>}
                                            </div>
                                            {p.name.trim()
                                                ? <p className="text-xs font-semibold text-slate-600 truncate mt-0.5">{p.name}{p.phone ? ` · ${p.phone}` : ""}</p>
                                                : <p className="text-xs text-slate-400 italic mt-0.5">Chưa nhập thông tin</p>}
                                        </div>
                                        {isExpanded ? <ChevronUp size={15} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-slate-400 flex-shrink-0" />}
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 py-4 bg-white space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Họ và tên <span className="text-red-500">*</span></label>
                                                    <input type="text" placeholder="Nhập họ và tên" value={p.name}
                                                        onChange={e => updatePassenger(index, "name", e.target.value)}
                                                        className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Số điện thoại <span className="text-red-500">*</span></label>
                                                    <input type="tel" placeholder="Nhập số điện thoại" value={p.phone}
                                                        onChange={e => updatePassenger(index, "phone", e.target.value)}
                                                        className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email <span className="text-slate-400 font-normal">(nhận thông báo chuyến đi)</span></label>
                                                <input type="email" placeholder="Nhập email để nhận xác nhận vé và nhắc lịch" value={p.email}
                                                    onChange={e => updatePassenger(index, "email", e.target.value)}
                                                    className="w-full px-3.5 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all placeholder:text-slate-300" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {!isFormValid && (
                            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-red-50 border border-red-200 rounded-xl">
                                <span className="text-red-500 text-sm">⚠️</span>
                                <p className="text-xs text-red-600 font-medium">Vui lòng điền đầy đủ thông tin cho tất cả hành khách.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ================= MAIN COMPONENT ================= */
export default function BusBookingUI() {
    const location = useLocation();
    const navigate = useNavigate();
    const users = useSelector((state: RootState) => state.user.user);

    const { selectedSeats = [] as string[], selectedSeatLabels = [] as string[], trip = null, pickupPoint = null as StopPoint | null, dropoffPoint = null as StopPoint | null, pickupLocationPoint = null as LocationPoint | null, dropoffLocationPoint = null as LocationPoint | null, ticketPrice = 0 } = location.state || {};

    const seatList: string[] = selectedSeatLabels.length > 0 ? selectedSeatLabels : selectedSeats;
    const selectedCount = seatList.length;
    const totalPrice = selectedCount * ticketPrice;

    const [splitMode, setSplitMode] = useState(false);

    const [booker, setBooker] = useState<PassengerInfo>({
        name: users?.name ?? users?.fullName ?? users?.username ?? "",
        phone: users?.phone ?? users?.phoneNumber ?? "",
        email: "",
    });

    const [passengers, setPassengers] = useState<PassengerInfo[]>(() =>
        seatList.map((_, i) => ({
            name: i === 0 ? (users?.name ?? users?.fullName ?? users?.username ?? "") : "",
            phone: i === 0 ? (users?.phone ?? users?.phoneNumber ?? "") : "",
            email: "",
        }))
    );
    const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>(() =>
        Object.fromEntries(seatList.map((_, i) => [i, true]))
    );

    useEffect(() => {
        if (!users) return;
        const name = users?.name ?? users?.fullName ?? users?.username ?? "";
        const phone = users?.phone ?? users?.phoneNumber ?? "";
        setBooker(prev => ({ name: prev.name || name, phone: prev.phone || phone, email: prev.email }));
        setPassengers(prev => { const next = [...prev]; if (next[0]) next[0] = { name: next[0].name || name, phone: next[0].phone || phone, email: next[0].email }; return next; });
    }, [users]);

    const updatePassenger = (index: number, field: keyof PassengerInfo, value: string) =>
        setPassengers(prev => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });

    const handleEnableSplit = () => {
        setPassengers(prev => { const next = [...prev]; if (next[0]) next[0] = { name: booker.name, phone: booker.phone, email: booker.email }; return next; });
        setSplitMode(true);
    };

    const isFormValid = splitMode
        ? passengers.every(p => p.name.trim() && p.phone.trim())
        : booker.name.trim() !== "" && booker.phone.trim() !== "";

    const [paymentMethod, setPaymentMethod] = useState<"CASH_ON_BOARD" | "ONLINE">("CASH_ON_BOARD");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [showQR, setShowQR] = useState(false);
    const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
    const [showPaymentSuccessToast, setShowPaymentSuccessToast] = useState(false);

    const fmt = (d?: string) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
    const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----";
    const calcDur = (s?: string, e?: string) => s && e ? `~${Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 3600000)} giờ` : "--";

    const startLabel = trip?.route_id?.start_id ? `${trip.route_id.start_id.province} (${trip.route_id.start_id.name})` : "Điểm đi";
    const stopLabel = trip?.route_id?.stop_id ? `${trip.route_id.stop_id.province} (${trip.route_id.stop_id.name})` : "Điểm đến";
    const routeLabel = `${startLabel} → ${stopLabel}`;

    const generateSeats = (floor: number): Seat[] => {
        if (!trip?.bus_id?.seat_layout) return [];
        const { rows, columns, row_overrides } = trip.bus_id.seat_layout;
        const seats: Seat[] = []; let cnt = 1;
        for (let row = 1; row <= rows; row++) {
            const override = row_overrides?.find((r: any) => r.row_index === row && r.floor === floor);
            columns.forEach((col: any, ci: number) => {
                let n = col.seats_per_row;
                if (override) { const c = override.column_overrides.find((c: any) => c.column_name === col.name); if (c) n = c.seats; }
                for (let i = 0; i < n; i++) {
                    const id = `${floor}-${row}-${ci}-${i}`; const label = `A${cnt++}`;
                    const isSelected = selectedSeats.includes(id) || selectedSeatLabels.includes(label);
                    seats.push({ id, floor, row, col: ci, status: isSelected ? "selected" : "available", label });
                }
            });
        }
        return seats;
    };

    const floor1Seats = useMemo(() => generateSeats(1), [trip, selectedSeats, selectedSeatLabels]);
    const groupedSeats = useMemo(() => {
        const g: Record<number, { LEFT: Seat[]; RIGHT: Seat[] }> = {};
        floor1Seats.forEach(s => { if (!g[s.row]) g[s.row] = { LEFT: [], RIGHT: [] }; if (s.col === 0) g[s.row].LEFT.push(s); else g[s.row].RIGHT.push(s); });
        return g;
    }, [floor1Seats]);

    const renderSeat = (seat: Seat) => {
        const status = seat.status;
        const v = {
            available: { detail: "border-green-400 bg-green-50", frame: "border-green-400 bg-white text-green-700", leg: "bg-green-400" },
            selected: { detail: "border-orange-500 bg-orange-100", frame: "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg", leg: "bg-orange-500" },
            booked: { detail: "border-slate-300 bg-slate-100", frame: "border-slate-300 bg-slate-200 text-slate-400", leg: "bg-slate-300" },
        }[status];
        return (
            <div key={seat.id} title={seat.label} className={`relative h-[32px] w-[62px] transition-all duration-300 ${status === "selected" ? "scale-110" : ""}`}>
                <span className={`pointer-events-none absolute left-[13px] top-0.5 h-1.5 w-[35px] rounded-t-[4px] border-[1.5px] border-b-0 ${v.detail}`} />
                <span className={`pointer-events-none absolute left-[7px] top-2 flex h-[14px] w-[48px] items-center justify-center rounded-[4px] border-[1.5px] text-[9px] font-black ${v.frame}`}>{seat.label}</span>
                <span className={`pointer-events-none absolute left-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
                <span className={`pointer-events-none absolute right-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
            </div>
        );
    };

    const createOrder = async (): Promise<string | null> => {
        setErrorMsg(null);
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) { setErrorMsg("Bạn chưa đăng nhập."); return null; }
        const payload = decodeJwt(accessToken);
        const user_id = payload?.id || payload?.userId || payload?._id || payload?.sub;
        if (!user_id) { setErrorMsg("Không xác định được tài khoản."); return null; }
        if (!trip?._id || !pickupPoint?._id || !dropoffPoint?._id) { setErrorMsg("Thiếu thông tin chuyến xe."); return null; }
        const main = splitMode ? passengers[0] : booker;
        const res = await fetch(`${API_BASE}/api/customer/check/create`, {
            method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
            body: JSON.stringify({
                user_id, trip_id: trip._id, start_id: pickupPoint._id, end_id: dropoffPoint._id,
                start_info: { city: pickupPoint?.stop_id?.province ?? "", specific_location: pickupLocationPoint?.location_name ?? "" },
                end_info: { city: dropoffPoint?.stop_id?.province ?? "", specific_location: dropoffLocationPoint?.location_name ?? "" },
                seat_labels: seatList, ticket_price: ticketPrice, payment_method: paymentMethod,
                passenger_name: main.name.trim(), passenger_phone: main.phone.trim(), passenger_email: main.email?.trim() || null,
                passengers: splitMode
                    ? passengers.map((p, i) => ({ seat_label: seatList[i], name: p.name.trim(), phone: p.phone.trim() }))
                    : seatList.map(seat => ({ seat_label: seat, name: booker.name.trim(), phone: booker.phone.trim() })),
            }),
        });
        const data = await res.json();
        if (!res.ok) { setErrorMsg(data.message || "Tạo đơn thất bại."); return null; }
        return data?.data?.order?._id || data?.data?._id || data?.order?._id || null;
    };

    const handleBooking = async () => {
        setIsSubmitting(true);
        try {
            const orderId = await createOrder();
            if (!orderId) return;
            if (paymentMethod === "ONLINE") { setPendingOrderId(orderId); setShowQR(true); }
            else navigate("/user/orderhistory");
        } catch { setErrorMsg("Lỗi kết nối. Vui lòng thử lại."); }
        finally { setIsSubmitting(false); }
    };

    const handlePaymentConfirmed = useCallback(() => {
        setShowQR(false); setShowPaymentSuccessToast(true);
        setTimeout(() => { setShowPaymentSuccessToast(false); navigate("/user/orderhistory"); }, 2200);
    }, []);

    /* ════════════ MAIN VIEW ════════════ */
    return (
        <>
            {showPaymentSuccessToast && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 bg-green-500 text-white px-6 py-3.5 rounded-2xl shadow-2xl animate-bounce">
                    <CheckCircle size={22} /><span className="font-black text-base">Thanh toán thành công! 🎉 Đang chuyển hướng...</span>
                </div>
            )}
            {showQR && pendingOrderId && (
                <QRModal orderId={pendingOrderId} amount={totalPrice} transferContent={makeTransferContent(pendingOrderId)} onPaid={handlePaymentConfirmed} onClose={() => setShowQR(false)} />
            )}

            {/* ===== HERO BANNER ===== */}
            <section className="relative overflow-hidden bg-[#ece7e2] hidden md:block">
                <img src="/images/bg4.png" alt="Hero background" className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none" style={{ maxHeight: "720px" }} />
                <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[96px] bg-gradient-to-b from-[#fefcfb]/90 via-[#fefcfb]/58 to-transparent" />
                <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />
                <div className="pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[18%] md:w-[62%]">
                    <div className="bus-aero-overlay absolute inset-[-16%] z-0">
                        <span className="bus-cloud bus-cloud-1 absolute left-[-10%] top-[-10%] h-[28%] w-[68%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.25)_54%,rgba(255,255,255,0)_100%)] blur-[30px]" />
                        <span className="bus-cloud bus-cloud-2 absolute left-[-20%] top-[28%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                        <span className="bus-cloud bus-cloud-3 absolute right-[-16%] top-[34%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.18)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                        <span className="bus-cloud bus-cloud-4 absolute left-[-16%] top-[66%] h-[30%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.24)_54%,rgba(255,255,255,0)_100%)] blur-[28px]" />
                        <span className="bus-cloud bus-cloud-5 absolute right-[-4%] top-[70%] h-[28%] w-[54%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[26px]" />
                        <span className="bus-cloud bus-cloud-6 absolute left-[4%] top-[90%] h-[16%] w-[72%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.56)_0%,rgba(255,255,255,0.14)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
                    </div>
                    <div className="bus-aero-trail absolute right-[-14%] top-[30%] z-0 h-[54%] w-[46%]">
                        <span className="bus-tail-cloud bus-tail-cloud-1 absolute right-[10%] top-[14%] h-[42%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.48)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                        <span className="bus-tail-cloud bus-tail-cloud-2 absolute right-[28%] top-[28%] h-[38%] w-[32%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.4)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                        <span className="bus-tail-cloud bus-tail-cloud-3 absolute right-[12%] top-[50%] h-[34%] w-[30%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.36)_54%,rgba(255,255,255,0)_100%)] blur-[10px]" />
                        <span className="bus-tail-cloud bus-tail-cloud-4 absolute right-[38%] top-[20%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.32)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                        <span className="bus-tail-cloud bus-tail-cloud-6 absolute right-[24%] top-[44%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
                    </div>
                    <div className="bus-bob relative z-10">
                        <img src="/images/bus7.png" alt="Bus overlay" className="w-full object-contain block relative -top-100" style={{ imageRendering: "auto", filter: "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))" }} />
                        <div className="pointer-events-none absolute inset-0">
                            <div className="bus-front-left-passenger"><img src="/images/loxe1.png" alt="Front passenger" className="bus-front-left-passenger-img" /></div>
                            <div className="bus-driver-fit"><img src="/images/1me1.png" alt="Driver" className="bus-driver-fit-img" /></div>
                        </div>
                    </div>
                </div>
                <div className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center px-4 min-h-[320px] pt-20 pb-6 md:min-h-[680px] md:pt-10 md:pb-24 lg:min-h-[780px] lg:pt-8">
                    <div className="page-enter-copy relative isolate w-full max-w-[760px] space-y-3 md:space-y-6 md:-ml-14 lg:-ml-24">
                        <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 hidden md:block h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />
                        <h1 className="hero-title relative z-10 py-1 font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] text-[34px] sm:text-[48px] md:text-[58px] lg:text-[72px]">
                            <span className="hero-title-line block whitespace-nowrap">Tìm và đặt ngay</span>
                            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap">những chuyến xe</span>
                            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap font-extrabold italic">
                                <span className="text-[#0d142a]">thật</span>{" "}
                                <span className="hero-title-shimmer">Dễ Dàng</span>
                            </span>
                        </h1>
                        <p className="relative z-10 hidden sm:block max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
                            Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ chất lượng cao nhất.
                        </p>
                    </div>
                </div>
            </section>

            {/* Mobile header */}
            <div className="lg:hidden sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm pt-12">
                <div className="flex items-center gap-3 px-4 py-3">
                    <button onClick={() => navigate(-1)} className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center active:scale-95"><ArrowLeft size={16} className="text-orange-500" /></button>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-black text-slate-800 truncate">
                            <span className="truncate">{trip?.route_id?.start_id?.province ?? "Điểm đi"}</span>
                            <ArrowRight size={13} className="text-orange-500 flex-shrink-0" />
                            <span className="truncate">{trip?.route_id?.stop_id?.province ?? "Điểm đến"}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">{fmtDate(trip?.departure_time)} · {fmt(trip?.departure_time)} · {selectedCount} ghế</div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <div className="text-base font-black text-orange-600">{totalPrice.toLocaleString("vi-VN")}₫</div>
                        <div className="text-[10px] text-slate-400">{selectedCount} ghế</div>
                    </div>
                </div>
            </div>

            {/* Main booking section */}
            <div className="relative z-20 bg-gradient-to-br from-white via-gray-50 to-gray-100 pt-[56px] lg:pt-0 pb-28 lg:pb-6 p-0 lg:p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="hidden lg:block mb-8 -mt-20 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-8 rounded-lg shadow-lg">
                        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-orange-100 hover:text-white text-sm font-semibold mb-4"><ArrowLeft size={15} /> Quay lại chọn ghế</button>
                        <h1 className="text-4xl font-bold mb-2">Đặt Vé Xe Khách</h1>
                        <p className="text-orange-100 flex items-center gap-2"><span>📍</span> {routeLabel} • {fmtDate(trip?.departure_time)}</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-0 lg:gap-8">
                        {/* LEFT col */}
                        <div className="lg:col-span-2 space-y-0 lg:space-y-8">

                            {/* Mobile price bar */}
                            <div className="lg:hidden mx-3 mt-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <div><p className="text-[11px] text-orange-100 font-bold uppercase tracking-wider">Tổng tiền</p><p className="text-2xl font-black text-white">{totalPrice.toLocaleString("vi-VN")}₫</p></div>
                                    <div className="text-right"><p className="text-[11px] text-orange-100 font-bold uppercase tracking-wider">Ghế đã chọn</p><div className="flex flex-wrap gap-1 justify-end mt-1">{seatList.map((s: string) => <span key={s} className="bg-white/25 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">{s}</span>)}</div></div>
                                </div>
                                <div className="text-[11px] text-orange-100">{selectedCount} ghế × {ticketPrice.toLocaleString("vi-VN")}₫/ghế</div>
                            </div>

                            {/* Route info */}
                            <div className="mx-3 mt-3 lg:mx-0 lg:mt-0 bg-white rounded-2xl lg:rounded-lg shadow-lg border-2 border-orange-200 lg:border-orange-300 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 lg:px-6 py-3.5 lg:py-4 bg-gradient-to-r from-orange-500 to-orange-600">
                                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center"><MapPin size={14} className="text-white" /></div>
                                    <h2 className="text-base lg:text-lg font-bold text-white">Thông tin lộ trình</h2>
                                </div>
                                <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
                                    {/* Pickup */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black">A</span><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm đón</span></div>
                                        <div className="rounded-xl border-2 border-green-200 bg-green-50 overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-green-100 border-b border-green-200"><div className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-green-700 uppercase">Khu vực</span>{pickupPoint && <span className="ml-auto text-[10px] font-semibold text-green-600 bg-green-200 px-2 py-0.5 rounded-full">Điểm {pickupPoint.stop_order}</span>}</div>
                                            <div className="px-3 py-2.5">{pickupPoint ? <><p className="text-sm font-bold text-green-900">{pickupPoint.stop_id.name}</p><p className="text-xs text-green-600 mt-0.5">{pickupPoint.stop_id.province}</p></> : <p className="text-sm text-slate-400 italic">Chưa có thông tin</p>}</div>
                                        </div>
                                        {pickupLocationPoint && <div className="rounded-xl border-2 border-green-300 bg-white overflow-hidden"><div className="flex items-center gap-2 px-3 py-2 bg-green-50 border-b border-green-200"><MapPin size={11} className="text-green-500" /><span className="text-[10px] font-bold text-green-700 uppercase">Vị trí cụ thể</span></div><div className="px-3 py-2.5"><p className="text-sm font-bold text-slate-800">{pickupLocationPoint.location_name}</p>{pickupLocationPoint.location?.coordinates?.length === 2 && <a href={`https://maps.google.com/?q=${pickupLocationPoint.location.coordinates[1]},${pickupLocationPoint.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-green-600 hover:text-green-700 mt-1"><MapPin size={11} /> Xem trên bản đồ</a>}</div></div>}
                                    </div>
                                    {/* Dropoff */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black">B</span><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm trả</span></div>
                                        <div className="rounded-xl border-2 border-orange-200 bg-orange-50 overflow-hidden">
                                            <div className="flex items-center gap-2 px-3 py-2 bg-orange-100 border-b border-orange-200"><div className="w-2 h-2 rounded-full bg-orange-500" /><span className="text-[10px] font-bold text-orange-700 uppercase">Khu vực</span>{dropoffPoint && <span className="ml-auto text-[10px] font-semibold text-orange-600 bg-orange-200 px-2 py-0.5 rounded-full">Điểm {dropoffPoint.stop_order}</span>}</div>
                                            <div className="px-3 py-2.5">{dropoffPoint ? <><p className="text-sm font-bold text-orange-900">{dropoffPoint.stop_id.name}</p><p className="text-xs text-orange-600 mt-0.5">{dropoffPoint.stop_id.province}</p></> : <p className="text-sm text-slate-400 italic">Chưa có thông tin</p>}</div>
                                        </div>
                                        {dropoffLocationPoint && <div className="rounded-xl border-2 border-orange-300 bg-white overflow-hidden"><div className="flex items-center gap-2 px-3 py-2 bg-orange-50 border-b border-orange-200"><Navigation size={11} className="text-orange-500" /><span className="text-[10px] font-bold text-orange-700 uppercase">Vị trí cụ thể</span></div><div className="px-3 py-2.5"><p className="text-sm font-bold text-slate-800">{dropoffLocationPoint.location_name}</p>{dropoffLocationPoint.location?.coordinates?.length === 2 && <a href={`https://maps.google.com/?q=${dropoffLocationPoint.location.coordinates[1]},${dropoffLocationPoint.location.coordinates[0]}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-orange-600 hover:text-orange-700 mt-1"><MapPin size={11} /> Xem trên bản đồ</a>}</div></div>}
                                    </div>
                                </div>
                                {pickupPoint && dropoffPoint && (
                                    <div className="mx-4 lg:mx-6 mb-4 lg:mb-5 flex items-center gap-3 px-3 py-2.5 bg-gradient-to-r from-green-50 to-orange-50 border-2 border-orange-200 rounded-xl">
                                        <div className="flex items-center gap-2 min-w-0 flex-1"><div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" /><div className="min-w-0"><p className="text-xs font-bold text-green-800 truncate">{pickupPoint.stop_id.name}</p>{pickupLocationPoint && <p className="text-[10px] text-green-600 truncate">{pickupLocationPoint.location_name}</p>}</div></div>
                                        <div className="flex items-center gap-1 flex-shrink-0"><div className="w-10 h-px bg-gradient-to-r from-green-400 to-orange-400" /><div className="text-[10px] font-bold text-slate-500 px-1">{calcDur(trip?.departure_time, trip?.arrival_time)}</div><div className="w-10 h-px bg-gradient-to-r from-orange-400 to-orange-500" /></div>
                                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end"><div className="min-w-0 text-right"><p className="text-xs font-bold text-orange-800 truncate">{dropoffPoint.stop_id.name}</p>{dropoffLocationPoint && <p className="text-[10px] text-orange-600 truncate">{dropoffLocationPoint.location_name}</p>}</div><div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" /></div>
                                    </div>
                                )}
                            </div>

                            {/* Seat map */}
                            <div className="mx-3 mt-3 lg:mx-0 lg:mt-0 bg-white rounded-2xl lg:rounded-lg p-4 lg:p-8 shadow-lg border-2 border-orange-200 lg:border-orange-300">
                                <h2 className="text-lg lg:text-2xl font-bold text-orange-900 mb-4 lg:mb-6">🪑 Sơ đồ chỗ ngồi</h2>
                                {selectedCount > 0 && <div className="mb-4 p-3 lg:p-4 bg-orange-50 border-2 border-orange-200 rounded-xl"><p className="text-xs font-bold text-orange-700 mb-2">✅ Ghế đã chọn ({selectedCount}):</p><div className="flex flex-wrap gap-1.5">{seatList.map((s: string) => <span key={s} className="bg-gradient-to-br from-orange-500 to-orange-600 text-white text-xs font-black px-2.5 py-1 rounded-lg shadow">Ghế {s}</span>)}</div></div>}
                                <div className="flex gap-3 mb-4 lg:mb-8 border-b-2 border-orange-200 pb-3 lg:pb-4"><div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md flex items-center gap-2 text-sm"><Armchair size={15} /> Tầng 1</div></div>
                                {/* Mobile seat map */}
                                <div className="lg:hidden overflow-x-auto bg-slate-50 rounded-xl border-2 border-slate-100">
                                    <div className="min-w-[340px] py-4 px-3"><div className="border-2 border-slate-200 rounded-2xl p-4 bg-white shadow-inner"><div className="text-center text-slate-400 text-xs font-bold mb-5 tracking-widest">🚍 ĐẦU XE</div><div className="flex flex-col gap-5 items-center w-full">{Object.keys(groupedSeats).map(rowKey => { const row = groupedSeats[Number(rowKey)]; if ((row.LEFT.length + row.RIGHT.length) % 2 !== 0) return <div key={rowKey} className="flex justify-center gap-3">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>; return <div key={rowKey} className="grid grid-cols-[1fr_36px_1fr] items-center w-full"><div className="flex justify-end gap-3">{row.LEFT.map(renderSeat)}</div><div /><div className="flex justify-start gap-3">{row.RIGHT.map(renderSeat)}</div></div>; })}</div></div></div>
                                </div>
                                {/* Desktop seat map */}
                                <div className="hidden lg:block bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-10 mb-8 border-2 border-orange-100"><div className="w-full max-w-6xl mx-auto border-2 border-slate-300 rounded-[40px] p-12 bg-white shadow-inner"><div className="text-center text-slate-400 font-bold mb-10 tracking-widest">🚍 ĐẦU XE</div><div className="flex flex-col gap-10 items-center w-full">{Object.keys(groupedSeats).map(rowKey => { const row = groupedSeats[Number(rowKey)]; if ((row.LEFT.length + row.RIGHT.length) % 2 !== 0) return <div key={rowKey} className="flex justify-center gap-6 mb-10">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>; return <div key={rowKey} className="grid grid-cols-[1fr_120px_1fr] items-center mb-10 w-full max-w-3xl mx-auto"><div className="flex justify-end gap-6">{row.LEFT.map(renderSeat)}</div><div /><div className="flex justify-start gap-6">{row.RIGHT.map(renderSeat)}</div></div>; })}</div></div></div>
                                <div className="flex flex-wrap gap-4 text-sm bg-orange-50 p-3 lg:p-6 rounded-xl border-2 border-orange-200 mt-3 lg:mt-0">
                                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-white border-2 border-green-400" /><span className="text-slate-700 font-bold text-xs">Trống</span></div>
                                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-gradient-to-br from-orange-500 to-orange-600" /><span className="text-slate-700 font-bold text-xs">Đã chọn</span></div>
                                    <div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-slate-200 border-2 border-slate-400" /><span className="text-slate-700 font-bold text-xs">Đã bán</span></div>
                                </div>
                            </div>

                            <CustomerSection
                                splitMode={splitMode}
                                setSplitMode={setSplitMode}
                                selectedCount={selectedCount}
                                seatList={seatList}
                                booker={booker}
                                setBooker={setBooker}
                                passengers={passengers}
                                expandedCards={expandedCards}
                                setExpandedCards={setExpandedCards}
                                updatePassenger={updatePassenger}
                                handleEnableSplit={handleEnableSplit}
                                isFormValid={isFormValid}
                            />

                            {/* Payment */}
                            <div className="mx-3 mt-3 lg:mx-0 lg:mt-0 bg-white rounded-2xl lg:rounded-lg p-4 lg:p-8 shadow-lg border-2 border-orange-200 lg:border-orange-300">
                                <h2 className="text-lg lg:text-2xl font-bold text-orange-900 mb-4 lg:mb-6">💳 Phương thức thanh toán</h2>
                                <div className="grid grid-cols-2 gap-3 lg:gap-4">
                                    {[{ value: "CASH_ON_BOARD", label: "Trả tiền trên xe", desc: "Thanh toán khi lên xe", icon: "💵" }, { value: "ONLINE", label: "Chuyển khoản QR", desc: "Quét mã ngay sau khi đặt", icon: "📱" }].map(opt => (
                                        <button key={opt.value} onClick={() => setPaymentMethod(opt.value as any)} className={`flex flex-col lg:flex-row items-start gap-2 lg:gap-4 p-3 lg:p-4 rounded-xl border-2 text-left transition-all active:scale-95 ${paymentMethod === opt.value ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300"}`}>
                                            <span className="text-xl lg:text-2xl">{opt.icon}</span>
                                            <div className="flex-1 min-w-0"><p className={`font-bold text-xs lg:text-sm ${paymentMethod === opt.value ? "text-orange-700" : "text-slate-700"}`}>{opt.label}</p><p className="text-[10px] lg:text-xs text-slate-500 mt-0.5 hidden lg:block">{opt.desc}</p></div>
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 self-center lg:self-start lg:mt-0.5 ${paymentMethod === opt.value ? "border-orange-500 bg-orange-500" : "border-slate-300"}`} />
                                        </button>
                                    ))}
                                </div>
                                {paymentMethod === "ONLINE" && <div className="mt-3 flex items-start gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 rounded-xl"><span className="text-blue-500 mt-0.5">ℹ️</span><p className="text-xs text-blue-700 font-medium">Sau khi bấm xác nhận, mã QR sẽ hiện ra. Hệ thống tự xác nhận khi nhận tiền.</p></div>}
                            </div>

                            {/* Terms */}
                            <div className="mx-3 mt-3 lg:mx-0 lg:mt-0 mb-3 lg:mb-0 bg-gradient-to-br from-orange-50 to-yellow-50 border-2 border-orange-200 lg:border-orange-300 rounded-2xl lg:rounded-lg p-4 lg:p-6 shadow-md">
                                <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-orange-200"><span className="text-xl">📋</span><h3 className="text-base lg:text-lg font-bold text-orange-900">Điều Khoản & Lưu Ý</h3></div>
                                <div className="space-y-3">
                                    {[
                                        { num: "1", icon: "🆔", title: "Chuẩn Bị Giấy Tờ", desc: "Hành khách bắt buộc phải mang theo CMND/CCCD/Hộ chiếu hợp lệ khi lên xe." },
                                        { num: "2", icon: "⏱️", title: "Giờ Khởi Hành", desc: "Xe khởi hành đúng giờ. Có mặt 15 phút trước." },
                                        { num: "3", icon: "📍", title: "Địa Điểm Xuất Phát", desc: "Có mặt tại bến xe ít nhất 30 phút trước giờ khởi hành." },
                                        { num: "4", icon: "🎒", title: "Quy Định Hành Lý", desc: "Tối đa 1 hành lý 50×40×25cm, không quá 15kg. Vượt quá tính phí bổ sung." },
                                        { num: "5", icon: "⚠️", title: "Tài Sản Cá Nhân", desc: "Không chịu trách nhiệm với điện thoại, laptop, tiền bạc, trang sức." },
                                    ].map(item => (
                                        <div key={item.num} className="flex gap-3">
                                            <div className="flex-shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-orange-100 border-2 border-orange-400"><span className="text-orange-600 font-bold text-xs">{item.num}</span></div>
                                            <div><p className="font-bold text-orange-900 text-sm">{item.icon} {item.title}</p><p className="text-xs text-orange-800 mt-0.5">{item.desc}</p></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT sidebar */}
                        <div className="hidden lg:block space-y-8 lg:sticky lg:top-6 h-fit">
                            <div className="bg-gradient-to-br from-orange-50 to-white rounded-lg p-8 shadow-lg border-2 border-orange-200">
                                <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2"><span className="text-2xl">🚌</span> Thông tin chuyến đi</h3>
                                <div className="space-y-4 text-sm">
                                    {[
                                        { label: "Tuyến xe", value: routeLabel }, { label: "Ngày đi", value: fmtDate(trip?.departure_time) },
                                        { label: "Giờ khởi hành", value: fmt(trip?.departure_time) }, { label: "Giờ đến dự kiến", value: fmt(trip?.arrival_time) },
                                        { label: "Thời gian hành trình", value: calcDur(trip?.departure_time, trip?.arrival_time) },
                                        { label: "Loại xe", value: trip?.bus_id?.bus_type_id?.name || "---" }, { label: "Số ghế đã chọn", value: `${selectedCount} ghế` },
                                    ].map(item => (<div key={item.label} className="pb-4 border-b-2 border-orange-100 last:border-0 last:pb-0"><p className="text-orange-600 text-xs font-bold uppercase tracking-wide mb-1">{item.label}</p><p className="font-semibold text-slate-900">{item.value}</p></div>))}
                                    <div className="pb-4 border-b-2 border-orange-100"><p className="text-orange-600 text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-green-500 text-white text-[9px] font-black flex items-center justify-center">A</span> Điểm đón</p>{pickupPoint ? <div><p className="font-semibold text-slate-900">{pickupPoint.stop_id.province} — {pickupPoint.stop_id.name}</p>{pickupLocationPoint && <p className="text-xs text-green-700 font-medium flex items-center gap-1 mt-0.5"><MapPin size={11} />{pickupLocationPoint.location_name}</p>}</div> : <p className="font-semibold text-slate-400 italic text-xs">Chưa có thông tin</p>}</div>
                                    <div><p className="text-orange-600 text-xs font-bold uppercase tracking-wide mb-1.5 flex items-center gap-1"><span className="w-4 h-4 rounded-full bg-orange-500 text-white text-[9px] font-black flex items-center justify-center">B</span> Điểm trả</p>{dropoffPoint ? <div><p className="font-semibold text-slate-900">{dropoffPoint.stop_id.province} — {dropoffPoint.stop_id.name}</p>{dropoffLocationPoint && <p className="text-xs text-orange-700 font-medium flex items-center gap-1 mt-0.5"><Navigation size={11} />{dropoffLocationPoint.location_name}</p>}</div> : <p className="font-semibold text-slate-400 italic text-xs">Chưa có thông tin</p>}</div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg p-8 shadow-lg border-2 border-orange-300">
                                <h3 className="text-xl font-bold text-orange-900 mb-6 flex items-center gap-2"><span className="text-2xl">💰</span> Chi tiết giá</h3>
                                <div className="space-y-4 text-sm mb-6 pb-6 border-b-2 border-orange-300">
                                    {[{ label: "Giá vé (1 ghế)", value: `${ticketPrice.toLocaleString("vi-VN")}đ` }, { label: "Số ghế đã chọn", value: String(selectedCount) }].map(({ label, value }) => (
                                        <div key={label} className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg"><span className="text-slate-700 font-medium">{label}</span><span className="font-bold text-orange-600">{value}</span></div>
                                    ))}
                                    <div className="flex justify-between items-center bg-white bg-opacity-60 p-3 rounded-lg"><span className="text-slate-700 font-medium">Thanh toán</span><span className="font-bold text-slate-700 text-xs">{paymentMethod === "CASH_ON_BOARD" ? "💵 Trên xe" : "📱 QR chuyển khoản"}</span></div>
                                </div>
                                <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg p-4 text-center"><p className="text-orange-100 text-sm mb-1 font-medium">Tổng tiền</p><p className="text-4xl font-black">{totalPrice.toLocaleString("vi-VN")}₫</p></div>
                            </div>

                            {errorMsg && <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-sm text-red-700 font-semibold">⚠️ {errorMsg}</div>}

                            <button disabled={!isFormValid || isSubmitting} onClick={handleBooking}
                                className={`w-full py-4 rounded-lg font-bold text-white transition-all text-lg shadow-lg flex items-center justify-center gap-2 ${isFormValid && !isSubmitting ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl active:scale-95 cursor-pointer" : "bg-slate-300 cursor-not-allowed opacity-60"}`}>
                                {isSubmitting ? <><Loader2 size={20} className="animate-spin" />Đang xử lý...</> : isFormValid ? (paymentMethod === "ONLINE" ? "📱 Đặt vé & Quét QR" : `💳 Xác nhận đặt ${selectedCount} ghế`) : "Điền đầy đủ thông tin"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile bottom bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-orange-100 shadow-2xl">
                {errorMsg && <div className="px-4 pt-2.5"><div className="text-xs text-red-600 font-semibold bg-red-50 border border-red-200 rounded-xl px-3 py-2">⚠️ {errorMsg}</div></div>}
                <div className="px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                        <div><span className="text-xs text-slate-500">Tổng cộng </span><span className="text-base font-black text-orange-600">{totalPrice.toLocaleString("vi-VN")}₫</span></div>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{selectedCount} ghế · {paymentMethod === "CASH_ON_BOARD" ? "💵" : "📱"}</span>
                    </div>
                    <button disabled={!isFormValid || isSubmitting} onClick={handleBooking}
                        className={`flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-2xl shadow-lg transition-all text-base ${isFormValid && !isSubmitting ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white active:scale-95" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}>
                        {isSubmitting ? <><Loader2 size={18} className="animate-spin" />Đang xử lý...</> : isFormValid ? (paymentMethod === "ONLINE" ? "📱 Đặt vé & Quét QR" : `💳 Xác nhận đặt ${selectedCount} ghế`) : "Điền đầy đủ thông tin"}
                    </button>
                </div>
            </div>

            <style>{`
                .page-enter-copy{opacity:0;animation:page-fade-up 1.08s cubic-bezier(0.22,1,0.36,1) forwards;animation-delay:.2s}
                .hero-title-line{opacity:0;transform:translateY(14px);animation:hero-title-reveal 1.12s cubic-bezier(0.2,0.8,0.2,1) forwards}
                .hero-title-line:nth-child(1){animation-delay:.36s}.hero-title-line:nth-child(2){animation-delay:.54s}.hero-title-line:nth-child(3){animation-delay:.72s}
                .hero-title-shimmer{color:#ff7a1b;display:inline-block;background-image:repeating-linear-gradient(100deg,#ff7a1b 0px,#ff9226 185px,#ffb347 260px,#ff7a1b 400px);background-size:520px 100%;background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:hero-title-shimmer-soft 5.8s linear infinite}
                .bus-bob{animation:bus-bob 1.9s cubic-bezier(.36,.06,.29,.97) infinite;transform-origin:56% 74%}
                .bus-aero-overlay{transform:rotate(12deg);transform-origin:22% 50%}
                .bus-cloud{animation:bus-cloud-drift 1.75s ease-out infinite}
                .bus-cloud-1{animation-delay:.06s;animation-duration:1.95s}.bus-cloud-2{animation-delay:.26s;animation-duration:1.55s}.bus-cloud-3{animation-delay:.42s}.bus-cloud-4{animation-delay:.62s;animation-duration:1.84s}.bus-cloud-5{animation-delay:.78s}.bus-cloud-6{animation-delay:.94s}
                .bus-driver-fit{position:absolute;left:26.3%;top:30.7%;width:11.6%;height:15.8%;overflow:hidden;clip-path:polygon(8% 1%,96% 5%,100% 95%,22% 98%,2% 56%);transform:perspective(760px) rotateY(-12deg) rotate(-.55deg);transform-origin:54% 50%;animation:bus-driver-settle 1.9s cubic-bezier(.36,.06,.29,.97) infinite}
                .bus-front-left-passenger{position:absolute;left:48.4%;top:26.2%;width:11.6%;height:15.6%;overflow:hidden;clip-path:polygon(18% 2%,94% 6%,98% 95%,10% 97%,4% 52%);transform:perspective(760px) rotateY(14deg) rotate(.7deg);transform-origin:50% 50%;animation:bus-driver-settle 2s cubic-bezier(.36,.06,.29,.97) infinite;z-index:1}
                .bus-front-left-passenger-img{position:absolute;left:2%;top:3%;width:130%;height:166%;object-fit:cover;object-position:center 10%;filter:saturate(.8) brightness(.88);opacity:.93;transform:scaleX(-1) rotate(-2deg);animation:bus-passenger-idle 1.8s ease-in-out infinite}
                .bus-driver-fit-img{position:absolute;left:-2%;top:3%;width:95%;height:112%;object-fit:cover;filter:saturate(.82) brightness(.9);opacity:.95;transform:scaleX(-1) rotate(5deg);animation:bus-driver-idle 1.65s ease-in-out infinite}
                @keyframes bus-bob{0%,100%{transform:translateY(0) rotate(-.35deg)}32%{transform:translateY(-4px) rotate(.12deg)}62%{transform:translateY(-8px) rotate(.24deg)}82%{transform:translateY(2px) rotate(-.16deg)}}
                @keyframes bus-cloud-drift{0%{opacity:.2;transform:translateX(-18px) scale(.84)}36%{opacity:.76}100%{opacity:0;transform:translateX(172px) scale(1.3)}}
                @keyframes bus-driver-settle{0%,100%{transform:perspective(760px) rotateY(-12deg) rotate(-.55deg) translateY(0)}34%{transform:perspective(760px) rotateY(-12deg) rotate(-.4deg) translateY(-1px)}68%{transform:perspective(760px) rotateY(-12deg) rotate(-.75deg) translateY(1px)}}
                @keyframes bus-driver-idle{0%,100%{transform:scaleX(-1) rotate(5deg) translateY(0)}28%{transform:scaleX(-1) rotate(4.1deg) translateY(-1px)}62%{transform:scaleX(-1) rotate(5.9deg) translateY(1px)}}
                @keyframes bus-passenger-idle{0%,100%{transform:scaleX(-1) rotate(-2deg) translateY(0)}34%{transform:scaleX(-1) rotate(-1.3deg) translateY(-1px)}72%{transform:scaleX(-1) rotate(-2.6deg) translateY(1px)}}
                @keyframes page-fade-up{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
                @keyframes hero-title-reveal{0%{opacity:0;transform:translateY(14px);filter:blur(3px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
                @keyframes hero-title-shimmer-soft{0%{background-position:0 50%}100%{background-position:-520px 50%}}
                @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
            `}</style>
        </>
    );
}