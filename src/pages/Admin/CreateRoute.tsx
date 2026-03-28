import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CircleCheck,
  Check,
  ChevronLeft,
  GripVertical,
  TriangleAlert,
  MapPin,
  Plus,
  Save,
  Loader2,
} from "lucide-react";
import type { recommendStops } from "../../model/recommendStops";
import baseAPIAuth from "../../api/auth";
import type { allStops } from "../../model/allStops";

type DotType = "start" | "middle" | "end";

function Dot({ type }: { type: DotType }) {
  if (type === "start") {
    return (
      <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#e8791c]" />
    );
  }
  if (type === "end") {
    return (
      <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#ef4444]" />
    );
  }
  return (
    <span className="inline-flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#cfd6e2]" />
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="h-4 w-[3px] rounded-full bg-[#e8791c]" />
      <h2 className="text-[16px] font-black leading-tight text-[#1f2736]">
        {title}
      </h2>
    </div>
  );
}

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

function StationCard({
  order,
  name,
  distance,
  duration_from_start,
  selected,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}: {
  order: number;
  name: string;
  distance: number;
  duration_from_start: number;
  selected: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  function formatHourMinute(hour: number) {
    const h = Math.floor(hour);
    const m = Math.round((hour - h) * 60);
    if (h === 0) return `${m} phút`;
    if (m === 0) return `${h} giờ`;
    return `${h} giờ ${m} phút`;
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      className={`flex w-full cursor-grab items-start justify-between gap-2 rounded-[8px] border px-3 py-2.5 text-left transition active:cursor-grabbing ${selected
        ? "border-[#e8791c] bg-[#F7E6D6]"
        : "border-[#d9e0ea] bg-white hover:border-[#cfd6e2]"
        } ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${selected
            ? "bg-[#e8791c]/20 text-[#c55a14]"
            : "bg-[#e8ecf1] text-[#6b7280]"
            }`}
        >
          {order}
        </span>
        <GripVertical
          size={13}
          className={`mt-0.5 shrink-0 ${selected ? "text-[#c55a14]" : "text-[#96a0b2]"}`}
        />
        <div className="min-w-0">
          <h3 className="truncate text-[13px] font-black leading-tight text-[#253042]">
            {name}
          </h3>
          <p
            className={`mt-1 truncate text-[9px] font-black uppercase tracking-[0.08em] ${selected ? "text-[#6b7280]" : "text-[#9ca6b7]"
              }`}
          >
            Cách khoảng {distance.toFixed(2)} km và khoảng{" "}
            {formatHourMinute(duration_from_start)} bắt đầu từ điểm xuất
            phát{" "}
          </p>
        </div>
      </div>
      <span
        className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${selected
          ? "border-2 border-[#e8791c] bg-white"
          : "border border-[#bcc6d5] bg-white"
          }`}
      >
        {selected ? (
          <Check size={10} className="text-[#e8791c]" strokeWidth={3} />
        ) : null}
      </span>
    </div>
  );
}

export default function CreateRoute() {
  const navigate = useNavigate();
  const [departure, setDeparture] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [recommendStops, setRecommendStops] = useState<recommendStops[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [stops, setStops] = useState<allStops[]>([]);
  const [showManualStopDropdown, setShowManualStopDropdown] = useState(false);
  const [manualStopSearch, setManualStopSearch] = useState("");

  // ── Loading states ──
  const [loadingConfirm, setLoadingConfirm] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);

  const getAllStops = async () => {
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getAllStops");
      setStops(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    getAllStops();
  }, []);

  // ── Xác nhận: gọi gợi ý trạm dừng với loading ──
  const getRecommendStops = async () => {
    if (!departureId || !destinationId) return;
    setLoadingConfirm(true);
    try {
      const res = await baseAPIAuth.get("/api/admin/check/recommendStops", {
        params: {
          start_id: departureId,
          stop_id: destinationId,
        },
      });
      const formatData = res.data.recommendedStops.map((stop: any) => ({
        _id: stop._id,
        name: stop.name,
        province: stop.province,
        distance_from_start: Number(Number(stop.distance_from_start).toFixed(2)),
        duration_from_start: Number(Number(stop.duration_from_start).toFixed(2)),
        selected: true,
      }));
      setRecommendStops(formatData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingConfirm(false);
    }
  };

  // ── Lưu tuyến với loading ──
  const createRoutes = async () => {
    if (!departure.trim() || !destination.trim()) {
      setNotice({
        type: "error",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập điểm xuất phát và điểm kết thúc.",
      });
      return;
    }
    setLoadingSave(true);
    setLoadingSave(true);
    try {
      const selectedStops = recommendStops
        .filter((s) => s.selected)
        .map((s, index) => ({
          stop_id: s._id,
          stop_order: index + 2,
          duration_from_start: s.duration_from_start,
        }));
      const res = await baseAPIAuth.post("/api/admin/check/routes", {
        start_id: departureId,
        stop_id: destinationId,
        stops: selectedStops,
      });
      setNotice({
        type: "success",
        title: "Tạo tuyến thành công",
        message: res.data?.message || "Thông tin tuyến đã được lưu.",
      });
    } catch (error: any) {
      console.error("Lỗi", error);
      setNotice({
        type: "error",
        title: "Tạo tuyến thất bại",
        message:
          error.response?.data?.message ||
          "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setLoadingSave(false);
    }
  };

  const getDurationHandicraft = async (stopId: string) => {
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getDurationHandicraft", {
        params: { start_id: departureId, stop_id: stopId },
      });
      return res.data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const toggleStation = (id: string) => {
    setRecommendStops((prev) =>
      prev.map((s) => (s._id === id ? { ...s, selected: !s.selected } : s)),
    );
  };

  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.setDragImage(e.currentTarget, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (targetIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDraggedIndex(null);
    const fromIndex = Number(e.dataTransfer.getData("text/plain"));
    if (Number.isNaN(fromIndex) || fromIndex === targetIndex) return;
    setRecommendStops((prev) => {
      const next = [...prev];
      const [removed] = next.splice(fromIndex, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });
  };

  const handleDragEnd = () => setDraggedIndex(null);

  const timelineStops = useMemo(() => {
    const start = {
      id: "hcm",
      name: departure || "Điểm xuất phát",
      dot: "start" as const,
    };
    const end = {
      id: "da-lat",
      name: destination || "Điểm kết thúc",
      dot: "end" as const,
    };
    const middleStops = recommendStops
      .filter((s) => s.selected)
      .map((s) => ({
        id: s._id,
        name: s.name.split(",")[0].trim(),
        dot: "middle" as const,
      }));
    return [start, ...middleStops, end];
  }, [recommendStops, departure, destination]);

  return (
    <>
      <div className="mx-auto w-full max-w-[1380px] space-y-6 overflow-visible px-4 pb-16 pt-10 lg:px-4">
        <header className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2] transition hover:text-[#9aa3b1]"
            aria-label="Quay lại"
          >
            <ChevronLeft size={25} strokeWidth={2.3} />
          </button>
          <div>
            <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
              Tạo tuyến đường mới
            </h1>
            <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
              Thiết lập điểm xuất phát, điểm đến và các trạm dừng trên tuyến
            </p>
          </div>
        </header>

        <div className="mt-14 grid min-h-0 gap-6 pt-4 xl:grid-cols-[1.1fr_0.9fr] xl:items-stretch">
          <div className="min-h-0 space-y-6">
            <section className="rounded-[20px] border border-[#e7eaf0] bg-white p-6 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
              <SectionTitle title="Thông tin hành trình" />

              <div className="flex flex-wrap items-end gap-3">
                <label className="min-w-0 flex-1 space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#8d96a7]">
                    ĐIỂM XUẤT PHÁT
                  </span>
                  <span className="flex min-w-[200px] flex-1 items-center gap-2 rounded-[8px] border border-[#dbe2ee] bg-[#f5f7fb] px-4 py-2.5">
                    <MapPin size={14} className="shrink-0 text-[#e8791c]" />
                    <select
                      value={departureId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setDepartureId(id);
                        const selected = stops.find((s) => s._id === id);
                        if (selected) setDeparture(selected.name);
                      }}
                      className="w-full bg-transparent text-[13px] font-black text-[#2a3444] outline-none"
                    >
                      <option value="">Chọn điểm xuất phát</option>
                      {stops.map((stop) => (
                        <option key={stop._id} value={stop._id}>
                          {stop.province}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                <span className="flex h-10 shrink-0 items-center pb-1 text-[#e8791c]">
                  <ArrowRight size={20} />
                </span>

                <label className="min-w-0 flex-1 space-y-1.5">
                  <span className="block text-[9px] font-black uppercase tracking-[0.1em] text-[#8d96a7]">
                    ĐIỂM KẾT THÚC
                  </span>
                  <span className="flex min-w-[200px] flex-1 items-center gap-2 rounded-[8px] border border-[#dbe2ee] bg-[#f5f7fb] px-4 py-2.5">
                    <MapPin size={14} className="shrink-0 text-[#e8791c]" />
                    <select
                      value={destinationId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setDestinationId(id);
                        const selected = stops.find((s) => s._id === id);
                        if (selected) setDestination(selected.name);
                      }}
                      className="w-full bg-transparent text-[13px] font-black text-[#2a3444] outline-none"
                    >
                      <option value="">Chọn điểm kết thúc</option>
                      {stops.map((stop) => (
                        <option key={stop._id} value={stop._id}>
                          {stop.province}
                        </option>
                      ))}
                    </select>
                  </span>
                </label>

                {/* ── Nút Xác nhận với loading ── */}
                <button
                  type="button"
                  onClick={getRecommendStops}
                  disabled={loadingConfirm || !departureId || !destinationId}
                  className="ml-auto inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[8px] bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-5 text-[13px] font-black text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition hover:from-[#f8af4f] hover:to-[#ef8a31] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loadingConfirm ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Đang tìm...
                    </>
                  ) : (
                    "Xác nhận"
                  )}
                </button>
              </div>
            </section>

            <section className="rounded-[20px] border border-[#e7eaf0] bg-white p-6 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="h-4 w-[3px] rounded-full bg-[#e8791c]" />
                  <h2 className="text-[16px] font-black leading-tight text-[#1f2736]">
                    Các trạm dừng
                  </h2>
                </div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#e8791c]">
                  Hệ thống gợi ý
                </span>
              </div>

              {/* Loading state cho danh sách trạm */}
              {loadingConfirm ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-400">
                  <Loader2 size={28} className="animate-spin text-[#e8791c]" />
                  <p className="text-[13px] font-semibold">Đang tìm trạm dừng phù hợp...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recommendStops.length === 0 && (
                    <p className="py-6 text-center text-[13px] text-[#9ca6b7]">
                      Chọn điểm xuất phát và điểm đến rồi bấm <strong>Xác nhận</strong> để xem gợi ý trạm dừng.
                    </p>
                  )}
                  {recommendStops.map((recommendStop, index) => (
                    <StationCard
                      key={recommendStop._id}
                      order={index + 1}
                      name={recommendStop.name}
                      distance={recommendStop.distance_from_start}
                      duration_from_start={recommendStop.duration_from_start}
                      selected={recommendStop.selected}
                      onClick={() => toggleStation(recommendStop._id)}
                      onDragStart={handleDragStart(index)}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedIndex === index}
                    />
                  ))}

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowManualStopDropdown(!showManualStopDropdown)}
                      className="flex h-[74px] w-full items-center justify-center gap-2 rounded-[10px] border border-[#d9e0ea] bg-white text-[13px] font-bold text-[#9ca6b7] transition hover:border-[#cfd6e2] hover:bg-[#fafbfc]"
                    >
                      <Plus size={16} />
                      Thêm trạm thủ công
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          <aside className="flex min-h-0 flex-col self-stretch rounded-[20px] border border-[#e7eaf0] bg-white p-6 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
            <SectionTitle title="Lộ trình chi tiết" />

            <div className="relative flex min-h-0 flex-1 flex-col pb-3 pl-7">
              <span className="pointer-events-none absolute bottom-6 left-[9px] top-[10px] w-px bg-[#e2e8f2]" />
              <div className="relative z-10 flex min-h-full flex-1 flex-col justify-between">
                {timelineStops.map((stop) => (
                  <article key={stop.id} className="relative flex shrink-0 flex-col">
                    <span className="absolute -left-[22px] top-[4px]">
                      <Dot type={stop.dot as DotType} />
                    </span>
                    <h3 className="text-[13px] font-black leading-tight text-[#273041]">
                      {stop.name}
                    </h3>
                  </article>
                ))}
              </div>
            </div>

            {/* ── Nút Lưu tuyến với loading ── */}
            <button
              type="button"
              onClick={createRoutes}
              disabled={loadingSave}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-[12px] font-black uppercase tracking-wider text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition hover:from-[#f8af4f] hover:to-[#ef8a31] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingSave ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save size={16} className="text-white" />
                  LƯU TUYẾN ĐƯỜNG
                </>
              )}
            </button>
          </aside>
        </div>
      </div>

      {/* Modal thêm trạm thủ công */}
      {showManualStopDropdown && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40"
          onClick={() => setShowManualStopDropdown(false)}
        >
          <div
            className="w-full max-w-lg rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b px-5 py-4">
              <h3 className="text-[16px] font-black text-[#1f2736]">Thêm trạm dừng</h3>
            </div>
            <div className="p-4">
              <input
                type="text"
                value={manualStopSearch}
                onChange={(e) => setManualStopSearch(e.target.value)}
                placeholder="Tìm trạm..."
                className="w-full rounded-lg border border-[#dbe2ee] bg-[#f5f7fb] px-3 py-2 text-[13px] font-semibold outline-none focus:border-[#e8791c]"
              />
            </div>
            <ul className="max-h-80 overflow-y-auto pb-2">
              {stops
                .filter((s) => {
                  if (s._id === departureId || s._id === destinationId) return false;
                  if (recommendStops.some((rs) => rs._id === s._id)) return false;
                  if (manualStopSearch.trim()) {
                    const keyword = manualStopSearch.toLowerCase();
                    return (
                      s.name.toLowerCase().includes(keyword) ||
                      s.province.toLowerCase().includes(keyword)
                    );
                  }
                  return true;
                })
                .map((stop) => (
                  <li
                    key={stop._id}
                    onClick={async () => {
                      const result = await getDurationHandicraft(stop._id);
                      if (!result) return;
                      setRecommendStops((prev) => [
                        ...prev,
                        {
                          _id: stop._id,
                          name: stop.name,
                          province: stop.province,
                          distance_from_start: Number(result.estimated_distance_km.toFixed(2)),
                          duration_from_start: Number(result.estimated_duration.toFixed(2)),
                          selected: true,
                        },
                      ]);
                      setShowManualStopDropdown(false);
                      setManualStopSearch("");
                    }}
                    className="flex cursor-pointer items-center justify-between px-5 py-3 text-[13px] font-semibold hover:bg-[#fff7ed]"
                  >
                    <div>
                      <p className="text-[#253042]">{stop.name}</p>
                      <p className="text-[10px] uppercase text-[#9ca6b7]">{stop.province}</p>
                    </div>
                    <Plus size={14} className="text-[#e8791c]" />
                  </li>
                ))}
            </ul>
            <div className="flex justify-end border-t p-4">
              <button
                onClick={() => setShowManualStopDropdown(false)}
                className="rounded-lg border px-4 py-2 text-sm font-bold text-[#657085]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notice modal */}
      {notice && (
        <>
          <style>{`
            @keyframes routeNoticeIn {
              0% { opacity: 0; transform: translateY(10px) scale(0.95); }
              70% { transform: translateY(-2px) scale(1.02); }
              100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes routeNoticeIcon {
              0% { transform: scale(0.4) rotate(-25deg); opacity: 0; }
              55% { transform: scale(1.18) rotate(8deg); opacity: 1; }
              80% { transform: scale(0.95) rotate(-4deg); }
              100% { transform: scale(1) rotate(0); }
            }
            @keyframes routeNoticePulse {
              0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32); }
              100% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
            }
          `}</style>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/35 px-4"
            onClick={() => setNotice(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.7)]"
              onClick={(event) => event.stopPropagation()}
              style={{
                animation: notice.type === "success"
                  ? "routeNoticeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
                  : "routeNoticeIn 0.35s ease",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${notice.type === "success" ? "bg-[#ecfdf3] text-[#16a34a]" : "bg-[#fff7ed] text-[#ea580c]"}`}
                  style={{
                    animation: notice.type === "success"
                      ? "routeNoticePulse 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                      : undefined,
                  }}
                >
                  {notice.type === "success" ? (
                    <CircleCheck size={20} style={{ animation: "routeNoticeIcon 0.55s cubic-bezier(0.22, 1, 0.36, 1)" }} />
                  ) : (
                    <TriangleAlert size={20} />
                  )}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-black text-[#111827]">{notice.title}</h3>
                  <p className="mt-1 text-sm font-medium text-[#4b5563]">{notice.message}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-lg bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}