import { useState, useRef, useEffect, useMemo } from "react";
import {
  MessageCircle, X, Send, Bot, User, RotateCcw,
  Phone, Mail, User as UserIcon, QrCode, CheckCircle2,
  Copy, ChevronLeft, Loader2, CheckCircle,
} from "lucide-react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL;
const BANK_ACCOUNT = import.meta.env.VITE_BANK_ACCOUNT;
const BANK_NAME = import.meta.env.VITE_BANK_NAME;

interface Message { role: "user" | "assistant"; content: string; }

interface ChatContext {
  step?: string;
  totalPrice?: number;
  selectedSeats?: string[];
  selectedTripId?: string;
  orderId?: string; // backend trả về sau khi tạo đơn ONLINE
  [key: string]: unknown;
}

// ============ FORMAT MESSAGE ============
function FormatMessage({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-1" />;
        const numberedMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
          const [, num, rest] = numberedMatch;
          return (
            <div key={i} className="flex items-start gap-2 rounded-lg bg-white/60 border border-[#e5e7eb] px-2.5 py-2 mt-1">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-[10px] font-bold text-white mt-0.5">{num}</span>
              <span className="text-[13px] leading-snug">{formatInlineText(rest)}</span>
            </div>
          );
        }
        if (trimmed.startsWith("•") || trimmed.startsWith("-")) {
          const content = trimmed.replace(/^[•-]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-1.5 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f7a53a]" />
              <span className="text-[13px] leading-snug">{formatInlineText(content)}</span>
            </div>
          );
        }
        const kvMatch = trimmed.match(/^(.+?):\s+(.+)/);
        if (kvMatch && !trimmed.startsWith("Ví dụ") && kvMatch[1].length < 25) {
          const [, label, value] = kvMatch;
          return (
            <div key={i} className="flex items-start gap-1 text-[13px] leading-snug">
              <span className="font-semibold text-[#374151] shrink-0">{label}:</span>
              <span>{formatInlineValue(value)}</span>
            </div>
          );
        }
        return <p key={i} className="text-[13px] leading-snug">{formatInlineText(trimmed)}</p>;
      })}
    </div>
  );
}
function formatInlineText(text: string) {
  const parts = text.split(/(\d{1,3}(?:\.\d{3})+\s*(?:đ|VND|vnđ))/gi);
  return parts.map((part, i) =>
    /\d{1,3}(?:\.\d{3})+\s*(?:đ|VND|vnđ)/i.test(part)
      ? <span key={i} className="font-bold text-[#e8791c]">{part}</span>
      : part
  );
}
function formatInlineValue(value: string) {
  if (/\d{1,3}(?:\.\d{3})+\s*(?:đ|VND|vnđ)/i.test(value))
    return <span className="font-bold text-[#e8791c]">{value}</span>;
  if (/^[a-f0-9]{24}$/i.test(value.trim()))
    return <code className="rounded bg-[#e5e7eb] px-1 py-0.5 text-[11px] font-mono">{value}</code>;
  return <span>{value}</span>;
}

// ============ SƠ ĐỒ GHẾ ============
interface SeatLayoutData {
  floors?: number; rows?: number;
  columns?: { name: string; seats_per_row: number }[];
  row_overrides?: { row_index: number; floor: number; column_overrides?: { column_name: string; seats: number }[] }[];
}
interface SeatInfo { code: string; floor: number; state: "EMPTY" | "SOLD" | "SELECTED"; }
interface ColumnSeats { columnName: string; seats: SeatInfo[]; }
interface RowData { rowIndex: number; columns: ColumnSeats[]; }

