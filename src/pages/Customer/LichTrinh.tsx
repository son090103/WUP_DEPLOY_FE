import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import baseAPIAuth from "../../api/auth";
import type { searchStops } from "../../model/searchStop";
import { createPortal } from "react-dom";
import baseAPIPublic from "../../api/auth-not";
import { CalendarDays, MapPin } from "lucide-react";

export default function LichTrinh() {

  const [departure, setDeparture] = useState("");
  const [departureId, setDepartureId] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationId, setDestinationId] = useState("");
  const [searchDepartureInput, setDepartureSearchInput] = useState<searchStops[]>([]);
  const [searchDestinationInput, setDestinationSearchInput] = useState<searchStops[]>([]);

  const departureRef = useRef<HTMLDivElement>(null);
  const destinationRef = useRef<HTMLDivElement>(null);
  const [departureRect, setDepartureRect] = useState<DOMRect | null>(null);
  const [destinationRect, setDestinationRect] = useState<DOMRect | null>(null);
  const url = import.meta.env.VITE_API_URL;
  const updateDepartureRect = () => {
    if (departureRef.current) setDepartureRect(departureRef.current.getBoundingClientRect());
  };
  const updateDestinationRect = () => {
    if (destinationRef.current) setDestinationRect(destinationRef.current.getBoundingClientRect());
  };

  const searchDestinationStops = async (keyword: string) => {
    if (!keyword.trim()) { setDestinationSearchInput([]); return; }
    try {
      const res = await baseAPIPublic.get("/api/admin/notcheck/searchStop", { params: { keyword } });
      setDestinationSearchInput(res.data);
    } catch (error) { console.error(error); }
  };

  const searchDepartureStops = async (keyword: string) => {
    if (!keyword.trim()) { setDepartureSearchInput([]); return; }
    try {
      const res = await baseAPIAuth.get("/api/admin/notcheck/searchStop", { params: { keyword } });
      setDepartureSearchInput(res.data);
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const delay = setTimeout(() => { searchDepartureStops(departure); }, 300);
    return () => clearTimeout(delay);
  }, [departure]);

  useEffect(() => {
    const delay = setTimeout(() => { searchDestinationStops(destination); }, 300);
    return () => clearTimeout(delay);
  }, [destination]);

  const [selectedDate, setSelectedDate] = useState("");
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${url}/api/customer/notcheck/search`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nodeId_start: departureId || null,
            nodeId_end: destinationId || null,
            name_start: !departureId ? departure : null,
            name_end: !destinationId ? destination : null,
            date: selectedDate,
          }),
        }
      );
      if (!response.ok) throw new Error("Search failed");
      const data = await response.json();
      const tripList = Array.isArray(data) ? data : (data?.data ?? []);
      setTrips(Array.isArray(tripList) ? tripList : []);
    } catch (error) {
      setError("Chương trình đang bị lỗi");
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const navigate = useNavigate();
  const lichtrinh = (id: string) => {
    navigate("/lichtrinhdetail", { state: { id } });
  };

  useEffect(() => {
    const fetchRoutesToday = async () => {
      try {
        const response = await fetch(`${url}/api/customer/notcheck/view-route`);
        const data = await response.json();

        if (data.success) {
          setTrips(data.data);
        }
      } catch (error) {
        console.error("Lỗi khi lấy routes hôm nay:", error);
      }
    };

    fetchRoutesToday();
  }, []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />

      {/* ===== Bus - ẨN trên mobile ===== */}
      <div className="hidden md:block pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%]">
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
          <img src="/images/bus7.png" alt="Bus overlay" className="w-full object-contain block relative"
            style={{ imageRendering: "auto", filter: "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))" }} />
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

      {/* ===== Hero - compact trên mobile ===== */}
      <div className="relative z-20 mx-auto flex w-full max-w-[1240px] items-center px-4
                      min-h-[240px] pt-20 pb-4
                      md:min-h-[680px] md:pt-24 md:pb-24
                      lg:min-h-[780px] lg:pt-20">
        <div className="page-enter-copy relative isolate w-full max-w-[760px] space-y-3 md:space-y-6 md:-ml-14 lg:-ml-24">
          <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 hidden md:block h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />

          <h1 className="hero-title relative z-10 py-1 font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a]
                         text-[32px] sm:text-[48px] md:text-[58px] lg:text-[72px]">
            <span className="hero-title-line block whitespace-nowrap">Tìm và đặt ngay</span>
            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap">những chuyến xe</span>
            <span className="hero-title-line mt-1 md:mt-2 block whitespace-nowrap font-extrabold italic">
              <span className="text-[#0d142a]">thật</span>{" "}
              <span className="hero-title-shimmer">Dễ Dàng</span>
            </span>
          </h1>

          {/* Subtitle ẩn mobile */}
          <p className="hidden sm:block relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
            Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ chất lượng cao nhất.
          </p>
        </div>
      </div>

      {/* ===== Search + Trips ===== */}
      <div className="relative z-[100] pb-20 -mt-4 md:-mt-36">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">

          {/* SEARCH BAR - dọc mobile / ngang desktop */}
          <div className="page-enter-search relative">
            <div className="w-full rounded-[10px] border border-[#f2e5d8] bg-white/95 p-2.5 md:py-4 md:px-6 shadow-[0_24px_35px_-24px_rgba(251,146,60,0.9)] backdrop-blur
                            flex flex-col md:flex-row md:items-center gap-3 md:gap-6">

              {/* ĐIỂM ĐI */}
              <div className="relative md:pl-4" style={{ zIndex: 200 }} ref={departureRef} onClick={updateDepartureRect}>
                <div className="flex flex-col justify-center md:border-r md:border-[#c89463] md:pr-6 md:h-[56px]">
                  <p className="text-[11px] font-bold text-[#c89463] uppercase mb-1">Điểm đi</p>
                  <div className="flex items-center gap-2 bg-orange-50/60 md:bg-transparent rounded-xl px-3 py-2 md:p-0">
                    <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                    <input type="text" placeholder="Nhập điểm đi" onFocus={updateDepartureRect} value={departure}
                      onChange={(e) => { setDeparture(e.target.value); updateDepartureRect(); }}
                      className="w-full bg-transparent outline-none text-[14px] font-semibold text-gray-700 placeholder:text-[#8c6a4f]" />
                  </div>
                </div>
                {searchDepartureInput.length > 0 && departureRect && createPortal(
                  <ul style={{ position: "fixed", top: departureRect.bottom + 8, left: departureRect.left, width: Math.max(departureRect.width, 260), zIndex: 99999 }}
                    className="max-h-64 overflow-y-auto rounded-[14px] border border-[#e5e9f2] bg-white shadow-[0_18px_40px_-8px_rgba(15,23,42,0.25)]">
                    {searchDepartureInput.map((stop) => (
                      <li key={stop._id}
                        onMouseDown={(e) => { e.preventDefault(); setDeparture(stop.province); setDepartureId(stop._id); setDepartureSearchInput([]); }}
                        className="group/item flex cursor-pointer items-center justify-between px-4 py-3 text-[13px] font-semibold text-[#253042] transition hover:bg-[#fff7ed]">
                        <div className="flex flex-col">
                          <span className="group-hover/item:text-[#e8791c] transition">{stop.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca6b7]">{stop.province}</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-[#e5e9f2] group-hover/item:bg-[#e8791c] transition" />
                      </li>
                    ))}
                  </ul>, document.body
                )}
              </div>

              {/* ĐIỂM ĐẾN */}
              <div className="relative" style={{ zIndex: 200 }} ref={destinationRef} onClick={updateDestinationRect}>
                <div className="flex flex-col justify-center md:border-r md:border-[#c89463] md:pr-6 md:h-[56px]">
                  <p className="text-[11px] font-bold text-[#c89463] uppercase mb-1">Điểm đến</p>
                  <div className="flex items-center gap-2 bg-orange-50/60 md:bg-transparent rounded-xl px-3 py-2 md:p-0">
                    <MapPin size={16} className="text-orange-500 flex-shrink-0" />
                    <input type="text" placeholder="Nhập điểm đến" value={destination} onFocus={updateDestinationRect}
                      onChange={(e) => { setDestination(e.target.value); updateDestinationRect(); }}
                      className="w-full bg-transparent outline-none text-[14px] font-semibold text-gray-700 placeholder:text-[#8c6a4f]" />
                  </div>
                </div>
                {searchDestinationInput.length > 0 && destinationRect && createPortal(
                  <ul style={{ position: "fixed", top: destinationRect.bottom + 8, left: destinationRect.left, width: Math.max(destinationRect.width, 260), zIndex: 99999 }}
                    className="max-h-64 overflow-y-auto rounded-[14px] border border-[#e5e9f2] bg-white shadow-[0_18px_40px_-8px_rgba(15,23,42,0.25)]">
                    {searchDestinationInput.map((stop) => (
                      <li key={stop._id}
                        onMouseDown={(e) => { e.preventDefault(); setDestination(stop.province); setDestinationId(stop._id); setDestinationSearchInput([]); }}
                        className="group/item flex cursor-pointer items-center justify-between px-4 py-3 text-[13px] font-semibold text-[#253042] transition hover:bg-[#fff7ed]">
                        <div className="flex flex-col">
                          <span className="group-hover/item:text-[#e8791c] transition">{stop.name}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca6b7]">{stop.province}</span>
                        </div>
                        <span className="h-2 w-2 rounded-full bg-[#e5e9f2] group-hover/item:bg-[#e8791c] transition" />
                      </li>
                    ))}
                  </ul>, document.body
                )}
              </div>

              {/* NGÀY ĐI */}
              <div className="flex flex-col justify-center md:flex-1 md:h-[56px] md:pl-2">
                <p className="text-[11px] font-bold text-[#c89463] uppercase mb-1">Ngày đặt vé</p>
                <div className="flex items-center gap-2 bg-orange-50/60 md:bg-transparent rounded-xl px-3 py-2 md:p-0">
                  <CalendarDays size={16} className="text-orange-500 flex-shrink-0" />
                  <input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full bg-transparent outline-none text-[14px] text-gray-700 cursor-pointer" />
                </div>
              </div>

              {/* Search Button */}
              <button
                className="w-full md:w-auto min-h-[48px] md:min-h-[60px] px-8 flex items-center justify-center
                           bg-gradient-to-r from-[#f7a53a] to-[#e8791c] text-white text-sm font-bold
                           rounded-[8px] shadow-[0_18px_30px_-14px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                onClick={() => reSearch()}>
                Tìm kiếm
              </button>
            </div>
          </div>

          {/* ===== HEADER ROW - chỉ hiện desktop ===== */}
          <div className="page-enter-content relative mt-8 mb-4 hidden md:block" style={{ zIndex: 1 }}>
            <div className="flex items-center gap-10 px-8 py-5 bg-gradient-to-br from-white/80 via-white/70 to-orange-50/60 backdrop-blur-md rounded-2xl border-2 border-white/60 shadow-xl">
              <div className="flex-1 font-bold text-slate-600">Tuyến xe</div>
              <div className="min-w-[110px] text-center font-bold text-slate-600">Loại xe</div>
              <div className="min-w-[90px] text-center font-bold text-slate-600">Quãng đường</div>
              <div className="min-w-[100px] text-center font-bold text-slate-600">Thời gian</div>
              <div className="min-w-[90px] text-center font-bold text-slate-600">Giá vé</div>
              <div className="min-w-[120px] text-center font-bold text-slate-600">Thao tác</div>
            </div>
          </div>

          {/* ===== TRIP LIST ===== */}
          <div className="page-enter-content space-y-4 mt-4 md:mt-0">
            {loading ? (
              <div className="text-center py-16">
                <div className="inline-block w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Đang tải chuyến xe...</p>
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-red-500 font-medium">{error}</p>
              </div>
            ) : !Array.isArray(trips) || trips.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-slate-500 font-medium">Không tìm thấy chuyến xe nào.</p>
              </div>
            ) : (
              (Array.isArray(trips) ? trips : []).map((trip, index) => (
                <div key={trip._id} className="relative group" style={{ animationDelay: `${0.1 * index}s` }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-500/20 to-orange-400/0 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 rounded-2xl" />
                  <div className="bg-gradient-to-br from-white via-white to-orange-50/20 backdrop-blur-sm border-2 border-orange-100/40 rounded-2xl p-4 md:p-7 hover:shadow-2xl hover:border-orange-200 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* ===== DESKTOP: ngang ===== */}
                    <div className="hidden md:flex items-center gap-10 relative z-10">
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="text-orange-600 font-extrabold whitespace-pre-line text-base leading-tight">
                          {trip?.start_id?.province ?? trip?.start_id?.name ?? "---"}
                        </div>
                        <div className="flex items-center flex-shrink-0 bg-orange-50 p-2 rounded-full group-hover:bg-orange-100 group-hover:scale-110 transition-all duration-300">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <div className="text-orange-600 font-extrabold text-base">
                          {trip?.stop_id?.province ?? trip?.stop_id?.name ?? "---"}
                        </div>
                      </div>
                      <div className="text-slate-800 font-semibold px-5 text-base min-w-[110px] text-center bg-slate-50 py-2 rounded-xl">----</div>
                      <div className="text-slate-800 font-semibold px-5 text-base min-w-[90px] text-center bg-slate-50 py-2 rounded-xl">
                        {trip?.distance_km ?? "--"} km
                      </div>
                      <div className="text-slate-800 font-semibold px-5 text-base min-w-[90px] text-center bg-slate-50 py-2 rounded-xl">
                        {trip?.estimated_duration
                          ? `${Math.ceil(trip.estimated_duration)}h`
                          : "---"}
                      </div>
                      <div className="text-slate-800 font-semibold px-5 text-base min-w-[90px] text-center bg-slate-50 py-2 rounded-xl">---</div>
                      <button
                        className="bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white px-8 py-3.5 rounded-[8px] font-bold text-base whitespace-nowrap shadow-[0_18px_30px_-14px_rgba(216,113,28,0.95)] transition duration-200 hover:scale-105"
                        onClick={() => { if (trip?._id) lichtrinh(trip._id); }}>
                        Tìm xe
                      </button>
                    </div>

                    {/* ===== MOBILE: card dọc ===== */}
                    <div className="md:hidden relative z-10">
                      {/* Route */}
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-orange-600 font-extrabold text-base">
                          {trip?.start_id?.province ?? trip?.start_id?.name ?? "---"}
                        </span>
                        <div className="flex-shrink-0 bg-orange-50 p-1.5 rounded-full">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-500">
                            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <span className="text-orange-600 font-extrabold text-base">
                          {trip?.stop_id?.province ?? trip?.stop_id?.name ?? "---"}
                        </span>
                      </div>

                      {/* Info pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-lg">
                          📍 {trip?.distance_km ?? "--"} km
                        </span>
                        <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-lg">
                          ⏱ {trip?.estimated_duration
                            ? `${Math.floor(trip.estimated_duration / 60)}h${trip.estimated_duration % 60 > 0 ? trip.estimated_duration % 60 + "m" : ""}`
                            : "---"}
                        </span>
                        <span className="bg-slate-50 border border-slate-100 text-slate-600 text-xs font-semibold px-3 py-1 rounded-lg">
                          🚌 ---
                        </span>
                      </div>

                      {/* Button full width mobile */}
                      <button
                        className="w-full bg-gradient-to-r from-[#f7a53a] to-[#e8791c] hover:from-[#f8af4f] hover:to-[#ef8a31] text-white py-3 rounded-[8px] font-bold text-sm shadow-[0_18px_30px_-14px_rgba(216,113,28,0.95)] transition duration-200"
                        onClick={() => { if (trip?._id) lichtrinh(trip._id); }}>
                        Tìm xe →
                      </button>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .page-enter-copy,.page-enter-search,.page-enter-content{opacity:0;will-change:transform,opacity;animation-fill-mode:forwards;animation-timing-function:cubic-bezier(0.22,1,0.36,1);}
        .page-enter-copy{animation-name:page-fade-up;animation-duration:1.08s;animation-delay:0.2s;}
        .page-enter-search{animation-name:page-fade-up;animation-duration:0.96s;animation-delay:0.42s;}
        .page-enter-content{animation-name:page-fade-up;animation-duration:0.96s;animation-delay:0.52s;}
        .hero-title-line{opacity:0;transform:translateY(14px);animation:hero-title-reveal 1.12s cubic-bezier(0.2,0.8,0.2,1) forwards;}
        .hero-title-line:nth-child(1){animation-delay:0.36s}.hero-title-line:nth-child(2){animation-delay:0.54s}.hero-title-line:nth-child(3){animation-delay:0.72s}
        .hero-title-shimmer{color:#ff7a1b;display:inline-block;line-height:1.12;padding-bottom:0.14em;background-image:repeating-linear-gradient(100deg,#ff7a1b 0px,#ff7a1b 120px,#ff9226 185px,#ffb347 260px,#ff9226 335px,#ff7a1b 400px,#e8791c 520px);background-size:520px 100%;background-position:0 50%;background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:hero-title-shimmer-soft 5.8s linear infinite;}
        .bus-bob{animation:bus-bob 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite;transform-origin:56% 74%;}
        .bus-aero-overlay{transform:rotate(12deg);transform-origin:22% 50%;}
        .bus-cloud{animation:bus-cloud-drift 1.75s ease-out infinite;}
        .bus-cloud-1{animation-delay:0.06s;animation-duration:1.95s}.bus-cloud-2{animation-delay:0.26s;animation-duration:1.55s}.bus-cloud-3{animation-delay:0.42s;animation-duration:1.58s}.bus-cloud-4{animation-delay:0.62s;animation-duration:1.84s}.bus-cloud-5{animation-delay:0.78s;animation-duration:1.72s}.bus-cloud-6{animation-delay:0.94s;animation-duration:1.6s}
        .bus-aero-trail{transform:rotate(12deg);transform-origin:22% 50%;}
        .bus-tail-cloud{animation:bus-trail-cloud 1.55s ease-out infinite;}
        .bus-tail-cloud-1{animation-delay:0.06s}.bus-tail-cloud-2{animation-delay:0.32s}.bus-tail-cloud-3{animation-delay:0.54s}.bus-tail-cloud-4{animation-delay:0.76s}.bus-tail-cloud-6{animation-delay:0.22s;animation-duration:1.45s}
        .bus-driver-fit{position:absolute;left:26.3%;top:30.7%;width:11.6%;height:15.8%;overflow:hidden;clip-path:polygon(8% 1%,96% 5%,100% 95%,22% 98%,2% 56%);transform:perspective(760px) rotateY(-12deg) rotate(-0.55deg);transform-origin:54% 50%;animation:bus-driver-settle 1.9s cubic-bezier(0.36,0.06,0.29,0.97) infinite;}
        .bus-front-left-passenger{position:absolute;left:48.4%;top:26.2%;width:11.6%;height:15.6%;overflow:hidden;clip-path:polygon(18% 2%,94% 6%,98% 95%,10% 97%,4% 52%);transform:perspective(760px) rotateY(14deg) rotate(0.7deg);transform-origin:50% 50%;animation:bus-driver-settle 2s cubic-bezier(0.36,0.06,0.29,0.97) infinite;z-index:1;}
        .bus-front-left-passenger-img{position:absolute;left:2%;top:3%;width:130%;height:166%;object-fit:cover;object-position:center 10%;filter:saturate(0.8) contrast(1.05) brightness(0.88);opacity:0.93;transform:scaleX(-1) rotate(-2deg);animation:bus-passenger-idle 1.8s ease-in-out infinite;}
        .bus-driver-fit-img{position:absolute;left:-2%;top:3%;width:95%;height:112%;object-fit:cover;object-position:center 8%;filter:saturate(0.82) contrast(1.08) brightness(0.9);opacity:0.95;transform:scaleX(-1) rotate(5deg);animation:bus-driver-idle 1.65s ease-in-out infinite;z-index:1;}
        @keyframes bus-bob{0%,100%{transform:translateY(0) rotate(-0.35deg)}32%{transform:translateY(-4px) rotate(0.12deg)}62%{transform:translateY(-8px) rotate(0.24deg)}82%{transform:translateY(2px) rotate(-0.16deg)}}
        @keyframes bus-cloud-drift{0%{opacity:0.2;transform:translateX(-18px) scale(0.84)}36%{opacity:0.76}100%{opacity:0;transform:translateX(172px) scale(1.3)}}
        @keyframes bus-trail-cloud{0%{opacity:0.62;transform:translateX(-6px) scale(0.78)}34%{opacity:0.96}100%{opacity:0;transform:translateX(92px) scale(1.22)}}
        @keyframes bus-driver-settle{0%,100%{transform:perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0)}34%{transform:perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px)}68%{transform:perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px)}}
        @keyframes bus-driver-idle{0%,100%{transform:scaleX(-1) rotate(5deg) translateY(0)}28%{transform:scaleX(-1) rotate(4.1deg) translateY(-1px)}62%{transform:scaleX(-1) rotate(5.9deg) translateY(1px)}82%{transform:scaleX(-1) rotate(4.6deg) translateY(0)}}
        @keyframes bus-passenger-idle{0%,100%{transform:scaleX(-1) rotate(-2deg) translateY(0)}34%{transform:scaleX(-1) rotate(-1.3deg) translateY(-1px)}72%{transform:scaleX(-1) rotate(-2.6deg) translateY(1px)}}
        @keyframes page-fade-up{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
        @keyframes hero-title-reveal{0%{opacity:0;transform:translateY(14px);filter:blur(3px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
        @keyframes hero-title-shimmer-soft{0%{background-position:0 50%}100%{background-position:-520px 50%}}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;opacity:1!important;transform:none!important}}
      `}</style>
    </div>
  );
}