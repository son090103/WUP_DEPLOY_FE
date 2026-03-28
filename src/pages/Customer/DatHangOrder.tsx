import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Loader2, RefreshCw, AlertCircle, X, BookOpen, List, Truck,
  Bike, Package, FileText, Ruler, Weight,
} from "lucide-react";

/* ═══════════════ TYPES ═══════════════════════════════════════════ */
type StopPoint = {
  _id: string; route_id: string; stop_order: number; is_pickup: boolean;
  stop_id: { _id: string; name: string; province: string; is_active: boolean; location: { type: string; coordinates: number[] } };
};
type LocationPoint = {
  _id: string; stop_id: string; location_name: string; status: boolean;
  location_type: "PICKUP" | "DROPOFF"; is_active: boolean;
  location: { type: string; coordinates: number[] };
};
type TripData = {
  _id: string; departure_time: string; arrival_time: string; status: string;
  route_id: { _id: string; start_id: { province: string; name: string }; stop_id: { province: string; name: string } };
  bus_id: { bus_type_id: { name: string } };
};
type ParcelItem = {
  _id: string; code: string; status: string; approval_status: string;
  total_price: number; weight_kg: number; created_at: string;
  item_category?: string; size_category?: string; volume_m3?: number;
  trip_id: {
    _id: string; departure_time: string; arrival_time: string; status: string;
    route_id: { start_id: { province: string; name: string }; stop_id: { province: string; name: string } };
  } | null;
  start_id: { stop_id: { province: string; name: string }; stop_order: number } | null;
  end_id: { stop_id: { province: string; name: string }; stop_order: number } | null;
  pickup_location_id: { location_name: string } | null;
  dropoff_location_id: { location_name: string } | null;
};
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type LocationState = { tripId?: string; bus_type_id?: string; trips_id?: string };
type ItemCategory = "DOCUMENT" | "PARCEL" | "BICYCLE" | "MOTORCYCLE" | "OTHER";
type SizeCategory = "SMALL" | "MEDIUM" | "LARGE";

/* ═══════════════ PRICING TYPE + FALLBACK ═════════════════════════ */
type PricingData = {
  price_per_kg: number;
  document_price_per_kg: number;
  volumetric_divisor: number;
  bicycle_price: { SMALL: number; MEDIUM: number; LARGE: number };
  motorcycle_price: { SMALL: number; MEDIUM: number; LARGE: number };
  name?: string;
  type?: string;
};

const PRICING_FALLBACK: PricingData = {
  price_per_kg: 20_000,
  document_price_per_kg: 15_000,
  volumetric_divisor: 5_000,
  bicycle_price: { SMALL: 100_000, MEDIUM: 150_000, LARGE: 200_000 },
  motorcycle_price: { SMALL: 250_000, MEDIUM: 350_000, LARGE: 500_000 },
};

/* ═══════════════ ESTIMATED WEIGHT ═══════════════════════════════ */
const ESTIMATED_WEIGHT: Record<"BICYCLE" | "MOTORCYCLE", Record<SizeCategory, number>> = {
  BICYCLE: { SMALL: 12, MEDIUM: 18, LARGE: 24 },
  MOTORCYCLE: { SMALL: 85, MEDIUM: 120, LARGE: 165 },
};

const CATEGORY_META: Record<ItemCategory, { label: string; icon: React.ReactNode; needsSize: boolean; needsWeight: boolean }> = {
  DOCUMENT: { label: "Giấy tờ / tài liệu", icon: <FileText size={16} />, needsSize: false, needsWeight: true },
  PARCEL: { label: "Hàng thông thường", icon: <Package size={16} />, needsSize: false, needsWeight: true },
  BICYCLE: { label: "Xe đạp", icon: <Bike size={16} />, needsSize: true, needsWeight: false },
  MOTORCYCLE: { label: "Xe máy", icon: <Truck size={16} />, needsSize: true, needsWeight: false },
  OTHER: { label: "Hàng cồng kềnh khác", icon: <Ruler size={16} />, needsSize: true, needsWeight: true },
};

const SIZE_META: Record<string, Record<SizeCategory, string>> = {
  BICYCLE: { SMALL: "Xe đạp mini", MEDIUM: "Xe đạp thường", LARGE: "Xe đạp thể thao" },
  MOTORCYCLE: { SMALL: "Xe ≤50cc / xe điện", MEDIUM: "Xe 51–150cc (Vision…)", LARGE: "Xe >150cc (SH, Exciter)" },
  OTHER: { SMALL: "Hàng nhỏ (<50cm)", MEDIUM: "Hàng vừa", LARGE: "Hàng lớn" },
};

/* ═══════════════ HELPERS ════════════════════════════════════════ */
function calcVolumetric(l: string, w: string, h: string, divisor = 5000) {
  const lv = Number(l), wv = Number(w), hv = Number(h);
  if (!lv || !wv || !hv) return { volume_m3: null, volumetric_weight_kg: null };
  const cm3 = lv * wv * hv;
  return {
    volume_m3: +(cm3 / 1_000_000).toFixed(4),
    volumetric_weight_kg: +(cm3 / divisor).toFixed(2),
  };
}

function calcPrice(
  cat: ItemCategory, size: SizeCategory | "",
  weight: number, volumetricKg: number | null,
  p: PricingData,
): number {
  if (cat === "MOTORCYCLE") return p.motorcycle_price[(size as SizeCategory) || "MEDIUM"];
  if (cat === "BICYCLE") return p.bicycle_price[(size as SizeCategory) || "MEDIUM"];
  if (cat === "DOCUMENT") return Math.max(1, weight) * p.document_price_per_kg;
  const charged = Math.max(weight, volumetricKg ?? 0);
  return Math.max(1, charged) * p.price_per_kg;
}

function resolveWeightKg(cat: ItemCategory, size: SizeCategory | "", manualWeight: number): number {
  if (cat === "BICYCLE" || cat === "MOTORCYCLE") {
    return ESTIMATED_WEIGHT[cat][(size as SizeCategory) || "MEDIUM"];
  }
  return manualWeight;
}

const fmtCurrency = (n: number) => n.toLocaleString("vi-VN") + "đ";
const fmtTime = (d?: string) => d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "--/--/----";

