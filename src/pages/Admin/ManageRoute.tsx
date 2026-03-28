import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Loader2, ChevronDown, ChevronRight as ChevronRt,
    MapPin, ToggleLeft, ToggleRight, DollarSign,
    Edit, Trash2, Plus, X, Save, AlertTriangle,
    ChevronLeft, ChevronRight,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL;

/* ─────────── Types ─────────── */
type StopAny = Record<string, unknown>;

type RouteRow = {
    _id: string;
    // BE trả về field "start" và "end" (không phải start_id/stop_id)
    start?: StopAny;
    end?: StopAny;
    // fallback nếu BE trả về start_id/stop_id
    start_id?: StopAny;
    stop_id?: StopAny;
    estimated_duration?: number;
    distance_km?: number;
    is_active: boolean;
    name?: string; // BE có thể trả về name ghép sẵn
};

type PriceRow = {
    _id: string;
    route_id: string;
    // BE có thể trả về start_id/end_id hoặc start/end
    start_id?: StopAny;
    end_id?: StopAny;
    start?: StopAny;
    end?: StopAny;
    bus_type_id?: { _id: string; name: string } | null;
    base_price: number;
    is_active: boolean;
};

type StopOpt = Record<string, unknown> & { _id: string };
type BusTypeOpt = { _id: string; name: string };

/* ─────────── Helpers ─────────── */
const authHeaders = () => {
    const t = localStorage.getItem("accessToken") ?? "";
    return { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) };
};

/** Thử nhiều field để lấy tên stop */
const stopName = (stop: StopAny | null | undefined): string => {
    // stop chưa populate → là string ObjectId
    if (!stop) return "—";
    if (typeof stop === "string") return `ID:${(stop as string).slice(-6)}`;
    if (typeof stop !== "object") return "—";
    // stop đã populate → là object với các fields
    const candidates = ["name", "title", "stop_name", "location_name", "label", "address", "province"];
    for (const k of candidates) {
        if (typeof stop[k] === "string" && (stop[k] as string).trim()) {
            return stop[k] as string;
        }
    }
    // fallback: lấy field string đầu tiên (bỏ qua _id, __v, các field đặc biệt)
    const skip = new Set(["_id", "__v", "is_active", "created_at", "updatedAt"]);
    for (const [k, v] of Object.entries(stop)) {
        if (!skip.has(k) && typeof v === "string" && v.trim()) return v;
    }
    const id = (stop._id ?? "") as string;
    return id ? `ID:${id.slice(-6)}` : "Chưa có tên";
};

/** Hiển thị tên stop kèm tỉnh nếu có */
const stopLabel = (stop: StopAny | null | undefined): string => {
    if (!stop || typeof stop !== "object") return stopName(stop);
    const name = stop.name as string | undefined;
    const province = stop.province as string | undefined;
    if (name && province && name !== province) return `${province} – ${name}`;
    return name ?? stopName(stop);
};

/** Trích xuất array từ bất kỳ response shape nào */
const extractArray = <T,>(data: unknown, ...extraPaths: string[][]): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === "object") {
        const d = data as Record<string, unknown>;
        if (Array.isArray(d.data)) return d.data as T[];
        // thử các path phụ
        for (const path of extraPaths) {
            let cur: unknown = d;
            for (const key of path) {
                cur = (cur as Record<string, unknown>)?.[key];
            }
            if (Array.isArray(cur)) return cur as T[];
        }
    }
    return [];
};

const fmtPrice = (n: number | undefined | null) => (n == null || isNaN(Number(n))) ? "—" : Number(n).toLocaleString("vi-VN") + " ₫";
const fmtKm = (n?: number) => n == null ? "—" : `${n} km`;
const fmtH = (n?: number) => n == null ? "—" : `${n}h`;

/* ─────────── UI atoms ─────────── */
const iCls = "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-3.5 py-2.5 text-sm font-medium text-[#4a3426] placeholder-[#c4a88a] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20";
const sCls = "w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-3.5 py-2.5 text-sm font-medium text-[#4a3426] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20 cursor-pointer";

const Lbl: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div>
        <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-1.5">
            {label}{required && <span className="text-red-400 ml-0.5">*</span>}
        </label>
        {children}
    </div>
);

