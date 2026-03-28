import { useEffect, useState } from "react";
import {
  Clock, Bus, DollarSign, MapPin, ChevronDown, Clock as ClockIcon, SlidersHorizontal, X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

/* ================= TYPES ================= */
type StopId = {
  _id: string;
  name: string;
  province: string;
  location?: { type: string; coordinates: [number, number] };
  is_active?: boolean;
};

type TimeStop = {
  _id: string;
  route_id: string;
  stop_id: StopId;
  stop_order: number;
  is_pickup: boolean;
  estimated_time?: number;
  " estimated_time"?: number;
};

type BusTypeId = {
  _id: string;
  name: string;
  description: string;
  category: string;
  amenities: string[];
  isActive: boolean;
};

type BusId = {
  _id: string;
  license_plate: string;
  bus_type_id: BusTypeId;
  status: string;
  created_at: string;
};

type RouteId = {
  _id: string;
  start_id: { _id: string; name: string; province: string };
  stop_id: { _id: string; name: string; province: string };
  distance_km: number;
  is_active: boolean;
};

type Trip = {
  _id: string;
  route_id: RouteId;
  bus_id: BusId;
  departure_time: string;
  arrival_time: string;
  status: string;
  created_at: string;
  time: TimeStop[];
};

type LocationState = {
  id?: string;
};

/* ================= SCHEDULE ACCORDION ================= */
function ScheduleAccordion({ trip }: { trip: Trip }) {
  const sortedStops = [...trip.time].sort((a, b) => a.stop_order - b.stop_order);
  const firstHour =
    sortedStops[0]?.estimated_time ??
    sortedStops[0]?.[" estimated_time"] ??
    0;
  const cumulativeHours = sortedStops.map((stop, idx) => {
    const h = stop.estimated_time ?? stop[" estimated_time"] ?? 0;
    return idx === 0 ? h : firstHour + h;
  });
  const calcArrival = (departureTime: string, totalHours: number) => {
    const base = new Date(new Date(departureTime).getTime() + totalHours * 60 * 60 * 1000);
    const time = base.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const day = String(base.getDate()).padStart(2, "0");
    const month = String(base.getMonth() + 1).padStart(2, "0");
    return { time, date: `${day}-${month}` };
  };
  return (
    <div className="schedule-expand border-t-2 border-orange-100">
      <div className="px-4 md:px-7 pt-5 pb-6 bg-gradient-to-b from-orange-50/40 to-white">
        <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-5">
          Lịch trình · {sortedStops.length} điểm dừng
        </p>
        <div className="relative">
          <div
            className="absolute top-4 bottom-4 w-0.5"
            style={{ left: "15px", background: "linear-gradient(to bottom, #fb923c, #fdba74, #fb923c)" }}
          />
          <div className="space-y-1">
            {sortedStops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === sortedStops.length - 1;
              const estHours = stop.estimated_time ?? stop[" estimated_time"] ?? 0;
              const { time, date } = calcArrival(trip.departure_time, cumulativeHours[idx]);
              return (
                <div key={stop._id} className="flex items-start gap-4 pb-4 last:pb-0">
                  <div className="relative z-10 flex-shrink-0 mt-0.5">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md ${isFirst
                        ? "bg-orange-500 ring-4 ring-orange-100"
                        : isLast
                          ? "bg-orange-700 ring-4 ring-orange-100"
                          : "bg-white ring-2 ring-orange-300"
                        }`}
                    >
                      <MapPin
                        size={14}
                        className={isFirst || isLast ? "text-white" : "text-orange-500"}
                        fill={isFirst || isLast ? "currentColor" : "none"}
                      />
                    </div>
                  </div>
                  <div
                    className={`flex-1 flex items-start justify-between min-w-0 pb-4 last:pb-0 ${!isLast ? "border-b border-orange-50" : ""
                      }`}
                  >
                    <div>
                      <p className={`font-bold text-sm ${isFirst ? "text-orange-600" : isLast ? "text-orange-700" : "text-slate-700"}`}>
                        {stop.stop_id.province}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">{stop.stop_id.name}</p>
                      <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                        {isFirst && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600 border border-orange-200">
                            Xuất phát
                          </span>
                        )}
                        {isLast && (
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                            Điểm đến
                          </span>
                        )}
                        {!isFirst && !isLast && (
                          <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                            Điểm dừng
                          </span>
                        )}
                        {estHours > 0 && (
                          <span className="text-[10px] text-orange-400 flex items-center gap-1 font-medium">
                            <ClockIcon size={10} /> +{estHours}h
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="font-black text-base text-slate-800 tabular-nums">{time}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{date}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= FILTER SIDEBAR CONTENT ================= */
function FilterContent({
  selectedFilters,
  toggleFilter,
  timeSlots,
  busTypes,
  tiers,
  onReset,
  onClose,
}: {
  selectedFilters: { timeSlots: string[]; busTypes: string[]; tiers: string[] };
  toggleFilter: (cat: "timeSlots" | "busTypes" | "tiers", val: string) => void;
  timeSlots: string[];
  busTypes: string[];
  tiers: string[];
  onReset: () => void;
  onClose?: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Header mobile */}
      {onClose && (
        <div className="flex items-center justify-between pb-3 border-b border-orange-100">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <SlidersHorizontal className="text-orange-500" size={20} /> Bộ lọc
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition">
            <X size={18} className="text-slate-600" />
          </button>
        </div>
      )}
      {/* Giờ đi */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 md:p-6">
        <h3 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
          <Clock className="text-orange-500" size={18} /> Giờ đi
        </h3>
        <div className="space-y-2">
          {timeSlots.map((slot) => (
            <label key={slot} className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all">
              <input
                type="checkbox"
                checked={selectedFilters.timeSlots.includes(slot)}
                onChange={() => toggleFilter("timeSlots", slot)}
                className="w-5 h-5 rounded border-2 border-slate-300 accent-orange-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">{slot}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Loại xe */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 md:p-6">
        <h3 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
          <Bus className="text-orange-500" size={18} /> Loại xe
        </h3>
        <div className="space-y-2">
          {busTypes.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all">
              <input
                type="checkbox"
                checked={selectedFilters.busTypes.includes(type)}
                onChange={() => toggleFilter("busTypes", type)}
                className="w-5 h-5 rounded border-2 border-slate-300 accent-orange-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">{type}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Tầng */}
      <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-4 md:p-6">
        <h3 className="font-bold text-base text-slate-800 mb-3 flex items-center gap-2">
          <DollarSign className="text-orange-500" size={18} /> Tầng
        </h3>
        <div className="space-y-2">
          {tiers.map((tier) => (
            <label key={tier} className="flex items-center gap-3 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all">
              <input
                type="checkbox"
                checked={selectedFilters.tiers.includes(tier)}
                onChange={() => toggleFilter("tiers", tier)}
                className="w-5 h-5 rounded border-2 border-slate-300 accent-orange-500 cursor-pointer"
              />
              <span className="text-sm text-slate-700 font-medium">{tier}</span>
            </label>
          ))}
        </div>
      </div>
      <button
        onClick={onReset}
        className="w-full bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-md"
      >
        Đặt lại
      </button>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function BusTripSearch() {
  const api = import.meta.env.VITE_API_URL
  const location = useLocation();
  const locationState = location.state as LocationState | null;
  const id = locationState?.id;
  console.log("id là: ", id)
  const navigate = useNavigate();
  const [selectedFilters, setSelectedFilters] = useState({
    timeSlots: [] as string[],
    busTypes: [] as string[],
    tiers: [] as string[],
  });
  const [trips, setTrip] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSchedule, setOpenSchedule] = useState<string | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);

  const timeSlots = ["Sáng sớm: 0h - 6h", "Buổi Sáng: 6h - 12h", "Buổi Chiều: 12h - 18h", "Buổi Tối: 18h - 24h"];
  const busTypes = ["Ghế Phổ", "Giường nằm", "Limousine"];
  const tiers = ["Tiêu chuẩn", "Tiêu tiết", "Tiêu cao"];

  const toggleFilter = (category: keyof typeof selectedFilters, value: string) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [category]: prev[category].includes(value)
        ? prev[category].filter((item) => item !== value)
        : [...prev[category], value],
    }));
  };
  const resetFilters = () => setSelectedFilters({ timeSlots: [], busTypes: [], tiers: [] });

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await fetch(`${api}/api/customer/notcheck/viewTrip`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ route_id: id }),
        });
        if (!response.ok) throw new Error("Failed to fetch trips");
        const data: { data: Trip[] } = await response.json();
        setTrip(data.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [id]);

  const calculateDuration = (
    departure: string | Date | null | undefined,
    arrival: string | Date | null | undefined
  ): string => {
    if (!departure || !arrival) return "N/A";
    const start = new Date(departure);
    const end = new Date(arrival);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "Invalid time";
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return "Invalid range";
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    return `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  };

  const formatDateTime = (value: string | Date | null | undefined): string => {
    if (!value) return "N/A";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "Invalid date";
    return date.toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const DatVe = (type_bus_id: string, trip_id: string) => {
    console.log("trip_id là: ", trip_id)
    // id bên dưới là route id
    navigate("/datve", { state: { tripId: id, bus_type_id: type_bus_id, trip_id: trip_id } });
  };
  const DatHang = (type_bus_id: string, trip_id: string) => {
    navigate("/dathang", { state: { tripId: id, bus_type_id: type_bus_id, trip_id: trip_id } });
  };
  const toggleSchedule = (tripId: string) => {
    setOpenSchedule((prev) => (prev === tripId ? null : tripId));
  };

  if (loading) return <p className="p-6 text-center">Loading...</p>;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">
      {/* Background */}
      <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />

      {/* Bus Animation */}
      <div className="pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%]">
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
          <span className="bus-tail-cloud bus-tail-cloud-5 absolute right-[44%] top-[42%] h-[24%] w-[22%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.3)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
          <span className="bus-tail-cloud bus-tail-cloud-6 absolute right-[24%] top-[44%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
          <span className="bus-tail-cloud bus-tail-cloud-7 absolute right-[18%] top-[64%] h-[22%] w-[22%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.76)_0%,rgba(255,255,255,0.34)_54%,rgba(255,255,255,0)_100%)] blur-[9px]" />
        </div>
        <div className="bus-bob relative z-10">
          <img
            src="/images/bus7.png"
            alt="Bus overlay"
            className="w-full object-contain block relative"
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

      {/* Hero Section */}
      <div className="relative z-20 mx-auto flex min-h-[520px] w-full max-w-[1240px] items-center px-4 pb-16 pt-24 lg:min-h-[580px] lg:pt-20">
        <div className="page-enter-copy relative isolate -ml-8 max-w-[760px] space-y-6 sm:-ml-14 lg:-ml-24">
          <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />
          <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[300px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.46)_0%,rgba(248,250,252,0.14)_58%,rgba(248,250,252,0)_84%)] blur-[18px]" />
          <h1 className="hero-title relative z-10 py-1 text-[48px] font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] sm:text-[58px] lg:text-[72px]">
            <span className="hero-title-line block whitespace-nowrap">Tìm và đặt ngay</span>
            <span className="hero-title-line mt-2 block whitespace-nowrap">những chuyến xe</span>
            <span className="hero-title-line mt-2 block whitespace-nowrap font-extrabold italic">
              <span className="text-[#0d142a]">thật</span>{" "}
              <span className="hero-title-shimmer">Dễ Dàng</span>
            </span>
          </h1>
          <p className="relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
            Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ chất lượng cao nhất.
          </p>
        </div>
      </div>

      {/* Search Results Section */}
      <div className="relative z-20 py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4">
          {/* Mobile filter button */}
          <div className="flex items-center justify-between mb-4 md:hidden">
            <p className="text-sm font-bold text-slate-600">{trips.length} chuyến xe</p>
            <button
              onClick={() => setFilterOpen(true)}
              className="flex items-center gap-2 bg-white border-2 border-orange-200 text-orange-600 font-bold text-sm px-4 py-2 rounded-xl shadow-sm hover:bg-orange-50 transition"
            >
              <SlidersHorizontal size={16} />
              Bộ lọc
              {selectedFilters.timeSlots.length + selectedFilters.busTypes.length + selectedFilters.tiers.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {selectedFilters.timeSlots.length + selectedFilters.busTypes.length + selectedFilters.tiers.length}
                </span>
              )}
            </button>
          </div>

          {/* Mobile Filter Drawer */}
          {filterOpen && (
            <div className="fixed inset-0 z-[999] md:hidden">
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setFilterOpen(false)} />
              <div
                className="absolute bottom-0 left-0 right-0 bg-[#fdf8f4] rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto shadow-2xl"
                style={{ animation: "slideUp 0.3s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-5" />
                <FilterContent
                  selectedFilters={selectedFilters}
                  toggleFilter={toggleFilter}
                  timeSlots={timeSlots}
                  busTypes={busTypes}
                  tiers={tiers}
                  onReset={resetFilters}
                  onClose={() => setFilterOpen(false)}
                />
                <button
                  onClick={() => setFilterOpen(false)}
                  className="w-full mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-lg"
                >
                  Áp dụng ({trips.length} chuyến)
                </button>
              </div>
            </div>
          )}

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
            {/* SIDEBAR desktop */}
            <aside className="hidden lg:block space-y-6">
              <FilterContent
                selectedFilters={selectedFilters}
                toggleFilter={toggleFilter}
                timeSlots={timeSlots}
                busTypes={busTypes}
                tiers={tiers}
                onReset={resetFilters}
              />
            </aside>

            {/* TRIP RESULTS */}
            <main className="space-y-4">
              {trips.map((trip, index) => {
                const isOpen = openSchedule === trip._id;
                return (
                  <div
                    key={trip._id}
                    className="relative group"
                    style={{
                      animation: "fadeInUp 0.5s ease-out forwards",
                      animationDelay: `${index * 0.1}s`,
                      opacity: 0,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-orange-500/30 to-orange-400/0 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                    <div
                      className={`bg-gradient-to-br from-white via-white to-orange-50/30 rounded-2xl shadow-xl border-2 transition-all duration-300 relative overflow-hidden
                        ${isOpen
                          ? "border-orange-300 shadow-orange-100"
                          : "border-orange-100/50 hover:shadow-2xl hover:border-orange-200 md:hover:-translate-y-1"
                        }`}
                    >
                      {/* Top accent */}
                      <div
                        className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                          }`}
                      />
                      <div className="p-4 md:p-7">
                        {/* DESKTOP Time row */}
                        <div className="hidden md:flex flex-col md:flex-row items-start md:items-center mb-6 gap-6">
                          <div className="flex-1 flex items-center gap-6">
                            <div>
                              <div className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
                                {formatDateTime(trip.departure_time)}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {trip.route_id.start_id.province} ({trip.route_id.start_id.name})
                              </div>
                            </div>
                            <div className="flex flex-col items-center px-4 md:px-8">
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-3 h-3 rounded-full bg-orange-400 ring-4 ring-orange-100" />
                                <div className="h-0.5 w-24 md:w-40 bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 relative">
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <Bus className="text-orange-500 bg-white rounded-full p-1" size={20} />
                                  </div>
                                </div>
                                <div className="w-3 h-3 rounded-full bg-orange-600 ring-4 ring-orange-100" />
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-600 font-semibold bg-orange-50 px-3 py-1 rounded-full">
                                <span>{calculateDuration(trip.departure_time, trip.arrival_time)}</span>
                                <span>•</span>
                                <span>{trip.route_id.distance_km} km</span>
                              </div>
                            </div>
                            <div>
                              <div className="text-2xl md:text-3xl font-black text-slate-800 mb-1">
                                {formatDateTime(trip.arrival_time)}
                              </div>
                              <div className="text-sm text-slate-500 font-medium">
                                {trip.route_id.stop_id.province} ({trip.route_id.stop_id.name})
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* MOBILE Time row */}
                        <div className="md:hidden mb-4">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-extrabold text-orange-600 text-sm">
                              {trip.route_id.start_id.province}
                            </span>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-orange-500 flex-shrink-0">
                              <path
                                d="M5 12H19M19 12L12 5M19 12L12 19"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="font-extrabold text-orange-600 text-sm">
                              {trip.route_id.stop_id.province}
                            </span>
                          </div>
                          <div className="flex items-center justify-between bg-orange-50/60 rounded-xl px-3 py-2.5 mb-3">
                            <div>
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Khởi hành</p>
                              <p className="font-black text-slate-800 text-sm">{formatDateTime(trip.departure_time)}</p>
                            </div>
                            <div className="text-center px-2">
                              <p className="text-[10px] text-orange-500 font-bold">
                                {calculateDuration(trip.departure_time, trip.arrival_time)}
                              </p>
                              <p className="text-[10px] text-slate-400">{trip.route_id.distance_km} km</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-semibold uppercase">Đến nơi</p>
                              <p className="font-black text-slate-800 text-sm">{formatDateTime(trip.arrival_time)}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span className="bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-3 py-1 rounded-lg">
                              {trip.bus_id.bus_type_id.name}
                            </span>
                            <span className="bg-green-50 border border-green-200 text-green-700 text-xs font-bold px-3 py-1 rounded-lg">
                              200.000 VND
                            </span>
                            <button
                              onClick={() => toggleSchedule(trip._id)}
                              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-lg border-2 transition-all ${isOpen
                                ? "bg-orange-50 border-orange-300 text-orange-600"
                                : "bg-slate-50 border-slate-200 text-slate-500"
                                }`}
                            >
                              <MapPin size={11} />
                              Lịch trình
                              <ChevronDown
                                size={11}
                                className="transition-transform duration-300"
                                style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                              />
                            </button>
                          </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex items-center justify-between pt-5 border-t-2 border-orange-100">
                          <div className="flex items-center gap-3 flex-wrap">
                            <div className="flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-xl">
                              <span className="text-xs font-semibold text-slate-600">Chọn Ghế</span>
                            </div>
                            <button
                              onClick={() => toggleSchedule(trip._id)}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all duration-200 font-semibold text-xs"
                              style={{
                                background: isOpen ? "#fff7ed" : "#f8fafc",
                                borderColor: isOpen ? "#fb923c" : "#e2e8f0",
                                color: isOpen ? "#ea580c" : "#475569",
                              }}
                            >
                              <MapPin size={13} className={isOpen ? "text-orange-500" : "text-slate-400"} />
                              Lịch Trình
                              <ChevronDown
                                size={13}
                                className="transition-transform duration-300"
                                style={{
                                  transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                  color: isOpen ? "#f97316" : "#94a3b8",
                                }}
                              />
                            </button>
                            <div className="bg-gradient-to-br from-purple-50 to-purple-100 px-4 py-2 rounded-xl border border-purple-200">
                              <span className="text-xs font-bold text-purple-700">
                                {trip.bus_id.bus_type_id.name}
                              </span>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 px-4 py-2 rounded-xl border border-green-200">
                              <span className="text-xs font-bold text-green-700">200.000 VND</span>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <button
                              onClick={() => DatVe(trip.bus_id.bus_type_id._id, trip._id)}
                              className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white px-9 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 relative overflow-hidden group/btn"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                              <span className="relative z-10">Đặt vé</span>
                            </button>
                            <button
                              onClick={() => DatHang(trip.bus_id.bus_type_id._id, trip._id)}
                              className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 hover:from-green-600 hover:via-green-700 hover:to-green-800 text-white px-6 py-3.5 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:shadow-green-500/50 hover:scale-105 transition-all duration-300 relative overflow-hidden group/btn"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
                              <span className="relative z-10">Gửi hàng</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Accordion schedule */}
                      <div
                        style={{
                          maxHeight: isOpen ? "600px" : "0px",
                          overflow: "hidden",
                          transition: "max-height 0.4s cubic-bezier(0.4,0,0.2,1)",
                        }}
                      >
                        {isOpen && <ScheduleAccordion trip={trip} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </main>
          </div>
        </div>
      </div>

      <style>{`
        .page-enter-copy {
          opacity: 0;
          will-change: transform, opacity;
          animation: page-fade-up 1.08s cubic-bezier(0.22, 1, 0.36, 1) forwards;
          animation-delay: 0.2s;
        }
        .hero-title-line {
          opacity: 0;
          transform: translateY(14px);
          animation: hero-title-reveal 1.12s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
        }
        .hero-title-line:nth-child(1) { animation-delay: 0.36s; }
        .hero-title-line:nth-child(2) { animation-delay: 0.54s; }
        .hero-title-line:nth-child(3) { animation-delay: 0.72s; }
        .hero-title-shimmer {
          color: #ff7a1b;
          display: inline-block;
          line-height: 1.12;
          padding-bottom: 0.14em;
          background-image: repeating-linear-gradient(
            100deg, #ff7a1b 0px, #ff7a1b 120px, #ff9226 185px,
            #ffb347 260px, #ff9226 335px, #ff7a1b 400px, #e8791c 520px
          );
          background-size: 520px 100%;
          background-position: 0 50%;
          background-repeat: repeat;
          background-clip: text;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 1px 0 rgba(255,181,88,0.36), 0 2px 0 rgba(234,121,27,0.38), 0 4px 0 rgba(178,76,16,0.3), 0 10px 16px rgba(94,40,9,0.22);
          -webkit-text-stroke: 0.26px rgba(136,57,12,0.26);
          filter: saturate(1.16) contrast(1.12) brightness(1.06);
          animation: hero-title-shimmer-soft 5.8s linear infinite;
          will-change: background-position;
        }
        .bus-bob { animation: bus-bob 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite; transform-origin: 56% 74%; will-change: transform; }
        .bus-aero-overlay { transform: rotate(12deg); transform-origin: 22% 50%; }
        .bus-cloud { animation: bus-cloud-drift 1.75s ease-out infinite; will-change: transform, opacity; }
        .bus-cloud-1 { animation-delay: 0.06s; animation-duration: 1.95s; }
        .bus-cloud-2 { animation-delay: 0.26s; animation-duration: 1.55s; }
        .bus-cloud-3 { animation-delay: 0.42s; animation-duration: 1.58s; }
        .bus-cloud-4 { animation-delay: 0.62s; animation-duration: 1.84s; }
        .bus-cloud-5 { animation-delay: 0.78s; animation-duration: 1.72s; }
        .bus-cloud-6 { animation-delay: 0.94s; animation-duration: 1.6s; }
        .bus-aero-trail { transform: rotate(12deg); transform-origin: 22% 50%; }
        .bus-tail-cloud { animation: bus-trail-cloud 1.55s ease-out infinite; will-change: transform, opacity; }
        .bus-tail-cloud-1 { animation-delay: 0.06s; } .bus-tail-cloud-2 { animation-delay: 0.32s; }
        .bus-tail-cloud-3 { animation-delay: 0.54s; } .bus-tail-cloud-4 { animation-delay: 0.76s; }
        .bus-tail-cloud-5 { animation-delay: 0.9s; animation-duration: 1.7s; }
        .bus-tail-cloud-6 { animation-delay: 0.22s; animation-duration: 1.45s; }
        .bus-tail-cloud-7 { animation-delay: 0.48s; animation-duration: 1.55s; }
        .bus-driver-fit {
          position: absolute; left: 26.3%; top: 30.7%; width: 11.6%; height: 15.8%;
          overflow: hidden; clip-path: polygon(8% 1%, 96% 5%, 100% 95%, 22% 98%, 2% 56%);
          transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg); transform-origin: 54% 50%;
          box-shadow: inset 0 -14px 16px rgba(2,6,23,0.28);
          animation: bus-driver-settle 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
        }
        .bus-front-left-passenger {
          position: absolute; left: 48.4%; top: 26.2%; width: 11.6%; height: 15.6%;
          overflow: hidden; clip-path: polygon(18% 2%, 94% 6%, 98% 95%, 10% 97%, 4% 52%);
          transform: perspective(760px) rotateY(14deg) rotate(0.7deg); transform-origin: 50% 50%;
          box-shadow: inset 0 -14px 16px rgba(2,6,23,0.34);
          animation: bus-driver-settle 2s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite; z-index: 1;
        }
        .bus-front-left-passenger-img {
          position: absolute; left: 2%; top: 3%; width: 130%; height: 166%;
          object-fit: cover; object-position: center 10%;
          filter: saturate(0.8) contrast(1.05) brightness(0.88); opacity: 0.93;
          transform: scaleX(-1) rotate(-2deg); animation: bus-passenger-idle 1.8s ease-in-out infinite;
        }
        .bus-driver-fit-img {
          position: absolute; left: -2%; top: 3%; width: 95%; height: 112%;
          object-fit: cover; object-position: center 8%;
          filter: saturate(0.82) contrast(1.08) brightness(0.9); opacity: 0.95;
          transform: scaleX(-1) rotate(5deg); animation: bus-driver-idle 1.65s ease-in-out infinite; z-index: 1;
        }
        .schedule-expand { animation: expandDown 0.35s cubic-bezier(0.4,0,0.2,1); }
        @keyframes expandDown { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes bus-bob {
          0%, 100% { transform: translateY(0) rotate(-0.35deg); } 32% { transform: translateY(-4px) rotate(0.12deg); }
          62% { transform: translateY(-8px) rotate(0.24deg); } 82% { transform: translateY(2px) rotate(-0.16deg); }
        }
        @keyframes bus-cloud-drift { 0% { opacity: 0.2; transform: translateX(-18px) scale(0.84); } 36% { opacity: 0.76; } 100% { opacity: 0; transform: translateX(172px) scale(1.3); } }
        @keyframes bus-trail-cloud { 0% { opacity: 0.62; transform: translateX(-6px) scale(0.78); } 34% { opacity: 0.96; } 100% { opacity: 0; transform: translateX(92px) scale(1.22); } }
        @keyframes bus-driver-settle {
          0%, 100% { transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0); }
          34% { transform: perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px); }
          68% { transform: perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px); }
        }
        @keyframes bus-driver-idle {
          0%, 100% { transform: scaleX(-1) rotate(5deg) translateY(0); } 28% { transform: scaleX(-1) rotate(4.1deg) translateY(-1px); }
          62% { transform: scaleX(-1) rotate(5.9deg) translateY(1px); } 82% { transform: scaleX(-1) rotate(4.6deg) translateY(0); }
        }
        @keyframes bus-passenger-idle {
          0%, 100% { transform: scaleX(-1) rotate(-2deg) translateY(0); } 34% { transform: scaleX(-1) rotate(-1.3deg) translateY(-1px); }
          72% { transform: scaleX(-1) rotate(-2.6deg) translateY(1px); }
        }
        @keyframes page-fade-up { 0% { opacity: 0; transform: translateY(24px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes hero-title-reveal { 0% { opacity: 0; transform: translateY(14px); filter: blur(3px); } 100% { opacity: 1; transform: translateY(0); filter: blur(0); } }
        @keyframes hero-title-shimmer-soft { 0% { background-position: 0 50%; } 100% { background-position: -520px 50%; } }
        input[type="checkbox"]:checked { background-color: #f97316; border-color: #f97316; }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
      `}</style>
    </div>
  );
}