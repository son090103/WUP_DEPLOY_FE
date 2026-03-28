import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus, Edit, Trash2, X, Save, Loader2,
    AlertTriangle, ToggleLeft, ToggleRight,
    DollarSign, Calendar, Tag, CheckCircle2,
    ChevronDown, ChevronUp, Bike, Truck, ChevronLeft,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

/* ─── Types ─────────────────────────────────── */
type SizePrices = { SMALL: number; MEDIUM: number; LARGE: number };

type PricingRow = {
    _id: string;
    name: string;
    description: string;
    type: "DEFAULT" | "HOLIDAY";
    effective_from?: string;
    effective_to?: string;
    price_per_kg: number;
    document_price_per_kg: number;
    volumetric_divisor: number;
    bicycle_price: SizePrices;
    motorcycle_price: SizePrices;
    isActive: boolean;
    created_at: string;
    updated_at?: string;
};

type FormData = {
    name: string;
    description: string;
    type: "DEFAULT" | "HOLIDAY";
    effective_from: string;
    effective_to: string;
    price_per_kg: string;
    document_price_per_kg: string;
    volumetric_divisor: string;
    bicycle_SMALL: string; bicycle_MEDIUM: string; bicycle_LARGE: string;
    motorcycle_SMALL: string; motorcycle_MEDIUM: string; motorcycle_LARGE: string;
    isActive: boolean;
};

/* ─── Auth ───────────────────────────────────── */
const authHeaders = () => {
    const t = localStorage.getItem("accessToken") ?? "";
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

const fmt = (n: number) => n.toLocaleString("vi-VN") + "đ";
const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

const iCls = "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-3 py-2 text-sm font-medium text-[#4a3426] placeholder-[#c4a88a] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20";

const Lbl: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-1">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const PriceInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div>
        <label className="block text-xs text-gray-500 mb-1">{label}</label>
        <div className="relative">
            <input type="number" min="0" step="1000" value={value} onChange={(e) => onChange(e.target.value)}
                className={iCls + " pr-6"} placeholder="0" />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">đ</span>
        </div>
    </div>
);

