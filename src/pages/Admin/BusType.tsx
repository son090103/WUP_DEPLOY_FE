import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Plus, Edit, Trash2, X, Save, Loader2,
    ChevronLeft, ChevronRight, AlertTriangle,
    ToggleLeft, ToggleRight, Bus, Search,
    Wifi, Wind, Tv, Zap, Coffee, Droplets, Cookie, BedDouble,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

type BusTypeRow = {
    _id: string; name: string; description: string;
    category: string; amenities: string[]; isActive: boolean;
};

const CATEGORIES = [
    { value: "SEAT", label: "Ghế ngồi", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { value: "SLEEPER", label: "Giường nằm", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { value: "LIMOUSINE", label: "Limousine", color: "bg-amber-100 text-amber-700 border-amber-200" },
    { value: "VIP", label: "VIP", color: "bg-rose-100 text-rose-700 border-rose-200" },
    { value: "OTHER", label: "Khác", color: "bg-gray-100 text-gray-600 border-gray-200" },
];

const AMENITIES_LIST = [
    { value: "AC", label: "Điều hoà", icon: Wind },
    { value: "WIFI", label: "WiFi", icon: Wifi },
    { value: "USB", label: "Sạc USB", icon: Zap },
    { value: "TV", label: "TV", icon: Tv },
    { value: "TOILET", label: "Toilet", icon: Droplets },
    { value: "BLANKET", label: "Chăn/Gối", icon: BedDouble },
    { value: "WATER", label: "Nước uống", icon: Coffee },
    { value: "SNACK", label: "Đồ ăn nhẹ", icon: Cookie },
];

const getCat = (v: string) =>
    CATEGORIES.find((c) => c.value === v) ?? { label: v, color: "bg-gray-100 text-gray-600 border-gray-200" };

const authHeaders = () => {
    const t = localStorage.getItem("accessToken") ?? "";
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

const iCls = "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-3.5 py-2.5 text-sm font-medium text-[#4a3426] placeholder-[#c4a88a] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20";
const sCls = iCls + " cursor-pointer";

const Lbl: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const ManageBusType: React.FC = () => {
    const navigate = useNavigate();
    const [busTypes, setBusTypes] = useState<BusTypeRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("");
    const [statFilter, setStatFilter] = useState("");
    const [page, setPage] = useState(1);
    const PER = 8;

    type ModalState = { open: boolean; editing?: BusTypeRow };
    const [modal, setModal] = useState<ModalState>({ open: false });
    const [confirmDel, setConfirmDel] = useState<{ id: string; name: string } | null>(null);

    const emptyForm = { name: "", description: "", category: "", amenities: [] as string[], isActive: true };
    const [form, setForm] = useState(emptyForm);
    const [formErr, setFormErr] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    const fetchBusTypes = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const params = new URLSearchParams();
            if (search) params.set("search", search);
            if (catFilter) params.set("category", catFilter);
            if (statFilter) params.set("isActive", statFilter);
            const res = await fetch(`${API_BASE}/api/admin/check/busTypes?${params}`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
            const list = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
            setBusTypes(list);
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu");
            setBusTypes([]);
        } finally { setLoading(false); }
    }, [search, catFilter, statFilter]);

    useEffect(() => { fetchBusTypes(); }, [fetchBusTypes]);

    const totalPages = Math.max(1, Math.ceil(busTypes.length / PER));
    const paged = busTypes.slice((page - 1) * PER, page * PER);
    const totalActive = useMemo(() => busTypes.filter((b) => b.isActive).length, [busTypes]);
    const totalOff = useMemo(() => busTypes.filter((b) => !b.isActive).length, [busTypes]);

    const toggleBusType = async (id: string) => {
        setToggling((p) => ({ ...p, [id]: true }));
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/busTypes/${id}/toggle`, { method: "PATCH", headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message);
            setBusTypes((prev) => prev.map((b) => b._id === id ? { ...b, isActive: data.data?.isActive ?? !b.isActive } : b));
        } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi"); }
        finally { setToggling((p) => ({ ...p, [id]: false })); }
    };

    const openCreate = () => { setForm(emptyForm); setFormErr(null); setModal({ open: true }); };
    const openEdit = (b: BusTypeRow) => {
        setForm({ name: b.name, description: b.description, category: b.category, amenities: [...b.amenities], isActive: b.isActive });
        setFormErr(null);
        setModal({ open: true, editing: b });
    };

    const save = async () => {
        if (!form.name.trim()) { setFormErr("Tên loại xe là bắt buộc"); return; }
        if (!form.category) { setFormErr("Vui lòng chọn danh mục"); return; }
        setSaving(true); setFormErr(null);
        try {
            const isEdit = !!modal.editing;
            const url = isEdit
                ? `${API_BASE}/api/admin/check/busTypes/${modal.editing!._id}`
                : `${API_BASE}/api/admin/check/busTypes`;
            const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: authHeaders(), body: JSON.stringify(form) });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi lưu");
            await fetchBusTypes();
            setModal({ open: false });
        } catch (e: unknown) { setFormErr(e instanceof Error ? e.message : "Lỗi khi lưu"); }
        finally { setSaving(false); }
    };

    const handleDelete = async () => {
        if (!confirmDel) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/busTypes/${confirmDel.id}`, { method: "DELETE", headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi xoá");
            await fetchBusTypes();
            setConfirmDel(null);
        } catch (e: unknown) { alert(e instanceof Error ? e.message : "Lỗi khi xoá"); }
        finally { setDeleting(false); }
    };

    const toggleAmenity = (v: string) => {
        setForm((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(v) ? prev.amenities.filter((a) => a !== v) : [...prev.amenities, v],
        }));
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
                        <ChevronLeft size={25} strokeWidth={2.3} />
                    </button>
                    <div>
                        <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý loại xe</h1>
                        <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">Thêm, sửa và quản lý các loại xe buýt</p>
                    </div>
                </div>
                <button onClick={openCreate}
                    className="inline-flex items-center gap-2 rounded-[10px] bg-[#f59e0b] px-4 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#d97706] shrink-0">
                    <Plus size={17} /> Thêm loại xe
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Tổng loại xe", value: busTypes.length, color: "text-gray-900", sub: "Trong hệ thống" },
                    { label: "Đang hoạt động", value: totalActive, color: "text-green-600", sub: "Đang khai thác" },
                    { label: "Đã tắt", value: totalOff, color: "text-red-500", sub: "Ngưng sử dụng" },
                ].map(({ label, value, color, sub }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-600">{label}</p>
                        <p className={`text-3xl font-black mt-1 ${color}`}>{value}</p>
                        <p className={`text-xs mt-1 ${color === "text-gray-900" ? "text-gray-400" : color}`}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Filters */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap gap-3">
                    <div className="relative flex-1 min-w-[200px]">
                        <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm tên loại xe..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100" />
                        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <select value={catFilter} onChange={(e) => { setCatFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-orange-300 cursor-pointer">
                        <option value="">Tất cả danh mục</option>
                        {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                    <select value={statFilter} onChange={(e) => { setStatFilter(e.target.value); setPage(1); }}
                        className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-orange-300 cursor-pointer">
                        <option value="">Tất cả trạng thái</option>
                        <option value="true">Hoạt động</option>
                        <option value="false">Đã tắt</option>
                    </select>
                </div>

                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="p-12 flex flex-col items-center gap-2 text-gray-400">
                            <Loader2 size={24} className="animate-spin text-[#FF5722]" />
                            <span className="text-sm">Đang tải...</span>
                        </div>
                    ) : error ? (
                        <div className="p-10 text-center text-red-500 text-sm">{error}
                            <button onClick={fetchBusTypes} className="block mx-auto mt-2 text-xs text-gray-400 underline">Thử lại</button>
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gray-100 bg-gray-50/60">
                                    <th className="px-5 py-3.5">#</th>
                                    <th className="px-5 py-3.5">Tên loại xe</th>
                                    <th className="px-5 py-3.5">Danh mục</th>
                                    <th className="px-5 py-3.5">Tiện ích</th>
                                    <th className="px-5 py-3.5 text-center">Trạng thái</th>
                                    <th className="px-5 py-3.5 text-right">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-14 text-center text-gray-400 text-sm">
                                        <Bus size={32} className="mx-auto mb-2 text-gray-300" />
                                        Không có loại xe nào
                                    </td></tr>
                                ) : paged.map((b, idx) => {
                                    const cat = getCat(b.category);
                                    return (
                                        <tr key={b._id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                                            <td className="px-5 py-3.5 text-gray-400 text-xs">{(page - 1) * PER + idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-9 h-9 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                                        <Bus size={16} className="text-[#FF5722]" />
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{b.name}</p>
                                                        {b.description && <p className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{b.description}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full border ${cat.color}`}>
                                                    {cat.label}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex flex-wrap gap-1">
                                                    {b.amenities.length === 0 ? <span className="text-xs text-gray-400">—</span>
                                                        : b.amenities.map((a) => {
                                                            const am = AMENITIES_LIST.find((x) => x.value === a);
                                                            const Icon = am?.icon;
                                                            return (
                                                                <span key={a} className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                                                                    {Icon && <Icon size={10} />}{am?.label ?? a}
                                                                </span>
                                                            );
                                                        })}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                {toggling[b._id] ? <Loader2 size={14} className="animate-spin text-[#FF5722] mx-auto" /> : (
                                                    <button onClick={() => toggleBusType(b._id)}
                                                        className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${b.isActive
                                                            ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                            : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}>
                                                        {b.isActive ? <><ToggleRight size={14} /> Hoạt động</> : <><ToggleLeft size={14} /> Đã tắt</>}
                                                    </button>
                                                )}
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(b)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5722] hover:bg-orange-50 transition"><Edit size={14} /></button>
                                                    <button onClick={() => setConfirmDel({ id: b._id, name: b.name })} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/40">
                    <span className="text-xs text-gray-400">{busTypes.length} loại xe</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition"><ChevronLeft size={16} /></button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${page === p ? "bg-[#FF5722] text-white" : "text-gray-600 hover:bg-gray-200"}`}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* ══ Modal thêm/sửa ══ */}
            {modal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-[0_30px_60px_-25px_rgba(181,98,27,0.45)] border border-[#f2e5d8] w-full max-w-lg overflow-hidden">
                        <div className="px-7 pt-7 pb-5 border-b border-[#f2e5d8] flex items-start justify-between">
                            <div>
                                <div className="w-10 h-10 bg-[#fff3e0] rounded-2xl flex items-center justify-center mb-3"><Bus size={20} className="text-[#FF5722]" /></div>
                                <h3 className="text-lg font-black text-[#2f2118]">{modal.editing ? "Chỉnh sửa loại xe" : "Thêm loại xe mới"}</h3>
                                <p className="text-sm text-[#7c5f4a] mt-0.5">{modal.editing ? modal.editing.name : "Điền thông tin loại xe"}</p>
                            </div>
                            <button onClick={() => setModal({ open: false })} className="p-2 rounded-xl text-[#b58460] hover:bg-[#fff3e0] transition"><X size={20} /></button>
                        </div>
                        <div className="px-7 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
                            <Lbl label="Tên loại xe" required>
                                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ghế ngồi 45 chỗ (Tiêu chuẩn)" className={iCls} />
                            </Lbl>
                            <Lbl label="Mô tả">
                                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Xe ghế ngồi phổ thông..." rows={2} className={iCls + " resize-none"} />
                            </Lbl>
                            <Lbl label="Danh mục" required>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={sCls}>
                                    <option value="">-- Chọn danh mục --</option>
                                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </Lbl>
                            <Lbl label="Tiện ích">
                                <div className="grid grid-cols-4 gap-2 mt-1">
                                    {AMENITIES_LIST.map(({ value, label, icon: Icon }) => {
                                        const active = form.amenities.includes(value);
                                        return (
                                            <button key={value} type="button" onClick={() => toggleAmenity(value)}
                                                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border text-[11px] font-semibold transition ${active
                                                    ? "bg-[#fff3e0] border-[#f39a32] text-[#e8791c]"
                                                    : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                                                <Icon size={16} className={active ? "text-[#e8791c]" : "text-gray-400"} />
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </Lbl>
                            <Lbl label="Trạng thái">
                                <div className="flex items-center gap-3">
                                    <button type="button" onClick={() => setForm({ ...form, isActive: !form.isActive })}
                                        className={`relative w-10 h-6 rounded-full transition-colors ${form.isActive ? "bg-[#FF5722]" : "bg-gray-300"}`}>
                                        <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.isActive ? "translate-x-4" : "translate-x-0"}`} />
                                    </button>
                                    <span className="text-sm text-gray-700 font-medium">{form.isActive ? "Hoạt động" : "Đã tắt"}</span>
                                </div>
                            </Lbl>
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
                                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_12px_24px_-10px_rgba(216,113,28,0.55)] hover:opacity-90 transition disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <><Save size={14} />{modal.editing ? "Lưu thay đổi" : "Tạo loại xe"}</>}
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
                                <p className="text-sm text-gray-500 mt-1">Xoá loại xe "{confirmDel.name}"? Hành động này không thể hoàn tác.</p>
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

export default ManageBusType;