const Modal: React.FC<{
    title: string; sub?: string; icon: React.ReactNode;
    onClose: () => void; footer: React.ReactNode; children: React.ReactNode;
}> = ({ title, sub, icon, onClose, footer, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-3xl shadow-[0_30px_60px_-25px_rgba(181,98,27,0.45)] border border-[#f2e5d8] w-full max-w-md overflow-hidden">
            <div className="px-7 pt-7 pb-5 border-b border-[#f2e5d8] flex items-start justify-between">
                <div>
                    <div className="w-10 h-10 bg-[#fff3e0] rounded-2xl flex items-center justify-center mb-3">{icon}</div>
                    <h3 className="text-lg font-black text-[#2f2118]">{title}</h3>
                    {sub && <p className="text-sm text-[#7c5f4a] mt-0.5">{sub}</p>}
                </div>
                <button onClick={onClose} className="p-2 rounded-xl text-[#b58460] hover:bg-[#fff3e0] transition"><X size={20} /></button>
            </div>
            <div className="px-7 py-5 space-y-4 max-h-[58vh] overflow-y-auto">{children}</div>
            <div className="px-7 pb-7 pt-4 border-t border-[#f2e5d8] flex gap-3">{footer}</div>
        </div>
    </div>
);

const BtnPrimary: React.FC<{ onClick: () => void; loading?: boolean; disabled?: boolean; children: React.ReactNode }> =
    ({ onClick, loading, disabled, children }) => (
        <button onClick={onClick} disabled={loading || disabled}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-[0_12px_24px_-10px_rgba(216,113,28,0.55)] hover:opacity-90 transition disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin" /> : children}
        </button>
    );

const BtnSecondary: React.FC<{ onClick: () => void; disabled?: boolean; children: React.ReactNode }> =
    ({ onClick, disabled, children }) => (
        <button onClick={onClick} disabled={disabled}
            className="flex-1 py-2.5 border border-[#e6d5c3] rounded-xl text-sm font-semibold text-[#7c5f4a] hover:bg-[#fff7ed] transition disabled:opacity-50">
            {children}
        </button>
    );

const Confirm: React.FC<{ msg: string; onOk: () => void; onCancel: () => void; loading?: boolean }> =
    ({ msg, onOk, onCancel, loading }) => (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl border border-red-100 w-full max-w-sm p-6">
                <div className="flex items-start gap-3 mb-5">
                    <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} className="text-red-500" />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 text-sm">Xác nhận xoá</p>
                        <p className="text-sm text-gray-500 mt-1">{msg}</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={onCancel} disabled={loading}
                        className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">Huỷ</button>
                    <button onClick={onOk} disabled={loading}
                        className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50">
                        {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />} Xoá
                    </button>
                </div>
            </div>
        </div>
    );

/* ══════════════════════════════════════════════════════════════
   Main Component
══════════════════════════════════════════════════════════════════ */
const ManageRoute: React.FC = () => {
    const navigate = useNavigate();
    /* ── Data — khởi tạo luôn là [] để tránh lỗi slice ── */
    const [routes, setRoutes] = useState<RouteRow[]>([]);
    const [stops, setStops] = useState<StopOpt[]>([]);
    // RouteStop list cho tuyến đang mở modal giá
    const [routeStops, setRouteStops] = useState<StopOpt[]>([]);
    const [routeStopsLoading, setRouteStopsLoading] = useState(false);
    const [busTypes, setBusTypes] = useState<BusTypeOpt[]>([]);
    const [pricesMap, setPricesMap] = useState<Record<string, PriceRow[]>>({});
    const [loadingPriceMap, setLoadingPriceMap] = useState<Record<string, boolean>>({});

    /* ── UI ── */
    const [routeLoading, setRouteLoading] = useState(false);
    const [routeError, setRouteError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const [toggling, setToggling] = useState<Record<string, boolean>>({});
    const [deleting, setDeleting] = useState(false);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
    const [page, setPage] = useState(1);
    const PER = 8;

    /* ── Modals ── */
    type PriceModal = { open: boolean; editing?: PriceRow; routeId?: string };
    type DelConfirm = { id: string; routeId: string; label: string };

    const [priceModal, setPriceModal] = useState<PriceModal>({ open: false });
    const [confirmDel, setConfirmDel] = useState<DelConfirm | null>(null);

    // Inline edit giá vé
    const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
    const [editingValue, setEditingValue] = useState<string>("");
    const [savingInline, setSavingInline] = useState(false);

    // Inline edit loại xe
    const [editingBusTypeId, setEditingBusTypeId] = useState<string | null>(null);
    const [savingBusType, setSavingBusType] = useState(false);

    /* ── Price form ── */
    const emptyPF = { start_id: "", end_id: "", bus_type_id: "", base_price: "", is_active: true };
    const [pf, setPf] = useState(emptyPF);
    const [pfErr, setPfErr] = useState<string | null>(null);
    const [pfSaving, setPfSaving] = useState(false);

    /* ══ FETCH ══ */

    /** GET /api/admin/check/routes */
    const fetchRoutes = useCallback(async () => {
        setRouteLoading(true);
        setRouteError(null);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/routes`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
            // extractArray đảm bảo luôn trả về []
            // API trả về: { success, data: { routes: [], pagination: {} } }
            let list: RouteRow[] = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.data)) list = data.data;
            else if (Array.isArray(data?.data?.routes)) list = data.data.routes;
            else if (Array.isArray(data?.routes)) list = data.routes;
            // normalize: map start→start_id, end→stop_id nếu cần
            const normalized = list.map((r: RouteRow) => ({
                ...r,
                start_id: r.start_id ?? r.start,
                stop_id: r.stop_id ?? r.end,
            }));
            setRoutes(normalized);
        } catch (e: unknown) {
            setRouteError(e instanceof Error ? e.message : "Lỗi không xác định");
            setRoutes([]);
        } finally {
            setRouteLoading(false);
        }
    }, []);

    /** GET /api/admin/check/routes/:routeId/prices */
    const fetchPrices = useCallback(async (routeId: string) => {
        setLoadingPriceMap((p) => ({ ...p, [routeId]: true }));
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/routes/${routeId}/prices`, { headers: authHeaders() });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? `HTTP ${res.status}`);
            let list: PriceRow[] = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.data)) list = data.data;
            else if (Array.isArray(data?.data?.prices)) list = data.data.prices;
            else if (Array.isArray(data?.prices)) list = data.prices;
            // normalize start→start_id, end→end_id
            // Backend đã resolve thủ công → start_id/end_id có { name, province }
            const normPrices = list.map((p: PriceRow) => {
                const raw = p as Record<string, unknown>;
                const bp = raw.base_price ?? raw.price ?? raw.amount ?? raw.fare ?? 0;
                return {
                    ...p,
                    start_id: (p.start_id ?? p.start) as StopAny | undefined,
                    end_id: (p.end_id ?? p.end) as StopAny | undefined,
                    base_price: Number(bp) || 0,
                };
            });
            setPricesMap((prev) => ({ ...prev, [routeId]: normPrices }));
        } catch {
            setPricesMap((p) => ({ ...p, [routeId]: [] }));
        } finally {
            setLoadingPriceMap((p) => ({ ...p, [routeId]: false }));
        }
    }, []);

    /** GET stops */
    const fetchStops = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/getAllStops`, { headers: authHeaders() });
            const data = await res.json();
            setStops(extractArray<StopOpt>(data));
        } catch { setStops([]); }
    }, []);

    /** GET RouteStop list cho 1 tuyến — dùng làm options trong modal giá */
    const fetchRouteStops = useCallback(async (routeId: string) => {
        setRouteStopsLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/routes/${routeId}/stops`, { headers: authHeaders() });
            const data = await res.json();
            // RouteStop shape: { stop_id: { _id, name, province }, stop_order, ... }
            let list: StopOpt[] = [];
            if (Array.isArray(data)) list = data;
            else if (Array.isArray(data?.data)) list = data.data;
            else if (Array.isArray(data?.data?.stops)) list = data.data.stops;
            else if (Array.isArray(data?.stops)) list = data.stops;
            setRouteStops(list);
        } catch { setRouteStops([]); }
        finally { setRouteStopsLoading(false); }
    }, []);

    /** GET bus types */
    const fetchBusTypes = useCallback(async () => {
        // Thử nhiều endpoint — điều chỉnh đúng route BusType của project
        const endpoints = [
            `${API_BASE}/api/admin/notcheck/BusType`,
            `${API_BASE}/api/admin/check/busTypes`,
            `${API_BASE}/api/admin/check/bus-types`,
            `${API_BASE}/api/admin/notcheck/busTypes`,
        ];
        for (const url of endpoints) {
            try {
                const res = await fetch(url, { headers: authHeaders() });
                if (!res.ok) continue;
                const data = await res.json();
                const list = extractArray<BusTypeOpt>(data);
                if (list.length > 0) { setBusTypes(list); return; }
            } catch { continue; }
        }
        setBusTypes([]); // không tìm được → bỏ qua, không crash
    }, []);

    useEffect(() => {
        fetchRoutes();
        fetchStops();
        fetchBusTypes();
    }, []);

    /* ══ Expand ══ */
    const toggleExpand = (routeId: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(routeId)) {
                next.delete(routeId);
            } else {
                next.add(routeId);
                // chỉ fetch lần đầu
                if (pricesMap[routeId] === undefined) fetchPrices(routeId);
            }
            return next;
        });
    };

    /* ══ Filter / Paginate — routes luôn là array nên filtered luôn là array ══ */
    const filtered = useMemo<RouteRow[]>(() => {
        // guard: nếu routes không phải array thì trả về []
        if (!Array.isArray(routes)) return [];

        let list = [...routes];
        if (statusFilter === "active") list = list.filter((r) => r.is_active);
        if (statusFilter === "inactive") list = list.filter((r) => !r.is_active);

        const q = search.trim().toLowerCase();
        if (q) {
            list = list.filter((r) =>
                stopName(r.start_id).toLowerCase().includes(q) ||
                stopName(r.stop_id).toLowerCase().includes(q)
            );
        }
        return list;
    }, [routes, search, statusFilter]);

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER));
    const paged = filtered.slice((page - 1) * PER, page * PER);

    const totalActive = Array.isArray(routes) ? routes.filter((r) => r.is_active).length : 0;
    const totalInactive = Array.isArray(routes) ? routes.filter((r) => !r.is_active).length : 0;

    /* ══ Toggle tuyến ══ */
    const toggleRoute = async (id: string) => {
        setToggling((p) => ({ ...p, [id]: true }));
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/routes/${id}/toggle`, {
                method: "PATCH", headers: authHeaders(),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi");
            setRoutes((prev) =>
                prev.map((r) => r._id === id ? { ...r, is_active: data.data?.is_active ?? !r.is_active } : r)
            );
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi cập nhật trạng thái");
        } finally {
            setToggling((p) => ({ ...p, [id]: false }));
        }
    };

    /* ══ Price CRUD ══ */
    const openCreatePrice = (routeId: string) => {
        setPf(emptyPF);
        setPfErr(null);
        setPriceModal({ open: true, routeId });
        fetchRouteStops(routeId);
    };

    const openEditPrice = (p: PriceRow) => {
        setPf({
            start_id: (p.start_id?._id as string) ?? "",
            end_id: (p.end_id?._id as string) ?? "",
            bus_type_id: p.bus_type_id?._id ?? "",
            base_price: (p.base_price ?? 0).toString(),
            is_active: p.is_active,
        });
        setPfErr(null);
        setPriceModal({ open: true, editing: p, routeId: p.route_id });
        if (p.route_id) fetchRouteStops(p.route_id);
    };

    const saveInlinePrice = async (priceId: string, routeId: string) => {
        if (!editingValue || isNaN(Number(editingValue)) || Number(editingValue) < 0) {
            setEditingPriceId(null);
            return;
        }
        setSavingInline(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/prices/${priceId}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ base_price: Number(editingValue) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi cập nhật giá");
            // Cập nhật local state ngay — không cần refetch toàn bộ
            setPricesMap((prev) => ({
                ...prev,
                [routeId]: (prev[routeId] ?? []).map((p) =>
                    p._id === priceId ? { ...p, base_price: Number(editingValue) } : p
                ),
            }));
            setEditingPriceId(null);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi khi lưu giá");
        } finally {
            setSavingInline(false);
        }
    };

    const saveInlineBusType = async (priceId: string, routeId: string, newBusTypeId: string) => {
        setSavingBusType(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/prices/${priceId}`, {
                method: "PATCH",
                headers: authHeaders(),
                body: JSON.stringify({ bus_type_id: newBusTypeId || null }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi cập nhật loại xe");
            // Cập nhật local state ngay
            const selectedBusType = busTypes.find((b) => b._id === newBusTypeId);
            setPricesMap((prev) => ({
                ...prev,
                [routeId]: (prev[routeId] ?? []).map((p) =>
                    p._id === priceId
                        ? { ...p, bus_type_id: selectedBusType ? { _id: selectedBusType._id, name: selectedBusType.name } : null }
                        : p
                ),
            }));
            setEditingBusTypeId(null);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi khi lưu loại xe");
        } finally {
            setSavingBusType(false);
        }
    };

    const savePrice = async () => {
        if (!pf.start_id || !pf.end_id) { setPfErr("Điểm bắt đầu và kết thúc là bắt buộc"); return; }
        if (!pf.base_price || isNaN(Number(pf.base_price)) || Number(pf.base_price) < 0) {
            setPfErr("Giá không hợp lệ");
            return;
        }
        const routeId = priceModal.routeId;
        if (!routeId) { setPfErr("Không xác định được tuyến"); return; }

        setPfSaving(true);
        setPfErr(null);
        try {
            const body: Record<string, unknown> = {
                start_id: pf.start_id,
                end_id: pf.end_id,
                base_price: Number(pf.base_price),
                is_active: pf.is_active,
            };
            if (pf.bus_type_id) body.bus_type_id = pf.bus_type_id;

            const isEdit = !!priceModal.editing;
            const url = isEdit
                ? `${API_BASE}/api/admin/check/prices/${priceModal.editing!._id}`
                : `${API_BASE}/api/admin/check/routes/${routeId}/prices`;

            const res = await fetch(url, {
                method: isEdit ? "PATCH" : "POST",
                headers: authHeaders(),
                body: JSON.stringify(body),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Lỗi lưu giá chặng");

            // refetch để cập nhật bảng giá
            await fetchPrices(routeId);
            setPriceModal({ open: false });
        } catch (e: unknown) {
            setPfErr(e instanceof Error ? e.message : "Lỗi lưu giá chặng");
        } finally {
            setPfSaving(false);
        }
    };

    const handleDeletePrice = async () => {
        if (!confirmDel) return;
        setDeleting(true);
        try {
            const res = await fetch(`${API_BASE}/api/admin/check/prices/${confirmDel.id}`, {
                method: "DELETE", headers: authHeaders(),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.message ?? "Xoá thất bại");
            await fetchPrices(confirmDel.routeId);
            setConfirmDel(null);
        } catch (e: unknown) {
            alert(e instanceof Error ? e.message : "Lỗi khi xoá");
        } finally {
            setDeleting(false);
        }
    };

    /* ══════════════════════════════ RENDER ═══════════════════ */
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button type="button" onClick={() => navigate(-1)} className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]">
                    <ChevronLeft size={25} strokeWidth={2.3} />
                </button>
                <div>
                    <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">Quản lý tuyến xe</h1>
                    <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">Xem và quản lý tuyến xe đang hoạt động</p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: "Tổng số tuyến", value: routes.length, sub: "Tất cả tuyến trong hệ thống", color: "text-gray-900" },
                    { label: "Tuyến hoạt động", value: totalActive, sub: "Đang vận hành", color: "text-green-600" },
                    { label: "Tuyến tạm ngưng", value: totalInactive, sub: "Đã tắt", color: "text-red-500" },
                ].map(({ label, value, sub, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <p className="text-sm font-semibold text-gray-600">{label}</p>
                        <p className={`text-3xl font-black mt-1 ${color}`}>
                            {value} <span className="text-xl font-bold">Tuyến</span>
                        </p>
                        <p className={`text-xs mt-1 ${color === "text-gray-900" ? "text-gray-400" : color}`}>{sub}</p>
                    </div>
                ))}
            </div>

            {/* Table card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                {/* Filter */}
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <input
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            placeholder="Tìm tên điểm đi/đến..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl bg-white text-sm placeholder-gray-400 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-100"
                        />
                        <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 whitespace-nowrap">Trạng thái</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1); }}
                            className="px-3 py-2 border border-gray-200 rounded-xl bg-white text-sm outline-none focus:border-orange-300 cursor-pointer"
                        >
                            <option value="all">Tất cả</option>
                            <option value="active">Hoạt động</option>
                            <option value="inactive">Tạm ngưng</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    {routeLoading ? (
                        <div className="p-12 flex flex-col items-center gap-2 text-gray-400">
                            <Loader2 size={24} className="animate-spin text-[#FF5722]" />
                            <span className="text-sm">Đang tải tuyến đường...</span>
                        </div>
                    ) : routeError ? (
                        <div className="p-10 text-center text-red-500 text-sm">
                            {routeError}
                            <button onClick={fetchRoutes} className="block mx-auto mt-2 text-xs text-gray-400 hover:text-gray-600 underline">
                                Thử lại
                            </button>
                        </div>
                    ) : (
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="text-left text-xs font-semibold text-gray-500 border-b border-gray-100">
                                    <th className="w-10 px-4 py-3.5" />
                                    <th className="px-4 py-3.5">Tuyến đường</th>
                                    <th className="px-4 py-3.5">Quãng đường</th>
                                    <th className="px-4 py-3.5">Thời gian</th>
                                    <th className="px-4 py-3.5 text-center">Trạng thái</th>
                                    <th className="px-4 py-3.5 text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paged.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-sm">
                                            Không có tuyến đường nào
                                        </td>
                                    </tr>
                                ) : paged.map((r) => {
                                    const isOpen = expanded.has(r._id);
                                    const prices = pricesMap[r._id] ?? [];
                                    const loadingP = loadingPriceMap[r._id] ?? false;
                                    const fromName = stopLabel(r.start_id);
                                    const toName = stopLabel(r.stop_id);
                                    const shortId = r._id.slice(-7).toUpperCase();

                                    return (
                                        <React.Fragment key={r._id}>
                                            {/* Tuyến lớn */}
                                            <tr className={`border-b border-gray-100 transition-colors ${isOpen ? "bg-orange-50/30" : "hover:bg-gray-50/60"}`}>
                                                <td className="px-4 py-3.5 text-center">
                                                    <button
                                                        onClick={() => toggleExpand(r._id)}
                                                        className={`p-1 rounded-lg transition ${isOpen ? "bg-orange-100 text-[#FF5722]" : "text-gray-400 hover:bg-gray-100"}`}
                                                    >
                                                        {isOpen ? <ChevronDown size={16} /> : <ChevronRt size={16} />}
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center shrink-0">
                                                            <MapPin size={14} className="text-[#FF5722]" />
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">
                                                                {stopLabel(r.start_id)} → {stopLabel(r.stop_id)}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-0.5">
                                                                {shortId}
                                                                {!isOpen && (
                                                                    <button
                                                                        onClick={() => toggleExpand(r._id)}
                                                                        className="ml-2 text-[#FF5722] hover:underline font-medium"
                                                                    >
                                                                        Xem giá chặng
                                                                    </button>
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5 text-gray-600">{fmtKm(r.distance_km)}</td>
                                                <td className="px-4 py-3.5 text-gray-600">{fmtH(r.estimated_duration)}</td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {toggling[r._id] ? (
                                                        <Loader2 size={14} className="animate-spin text-[#FF5722] mx-auto" />
                                                    ) : (
                                                        <button
                                                            onClick={() => toggleRoute(r._id)}
                                                            className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition ${r.is_active
                                                                ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                                                                : "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"}`}
                                                        >
                                                            {r.is_active
                                                                ? <><ToggleRight size={14} /> Hoạt động</>
                                                                : <><ToggleLeft size={14} /> Tạm ngưng</>}
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-right">
                                                    <button
                                                        onClick={() => toggleExpand(r._id)}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#FF5722] hover:bg-orange-50 transition"
                                                        title="Xem/ẩn giá chặng"
                                                    >
                                                        <DollarSign size={15} />
                                                    </button>
                                                </td>
                                            </tr>

                                            {/* Expanded: Giá chặng */}
                                            {isOpen && (
                                                <tr className="border-b border-orange-100/60">
                                                    <td colSpan={6} className="p-0 bg-[#fffaf5]">
                                                        <div className="mx-6 my-3 rounded-xl border border-orange-200/60 overflow-hidden">
                                                            {/* Sub-header */}
                                                            <div className="flex items-center justify-between px-4 py-2.5 bg-[#fff3e0]/60 border-b border-orange-100">
                                                                <div className="flex items-center gap-2">
                                                                    <DollarSign size={14} className="text-[#e8791c]" />
                                                                    <span className="text-xs font-bold text-[#7c5f4a] uppercase tracking-wider">
                                                                        Giá chặng — {stopLabel(r.start_id)} → {stopLabel(r.stop_id)}
                                                                    </span>
                                                                    <span className="text-[11px] bg-[#FF5722] text-white px-2 py-0.5 rounded-full font-semibold">
                                                                        {prices.length} chặng
                                                                    </span>
                                                                </div>
                                                                <button
                                                                    onClick={() => openCreatePrice(r._id)}
                                                                    className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 bg-[#FF5722] text-white rounded-lg hover:bg-[#e64a19] transition"
                                                                >
                                                                    <Plus size={12} /> Thêm giá
                                                                </button>
                                                            </div>

                                                            {/* Sub-body */}
                                                            {loadingP ? (
                                                                <div className="py-6 flex justify-center">
                                                                    <Loader2 size={18} className="animate-spin text-[#FF5722]" />
                                                                </div>
                                                            ) : prices.length === 0 ? (
                                                                <div className="py-8 text-center text-gray-400 text-sm space-y-2">
                                                                    <DollarSign size={28} className="mx-auto text-gray-300" />
                                                                    <p>Chưa có giá chặng nào.</p>
                                                                    <button
                                                                        onClick={() => openCreatePrice(r._id)}
                                                                        className="text-[#e8791c] font-semibold text-sm hover:underline"
                                                                    >
                                                                        + Thêm giá chặng đầu tiên
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-left text-[11px] font-bold text-[#b58460] uppercase tracking-wider bg-[#fff9f0]/60">
                                                                            <th className="px-4 py-2.5">Từ điểm</th>
                                                                            <th className="px-4 py-2.5">Đến điểm</th>
                                                                            <th className="px-4 py-2.5">Loại xe</th>
                                                                            <th className="px-4 py-2.5">Giá vé</th>
                                                                            <th className="px-4 py-2.5 text-center">Hiệu lực</th>
                                                                            <th className="px-4 py-2.5 text-right">Thao tác</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody className="divide-y divide-orange-50">
                                                                        {prices.map((p) => (
                                                                            <tr key={p._id} className="hover:bg-orange-50/40 transition-colors">
                                                                                <td className="px-4 py-3 font-medium text-gray-800">{stopLabel(p.start_id)}</td>
                                                                                <td className="px-4 py-3 font-medium text-gray-800">{stopLabel(p.end_id)}</td>
                                                                                {/* ── Inline edit loại xe ── */}
                                                                                <td className="px-4 py-3">
                                                                                    {editingBusTypeId === p._id ? (
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            {savingBusType ? (
                                                                                                <Loader2 size={14} className="animate-spin text-[#FF5722]" />
                                                                                            ) : (
                                                                                                <>
                                                                                                    <select
                                                                                                        autoFocus
                                                                                                        defaultValue={p.bus_type_id?._id ?? ""}
                                                                                                        onChange={(e) => saveInlineBusType(p._id, r._id, e.target.value)}
                                                                                                        onBlur={() => setEditingBusTypeId(null)}
                                                                                                        className="text-xs border border-[#f39a32] rounded-lg px-2 py-1 outline-none bg-white text-[#4a3426] cursor-pointer"
                                                                                                    >
                                                                                                        <option value="">Tất cả</option>
                                                                                                        {busTypes.map((b) => (
                                                                                                            <option key={b._id} value={b._id}>{b.name}</option>
                                                                                                        ))}
                                                                                                    </select>
                                                                                                    <button
                                                                                                        onClick={() => setEditingBusTypeId(null)}
                                                                                                        className="p-0.5 rounded text-gray-400 hover:bg-gray-100 transition"
                                                                                                        title="Huỷ"
                                                                                                    >
                                                                                                        <X size={12} />
                                                                                                    </button>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => setEditingBusTypeId(p._id)}
                                                                                            className="group flex items-center gap-1 text-xs text-gray-500 hover:text-[#FF5722] transition"
                                                                                            title="Click để đổi loại xe"
                                                                                        >
                                                                                            <span>{p.bus_type_id?.name ?? "Tất cả"}</span>
                                                                                            <Edit size={11} className="text-gray-300 group-hover:text-[#FF5722] transition-colors" />
                                                                                        </button>
                                                                                    )}
                                                                                </td>

                                                                                {/* ── Inline edit giá vé ── */}
                                                                                <td className="px-4 py-3">
                                                                                    {editingPriceId === p._id ? (
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <input
                                                                                                type="number"
                                                                                                min="0"
                                                                                                step="1000"
                                                                                                value={editingValue}
                                                                                                onChange={(e) => setEditingValue(e.target.value)}
                                                                                                onKeyDown={(e) => {
                                                                                                    if (e.key === "Enter") saveInlinePrice(p._id, r._id);
                                                                                                    if (e.key === "Escape") setEditingPriceId(null);
                                                                                                }}
                                                                                                autoFocus
                                                                                                className="w-28 px-2 py-1 text-sm font-bold border-2 border-[#f39a32] rounded-lg outline-none bg-white text-[#4a3426]"
                                                                                            />
                                                                                            <span className="text-xs text-gray-400">₫</span>
                                                                                            {savingInline ? (
                                                                                                <Loader2 size={14} className="animate-spin text-[#FF5722]" />
                                                                                            ) : (
                                                                                                <>
                                                                                                    <button
                                                                                                        onClick={() => saveInlinePrice(p._id, r._id)}
                                                                                                        className="p-1 rounded-lg bg-[#FF5722] text-white hover:bg-[#e64a19] transition"
                                                                                                        title="Lưu (Enter)"
                                                                                                    >
                                                                                                        <Save size={12} />
                                                                                                    </button>
                                                                                                    <button
                                                                                                        onClick={() => setEditingPriceId(null)}
                                                                                                        className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 transition"
                                                                                                        title="Huỷ (Esc)"
                                                                                                    >
                                                                                                        <X size={12} />
                                                                                                    </button>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <button
                                                                                            onClick={() => {
                                                                                                setEditingPriceId(p._id);
                                                                                                setEditingValue(String(p.base_price ?? 0));
                                                                                            }}
                                                                                            className="group flex items-center gap-1.5 hover:gap-2 transition-all"
                                                                                            title="Click để sửa giá"
                                                                                        >
                                                                                            <span className="font-bold text-lg text-[#e8791c]">{fmtPrice(p.base_price)}</span>
                                                                                            <Edit size={12} className="text-gray-300 group-hover:text-[#FF5722] transition-colors" />
                                                                                        </button>
                                                                                    )}
                                                                                </td>

                                                                                <td className="px-4 py-3 text-center">
                                                                                    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${p.is_active
                                                                                        ? "bg-green-50 text-green-700 border-green-200"
                                                                                        : "bg-gray-50 text-gray-400 border-gray-200"}`}
                                                                                    >
                                                                                        <span className={`w-1.5 h-1.5 rounded-full ${p.is_active ? "bg-green-500" : "bg-gray-400"}`} />
                                                                                        {p.is_active ? "Hiệu lực" : "Tắt"}
                                                                                    </span>
                                                                                </td>
                                                                                <td className="px-4 py-3 text-right">
                                                                                    <button
                                                                                        onClick={() => setConfirmDel({
                                                                                            id: p._id,
                                                                                            routeId: r._id,
                                                                                            label: `${stopLabel(p.start_id)} → ${stopLabel(p.end_id)}`,
                                                                                        })}
                                                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                                                                        title="Xoá giá"
                                                                                    >
                                                                                        <Trash2 size={13} />
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-3.5 border-t border-gray-100 bg-gray-50/40">
                    <span className="text-xs text-gray-400">{filtered.length} tuyến</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                            <button
                                key={p}
                                onClick={() => setPage(p)}
                                className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${page === p ? "bg-[#FF5722] text-white" : "text-gray-600 hover:bg-gray-200"}`}
                            >
                                {p}
                            </button>
                        ))}
                        <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:pointer-events-none transition"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal: Cập nhật giá chặng */}
            {priceModal.open && (
                <Modal
                    title={priceModal.editing ? "Cập nhật giá chặng" : "Thêm giá chặng"}
                    sub={priceModal.editing
                        ? `${stopName(priceModal.editing.start_id)} → ${stopName(priceModal.editing.end_id)}`
                        : "Thiết lập giá cho chặng con"}
                    icon={<DollarSign size={20} className="text-[#FF5722]" />}
                    onClose={() => setPriceModal({ open: false })}
                    footer={<>
                        <BtnSecondary onClick={() => setPriceModal({ open: false })} disabled={pfSaving}>Huỷ</BtnSecondary>
                        <BtnPrimary onClick={savePrice} loading={pfSaving}>
                            <Save size={14} />{priceModal.editing ? "Lưu thay đổi" : "Thêm giá"}
                        </BtnPrimary>
                    </>}
                >
                    <Lbl label="Điểm bắt đầu chặng (RouteStop)" required>
                        <select value={pf.start_id} onChange={(e) => setPf({ ...pf, start_id: e.target.value })} className={sCls}
                            disabled={routeStopsLoading}>
                            <option value="">{routeStopsLoading ? "Đang tải..." : "-- Chọn điểm dừng --"}</option>
                            {routeStops.map((s) => (
                                <option key={s._id as string} value={s._id as string}>
                                    {`${(s as Record<string, unknown>).stop_order ?? "?"}`}. {stopLabel(s)}
                                </option>
                            ))}
                        </select>
                    </Lbl>
                    <Lbl label="Điểm kết thúc chặng (RouteStop)" required>
                        <select value={pf.end_id} onChange={(e) => setPf({ ...pf, end_id: e.target.value })} className={sCls}
                            disabled={routeStopsLoading}>
                            <option value="">{routeStopsLoading ? "Đang tải..." : "-- Chọn điểm dừng --"}</option>
                            {routeStops
                                .filter((s) => (s._id as string) !== pf.start_id)
                                .map((s) => (
                                    <option key={s._id as string} value={s._id as string}>
                                        {`${(s as Record<string, unknown>).stop_order ?? "?"}`}. {stopLabel(s)}
                                    </option>
                                ))}
                        </select>
                    </Lbl>
                    <div className="grid grid-cols-2 gap-4">
                        <Lbl label="Loại xe">
                            <select value={pf.bus_type_id} onChange={(e) => setPf({ ...pf, bus_type_id: e.target.value })} className={sCls}>
                                <option value="">-- Tất cả loại xe --</option>
                                {busTypes.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
                            </select>
                        </Lbl>
                        <Lbl label="Giá vé (₫)" required>
                            <input
                                type="number" min="0" step="1000"
                                value={pf.base_price}
                                onChange={(e) => setPf({ ...pf, base_price: e.target.value })}
                                placeholder="300000"
                                className={iCls}
                            />
                        </Lbl>
                    </div>
                    <Lbl label="Trạng thái">
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setPf({ ...pf, is_active: !pf.is_active })}
                                className={`relative w-10 h-6 rounded-full transition-colors ${pf.is_active ? "bg-[#FF5722]" : "bg-gray-300"}`}
                            >
                                <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${pf.is_active ? "translate-x-4" : "translate-x-0"}`} />
                            </button>
                            <span className="text-sm text-gray-700 font-medium">{pf.is_active ? "Hiệu lực" : "Tắt"}</span>
                        </div>
                    </Lbl>
                    {pfErr && (
                        <div className="flex items-start gap-2 bg-[#fff7ed] border border-[#f2d5b8] text-[#c2410c] text-sm px-4 py-3 rounded-xl">
                            <X size={14} className="mt-0.5 shrink-0" />{pfErr}
                        </div>
                    )}
                </Modal>
            )}

            {/* Confirm xoá giá */}
            {confirmDel && (
                <Confirm
                    msg={`Xoá giá chặng "${confirmDel.label}"? Hành động không thể hoàn tác.`}
                    onOk={handleDeletePrice}
                    onCancel={() => setConfirmDel(null)}
                    loading={deleting}
                />
            )}
        </div>
    );
};

export default ManageRoute;