/* ═══════════════════════════════════════════════
   Main
═══════════════════════════════════════════════ */
const ManagePricing: React.FC = () => {
    const navigate = useNavigate();
    const [configs, setConfigs] = useState<PricingRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState(false);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    type ModalState = { open: boolean; editing?: PricingRow };
    const [modal, setModal] = useState<ModalState>({ open: false });
    const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);

    const empty: FormData = {
        name: "", description: "", type: "DEFAULT",
        effective_from: "", effective_to: "",
        price_per_kg: "20000", document_price_per_kg: "15000", volumetric_divisor: "5000",
        bicycle_SMALL: "100000", bicycle_MEDIUM: "150000", bicycle_LARGE: "200000",
        motorcycle_SMALL: "250000", motorcycle_MEDIUM: "350000", motorcycle_LARGE: "500000",
        isActive: true,
    };
    const [form, setForm] = useState<FormData>(empty);
    const [formErr, setFormErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    /* ═ Fetch ═ */
    const fetchConfigs = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/pricing`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi tải dữ liệu");
            const list = Array.isArray(data?.data) ? data.data : [];
            // Sort: DEFAULT lên đầu, sau đó HOLIDAY mới nhất
            list.sort((a: PricingRow, b: PricingRow) => {
                if (a.type !== b.type) return a.type === "DEFAULT" ? -1 : 1;
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
            setConfigs(list);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Lỗi");
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchConfigs(); }, [fetchConfigs]);

    /* ═ Toggle expand ═ */
    const toggleExpand = (id: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    /* ═ Toggle active ═ */
    const toggleActive = async (id: string) => {
        setToggling((p) => ({ ...p, [id]: true }));
        try {
            const cfg = configs.find((c) => c._id === id)!;
            const res = await fetch(`${API_BASE}/api/admin/check/pricing/${id}`, {
                method: "PATCH", headers: authHeaders(),
                body: JSON.stringify({ isActive: !cfg.isActive }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi");
            await fetchConfigs();
        } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi"); }
        finally { setToggling((p) => ({ ...p, [id]: false })); }
    };

    /* ═ Open modal ═ */
    const openCreate = () => { setForm(empty); setFormErr(null); setModal({ open: true }); };
    const openEdit = (c: PricingRow) => {
        const toDateInput = (d?: string) => d ? new Date(d).toISOString().slice(0, 10) : "";
        setForm({
            name: c.name, description: c.description, type: c.type,
            effective_from: toDateInput(c.effective_from),
            effective_to: toDateInput(c.effective_to),
            price_per_kg: String(c.price_per_kg),
            document_price_per_kg: String(c.document_price_per_kg),
            volumetric_divisor: String(c.volumetric_divisor),
            bicycle_SMALL: String(c.bicycle_price.SMALL),
            bicycle_MEDIUM: String(c.bicycle_price.MEDIUM),
            bicycle_LARGE: String(c.bicycle_price.LARGE),
            motorcycle_SMALL: String(c.motorcycle_price.SMALL),
            motorcycle_MEDIUM: String(c.motorcycle_price.MEDIUM),
            motorcycle_LARGE: String(c.motorcycle_price.LARGE),
            isActive: c.isActive,
        });
        setFormErr(null);
        setModal({ open: true, editing: c });
    };

    /* ═ Save ═ */
    const save = async () => {
        if (!form.name.trim()) { setFormErr("Tên bảng giá là bắt buộc"); return; }
        if (!form.price_per_kg) { setFormErr("Giá/kg là bắt buộc"); return; }
        if (form.type === "HOLIDAY" && (!form.effective_from || !form.effective_to)) { setFormErr("Giá ngày lễ cần có ngày bắt đầu và kết thúc"); return; }

        setSaving(true); setFormErr(null);
        try {
            const body = {
                name: form.name.trim(),
                description: form.description.trim(),
                type: form.type,
                effective_from: form.effective_from || null,
                effective_to: form.effective_to || null,
                price_per_kg: Number(form.price_per_kg),
                document_price_per_kg: Number(form.document_price_per_kg),
                volumetric_divisor: Number(form.volumetric_divisor),
                bicycle_price: { SMALL: Number(form.bicycle_SMALL), MEDIUM: Number(form.bicycle_MEDIUM), LARGE: Number(form.bicycle_LARGE) },
                motorcycle_price: { SMALL: Number(form.motorcycle_SMALL), MEDIUM: Number(form.motorcycle_MEDIUM), LARGE: Number(form.motorcycle_LARGE) },
                isActive: form.isActive,
            };
            const isEdit = !!modal.editing;
            const url = isEdit
                ? `${API_BASE}/api/admin/check/pricing/${modal.editing!._id}`
                : `${API_BASE}/api/admin/check/pricing`;
            const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(body) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi lưu");
            await fetchConfigs();
            setModal({ open: false });
        } catch (e: unknown) { setFormErr(e instanceof Error ? e.message : "Lỗi khi lưu"); }
        finally { setSaving(false); }
    };

    /* ═ Delete ═ */
    const handleDelete = async () => {
        if (!confirmDel) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/pricing/${confirmDel.id}`, { method: "DELETE", headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi xoá");
            await fetchConfigs();
            setConfirmDel(null);
        } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi"); }
        finally { setDeleting(false); }
    };

    /* ════════ RENDER ════════ */
    const activeDefault = configs.find((c) => c.type === "DEFAULT" && c.isActive);
    const activeHoliday = configs.find((c) => c.type === "HOLIDAY" && c.isActive && c.effective_from && c.effective_to &&
        new Date() >= new Date(c.effective_from) && new Date() <= new Date(c.effective_to));

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
                        <ChevronLeft size={25} strokeWidth={2.3} />
                    </button>
                    <div>
                        <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý bảng giá</h1>
                        <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">Cấu hình giá vận chuyển hàng hoá</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706] shrink-0">
                    <Plus size={17} /> Thêm bảng giá
                </button>
            </div>

            {/* Active indicator */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={`rounded-2xl border p-4 flex items-start gap-3 ${activeHoliday ? "bg-amber-50 border-amber-200" : "bg-gray-50 border-gray-200"}`}>
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeHoliday ? "bg-amber-100" : "bg-gray-100"}`}>
                        <Calendar size={18} className={activeHoliday ? "text-amber-600" : "text-gray-400"} />
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Đang áp dụng</p>
                        {activeHoliday ? (
                            <>
                                <p className="font-bold text-amber-700 text-sm mt-0.5">{activeHoliday.name}</p>
                                <p className="text-xs text-amber-600">{fmtDate(activeHoliday.effective_from)} → {fmtDate(activeHoliday.effective_to)}</p>
                            </>
                        ) : (
                            <p className="text-sm text-gray-500 mt-0.5">{activeDefault ? activeDefault.name : "Giá hệ thống (mặc định)"}</p>
                        )}
                    </div>
                    {(activeHoliday || activeDefault) && <CheckCircle2 size={16} className="ml-auto text-green-500 shrink-0 mt-0.5" />}
                </div>

                <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-orange-500 mb-2">Giá đang hiệu lực</p>
                    {(() => {
                        const active = activeHoliday ?? activeDefault;
                        if (!active) return <p className="text-sm text-gray-500">Dùng giá hệ thống</p>;
                        return (
                            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-700">
                                <span>Hàng thường: <b className="text-orange-600">{fmt(active.price_per_kg)}/kg</b></span>
                                <span>Giấy tờ: <b className="text-orange-600">{fmt(active.document_price_per_kg)}/kg</b></span>
                                <span>Xe đạp mini: <b className="text-orange-600">{fmt(active.bicycle_price.SMALL)}</b></span>
                                <span>Xe máy ≤50cc: <b className="text-orange-600">{fmt(active.motorcycle_price.SMALL)}</b></span>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 size={24} className="animate-spin text-[#FF5722]" />
                        <span className="text-sm">Đang tải...</span>
                    </div>
                ) : error ? (
                    <div className="p-10 text-center text-red-500 text-sm">{error}
                        <button onClick={fetchConfigs} className="block mx-auto mt-2 text-xs text-gray-400 underline">Thử lại</button>
                    </div>
                ) : configs.length === 0 ? (
                    <div className="p-14 text-center text-gray-400 text-sm">
                        <DollarSign size={32} className="mx-auto mb-2 text-gray-300" />
                        Chưa có bảng giá nào. Thêm bảng giá đầu tiên!
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {configs.map((c) => {
                            const isExpanded = expanded.has(c._id);
                            const isHoliday = c.type === "HOLIDAY";
                            const now = new Date();
                            const inRange = isHoliday && c.effective_from && c.effective_to &&
                                now >= new Date(c.effective_from) && now <= new Date(c.effective_to);

                            return (
                                <div key={c._id} className={`transition-colors ${c.isActive ? "" : "opacity-60"}`}>
                                    {/* Row header */}
                                    <div className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/60">
                                        {/* Type badge */}
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isHoliday ? "bg-amber-100" : "bg-blue-100"}`}>
                                            {isHoliday ? <Calendar size={16} className="text-amber-600" /> : <Tag size={16} className="text-blue-600" />}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-semibold text-gray-900 text-sm">{c.name}</p>
                                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isHoliday ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                                                    {isHoliday ? "Ngày lễ" : "Mặc định"}
                                                </span>
                                                {inRange && <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">✓ Đang áp dụng</span>}
                                            </div>
                                            {c.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{c.description}</p>}
                                            {isHoliday && <p className="text-xs text-amber-600 mt-0.5">{fmtDate(c.effective_from)} → {fmtDate(c.effective_to)}</p>}
                                        </div>

                                        {/* Giá tóm tắt */}
                                        <div className="hidden md:flex items-center gap-6 text-xs text-gray-600 shrink-0">
                                            <span>{fmt(c.price_per_kg)}<span className="text-gray-400">/kg</span></span>
                                            <span className="text-gray-300">|</span>
                                            <span className="flex items-center gap-1"><Bike size={12} /> {fmt(c.bicycle_price.MEDIUM)}</span>
                                            <span className="flex items-center gap-1"><Truck size={12} /> {fmt(c.motorcycle_price.MEDIUM)}</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            {toggling[c._id] ? <Loader2 size={14} className="animate-spin text-[#FF5722]" /> : (
                                                <button onClick={() => toggleActive(c._id)}
                                                    className={`p-1.5 rounded-lg text-xs font-semibold transition ${c.isActive
                                                        ? "text-green-600 hover:bg-green-50"
                                                        : "text-gray-400 hover:bg-gray-100"}`}>
                                                    {c.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                                </button>
                                            )}
                                            <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5722] hover:bg-orange-50 transition"><Edit size={14} /></button>
                                            <button onClick={() => setConfirmDel({ id: c._id, name: c.name })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                                            <button onClick={() => toggleExpand(c._id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition">
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded detail */}
                                    {isExpanded && (
                                        <div className="px-5 pb-5 bg-gray-50/50">
                                            <div className="rounded-xl border border-gray-200 bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase text-gray-400 mb-2">Hàng thường / Other</p>
                                                    <p>{fmt(c.price_per_kg)}<span className="text-gray-400 text-xs">/kg</span></p>
                                                    <p className="text-xs text-gray-400 mt-1">Divisor: {c.volumetric_divisor}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase text-gray-400 mb-2">Giấy tờ</p>
                                                    <p>{fmt(c.document_price_per_kg)}<span className="text-gray-400 text-xs">/kg</span></p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1"><Bike size={11} />Xe đạp</p>
                                                    <p className="text-xs">Mini: <b>{fmt(c.bicycle_price.SMALL)}</b></p>
                                                    <p className="text-xs">Thường: <b>{fmt(c.bicycle_price.MEDIUM)}</b></p>
                                                    <p className="text-xs">Thể thao: <b>{fmt(c.bicycle_price.LARGE)}</b></p>
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-bold uppercase text-gray-400 mb-2 flex items-center gap-1"><Truck size={11} />Xe máy</p>
                                                    <p className="text-xs">≤50cc: <b>{fmt(c.motorcycle_price.SMALL)}</b></p>
                                                    <p className="text-xs">51-150cc: <b>{fmt(c.motorcycle_price.MEDIUM)}</b></p>
                                                    <p className="text-xs">&gt;150cc: <b>{fmt(c.motorcycle_price.LARGE)}</b></p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ══ Modal ══ */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-[0_30px_60px_-25px_rgba(181,98,27,0.45)] border border-[#f2e5d8] w-full max-w-2xl overflow-hidden">
                        <div className="px-7 pt-7 pb-5 border-b border-[#f2e5d8] flex items-start justify-between">
                            <div>
                                <div className="w-10 h-10 bg-[#fff3e0] rounded-2xl flex items-center justify-center mb-3"><DollarSign size={20} className="text-[#FF5722]" /></div>
                                <h3 className="text-lg font-black text-[#2f2118]">{modal.editing ? "Chỉnh sửa bảng giá" : "Thêm bảng giá mới"}</h3>
                                <p className="text-sm text-[#7c5f4a] mt-0.5">{modal.editing ? modal.editing.name : "Cấu hình giá vận chuyển"}</p>
                            </div>
                            <button onClick={() => setModal({ open: false })} className="p-2 rounded-xl text-[#b58460] hover:bg-[#fff3e0] transition"><X size={20} /></button>
                        </div>

                        <div className="px-7 py-5 space-y-5 max-h-[65vh] overflow-y-auto">
                            {/* Tên & loại */}
                            <div className="grid grid-cols-2 gap-4">
                                <Lbl label="Tên bảng giá" required>
                                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tết Nguyên Đán 2025" className={iCls} />
                                </Lbl>
                                <Lbl label="Loại" required>
                                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "DEFAULT" | "HOLIDAY" })} className={iCls + " cursor-pointer"}>
                                        <option value="DEFAULT">Mặc định</option>
                                        <option value="HOLIDAY">Ngày lễ / Sự kiện</option>
                                    </select>
                                </Lbl>
                            </div>

                            <Lbl label="Mô tả">
                                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Giá áp dụng dịp Tết..." className={iCls} />
                            </Lbl>

                            {/* Thời gian — chỉ hiện khi HOLIDAY */}
                            {form.type === "HOLIDAY" && (
                                <div className="grid grid-cols-2 gap-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                    <Lbl label="Ngày bắt đầu" required>
                                        <input type="date" value={form.effective_from} onChange={(e) => setForm({ ...form, effective_from: e.target.value })} className={iCls} />
                                    </Lbl>
                                    <Lbl label="Ngày kết thúc" required>
                                        <input type="date" value={form.effective_to} onChange={(e) => setForm({ ...form, effective_to: e.target.value })} className={iCls} />
                                    </Lbl>
                                </div>
                            )}

                            {/* Giá per kg */}
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2">Giá theo kg</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <PriceInput label="Hàng thường / cồng kềnh (/kg) *" value={form.price_per_kg} onChange={(v) => setForm({ ...form, price_per_kg: v })} />
                                    <PriceInput label="Giấy tờ / tài liệu (/kg) *" value={form.document_price_per_kg} onChange={(v) => setForm({ ...form, document_price_per_kg: v })} />
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1">Volumetric divisor</label>
                                        <input type="number" min="1" value={form.volumetric_divisor} onChange={(e) => setForm({ ...form, volumetric_divisor: e.target.value })} className={iCls} placeholder="5000" />
                                        <p className="text-[10px] text-gray-400 mt-0.5">Thường = 5000</p>
                                    </div>
                                </div>
                            </div>

                            {/* Xe đạp */}
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2 flex items-center gap-1"><Bike size={12} />Giá xe đạp (cố định)</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <PriceInput label="SMALL – Xe đạp mini" value={form.bicycle_SMALL} onChange={(v) => setForm({ ...form, bicycle_SMALL: v })} />
                                    <PriceInput label="MEDIUM – Xe đạp thường" value={form.bicycle_MEDIUM} onChange={(v) => setForm({ ...form, bicycle_MEDIUM: v })} />
                                    <PriceInput label="LARGE – Xe đạp thể thao" value={form.bicycle_LARGE} onChange={(v) => setForm({ ...form, bicycle_LARGE: v })} />
                                </div>
                            </div>

                            {/* Xe máy */}
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2 flex items-center gap-1"><Truck size={12} />Giá xe máy (cố định)</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <PriceInput label="SMALL – ≤50cc / xe điện" value={form.motorcycle_SMALL} onChange={(v) => setForm({ ...form, motorcycle_SMALL: v })} />
                                    <PriceInput label="MEDIUM – 51-150cc" value={form.motorcycle_MEDIUM} onChange={(v) => setForm({ ...form, motorcycle_MEDIUM: v })} />
                                    <PriceInput label="LARGE – >150cc (SH, Exciter)" value={form.motorcycle_LARGE} onChange={(v) => setForm({ ...form, motorcycle_LARGE: v })} />
                                </div>
                            </div>

                            {/* Trạng thái */}
                            <div className="flex items-center gap-3 pt-1">
                                <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                    className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? "bg-[#FF5722]" : "bg-gray-300"}`}>
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
                                </button>
                                <span className="text-sm text-gray-700 font-medium">
                                    {form.isActive ? "Kích hoạt ngay" : "Lưu nhưng chưa kích hoạt"}
                                </span>
                            </div>

                            {form.type === "DEFAULT" && form.isActive && (
                                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2.5 rounded-xl">
                                    <AlertTriangle size={13} className="mt-0.5 shrink-0" />
                                    Kích hoạt bảng giá DEFAULT mới sẽ tự động tắt bảng giá DEFAULT hiện tại.
                                </div>
                            )}

                            {formErr && (
                                <div className="flex items-start gap-2 bg-[#fff7ed] border border-[#f2d5b8] text-[#c2410c] text-sm px-4 py-3 rounded-xl">
                                    <X size={14} className="mt-0.5 shrink-0" />{formErr}
                                </div>
                            )}
                        </div>

                        <div className="px-7 pb-7 pt-4 border-t border-[#f2e5d8] flex gap-3">
                            <button onClick={() => setModal({ open: false })} disabled={saving}
                                className="flex-1 py-2.5 border border-[#e6d5c3] rounded-xl text-sm font-semibold text-[#7c5f4a] hover:bg-[#fff7ed] transition disabled:opacity-50">Huỷ</button>
                            <button onClick={save} disabled={saving}
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={14} />{modal.editing ? "Lưu thay đổi" : "Tạo bảng giá"}</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══ Confirm xoá ══ */}
            {confirmDel && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl border border-red-100 w-full max-w-sm p-6">
                        <div className="flex items-start gap-3 mb-5">
                            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle size={20} className="text-red-500" /></div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">Xác nhận xoá</p>
                                <p className="text-sm text-gray-500 mt-1">Xoá bảng giá "{confirmDel.name}"?</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDel(null)} disabled={deleting} className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Huỷ</button>
                            <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50">
                                {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xoá
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePricing;