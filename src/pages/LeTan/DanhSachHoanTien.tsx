import { useCallback, useEffect, useRef, useState } from "react";
import {
    Loader2, RefreshCw, AlertCircle,
    Phone, CreditCard, Bus, Clock, BadgeCheck, QrCode, X, CheckCircle2, PartyPopper,
} from "lucide-react";

/* ═══════════════ TYPES ═══════════════════════════════════════════ */
type RefundItem = {
    payment_id: string;
    order_id: string;
    passenger_name: string;
    passenger_phone: string;
    passenger_email: string | null;
    seat_labels: string[];
    paid_amount: number;
    refund_amount: number;
    refund_account: string | null;
    refund_bank: string | null;
    paid_at: string | null;
    trip: { departure_time: string; from: string | null; to: string | null } | null;
    created_at: string;
};
type Pagination = { page: number; limit: number; total: number; totalPages: number };
type ModalStep = "qr" | "success";

/* ═══════════════ HELPERS ═════════════════════════════════════════ */
const fmtCurrency = (n?: number | null) => (n ?? 0).toLocaleString("vi-VN") + "đ";
const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";
const fmtTime = (d?: string | null) =>
    d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "—";

const API = import.meta.env.VITE_API_URL;

/* ═══════════════ VIETQR BANK MAP ════════════════════════════════ */
const BANK_CODE_MAP: Record<string, string> = {
    "vietcombank": "VCB", "vcb": "VCB",
    "mb bank": "MB", "mb": "MB", "mbbank": "MB",
    "techcombank": "TCB", "tcb": "TCB",
    "bidv": "BIDV",
    "vietinbank": "CTG",
    "agribank": "AGR",
    "vpbank": "VPB",
    "acb": "ACB",
    "sacombank": "STB",
    "tpbank": "TPB",
    "seabank": "SEAB",
    "ocb": "OCB",
    "hdbank": "HDB",
    "vib": "VIB",
    "msb": "MSB",
    "shb": "SHB",
    "pvcombank": "PVCB",
    "eximbank": "EIB",
    "bvbank": "BVB",
};

function getBankCode(bankName?: string | null): string | null {
    if (!bankName) return null;
    const key = bankName.toLowerCase().replace(/\(.*?\)/g, "").trim();
    for (const [k, v] of Object.entries(BANK_CODE_MAP)) {
        if (key.includes(k)) return v;
    }
    return null;
}

function buildVietQR(
    bankName: string | null,
    accountNo: string | null,
    amount: number,
    description: string,
): string | null {
    const bankCode = getBankCode(bankName);
    if (!bankCode || !accountNo) return null;
    return (
        `https://img.vietqr.io/image/${bankCode}-${accountNo}-compact2.jpg` +
        `?amount=${amount}` +
        `&addInfo=${encodeURIComponent(description)}` +
        `&accountName=`
    );
}

/* ═══════════════ QR MODAL ═══════════════════════════════════════ */
function QRModal({ item, onClose, onDone }: {
    item: RefundItem;
    onClose: () => void;
    onDone: (id: string) => void;
}) {
    const [step, setStep] = useState<ModalStep>("qr");
    const [qrError, setQrError] = useState(false);
    const [txCode, setTxCode] = useState<string | null>(null);
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const refundAmt = item.refund_amount ?? Math.round((item.paid_amount ?? 0) * 0.7);
    const shortId = item.payment_id.slice(-8).toUpperCase();

    const description = `Hoan ${shortId} ${item.passenger_name}`.slice(0, 50);
    const qrUrl = buildVietQR(item.refund_bank, item.refund_account, refundAmt, description);

    // ── Polling mỗi 3s ───────────────────────────────────────────
    useEffect(() => {
        if (step === "success") return;

        pollRef.current = setInterval(async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(
                    `${API}/api/receptionist/check/refunds/${item.payment_id}/status`,
                    { headers: { Authorization: `Bearer ${token}` } },
                );

                // 400 = REFUND_PENDING → bỏ qua, đợi tiếp
                // 404/500 = lỗi → bỏ qua, đợi tiếp
                if (!res.ok) return;

                const json = await res.json();

                // Chỉ thành công khi đúng REFUND_SUCCESS
                if (json.payment_status === "REFUND_SUCCESS") {
                    clearInterval(pollRef.current!);
                    setTxCode(json.refund_transaction_code ?? null);
                    setStep("success");
                    onDone(item.payment_id);
                }
            } catch { /* lỗi mạng → bỏ qua, poll tiếp */ }
        }, 3000);

        return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }, [step, item.payment_id, onDone]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">

                {/* Header */}
                <div className={`px-6 py-5 flex items-start justify-between flex-shrink-0
                    ${step === "success"
                        ? "bg-gradient-to-r from-green-500 to-emerald-500"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600"}`}>
                    <div>
                        <p className="text-white font-black text-lg">
                            {step === "success" ? "🎉 Hoàn tiền thành công!" : "Chuyển khoản hoàn tiền"}
                        </p>
                        <p className="text-white/80 text-sm mt-0.5">
                            {item.passenger_name} · {item.passenger_phone}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center flex-shrink-0">
                        <X size={18} className="text-white" />
                    </button>
                </div>

                <div className="overflow-y-auto flex-1 p-6">

                    {/* ══ STEP: QR ══ */}
                    {step === "qr" && (
                        <div className="space-y-4">

                            {/* Hướng dẫn */}
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm">
                                <p className="font-bold text-blue-700 mb-1">📱 Hướng dẫn</p>
                                <p className="text-slate-600">
                                    Dùng app ngân hàng công ty quét QR bên dưới để chuyển{" "}
                                    <b className="text-green-700">{fmtCurrency(refundAmt)}</b> cho khách.
                                    Hệ thống tự xác nhận khi SePay ghi nhận giao dịch.
                                </p>
                            </div>

                            {/* Số tiền + ghế */}
                            <div className="bg-green-50 rounded-2xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">Số tiền hoàn (70%)</p>
                                    <p className="text-2xl font-black text-green-700">{fmtCurrency(refundAmt)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        / {fmtCurrency(item.paid_amount)} đã thanh toán
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 mb-1">Ghế</p>
                                    <div className="flex gap-1 flex-wrap justify-end">
                                        {item.seat_labels.map((s) => (
                                            <span key={s} className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md">
                                                🪑 {s}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin TK khách */}
                            <div className="bg-slate-50 rounded-xl px-4 py-3 text-sm space-y-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                    Tài khoản nhận (khách hàng)
                                </p>
                                <div className="flex items-center gap-2">
                                    <CreditCard size={14} className="text-blue-500 flex-shrink-0" />
                                    <span className="font-black text-blue-800 tracking-widest text-base">
                                        {item.refund_account ?? "—"}
                                    </span>
                                </div>
                                {item.refund_bank && (
                                    <p className="text-slate-600 font-semibold">🏦 {item.refund_bank}</p>
                                )}
                                <div className="flex items-center gap-1.5 text-slate-500">
                                    <Phone size={12} />
                                    <span>{item.passenger_phone}</span>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="flex flex-col items-center gap-3">
                                {qrUrl && !qrError ? (
                                    <>
                                        <div className="bg-white border-4 border-blue-100 rounded-2xl p-3 shadow-inner">
                                            <img
                                                src={qrUrl}
                                                alt="VietQR"
                                                className="w-60 h-60 object-contain"
                                                onError={() => setQrError(true)}
                                            />
                                        </div>
                                        <div className="w-full bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5 text-center">
                                            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-wide">
                                                Nội dung chuyển khoản
                                            </p>
                                            <p className="font-black text-yellow-800 mt-0.5 break-all">{description}</p>
                                        </div>
                                    </>
                                ) : (
                                    <div className="w-full bg-orange-50 border border-orange-200 rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
                                        <QrCode size={36} className="text-orange-300" />
                                        <p className="text-sm font-semibold text-orange-700">
                                            {!item.refund_account
                                                ? "Khách chưa cung cấp số tài khoản"
                                                : !getBankCode(item.refund_bank)
                                                    ? `Ngân hàng "${item.refund_bank}" chưa hỗ trợ QR tự động`
                                                    : "Không tải được QR — kiểm tra lại thông tin TK"}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            Liên hệ khách qua SĐT: <b>{item.passenger_phone}</b>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Polling indicator */}
                            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 pt-1">
                                <Loader2 size={13} className="animate-spin text-blue-400" />
                                <span>Đang chờ SePay xác nhận giao dịch...</span>
                            </div>
                        </div>
                    )}

                    {/* ══ STEP: SUCCESS ══ */}
                    {step === "success" && (
                        <div className="flex flex-col items-center justify-center py-6 gap-4 text-center">
                            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                                <PartyPopper size={40} className="text-green-500" />
                            </div>
                            <div>
                                <p className="text-xl font-black text-slate-800">Chuyển khoản thành công!</p>
                                <p className="text-slate-500 text-sm mt-1">
                                    SePay đã ghi nhận giao dịch chuyển ra
                                </p>
                            </div>
                            <div className="bg-green-50 rounded-2xl p-4 w-full space-y-2 text-sm text-left">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Đã hoàn</span>
                                    <span className="font-black text-green-700">{fmtCurrency(refundAmt)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tài khoản nhận</span>
                                    <span className="font-bold">{item.refund_account ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Ngân hàng</span>
                                    <span className="font-bold">{item.refund_bank ?? "—"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Khách hàng</span>
                                    <span className="font-bold">{item.passenger_name}</span>
                                </div>
                                {txCode && (
                                    <div className="flex justify-between pt-1 border-t border-green-100">
                                        <span className="text-slate-500">Mã GD SePay</span>
                                        <span className="font-mono font-bold text-slate-700 text-xs">{txCode}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 flex-shrink-0">
                    {step === "qr" ? (
                        <div className="flex justify-between items-center gap-3">
                            <button onClick={onClose}
                                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                                Đóng
                            </button>
                            <p className="text-xs text-slate-400 text-right">
                                Tự động xác nhận sau khi SePay nhận giao dịch
                            </p>
                        </div>
                    ) : (
                        <button onClick={onClose}
                            className="w-full rounded-xl bg-green-500 hover:bg-green-600 text-white px-5 py-2.5 text-sm font-bold transition flex items-center justify-center gap-2">
                            <CheckCircle2 size={16} /> Đóng
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ═══════════════ MAIN PAGE ═══════════════════════════════════════ */
export default function LeTanRefundPage() {
    const [items, setItems] = useState<RefundItem[]>([]);
    const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 1 });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selected, setSelected] = useState<RefundItem | null>(null);

    const fetchList = useCallback(async (page: number) => {
        setError(null); setLoading(true);
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API}/api/receptionist/check/refunds?page=${page}&limit=20`,
                { headers: { Authorization: `Bearer ${token}` } });
            const json: { data?: RefundItem[]; pagination?: Pagination; message?: string } = await res.json();
            if (!res.ok) { setError(json.message ?? "Lỗi tải dữ liệu."); return; }
            setItems(json.data ?? []);
            setPagination(json.pagination ?? { page, limit: 20, total: 0, totalPages: 1 });
        } catch { setError("Lỗi kết nối."); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchList(currentPage); }, [currentPage, fetchList]);

    const handleDone = (paymentId: string) => {
        setItems((prev) => prev.filter((i) => i.payment_id !== paymentId));
        setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
    };

    const pageNumbers = (): number[] => {
        const t = pagination.totalPages;
        if (t <= 5) return Array.from({ length: t }, (_, i) => i + 1);
        if (currentPage <= 3) return [1, 2, 3, 4, 5];
        if (currentPage >= t - 2) return [t - 4, t - 3, t - 2, t - 1, t];
        return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">

                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800">Quản lý hoàn tiền</h1>
                        {!loading && (
                            <p className="text-sm text-slate-500 mt-0.5">
                                {pagination.total > 0
                                    ? <span className="text-red-500 font-bold">{pagination.total} vé cần hoàn tiền</span>
                                    : "Không có vé nào cần hoàn tiền"}
                            </p>
                        )}
                    </div>
                    <button onClick={() => fetchList(currentPage)} disabled={loading}
                        className="flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 size={36} className="animate-spin text-green-500" />
                        <p className="text-slate-500">Đang tải danh sách...</p>
                    </div>
                )}
                {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <AlertCircle size={40} className="text-red-400" />
                        <p className="text-slate-600 font-semibold">{error}</p>
                        <button onClick={() => fetchList(currentPage)}
                            className="mt-2 px-5 py-2 bg-green-500 text-white rounded-xl font-bold text-sm hover:bg-green-600">
                            Thử lại
                        </button>
                    </div>
                )}
                {!loading && !error && items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                        <BadgeCheck size={48} className="text-green-300" />
                        <p className="text-slate-500 font-semibold text-lg">Không có vé nào cần hoàn tiền</p>
                        <p className="text-slate-400 text-sm">Tất cả đã được xử lý ✅</p>
                    </div>
                )}

                {!loading && !error && items.length > 0 && (
                    <div className="space-y-4">
                        {items.map((item) => {
                            const refundAmt = item.refund_amount ?? Math.round((item.paid_amount ?? 0) * 0.7);
                            return (
                                <div key={item.payment_id}
                                    className="bg-white rounded-2xl shadow-md border border-green-100/60 overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="h-1 bg-red-400" />
                                    <div className="p-5">
                                        <div className="flex flex-wrap gap-4 items-start justify-between mb-4">
                                            <div>
                                                <p className="font-black text-slate-800">{item.passenger_name}</p>
                                                <div className="flex items-center gap-1.5 text-slate-500 mt-0.5">
                                                    <Phone size={12} />
                                                    <span className="text-sm">{item.passenger_phone}</span>
                                                </div>
                                                {item.seat_labels.length > 0 && (
                                                    <div className="flex gap-1 mt-1.5 flex-wrap">
                                                        {item.seat_labels.map((s) => (
                                                            <span key={s} className="bg-orange-100 text-orange-700 text-[11px] font-black px-2 py-0.5 rounded-md">🪑 {s}</span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-slate-400">Cần hoàn (70%)</p>
                                                <p className="text-xl font-black text-green-700">{fmtCurrency(refundAmt)}</p>
                                                <p className="text-xs text-slate-400">/ {fmtCurrency(item.paid_amount)} đã TT</p>
                                            </div>
                                        </div>

                                        <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
                                            <CreditCard size={16} className="text-blue-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">TK nhận hoàn của khách</p>
                                                {item.refund_bank && (
                                                    <p className="text-xs font-semibold text-blue-700 mt-0.5">🏦 {item.refund_bank}</p>
                                                )}
                                                {item.refund_account
                                                    ? <p className="font-black text-blue-800 text-base tracking-widest">{item.refund_account}</p>
                                                    : <p className="text-slate-400 italic text-xs">Chưa có TK — liên hệ SĐT</p>}
                                            </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 mb-4">
                                            {item.trip && (
                                                <div className="flex items-center gap-1">
                                                    <Bus size={12} className="text-slate-400" />
                                                    <span className="font-semibold">{item.trip.from ?? "?"} → {item.trip.to ?? "?"}</span>
                                                    <span>· {fmtTime(item.trip.departure_time)} {fmtDate(item.trip.departure_time)}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1">
                                                <Clock size={12} className="text-slate-400" />
                                                <span>Yêu cầu hủy {fmtDate(item.created_at)}</span>
                                            </div>
                                            {item.paid_at && (
                                                <span>· TT lúc {fmtTime(item.paid_at)} {fmtDate(item.paid_at)}</span>
                                            )}
                                        </div>

                                        <button onClick={() => setSelected(item)}
                                            className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 text-sm transition">
                                            <QrCode size={16} /> Hoàn tiền
                                        </button>
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
                                className={`w-8 h-8 rounded-full text-sm font-bold transition-all ${currentPage === page ? "bg-green-500 text-white" : "text-slate-600 hover:bg-slate-100"}`}>
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

            {selected && (
                <QRModal item={selected} onClose={() => setSelected(null)} onDone={handleDone} />
            )}
        </div>
    );
}