/* ═══════════════ STATUS LABELS ══════════════════════════════════ */
const PARCEL_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Chờ thanh toán", color: "bg-gray-100 text-gray-500 border-gray-200" },
  RECEIVED: { label: "Đã nhận hàng", color: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ON_BUS: { label: "Trên xe", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_TRANSIT: { label: "Đang vận chuyển", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  DELIVERED: { label: "Đã giao", color: "bg-green-100 text-green-700 border-green-200" },
  CANCELLED: { label: "Đã hủy", color: "bg-slate-100 text-slate-500 border-slate-200" },
  RETURNED: { label: "Hoàn hàng", color: "bg-red-100 text-red-500 border-red-200" },
};

const API = import.meta.env.VITE_API_URL;
const BANK_CODE = import.meta.env.VITE_BANK_NAME ?? "MB";
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT ?? "0123456789";

function buildQrUrl(amount: number, content: string): string {
  return `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_CODE}&amount=${amount}&des=${encodeURIComponent(content)}&template=compact&download=false`;
}

/* ═══════════════ QR PAYMENT MODAL ══════════════════════════════ */
type QRData = {
  parcelId: string;
  parcelCode: string;
  qrUrl: string;
  bankCode: string;
  accountNumber: string;
  amount: number;
  transferContent: string;
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
      className={`shrink-0 ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold transition-all ${copied ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600 hover:bg-orange-200"}`}
    >
      {copied ? "✓ Đã copy" : "copy"}
    </button>
  );
}

function QRPaymentModal({ data, onClose, onPaid }: { data: QRData; onClose: () => void; onPaid: () => void }) {
  const [paid, setPaid] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [imgError, setImgError] = useState(false);

  // ✅ Polling mỗi 3 giây — cleanup đúng, dừng khi paid
  useEffect(() => {
    if (paid) return;
    const token = localStorage.getItem("accessToken") ?? "";

    const iv = setInterval(async () => {
      try {
        // ✅ fix typo: "pracel" → "parcel"
        const r = await fetch(
          `${API}/api/customer/check/payment-status-parcel/${data.parcelId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const json = await r.json();
        if (json?.data?.paid) {
          setPaid(true);
          clearInterval(iv);
          setTimeout(onPaid, 2200);
        }
      } catch { /* bỏ qua lỗi mạng, tiếp tục polling */ }
    }, 3000);

    const tick = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => { clearInterval(iv); clearInterval(tick); };
  }, [data.parcelId, paid]);

  const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-md bg-white sm:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden animate-slide-up">

        {/* Header */}
        <div className="relative bg-gradient-to-br from-orange-500 via-orange-500 to-amber-400 px-6 pt-6 pb-5">
          <button onClick={onClose}
            className="absolute right-4 top-4 w-8 h-8 rounded-full bg-white/25 hover:bg-white/40 flex items-center justify-center transition-all active:scale-90">
            <X size={16} className="text-white" />
          </button>
          <p className="text-orange-100 text-xs font-semibold mb-1">Quét mã để thanh toán</p>
          <p className="text-white text-3xl font-black tracking-tight">{fmt(data.amount)}</p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs bg-white/20 text-white px-2.5 py-1 rounded-full font-mono font-semibold">{data.parcelCode}</span>
            {!paid && (
              <span className="text-xs bg-white/15 text-orange-100 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                {seconds}s đang chờ...
              </span>
            )}
            {paid && <span className="text-xs bg-green-400/30 text-white px-2.5 py-1 rounded-full font-bold">✓ Đã thanh toán</span>}
          </div>
        </div>

        {paid ? (
          <div className="px-6 py-10 text-center space-y-4">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-30" />
              <div className="relative w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-xl font-black text-gray-900">Thanh toán thành công!</p>
              <p className="text-sm text-gray-500 mt-1">Đơn hàng đã được xác nhận 🎉</p>
            </div>
            <div className="w-5 h-5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : (
          <div className="px-5 py-5 space-y-4">
            <div className="flex gap-4 items-start">
              {/* QR code */}
              <div className="shrink-0 w-[130px] h-[130px] rounded-2xl overflow-hidden border-2 border-orange-100 bg-gray-50 flex items-center justify-center shadow-sm">
                {imgError ? (
                  <div className="text-center p-2">
                    <p className="text-[10px] text-gray-400">Không tải được QR</p>
                    <p className="text-[10px] text-orange-500 mt-1">Nhập tay thông tin bên cạnh</p>
                  </div>
                ) : (
                  <img src={data.qrUrl} alt="QR" className="w-full h-full object-contain" onError={() => setImgError(true)} />
                )}
              </div>

              {/* Bank info */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2">
                  <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Ngân hàng</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{data.bankCode}</p>
                </div>
                <div className="rounded-xl bg-gray-50 border border-gray-100 px-3 py-2 flex items-center justify-between gap-1">
                  <div className="min-w-0">
                    <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">Số TK</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{data.accountNumber}</p>
                  </div>
                  <CopyBtn text={data.accountNumber} />
                </div>
              </div>
            </div>

            {/* Nội dung CK */}
            <div className="rounded-2xl bg-orange-50 border-2 border-orange-200 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] font-bold text-orange-500 uppercase tracking-wide">⚠️ Nội dung chuyển khoản</p>
                <CopyBtn text={data.transferContent} />
              </div>
              <p className="text-lg font-black text-orange-700 font-mono tracking-widest">{data.transferContent}</p>
              <p className="text-[10px] text-orange-400 mt-1">Nhập đúng nội dung này để hệ thống tự xác nhận</p>
            </div>

            {/* Số tiền */}
            <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-[10px] font-bold uppercase tracking-wide">Số tiền cần chuyển</p>
                <p className="text-white text-xl font-black mt-0.5">{fmt(data.amount)}</p>
              </div>
              <CopyBtn text={String(data.amount)} />
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 pb-1">
              <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              Đang tự động kiểm tra thanh toán mỗi 3 giây...
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .animate-slide-up { animation: slide-up 0.3s cubic-bezier(0.32,0.72,0,1) forwards; }
      `}</style>
    </div>
  );
}

/* ═══════════════ MAIN COMPONENT ════════════════════════════════ */
export default function DatHangOrder() {
  const location = useLocation();
  const navigate = useNavigate();
  const { tripId, bus_type_id } = (location.state ?? {}) as LocationState;
  const trips_id = location.state?.trip_id ?? "";

  const [trip, setTrip] = useState<TripData | null>(null);
  const [pickupPoints, setPickupPoints] = useState<StopPoint[]>([]);
  const [dropoffPoints, setDropoffPoints] = useState<StopPoint[]>([]);
  const [selectedPickupId, setSelectedPickupId] = useState("");
  const [selectedPickupStopId, setSelectedPickupStopId] = useState("");
  const [selectedDropoffId, setSelectedDropoffId] = useState("");
  const [selectedDropoffStopId, setSelectedDropoffStopId] = useState("");
  const [pickupLocations, setPickupLocations] = useState<LocationPoint[]>([]);
  const [dropoffLocations, setDropoffLocations] = useState<LocationPoint[]>([]);
  const [selectedPickupLocId, setSelectedPickupLocId] = useState("");
  const [selectedDropoffLocId, setSelectedDropoffLocId] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [parcelType, setParcelType] = useState("");
  const [weight, setWeight] = useState("0");
  const [itemCategory, setItemCategory] = useState<ItemCategory>("PARCEL");
  const [sizeCategory, setSizeCategory] = useState<SizeCategory | "">("");
  const [dimL, setDimL] = useState("");
  const [dimW, setDimW] = useState("");
  const [dimH, setDimH] = useState("");

  /* ── Pricing động từ API ── */
  const [pricing, setPricing] = useState<PricingData>(PRICING_FALLBACK);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [pricingName, setPricingName] = useState<string | null>(null);

  /* ── Computed ── */
  const meta = CATEGORY_META[itemCategory];
  const weightNum = Number(weight);
  const isVehicle = itemCategory === "BICYCLE" || itemCategory === "MOTORCYCLE";
  const { volume_m3, volumetric_weight_kg } = calcVolumetric(dimL, dimW, dimH, pricing.volumetric_divisor);
  const totalPrice = calcPrice(itemCategory, sizeCategory, weightNum, volumetric_weight_kg, pricing);
  const chargedWeight = Math.max(weightNum, volumetric_weight_kg ?? 0);
  const actualWeightKg = resolveWeightKg(itemCategory, sizeCategory, weightNum);

  /* ── UI state ── */
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [remainingWeight, setRemainingWeight] = useState<number | null>(null);
  const [remainingVolume, setRemainingVolume] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"order" | "history">("order");
  const [qrData, setQrData] = useState<QRData | null>(null);

  /* ── History ── */
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPagination, setHistoryPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [parcels, setParcels] = useState<ParcelItem[]>([]);
  const [selectedParcel, setSelectedParcel] = useState<ParcelItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const pickupPoint = pickupPoints.find((p) => p._id === selectedPickupId) ?? null;
  const dropoffPoint = dropoffPoints.find((p) => p._id === selectedDropoffId) ?? null;
  const pickupLoc = pickupLocations.find((p) => p._id === selectedPickupLocId) ?? null;
  const dropoffLoc = dropoffLocations.find((p) => p._id === selectedDropoffLocId) ?? null;

  /* ═══ Effects ═══ */

  // Fetch pricing config khi mount
  useEffect(() => {
    setPricingLoading(true);
    fetch(`${API}/api/customer/notcheck/pricing/active`)
      .then((r) => r.json())
      .then((json) => {
        const d = json?.data;
        if (!d) return;
        setPricing({
          price_per_kg: d.price_per_kg,
          document_price_per_kg: d.document_price_per_kg,
          volumetric_divisor: d.volumetric_divisor,
          bicycle_price: d.bicycle_price,
          motorcycle_price: d.motorcycle_price,
          name: d.name,
          type: d.type,
        });
        if (d.type === "HOLIDAY") setPricingName(d.name);
      })
      .catch(() => { /* giữ fallback */ })
      .finally(() => setPricingLoading(false));
  }, []);

  useEffect(() => {
    if (!tripId) return;
    setLoading(true);
    fetch(`${API}/api/customer/notcheck/diagram-bus`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route_id: tripId }),
    }).then((r) => r.json()).then((res: { data: TripData }) => setTrip(res.data))
      .catch(console.error).finally(() => setLoading(false));
  }, [tripId]);

  useEffect(() => {
    if (!trip?.route_id?._id) return;
    fetch(`${API}/api/customer/notcheck/start-point`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ route_id: trip.route_id._id, trips_id }),
    }).then((r) => r.json()).then((res: { data?: StopPoint[] }) =>
      setPickupPoints((res.data ?? []).sort((a, b) => a.stop_order - b.stop_order))
    ).catch(console.error);
  }, [trip]);

  useEffect(() => {
    if (!trip?.route_id?._id) return;
    setDropoffPoints([]); setSelectedDropoffId(""); setSelectedDropoffStopId("");
    setDropoffLocations([]); setSelectedDropoffLocId("");
    if (!selectedPickupStopId) return;
    const dto: Record<string, string> = { route_id: trip.route_id._id, start_id: selectedPickupStopId };
    if (bus_type_id) dto.bus_type_id = bus_type_id;
    fetch(`${API}/api/customer/notcheck/end-point`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dto),
    }).then((r) => r.json()).then((res: { data?: StopPoint[] }) =>
      setDropoffPoints((res.data ?? []).sort((a, b) => a.stop_order - b.stop_order))
    ).catch(console.error);
  }, [selectedPickupStopId, trip, bus_type_id]);

  useEffect(() => {
    if (!selectedPickupStopId || !trip?.route_id?._id) { setPickupLocations([]); setSelectedPickupLocId(""); return; }
    fetch(`${API}/api/customer/notcheck/location-point`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: selectedPickupStopId, route_id: trip.route_id._id }),
    }).then((r) => r.json()).then((res: { data?: LocationPoint[] }) =>
      setPickupLocations((res.data ?? []).filter((p) => p.is_active && p.status))
    ).catch(console.error);
  }, [selectedPickupStopId, trip]);

  useEffect(() => {
    if (!selectedDropoffStopId || !trip?.route_id?._id) { setDropoffLocations([]); setSelectedDropoffLocId(""); return; }
    fetch(`${API}/api/customer/notcheck/location-point`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stop_id: selectedDropoffStopId, route_id: trip.route_id._id }),
    }).then((r) => r.json()).then((res: { data?: LocationPoint[] }) =>
      setDropoffLocations((res.data ?? []).filter((p) => p.is_active && p.status))
    ).catch(console.error);
  }, [selectedDropoffStopId, trip]);

  useEffect(() => { if (activeTab === "history") fetchParcelHistory(historyPage); }, [activeTab, historyPage]);
  useEffect(() => { setSizeCategory(""); setWeight("0"); setDimL(""); setDimW(""); setDimH(""); }, [itemCategory]);

  /* ═══ History helpers ═══ */
  const fetchParcelHistory = useCallback(async (page: number) => {
    setHistoryError(null); setHistoryLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) { setHistoryError("Bạn cần đăng nhập."); return; }
      const res = await fetch(`${API}/api/customer/check/parcels?page=${page}&limit=10`,
        { headers: { Authorization: `Bearer ${token}` } });
      const json: { data?: ParcelItem[]; pagination?: Pagination; message?: string } = await res.json();
      if (!res.ok) { setHistoryError(json.message ?? "Lỗi tải lịch sử."); return; }
      setParcels(json.data ?? []);
      setHistoryPagination(json.pagination ?? { page, limit: 10, total: 0, totalPages: 1 });
    } catch { setHistoryError("Lỗi kết nối."); }
    finally { setHistoryLoading(false); }
  }, []);

  const fetchParcelDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch(`${API}/api/customer/check/parcels/${id}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const json: { data?: ParcelItem; message?: string } = await res.json();
      if (!res.ok) { setHistoryError(json.message ?? "Lỗi tải chi tiết."); return; }
      if (json.data) setSelectedParcel(json.data);
    } catch { setHistoryError("Lỗi kết nối."); }
    finally { setDetailLoading(false); }
  }, []);

  const cancelParcel = useCallback(async (parcelId: string) => {
    setCancelingId(parcelId);
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) return;
      const res = await fetch(`${API}/api/customer/check/parcels/${parcelId}/cancel`,
        { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      const json: { message?: string } = await res.json();
      if (!res.ok) { setHistoryError(json.message ?? "Không thể hủy."); return; }
      await fetchParcelHistory(historyPage);
      if (selectedParcel?._id === parcelId) await fetchParcelDetail(parcelId);
    } catch { setHistoryError("Lỗi kết nối."); }
    finally { setCancelingId(null); }
  }, [historyPage, selectedParcel, fetchParcelHistory, fetchParcelDetail]);

  /* ═══ Submit ═══ */
  const canSubmit =
    !!trip && !!pickupPoint && !!dropoffPoint &&
    receiverName.trim().length > 0 && receiverPhone.trim().length > 0 &&
    (!meta.needsSize || !!sizeCategory) &&
    (!meta.needsWeight || weightNum > 0);

  const handleSubmit = async () => {
    setError(null); setSuccess(null); setRemainingWeight(null); setRemainingVolume(null);
    if (!canSubmit) { setError("Vui lòng điền đầy đủ thông tin."); return; }
    const token = localStorage.getItem("accessToken");
    if (!token) { setError("Bạn cần đăng nhập để đặt đơn."); return; }

    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        trip_id: trip!._id,
        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhone.trim(),
        start_id: pickupPoint!._id,
        end_id: dropoffPoint!._id,
        weight_kg: actualWeightKg,
        payment_method: "ONLINE",
        item_category: itemCategory,
        size_category: sizeCategory || null,
        parcel_type: parcelType.trim() || null,
      };
      if (pickupLoc) body.pickup_location_id = pickupLoc._id;
      if (dropoffLoc) body.dropoff_location_id = dropoffLoc._id;
      if (dimL && dimW && dimH) {
        body.dimensions = { length_cm: Number(dimL), width_cm: Number(dimW), height_cm: Number(dimH) };
      }

      const res = await fetch(`${API}/api/customer/check/parcels`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });

      // ✅ Type đầy đủ — có _id và total_price
      const json: {
        message?: string;
        data?: {
          parcel?: {
            _id?: string;         // ✅ fix: thêm _id
            code?: string;
            approval_status?: string;
            status?: string;
            total_price?: number; // ✅ fix: thêm total_price
          };
        };
        remaining_weight_kg?: number;
        remaining_volume_m3?: number;
      } = await res.json();

      if (!res.ok) { setError(json.message ?? "Đặt hàng thất bại"); return; }

      const parcel = json.data?.parcel;
      if (parcel?.approval_status === "REJECTED" || parcel?.status === "CANCELLED") {
        setError(json.message ?? "Đơn không được chấp nhận.");
        setRemainingWeight(json.remaining_weight_kg ?? null);
        setRemainingVolume(json.remaining_volume_m3 ?? null);
        return;
      }

      // ✅ fix: lấy đúng _id, validate trước khi mở QR
      const parcelId = parcel?._id ?? "";
      const parcelCode = parcel?.code ?? "";
      const amount = parcel?.total_price ?? totalPrice;

      if (!parcelId || !parcelCode) {
        setError("Không lấy được thông tin đơn hàng. Vui lòng thử lại.");
        return;
      }

      const content = `DH${parcelCode}`;
      setQrData({
        parcelId,
        parcelCode,
        qrUrl: buildQrUrl(amount, content),
        bankCode: BANK_CODE,
        accountNumber: BANK_ACCOUNT,
        amount,
        transferContent: content,
      });
    } catch { setError("Lỗi kết nối. Vui lòng thử lại."); }
    finally { setSubmitting(false); }
  };

  /* ═══════════════ HERO ════════════════════════════════════════ */
  const renderHero = () => (
    <>
      <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />
      <div className="pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%] hidden md:block">
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
          <img
            src="/images/bus7.png"
            alt="Bus overlay"
            className="w-full object-contain block relative -top-100"
            style={{
              imageRendering: "auto",
              filter: "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))",
            }}
          />
          <div className="pointer-events-none absolute inset-0">
            <div className="bus-front-left-passenger">
              <img src="/images/loxe1.png" alt="Front passenger" className="bus-front-left-passenger-img" />
            </div>
            <div className="bus-driver-fit">
              <img src="/images/1me1.png" alt="Driver" className="bus-driver-fit-img" />
            </div>
          </div>
        </div>
      </div>
      <div className="relative z-20 mx-auto flex min-h-[320px] w-full max-w-[1240px] items-center px-4 pt-20 pb-6 md:min-h-[680px] md:pt-24 md:pb-24 lg:min-h-[780px] lg:pt-20">
        <div className="page-enter-copy relative isolate w-full max-w-[760px] space-y-3 md:space-y-6 md:-ml-14 lg:-ml-24">
          <h1 className="hero-title relative z-10 py-1 text-[48px] font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] sm:text-[58px] lg:text-[72px]">
            <span className="hero-title-line block whitespace-nowrap">Gửi hàng dễ dàng</span>
            <span className="hero-title-line mt-2 block whitespace-nowrap">Giữa các chặng đường</span>
            <span className="hero-title-line mt-2 block whitespace-nowrap font-extrabold italic">
              <span className="hero-title-shimmer">Nhanh</span> <span className="hero-title-shimmer">-</span> <span className="hero-title-shimmer">An toàn</span>
            </span>
          </h1>
          <p className="relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
            Gửi hàng thông thường, xe đạp, xe máy… – đặt nhanh, giá minh bạch.
          </p>
        </div>
      </div>
    </>
  );

  /* ═══════════════ ORDER FORM ══════════════════════════════════ */
  const renderOrderForm = () => {
    if (!tripId || !trip) {
      return (
        <div className="rounded-2xl bg-white shadow border border-orange-100 p-10 text-center">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Chọn chuyến để bắt đầu gửi hàng</h2>
          <p className="text-sm text-slate-600 mb-6">Vui lòng chọn chuyến trên trang lịch trình.</p>
          <button onClick={() => navigate("/lichtrinh")} className="rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white hover:bg-orange-600">
            Xem lịch trình
          </button>
        </div>
      );
    }

    const sizeOptions = SIZE_META[itemCategory] as Record<SizeCategory, string> | undefined;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">

          {/* Banner giá ngày lễ */}
          {pricingName && (
            <div className="flex items-center gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3.5">
              <span className="text-amber-500 text-lg">🎉</span>
              <div>
                <p className="text-sm font-bold text-amber-700">Giá ngày lễ đang áp dụng</p>
                <p className="text-xs text-amber-600">{pricingName}</p>
              </div>
            </div>
          )}

          {/* Trip info */}
          <div className="bg-white rounded-2xl shadow border border-orange-100 p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-500">Chuyến</p>
                <p className="text-lg font-bold text-slate-900">{trip.route_id.start_id.province} → {trip.route_id.stop_id.province}</p>
                <p className="text-xs text-slate-500 mt-1">{fmtDate(trip.departure_time)} • {fmtTime(trip.departure_time)} → {fmtTime(trip.arrival_time)}</p>
              </div>
              <div className="rounded-2xl bg-orange-50 border border-orange-200 px-4 py-3 text-center">
                <p className="text-xs font-semibold text-orange-600">Loại xe</p>
                <p className="text-sm font-bold text-orange-700 mt-1">{trip.bus_id?.bus_type_id?.name ?? "--"}</p>
              </div>
            </div>
          </div>

          {/* Pickup / Dropoff */}
          <div className="bg-white rounded-2xl shadow border border-orange-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Điểm đón và điểm trả</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-500 text-white font-bold">A</div>
                  <p className="text-sm font-semibold text-slate-700">Điểm đón</p>
                </div>
                <select value={selectedPickupId}
                  onChange={(e) => { setSelectedPickupId(e.target.value); setSelectedPickupStopId(pickupPoints.find((p) => p._id === e.target.value)?.stop_id?._id ?? ""); }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-green-400 focus:ring-2 focus:ring-green-100">
                  <option value="">Chọn điểm đón</option>
                  {pickupPoints.map((p) => <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>)}
                </select>
                {selectedPickupId && pickupLocations.length > 0 && (
                  <select value={selectedPickupLocId} onChange={(e) => setSelectedPickupLocId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-green-400 focus:ring-2 focus:ring-green-100">
                    <option value="">Chọn vị trí cụ thể</option>
                    {pickupLocations.map((lp) => <option key={lp._id} value={lp._id}>{lp.location_name}</option>)}
                  </select>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-orange-500 text-white font-bold">B</div>
                  <p className="text-sm font-semibold text-slate-700">Điểm trả</p>
                </div>
                <select value={selectedDropoffId}
                  onChange={(e) => { setSelectedDropoffId(e.target.value); setSelectedDropoffStopId(dropoffPoints.find((p) => p._id === e.target.value)?.stop_id?._id ?? ""); }}
                  disabled={!selectedPickupId}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-100 disabled:opacity-60">
                  <option value="">{selectedPickupId ? "Chọn điểm trả" : "Chọn điểm đón trước"}</option>
                  {dropoffPoints.map((p) => <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>)}
                </select>
                {selectedDropoffId && dropoffLocations.length > 0 && (
                  <select value={selectedDropoffLocId} onChange={(e) => setSelectedDropoffLocId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="">Chọn vị trí cụ thể</option>
                    {dropoffLocations.map((lp) => <option key={lp._id} value={lp._id}>{lp.location_name}</option>)}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Loại hàng */}
          <div className="bg-white rounded-2xl shadow border border-orange-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Loại hàng gửi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {(Object.keys(CATEGORY_META) as ItemCategory[]).map((cat) => {
                const m = CATEGORY_META[cat];
                return (
                  <button key={cat} onClick={() => setItemCategory(cat)}
                    className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 text-xs font-bold transition-all ${itemCategory === cat
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-orange-300 hover:text-orange-600"}`}>
                    <span className={itemCategory === cat ? "text-orange-500" : "text-slate-400"}>{m.icon}</span>
                    {m.label}
                  </button>
                );
              })}
            </div>

            {meta.needsSize && sizeOptions && (
              <div className="mt-3">
                <p className="text-sm font-semibold text-slate-700 mb-2">Phân loại <span className="text-red-500">*</span></p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(Object.keys(sizeOptions) as SizeCategory[]).map((s) => {
                    const price = itemCategory === "MOTORCYCLE"
                      ? pricing.motorcycle_price[s]
                      : itemCategory === "BICYCLE"
                        ? pricing.bicycle_price[s]
                        : null;
                    const estKg = isVehicle ? ESTIMATED_WEIGHT[itemCategory as "BICYCLE" | "MOTORCYCLE"][s] : null;
                    return (
                      <button key={s} onClick={() => setSizeCategory(s)}
                        className={`p-3 rounded-2xl border-2 text-left transition-all ${sizeCategory === s ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-300"}`}>
                        <p className={`text-xs font-black ${sizeCategory === s ? "text-orange-700" : "text-slate-700"}`}>{s}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{sizeOptions[s]}</p>
                        {price != null && (
                          <p className="text-xs font-bold text-orange-600 mt-1">
                            {pricingLoading ? "..." : fmtCurrency(price)}
                          </p>
                        )}
                        {estKg && <p className="text-[11px] text-slate-400 mt-0.5">~{estKg} kg</p>}
                      </button>
                    );
                  })}
                </div>
                {isVehicle && sizeCategory && (
                  <p className="mt-2 text-xs text-slate-400 italic">
                    * Khối lượng ước tính ~{ESTIMATED_WEIGHT[itemCategory as "BICYCLE" | "MOTORCYCLE"][sizeCategory as SizeCategory]} kg
                    được dùng để kiểm tra tải trọng xe.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Thông tin đơn */}
          <div className="bg-white rounded-2xl shadow border border-orange-100 p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Thông tin đơn hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tên người nhận <span className="text-red-500">*</span></label>
                <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  placeholder="Tên người nhận" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Số điện thoại <span className="text-red-500">*</span></label>
                <input value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  placeholder="SĐT người nhận" />
              </div>
              {meta.needsWeight && (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Khối lượng (kg) <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Weight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input type="number" min={0} value={weight} onChange={(e) => setWeight(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 pl-9 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                      placeholder="kg" />
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mô tả hàng</label>
                <input value={parcelType} onChange={(e) => setParcelType(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
                  placeholder="Dễ vỡ, thực phẩm, điện tử…" />
              </div>
            </div>

            {(itemCategory === "PARCEL" || itemCategory === "OTHER") && (
              <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <Ruler size={15} className="text-slate-500" />
                  <p className="text-sm font-bold text-slate-700">Kích thước (cm) – tuỳ chọn</p>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Nếu hàng cồng kềnh hãy nhập kích thước. Hệ thống tính KL thể tích (L×W×H÷{pricing.volumetric_divisor})
                  và lấy trị số lớn hơn để tính giá.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[{ label: "Dài", val: dimL, set: setDimL }, { label: "Rộng", val: dimW, set: setDimW }, { label: "Cao", val: dimH, set: setDimH }].map(({ label, val, set }) => (
                    <div key={label}>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">{label} (cm)</label>
                      <input type="number" min={0} value={val} onChange={(e) => set(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400" placeholder="0" />
                    </div>
                  ))}
                </div>
                {volume_m3 && (
                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-slate-600">
                    <span>Thể tích: <span className="text-orange-600">{volume_m3} m³</span></span>
                    <span>KL quy đổi: <span className="text-orange-600">{volumetric_weight_kg} kg</span></span>
                    <span>KL tính giá: <span className="font-black text-orange-600">{chargedWeight.toFixed(2)} kg</span></span>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs text-slate-500">
                  Tổng giá {pricingLoading && <span className="text-orange-400">(đang tải giá...)</span>}
                </p>
                <p className="text-2xl font-black text-orange-600">{fmtCurrency(totalPrice)}</p>
                {!isVehicle && volumetric_weight_kg && volumetric_weight_kg > weightNum && (
                  <p className="text-[11px] text-slate-400">* Tính theo KL thể tích ({volumetric_weight_kg} kg)</p>
                )}
              </div>
              <button onClick={handleSubmit} disabled={submitting || !canSubmit || pricingLoading}
                className="w-full sm:w-auto rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-orange-600 disabled:opacity-60">
                {submitting ? "Đang gửi..." : "Đặt hàng ngay"}
              </button>
            </div>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
            {success && <p className="mt-4 text-sm text-green-600">{success}</p>}
            {(remainingWeight !== null || remainingVolume !== null) && (
              <div className="mt-2 text-sm text-orange-700 space-y-1">
                {remainingWeight !== null && <p>Tải trọng còn lại: <b>{remainingWeight} kg</b></p>}
                {remainingVolume !== null && <p>Thể tích còn lại: <b>{remainingVolume} m³</b></p>}
                <p>Vui lòng giảm khối lượng / kích thước hoặc chọn chuyến khác.</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow border border-orange-100 p-6 sticky top-4">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tổng quan</h3>
            <p className="text-xs text-slate-500 mb-4">Kiểm tra nhanh thông tin</p>
            <div className="space-y-2 text-sm text-slate-700">
              <Row label="Chuyến" value={`${trip.route_id.start_id.province} → ${trip.route_id.stop_id.province}`} />
              <Row label="Loại hàng" value={CATEGORY_META[itemCategory].label} />
              {sizeCategory && <Row label="Phân loại" value={SIZE_META[itemCategory]?.[sizeCategory] ?? sizeCategory} />}
              {isVehicle && sizeCategory
                ? <Row label="KL ước tính" value={`~${ESTIMATED_WEIGHT[itemCategory as "BICYCLE" | "MOTORCYCLE"][sizeCategory as SizeCategory]} kg`} />
                : meta.needsWeight && <Row label="Khối lượng" value={`${weightNum.toLocaleString()} kg`} />
              }
              {volume_m3 && <Row label="Thể tích" value={`${volume_m3} m³`} />}
              {volumetric_weight_kg && <Row label="KL quy đổi" value={`${volumetric_weight_kg} kg`} />}
              <div className="pt-2 border-t border-slate-100">
                <Row label="Giá" value={<span className="font-black text-orange-600">{fmtCurrency(totalPrice)}</span>} />
                <Row label="Thanh toán" value="Online" />
              </div>
            </div>

            <details className="mt-4">
              <summary className="text-xs font-semibold text-slate-400 cursor-pointer hover:text-slate-600">
                Bảng giá tham khảo {pricingName ? `(${pricingName})` : ""}
              </summary>
              <div className="mt-2 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-700">Hàng thông thường / cồng kềnh</p>
                <p>{fmtCurrency(pricing.price_per_kg)}/kg</p>
                <p className="font-semibold text-slate-700 mt-2">Giấy tờ</p>
                <p>{fmtCurrency(pricing.document_price_per_kg)}/kg</p>
                <p className="font-semibold text-slate-700 mt-2">Xe đạp (giá cố định)</p>
                <p>Mini: {fmtCurrency(pricing.bicycle_price.SMALL)} · Thường: {fmtCurrency(pricing.bicycle_price.MEDIUM)} · Thể thao: {fmtCurrency(pricing.bicycle_price.LARGE)}</p>
                <p className="font-semibold text-slate-700 mt-2">Xe máy (giá cố định)</p>
                <p>≤50cc: {fmtCurrency(pricing.motorcycle_price.SMALL)} · 51–150cc: {fmtCurrency(pricing.motorcycle_price.MEDIUM)} · &gt;150cc: {fmtCurrency(pricing.motorcycle_price.LARGE)}</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  };

  /* ═══════════════ HISTORY ══════════════════════════════════════ */
  const renderHistory = () => {
    const getPageNumbers = (): number[] => {
      const total = historyPagination.totalPages;
      if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
      if (historyPage <= 3) return [1, 2, 3, 4, 5];
      if (historyPage >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
      return [historyPage - 2, historyPage - 1, historyPage, historyPage + 1, historyPage + 2];
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Lịch sử gửi hàng</h2>
            <p className="text-sm text-slate-500">Xem lại đơn và hủy nếu còn chờ xử lý.</p>
          </div>
          <button onClick={() => fetchParcelHistory(historyPage)} disabled={historyLoading}
            className="flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 disabled:opacity-50">
            <RefreshCw size={16} className={historyLoading ? "animate-spin" : ""} /> Làm mới
          </button>
        </div>

        {historyLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 size={36} className="animate-spin text-orange-500" />
            <p className="text-slate-500 font-medium">Đang tải lịch sử...</p>
          </div>
        ) : historyError ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-slate-600 font-semibold">{historyError}</p>
            <button onClick={() => fetchParcelHistory(historyPage)} className="mt-2 px-5 py-2 bg-orange-500 text-white rounded-xl font-bold text-sm hover:bg-orange-600">Thử lại</button>
          </div>
        ) : parcels.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
            <Truck size={48} className="text-slate-300" />
            <p className="text-slate-500 font-semibold text-lg">Chưa có đơn gửi hàng</p>
          </div>
        ) : (
          <div className="space-y-4">
            {parcels.map((parcel) => {
              const stCfg = PARCEL_STATUS_LABEL[parcel.status] ?? PARCEL_STATUS_LABEL.RECEIVED;
              const canCancel = parcel.status === "PENDING" || parcel.status === "RECEIVED";
              const hint = parcel.status === "CANCELLED" ? "Đơn đã hủy." : canCancel ? null : "Đơn đang xử lý, không thể hủy.";
              const pIsVehicle = parcel.item_category === "BICYCLE" || parcel.item_category === "MOTORCYCLE";
              return (
                <div key={parcel._id} className="bg-white rounded-2xl shadow-md border border-orange-100/60 overflow-hidden">
                  <div className={`h-1 ${stCfg.color.includes("yellow") ? "bg-yellow-400" : stCfg.color.includes("slate") ? "bg-slate-300" : "bg-green-400"}`} />
                  <div className="p-6">
                    <div className="flex flex-wrap gap-3 items-start justify-between">
                      <div className="min-w-[200px]">
                        <div className="text-xs text-slate-500">Mã đơn</div>
                        <div className="text-sm font-semibold text-slate-800 font-mono">{parcel.code}</div>
                        <div className="text-[11px] text-slate-400 mt-1">{fmtDate(parcel.created_at)}</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${stCfg.color}`}>{stCfg.label}</span>
                        {parcel.item_category && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            {CATEGORY_META[parcel.item_category as ItemCategory]?.label ?? parcel.item_category}
                            {parcel.size_category ? ` · ${parcel.size_category}` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                      <div><div className="font-semibold">Chuyến</div>
                        <div>{parcel.trip_id ? `${parcel.trip_id.route_id.start_id.province} → ${parcel.trip_id.route_id.stop_id.province}` : "-"}</div>
                      </div>
                      {!pIsVehicle && (
                        <div><div className="font-semibold">Khối lượng</div>
                          <div>{parcel.weight_kg?.toLocaleString()} kg{parcel.volume_m3 ? ` · ${parcel.volume_m3} m³` : ""}</div>
                        </div>
                      )}
                      <div><div className="font-semibold">Giá</div>
                        <div className="text-orange-600 font-bold">{fmtCurrency(parcel.total_price)}</div>
                      </div>
                      <div><div className="font-semibold">Điểm đón</div>
                        <div>{parcel.pickup_location_id?.location_name ?? parcel.start_id?.stop_id?.province}</div>
                      </div>
                      <div><div className="font-semibold">Điểm trả</div>
                        <div>{parcel.dropoff_location_id?.location_name ?? parcel.end_id?.stop_id?.province}</div>
                      </div>
                    </div>
                    <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <button onClick={() => fetchParcelDetail(parcel._id)} disabled={detailLoading}
                        className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2 text-sm font-semibold text-orange-600 hover:bg-orange-50 transition disabled:opacity-60">
                        {detailLoading ? <><Loader2 className="animate-spin" size={16} /> Đang tải</> : <><BookOpen size={16} /> Xem chi tiết</>}
                      </button>
                      {canCancel
                        ? <button onClick={() => cancelParcel(parcel._id)} disabled={cancelingId === parcel._id}
                          className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 transition disabled:opacity-50">
                          <X size={16} />{cancelingId === parcel._id ? "Đang hủy..." : "Hủy đơn"}
                        </button>
                        : hint ? <span className="text-sm font-semibold text-slate-500">{hint}</span> : null
                      }
                    </div>
                  </div>
                </div>
              );
            })}

            {historyPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button onClick={() => setHistoryPage((p) => Math.max(1, p - 1))} disabled={historyPage === 1}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40">‹</button>
                {getPageNumbers().map((p) => (
                  <button key={p} onClick={() => setHistoryPage(p)}
                    className={`w-9 h-9 rounded-full text-sm font-semibold ${p === historyPage ? "bg-orange-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"}`}>{p}</button>
                ))}
                <button onClick={() => setHistoryPage((p) => Math.min(historyPagination.totalPages, p + 1))} disabled={historyPage === historyPagination.totalPages}
                  className="w-9 h-9 flex items-center justify-center rounded-full border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-40">›</button>
              </div>
            )}
          </div>
        )}

        {/* Detail modal */}
        {selectedParcel && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/50">
            <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Chi tiết đơn hàng</h3>
                  <p className="text-xs text-slate-500">Mã: {selectedParcel.code}</p>
                </div>
                <button onClick={() => setSelectedParcel(null)} className="text-slate-500 hover:text-slate-700"><X size={20} /></button>
              </div>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
                <div className="space-y-2">
                  <div className="font-semibold">Trạng thái</div>
                  <div>{PARCEL_STATUS_LABEL[selectedParcel.status]?.label ?? selectedParcel.status}</div>
                  <div className="font-semibold mt-2">Loại hàng</div>
                  <div>
                    {CATEGORY_META[selectedParcel.item_category as ItemCategory]?.label ?? selectedParcel.item_category ?? "—"}
                    {selectedParcel.size_category ? ` · ${selectedParcel.size_category}` : ""}
                  </div>
                  {(selectedParcel.item_category !== "BICYCLE" && selectedParcel.item_category !== "MOTORCYCLE") && (
                    <><div className="font-semibold mt-2">Khối lượng</div>
                      <div>{selectedParcel.weight_kg.toLocaleString()} kg{selectedParcel.volume_m3 ? ` · ${selectedParcel.volume_m3} m³` : ""}</div></>
                  )}
                  <div className="font-semibold mt-2">Tổng giá</div>
                  <div className="text-orange-600 font-bold">{fmtCurrency(selectedParcel.total_price)}</div>
                </div>
                <div className="space-y-2">
                  <div className="font-semibold">Tuyến</div>
                  <div>{selectedParcel.trip_id ? `${selectedParcel.trip_id.route_id.start_id.province} → ${selectedParcel.trip_id.route_id.stop_id.province}` : "-"}</div>
                  <div className="font-semibold mt-2">Điểm đón</div>
                  <div>{selectedParcel.pickup_location_id?.location_name ?? selectedParcel.start_id?.stop_id?.province}</div>
                  <div className="font-semibold mt-2">Điểm trả</div>
                  <div>{selectedParcel.dropoff_location_id?.location_name ?? selectedParcel.end_id?.stop_id?.province}</div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setSelectedParcel(null)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Đóng</button>
                {(selectedParcel.status === "PENDING" || selectedParcel.status === "RECEIVED") && (
                  <button onClick={() => cancelParcel(selectedParcel._id)} className="rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Hủy đơn</button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═══════════════ MAIN RENDER ════════════════════════════════ */
  return (
    <>
    {renderHero()}
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-orange-50/20 to-slate-100 -mt-52">
      {loading && (
        <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-white/70">
          <Loader2 className="animate-spin text-orange-500" size={40} />
        </div>
      )}

      {/* QR Payment Modal */}
      {qrData && (
        <QRPaymentModal
          data={qrData}
          onClose={() => setQrData(null)}
          onPaid={() => {
            setQrData(null);
            navigate("/user/parcel-history"); // ✅ redirect sang trang dathang
          }}
        />
      )}

      <div className="relative z-20 mx-auto max-w-6xl px-4 pb-16">
        <div className="flex flex-wrap items-center gap-4 pt-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Gửi hàng</h1>
            <p className="text-sm text-slate-600">Chọn chuyến, loại hàng, kích thước – giá tự tính.</p>
          </div>
          <div className="flex gap-2">
            {(["order", "history"] as const).map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${activeTab === tab ? "bg-orange-500 text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
                {tab === "order"
                  ? <><Truck size={16} className="inline -mt-0.5 mr-1" />Đặt hàng</>
                  : <><List size={16} className="inline -mt-0.5 mr-1" />Lịch sử</>}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-8">{activeTab === "order" ? renderOrderForm() : renderHistory()}</div>
      </div>
    </div>

    <style>{`
      .hero-title-shimmer {
        color: #ff7a1b; display: inline-block; line-height: 1.12;
        padding-bottom: 0.14em; margin-bottom: 0;
        background-image: repeating-linear-gradient(100deg,#ff7a1b 0px,#ff7a1b 120px,#ff9226 185px,#ffb347 260px,#ff9226 335px,#ff7a1b 400px,#e8791c 520px);
        background-size: 520px 100%; background-position: 0 50%; background-repeat: repeat;
        background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        text-shadow: 0 1px 0 rgba(255,181,88,0.36),0 2px 0 rgba(234,121,27,0.38),0 4px 0 rgba(178,76,16,0.3),0 10px 16px rgba(94,40,9,0.22);
        -webkit-text-stroke: 0.26px rgba(136,57,12,0.26);
        filter: saturate(1.16) contrast(1.12) brightness(1.06);
        animation: hero-title-shimmer-soft 5.8s linear infinite; will-change: background-position;
      }
      @keyframes hero-title-shimmer-soft { 0%{background-position:0 50%} 100%{background-position:-520px 50%} }
      .bus-bob { animation: bus-bob 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite; transform-origin: 56% 74%; will-change: transform; }
      .bus-aero-overlay { transform: rotate(12deg); transform-origin: 22% 50%; }
      .bus-cloud { animation: bus-cloud-drift 1.75s ease-out infinite; will-change: transform, opacity; }
      .bus-cloud-1 { animation-delay: 0.06s; animation-duration: 1.95s; }
      .bus-cloud-2 { animation-delay: 0.26s; animation-duration: 1.55s; }
      .bus-cloud-3 { animation-delay: 0.42s; animation-duration: 1.58s; }
      .bus-cloud-4 { animation-delay: 0.62s; animation-duration: 1.84s; }
      .bus-cloud-5 { animation-delay: 0.78s; animation-duration: 1.72s; }
      .bus-cloud-6 { animation-delay: 0.94s; animation-duration: 1.6s; }
      .bus-aero-trail { transform: rotate(12deg); transform-origin: 22% 50%; will-change: transform; }
      .bus-tail-cloud { animation: bus-trail-cloud 1.55s ease-out infinite; will-change: transform, opacity; }
      .bus-tail-cloud-1 { animation-delay: 0.06s; }
      .bus-tail-cloud-2 { animation-delay: 0.32s; }
      .bus-tail-cloud-3 { animation-delay: 0.54s; }
      .bus-tail-cloud-4 { animation-delay: 0.76s; }
      .bus-tail-cloud-6 { animation-delay: 0.22s; animation-duration: 1.45s; }
      .bus-driver-fit {
        position: absolute; left: 26.3%; top: 30.7%; width: 11.6%; height: 15.8%;
        overflow: hidden; clip-path: polygon(8% 1%, 96% 5%, 100% 95%, 22% 98%, 2% 56%);
        transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg); transform-origin: 54% 50%;
        animation: bus-driver-settle 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite; will-change: transform;
      }
      .bus-driver-fit-img {
        position: absolute; left: -2%; top: 3%; width: 95%; height: 112%;
        object-fit: cover; object-position: center 8%;
        filter: saturate(0.82) contrast(1.08) brightness(0.9); opacity: 0.95;
        transform: scaleX(-1) rotate(5deg);
        animation: bus-driver-idle 1.65s ease-in-out infinite; will-change: transform; z-index: 1;
      }
      .bus-front-left-passenger {
        position: absolute; left: 48.4%; top: 26.2%; width: 11.6%; height: 15.6%;
        overflow: hidden; clip-path: polygon(18% 2%, 94% 6%, 98% 95%, 10% 97%, 4% 52%);
        transform: perspective(760px) rotateY(14deg) rotate(0.7deg); transform-origin: 50% 50%;
        animation: bus-driver-settle 2s cubic-bezier(0.36,0.06,0.29,0.97) infinite; will-change: transform; z-index: 1;
      }
      .bus-front-left-passenger-img {
        position: absolute; left: 2%; top: 3%; width: 130%; height: 166%;
        object-fit: cover; object-position: center 10%;
        filter: saturate(0.8) contrast(1.05) brightness(0.88); opacity: 0.93;
        transform: scaleX(-1) rotate(-2deg);
        animation: bus-passenger-idle 1.8s ease-in-out infinite; will-change: transform;
      }
      @keyframes bus-bob { 0%,100%{transform:translateY(0) rotate(-0.35deg)} 32%{transform:translateY(-4px) rotate(0.12deg)} 62%{transform:translateY(-8px) rotate(0.24deg)} 82%{transform:translateY(2px) rotate(-0.16deg)} }
      @keyframes bus-cloud-drift { 0%{opacity:.2;transform:translateX(-18px) scale(.84)} 36%{opacity:.76} 100%{opacity:0;transform:translateX(172px) scale(1.3)} }
      @keyframes bus-trail-cloud { 0%{opacity:.62;transform:translateX(-6px) scale(.78)} 34%{opacity:.96} 100%{opacity:0;transform:translateX(92px) scale(1.22)} }
      @keyframes bus-driver-settle { 0%,100%{transform:perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0)} 34%{transform:perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px)} 68%{transform:perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px)} }
      @keyframes bus-driver-idle { 0%,100%{transform:scaleX(-1) rotate(5deg) translateY(0)} 28%{transform:scaleX(-1) rotate(4.1deg) translateY(-1px)} 62%{transform:scaleX(-1) rotate(5.9deg) translateY(1px)} 82%{transform:scaleX(-1) rotate(4.6deg) translateY(0)} }
      @keyframes bus-passenger-idle { 0%,100%{transform:scaleX(-1) rotate(-2deg) translateY(0)} 34%{transform:scaleX(-1) rotate(-1.3deg) translateY(-1px)} 72%{transform:scaleX(-1) rotate(-2.6deg) translateY(1px)} }
      @media (prefers-reduced-motion: reduce) {
        .bus-bob,.bus-cloud,.bus-tail-cloud,
        .bus-front-left-passenger,.bus-front-left-passenger-img,.bus-driver-fit,.bus-driver-fit-img {
          animation: none !important; opacity: 1 !important; transform: none !important;
        }
      }
    `}</style>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-2 text-sm">
      <span className="text-slate-500 flex-shrink-0">{label}</span>
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}