function buildSeatMap(layout: SeatLayoutData, bookedSeats: string[], selectedSeats: string[]) {
  const floors = layout.floors || 1, rows = layout.rows || 0;
  const columns = layout.columns || [], overrides = layout.row_overrides || [];
  const result: { floor: number; rows: RowData[]; columns: typeof columns }[] = [];
  for (let f = 1; f <= floors; f++) {
    const floorRows: RowData[] = [];
    let seatCounter = 1;
    const prefix = floors > 1 ? (f === 1 ? "A" : "B") : "A";
    for (let r = 1; r <= rows; r++) {
      const rowColumns: ColumnSeats[] = [];
      const override = overrides.find((o) => o.row_index === r && o.floor === f);
      columns.forEach((col) => {
        let seatsInCol = col.seats_per_row;
        if (override) { const colOv = override.column_overrides?.find((c) => c.column_name === col.name); if (colOv) seatsInCol = colOv.seats; }
        const colSeats: SeatInfo[] = [];
        for (let s = 0; s < seatsInCol; s++) {
          const code = `${prefix}${seatCounter++}`;
          const state = bookedSeats.includes(code) ? "SOLD" : selectedSeats.includes(code) ? "SELECTED" : "EMPTY";
          colSeats.push({ code, floor: f, state });
        }
        rowColumns.push({ columnName: col.name, seats: colSeats });
      });
      floorRows.push({ rowIndex: r, columns: rowColumns });
    }
    result.push({ floor: f, rows: floorRows, columns });
  }
  return result;
}
function getSeatStyle(state: "EMPTY" | "SOLD" | "SELECTED") {
  if (state === "SELECTED") return { frame: "border-[#ea5b2a] bg-[#fff6f1]", detail: "border-[#ea5b2a] bg-[#fffaf7]", label: "text-[#d84e1f]", leg: "bg-[#ea5b2a]" };
  if (state === "SOLD") return { frame: "border-[#a5acb8] bg-[#f4f5f7]", detail: "border-[#a5acb8] bg-[#f8f9fb]", label: "text-[#868e9b]", leg: "bg-[#a5acb8]" };
  return { frame: "border-[#1e8f2a] bg-white", detail: "border-[#1e8f2a] bg-white", label: "text-[#1e8f2a]", leg: "bg-[#1e8f2a]" };
}
function MiniSeat({ seat }: { seat: SeatInfo }) {
  const s = getSeatStyle(seat.state);
  return (
    <div className="relative h-[28px] w-[44px] overflow-visible">
      <span className={`pointer-events-none absolute left-[8px] top-[0px] h-[8px] w-[27px] rounded-t-[4px] border-[1.5px] border-b-0 ${s.detail}`} />
      <span className={`pointer-events-none absolute left-[4px] top-[7px] flex h-[14px] w-[36px] items-center justify-center rounded-[3px] border-[1.5px] text-[8px] font-black leading-none ${s.frame} ${s.label}`}>{seat.code}</span>
      <span className={`pointer-events-none absolute left-[14px] top-[21px] h-[5px] w-[1.5px] rounded-b-[1px] ${s.leg}`} />
      <span className={`pointer-events-none absolute right-[14px] top-[21px] h-[5px] w-[1.5px] rounded-b-[1px] ${s.leg}`} />
    </div>
  );
}
function SeatLayoutDiagram({ context }: { context: ChatContext }) {
  const layout = context.seatLayout as SeatLayoutData | undefined;
  const bookedSeats = (context.bookedSeats as string[]) || [];
  const selectedSeats = (context.selectedSeats as string[]) || [];
  const floorData = useMemo(() => { if (!layout) return []; return buildSeatMap(layout, bookedSeats, selectedSeats); }, [layout, bookedSeats, selectedSeats]);
  const [activeFloor, setActiveFloor] = useState(1);
  if (!layout || !floorData.length) return null;
  const currentFloor = floorData.find((f) => f.floor === activeFloor) || floorData[0];
  const columns = currentFloor.columns;
  const gridCols: string[] = [];
  columns.forEach((col, ci) => { if (ci > 0) gridCols.push("12px"); for (let i = 0; i < col.seats_per_row; i++) gridCols.push("44px"); });
  return (
    <div className="mt-2 rounded-xl border border-[#e5e7eb] bg-white p-2.5">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#374151]">Sơ đồ ghế</span>
        {floorData.length > 1 && (
          <div className="flex gap-1">
            {floorData.map((f) => (
              <button key={f.floor} onClick={() => setActiveFloor(f.floor)} className={`rounded-md px-2 py-0.5 text-[10px] font-semibold transition ${activeFloor === f.floor ? "bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-white" : "bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]"}`}>Tầng {f.floor}</button>
            ))}
          </div>
        )}
      </div>
      <div className="mb-1" style={{ display: "grid", gridTemplateColumns: gridCols.join(" "), gap: "3px", justifyContent: "center" }}>
        {columns.map((col, ci) => {
          const cells = [];
          if (ci > 0) cells.push(<div key={`gap-h-${ci}`} />);
          for (let i = 0; i < col.seats_per_row; i++) {
            if (ci === 0 && i === 0) cells.push(<div key="driver" className="flex h-[28px] w-[44px] items-center justify-center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg></div>);
            else if (ci === columns.length - 1 && i === col.seats_per_row - 1) cells.push(<div key="door" className="flex h-[28px] w-[44px] items-center justify-center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg></div>);
            else cells.push(<div key={`empty-h-${ci}-${i}`} className="h-[28px] w-[44px]" />);
          }
          return cells;
        })}
      </div>
      <div className="flex flex-col items-center gap-1">
        {currentFloor.rows.map((row) => (
          <div key={row.rowIndex} style={{ display: "grid", gridTemplateColumns: gridCols.join(" "), gap: "3px", justifyContent: "center" }}>
            {row.columns.map((col, ci) => {
              const cells = [];
              if (ci > 0) cells.push(<div key={`gap-${row.rowIndex}-${ci}`} />);
              if (col.seats.length > 0) col.seats.forEach((seat) => cells.push(<MiniSeat key={seat.code} seat={seat} />));
              else { const n = columns[ci]?.seats_per_row || 0; for (let i = 0; i < n; i++) cells.push(<div key={`empty-${row.rowIndex}-${ci}-${i}`} className="h-[28px] w-[44px]" />); }
              return cells;
            })}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-center gap-3">
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-[#1e8f2a] bg-white" /><span className="text-[9px] text-[#6b7280]">Trống</span></div>
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-[#a5acb8] bg-[#f4f5f7]" /><span className="text-[9px] text-[#6b7280]">Đã đặt</span></div>
        <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm border-[1.5px] border-[#ea5b2a] bg-[#fff6f1]" /><span className="text-[9px] text-[#6b7280]">Đang chọn</span></div>
      </div>
    </div>
  );
}

// ============ QR POLLING ============
// Polling payment status mỗi 3s — tự xác nhận khi webhook bắn về
interface QRPollingProps {
  orderId: string;
  amount: number;
  transferContent: string;
  onPaid: () => void;
}
function QRPolling({ orderId, amount, transferContent, onPaid }: QRPollingProps) {
  const [status, setStatus] = useState<"waiting" | "paid" | "timeout">("waiting");
  const [elapsed, setElapsed] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgSrc, setImgSrc] = useState("");
  const onPaidRef = useRef(onPaid);
  useEffect(() => { onPaidRef.current = onPaid; }, [onPaid]);

  const TIMEOUT = 10 * 60;
  const qrUrl = `https://qr.sepay.vn/img?acc=${BANK_ACCOUNT}&bank=${BANK_NAME}&amount=${amount}&des=${encodeURIComponent(transferContent)}&template=compact&download=false`;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(`BankName:${BANK_NAME}|Account:${BANK_ACCOUNT}|Amount:${amount}|Content:${transferContent}`)}&color=e8791c&bgcolor=ffffff&margin=10`;

  useEffect(() => { setImgSrc(qrUrl); setImgLoaded(false); }, [qrUrl]);

  // Polling payment status
  useEffect(() => {
    if (status !== "waiting") return;
    const token = localStorage.getItem("accessToken");
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/customer/check/payment-status/${orderId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data?.data?.payment_status === "PAID" || data?.data?.order_status === "PAID") {
          setStatus("paid");
          clearInterval(interval);
          setTimeout(() => onPaidRef.current(), 1400);
        }
      } catch { /* silent */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [orderId, status]);

  // Countdown
  useEffect(() => {
    if (status !== "waiting") return;
    const t = setInterval(() => {
      setElapsed(e => { if (e + 1 >= TIMEOUT) { setStatus("timeout"); clearInterval(t); } return e + 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  const remaining = TIMEOUT - elapsed;
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const pct = Math.round((elapsed / TIMEOUT) * 100);
  const formatPrice = (n: number) => n.toLocaleString("vi-VN") + "đ";
  const copy = (text: string, key: string) => { navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); }); };

  return (
    <div className="mx-1 mt-2 rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-white" />
          <span className="text-[13px] font-bold text-white">Quét mã chuyển khoản</span>
        </div>
        {status === "waiting" && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-full px-2.5 py-1">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span className="text-white font-black text-[11px] tabular-nums">{mm}:{ss}</span>
          </div>
        )}
        {status === "paid" && (
          <div className="flex items-center gap-1 bg-green-500 rounded-full px-2.5 py-1">
            <CheckCircle size={11} className="text-white" />
            <span className="text-white font-black text-[10px]">Đã thanh toán!</span>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {status === "waiting" && (
        <div className="h-1 bg-orange-100">
          <div className="h-full bg-gradient-to-r from-[#f7a53a] to-[#e8791c] transition-all duration-1000" style={{ width: `${100 - pct}%` }} />
        </div>
      )}
      {status === "timeout" && (
        <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-3 py-2">
          <span className="text-xs">⏰</span>
          <div><p className="text-[11px] font-bold text-red-600">Hết thời gian</p><p className="text-[10px] text-red-400">Liên hệ hỗ trợ nếu đã chuyển khoản.</p></div>
        </div>
      )}

      <div className="p-3 space-y-3">
        {/* QR Image */}
        <div className="flex flex-col items-center gap-2">
          <div className="relative bg-white border-2 border-[#f7a53a] rounded-2xl p-2 shadow-sm" style={{ width: 188, height: 188 }}>
            {!imgLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-xl gap-1.5">
                <Loader2 size={22} className="animate-spin text-[#f7a53a]" />
                <span className="text-[10px] text-slate-400">Đang tạo QR...</span>
              </div>
            )}
            {status === "paid" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-green-500/95 rounded-xl gap-1">
                <CheckCircle size={36} className="text-white" />
                <span className="text-white font-black text-xs">Đã thanh toán!</span>
              </div>
            )}
            <img src={imgSrc} alt="QR chuyển khoản"
              className={`w-full h-full object-contain transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => { if (imgSrc !== fallbackQrUrl) setImgSrc(fallbackQrUrl); else setImgLoaded(true); }}
            />
            {/* Corner decorations */}
            <span className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-[#e8791c] rounded-tl" />
            <span className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-[#e8791c] rounded-tr" />
            <span className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-[#e8791c] rounded-bl" />
            <span className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-[#e8791c] rounded-br" />
          </div>
          <span className="text-[10px] text-[#9ca3af]">Quét QR bằng app ngân hàng bất kỳ</span>
        </div>

        {/* Bank info */}
        <div className="rounded-xl bg-[#f9fafb] border border-[#e5e7eb] p-2.5 space-y-1.5">
          {[
            { label: "Ngân hàng", value: BANK_NAME, key: "bank" },
            { label: "Số TK", value: BANK_ACCOUNT, key: "acc", canCopy: true },
            { label: "Số tiền", value: formatPrice(amount), key: "amt", highlight: true },
            { label: "Nội dung CK", value: transferContent, key: "content", canCopy: true, mono: true },
          ].map(({ label, value, key, canCopy, highlight, mono }) => (
            <div key={key} className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${highlight ? "bg-[#fff8f0] border border-[#ffe4c4]" : ""}`}>
              <div className="min-w-0 flex-1">
                <span className="text-[9px] text-[#9ca3af] block">{label}</span>
                <span className={`text-[11px] break-all ${highlight ? "font-black text-[#e8791c]" : "font-semibold text-[#374151]"} ${mono ? "font-mono" : ""}`}>{value}</span>
              </div>
              {canCopy && (
                <button onClick={() => copy(value, key)} className={`flex-shrink-0 flex items-center gap-1 px-1.5 py-1 rounded-lg text-[10px] font-bold transition-all ${copied === key ? "bg-green-100 text-green-700" : "bg-[#e5e7eb] text-[#6b7280] hover:bg-[#f7a53a]/20 hover:text-[#e8791c]"}`}>
                  {copied === key ? <><CheckCircle2 size={9} /> OK</> : <><Copy size={9} /> Copy</>}
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-200 px-2.5 py-2">
          <span className="text-amber-500 text-xs flex-shrink-0">⚠️</span>
          <p className="text-[10px] text-amber-700 leading-relaxed">Nhập <span className="font-black text-amber-800">đúng nội dung chuyển khoản</span> để hệ thống tự kích hoạt vé.</p>
        </div>

        {/* Polling status */}
        {status === "waiting" && (
          <div className="flex items-center justify-center gap-2 text-[10px] text-[#9ca3af]">
            <div className="flex gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f7a53a] animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#f7a53a] animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="h-1.5 w-1.5 rounded-full bg-[#f7a53a] animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            Hệ thống tự xác nhận khi nhận được tiền
          </div>
        )}
      </div>
    </div>
  );
}

// ============ PAYMENT FORM ============
interface PaymentFormProps {
  context: ChatContext;
  onSubmit: (data: { name: string; phone: string; email: string }) => void;
  onBack: () => void;
  submitting?: boolean;
}
function PaymentForm({ context, onSubmit, onBack, submitting }: PaymentFormProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const amount = context.totalPrice || 0;
  const formatPrice = (n: number) => n.toLocaleString("vi-VN") + "đ";

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) e.name = "Vui lòng nhập họ tên (ít nhất 2 ký tự)";
    if (!/^(0|\+84)[0-9]{8,10}$/.test(phone.replace(/\s/g, ""))) e.phone = "Số điện thoại không hợp lệ";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Email không hợp lệ";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  return (
    <div className="mx-1 mt-2 rounded-2xl border border-[#e5e7eb] bg-white overflow-hidden">
      <div className="bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-3 flex items-center gap-2">
        <button onClick={onBack} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><ChevronLeft size={14} /></button>
        <UserIcon size={15} className="text-white" />
        <span className="text-[13px] font-bold text-white">Thông tin hành khách</span>
      </div>

      <div className="p-3 space-y-2.5">
        <div className="flex items-center justify-between rounded-xl bg-[#fff8f0] border border-[#ffe4c4] px-3 py-2">
          <span className="text-[11px] text-[#9ca3af]">Tổng tiền</span>
          <span className="text-[15px] font-black text-[#e8791c]">{formatPrice(amount)}</span>
        </div>

        <FormField icon={<UserIcon size={13} className="text-[#f7a53a]" />} label="Họ và tên" placeholder="Nguyễn Văn A" value={name} onChange={setName} error={errors.name} />
        <FormField icon={<Phone size={13} className="text-[#f7a53a]" />} label="Số điện thoại" placeholder="0901234567" value={phone} onChange={setPhone} error={errors.phone} type="tel" />
        <FormField icon={<Mail size={13} className="text-[#f7a53a]" />} label="Email (tuỳ chọn)" placeholder="example@email.com" value={email} onChange={setEmail} error={errors.email} type="email" />

        <button onClick={() => { if (validate()) onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim() }); }}
          disabled={submitting}
          className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] py-2.5 text-[13px] font-bold text-white shadow-sm hover:opacity-90 transition active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting
            ? <><Loader2 size={13} className="animate-spin" /> Đang tạo đơn...</>
            : <><QrCode size={14} /> Tiếp tục & Xem QR thanh toán</>}
        </button>
      </div>
    </div>
  );
}

function FormField({ icon, label, placeholder, value, onChange, error, type = "text" }: {
  icon: React.ReactNode; label: string; placeholder: string;
  value: string; onChange: (v: string) => void; error?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-[#374151]">{icon}{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className={`w-full rounded-xl border px-3 py-2 text-[13px] text-[#1f2937] outline-none placeholder:text-[#c0c4cc] transition-all ${error ? "border-red-400 bg-red-50 focus:ring-1 focus:ring-red-400" : "border-[#e5e7eb] bg-[#f9fafb] focus:border-[#f7a53a] focus:ring-1 focus:ring-[#f7a53a]/30"}`}
      />
      {error && <p className="text-[10px] text-red-500 pl-1">{error}</p>}
    </div>
  );
}

// ============ MAIN CHATBOX ============
export default function ChatBoxV2() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Xin chào! 👋 Tôi có thể giúp bạn tìm chuyến xe và đặt vé. Bạn muốn đi đâu?\n\nVí dụ: \"Tôi muốn đi Đà Nẵng ra Huế ngày mai\"" },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [context, setContext] = useState<ChatContext>({});
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  // QR polling — chỉ hiện khi backend trả về orderId
  const [qrOrderId, setQrOrderId] = useState<string | null>(null);
  const [qrTransferContent, setQrTransferContent] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open, showPaymentForm, qrOrderId]);

  // Hiện form khi bước confirm_booking; ẩn khi bước khác
  // QUAN TRỌNG: KHÔNG reset qrOrderId khi step="waiting_payment"
  // vì đó là lúc backend vừa tạo đơn xong và FE đang hiện QR polling
  useEffect(() => {
    if (context.step === "confirm_booking") {
      setShowPaymentForm(true);
      setQrOrderId(null);
    } else if (context.step === "waiting_payment") {
      // Giữ nguyên QR, không làm gì cả
      setShowPaymentForm(false);
    } else {
      setShowPaymentForm(false);
      setQrOrderId(null);
    }
  }, [context.step]);

  const getToken = (): string | null => localStorage.getItem("accessToken");

  const sendMessage = async (overrideMessage?: string) => {
    const msgText = overrideMessage || input.trim();
    if (!msgText || loading) return;
    const userMsg: Message = { role: "user", content: msgText };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setLoading(true);
    try {
      const token = getToken();
      const needAuth = context.step === "confirm_booking" && token;
      const url = needAuth ? `${API_BASE}/api/ai/check/chat` : `${API_BASE}/api/ai/notcheck/v2/chat`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const historyToSend = updatedMessages.slice(-10).map((m) => ({ role: m.role, content: m.content }));
      const res = await axios.post(url, { message: msgText, history: historyToSend, context }, { headers, timeout: 30000 });
      const data = res.data;
      if (data.requireAuth && !token) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Bạn cần đăng nhập để đặt vé. Vui lòng đăng nhập rồi quay lại chat nhé!" }]);
        setContext(data.context || {});
        setLoading(false);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      setContext(data.context || {});
    } catch (err: unknown) {
      let errorMsg = "Có lỗi xảy ra. Vui lòng thử lại sau!";
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") errorMsg = "Phản hồi quá lâu. AI đang bận, bạn thử lại nhé!";
        else if (err.response?.status === 401) errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
        else if (!err.response) errorMsg = "Không thể kết nối server. Vui lòng kiểm tra kết nối!";
      }
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit form thông tin hành khách:
   * → gửi lên AI endpoint (confirm_booking)
   * → backend tạo đơn + tạo payment ONLINE + trả về orderId trong context
   * → FE hiện QR polling
   */
  const handlePaymentSubmit = async (data: { name: string; phone: string; email: string }) => {
    setFormSubmitting(true);
    setShowPaymentForm(false);

    const msg = `Đặt vé, tên ${data.name}, sdt ${data.phone}${data.email ? `, email ${data.email}` : ""}`;
    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const token = getToken();
      const url = token ? `${API_BASE}/api/ai/check/chat` : `${API_BASE}/api/ai/notcheck/v2/chat`;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await axios.post(url, {
        message: msg,
        history: updatedMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        context,
      }, { headers, timeout: 30000 });

      const resData = res.data;

      if (resData.requireAuth && !token) {
        setMessages((prev) => [...prev, { role: "assistant", content: "Bạn cần đăng nhập để đặt vé. Vui lòng đăng nhập rồi quay lại chat nhé!" }]);
        setContext(resData.context || {});
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: resData.reply }]);
      const newCtx: ChatContext = resData.context || {};
      setContext(newCtx);

      // Backend trả về orderId → hiện QR polling
      if (newCtx.orderId) {
        setQrTransferContent(`DATVE ${newCtx.orderId}`);
        setQrOrderId(newCtx.orderId);
      }
    } catch (err: unknown) {
      let errorMsg = "Có lỗi xảy ra khi đặt vé. Vui lòng thử lại!";
      if (axios.isAxiosError(err)) {
        if (err.code === "ECONNABORTED") errorMsg = "Phản hồi quá lâu. Vui lòng thử lại!";
        else if (err.response?.status === 401) errorMsg = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại!";
      }
      setMessages((prev) => [...prev, { role: "assistant", content: errorMsg }]);
      setShowPaymentForm(true); // mở lại form nếu lỗi
    } finally {
      setLoading(false);
      setFormSubmitting(false);
    }
  };

  // Webhook → polling xác nhận → callback này
  const handlePaymentPaid = () => {
    setQrOrderId(null);
    setMessages((prev) => [...prev, {
      role: "assistant",
      content: "🎉 Thanh toán thành công! Vé của bạn đã được xác nhận. Bạn có thể xem lịch sử đặt vé trong tài khoản. Bạn có muốn đặt thêm chuyến khác không?",
    }]);
    setContext({});
  };

  const resetChat = () => {
    setMessages([{ role: "assistant", content: "Xin chào! 👋 Tôi có thể giúp bạn tìm chuyến xe và đặt vé. Bạn muốn đi đâu?\n\nVí dụ: \"Tôi muốn đi Đà Nẵng ra Huế ngày mai\"" }]);
    setContext({});
    setShowPaymentForm(false);
    setQrOrderId(null);
  };

  const stepLabel = context.step === "select_route" ? "Chọn tuyến"
    : context.step === "select_trip" ? "Chọn chuyến"
      : context.step === "select_seat" ? "Chọn ghế"
        : context.step === "confirm_booking" ? "Thanh toán"
          : "Hỗ trợ";

  const isPaymentActive = showPaymentForm || !!qrOrderId;

  return (
    <>
      {!open && (
        <button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#f7a53a] to-[#e8791c] shadow-[0_8px_24px_-6px_rgba(232,121,28,0.7)] transition-all duration-300 hover:scale-110">
          <MessageCircle size={26} className="text-white" />
        </button>
      )}

      {open && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col rounded-[20px] border border-[#e7eaf0] bg-white shadow-[0_24px_60px_-12px_rgba(15,23,42,0.3)]" style={{ width: 380, height: 560 }}>
          {/* HEADER */}
          <div className="flex items-center justify-between rounded-t-[20px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20"><Bot size={18} className="text-white" /></div>
              <div>
                <p className="text-sm font-black text-white">Trợ lý đặt vé</p>
                <p className="text-[11px] text-white/70">{context.step ? `Bước: ${stepLabel}` : "Luôn sẵn sàng hỗ trợ"}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={resetChat} title="Bắt đầu lại" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><RotateCcw size={13} /></button>
              <button onClick={() => setOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30"><X size={15} /></button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex items-end gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${msg.role === "assistant" ? "bg-gradient-to-br from-[#f7a53a] to-[#e8791c]" : "bg-[#e5e7eb]"}`}>
                  {msg.role === "assistant" ? <Bot size={14} className="text-white" /> : <User size={14} className="text-[#6b7280]" />}
                </div>
                <div className={`max-w-[75%] rounded-[14px] px-3 py-2 text-sm leading-relaxed ${msg.role === "user" ? "rounded-br-[4px] bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-white whitespace-pre-line" : "rounded-bl-[4px] bg-[#f3f4f6] text-[#1f2937]"}`}>
                  {msg.role === "assistant" ? <FormatMessage text={msg.content} /> : msg.content}
                </div>
              </div>
            ))}

            {/* SƠ ĐỒ GHẾ — bookedSeats đã được check overlap đúng từ backend */}
            {(context.step === "select_seat" || context.step === "confirm_booking") && !!context.seatLayout && (
              <SeatLayoutDiagram context={context} />
            )}

            {/* FORM THÔNG TIN */}
            {showPaymentForm && !qrOrderId && (
              <PaymentForm
                context={context}
                onSubmit={handlePaymentSubmit}
                onBack={() => setShowPaymentForm(false)}
                submitting={formSubmitting}
              />
            )}

            {/* QR POLLING — polling /payment-status/:orderId mỗi 3s */}
            {qrOrderId && (
              <QRPolling
                orderId={qrOrderId}
                amount={context.totalPrice || 0}
                transferContent={qrTransferContent}
                onPaid={handlePaymentPaid}
              />
            )}

            {/* LOADING */}
            {loading && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f7a53a] to-[#e8791c]"><Bot size={14} className="text-white" /></div>
                <div className="rounded-[14px] rounded-bl-[4px] bg-[#f3f4f6] px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-2 w-2 rounded-full bg-[#9ca3af] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT — ẩn khi đang ở form hoặc QR */}
          {!isPaymentActive && (
            <div className="border-t border-[#e5e7eb] px-3 py-3">
              <div className="flex items-center gap-2 rounded-[12px] border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2">
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Nhập tin nhắn..." className="flex-1 bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]" />
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#f7a53a] to-[#e8791c] text-white disabled:opacity-40 transition hover:scale-105">
                  <Send size={14} />
                </button>
              </div>
              <p className="mt-2 text-center text-[10px] text-[#9ca3af]">Powered by AI · Hỗ trợ 24/7</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}