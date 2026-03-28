import { useState, useMemo, useEffect } from "react";
import { X, ArrowRight, Armchair, MapPin, Navigation, SlidersHorizontal, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

/* ================= TYPES ================= */

type SeatStatus = "available" | "selected" | "booked";

type Seat = {
    id: string;
    floor: 1 | 2;
    row: number;
    col: number;
    status: SeatStatus;
    label: string;
};

type StopPoint = {
    _id: string;
    route_id: string;
    stop_order: number;
    is_pickup: boolean;
    stop_id: {
        _id: string;
        name: string;
        province: string;
        is_active: boolean;
        location: { type: string; coordinates: number[] };
    };
};

type LocationPoint = {
    _id: string;
    stop_id: string;
    location_name: string;
    status: boolean;
    location_type: "PICKUP" | "DROPOFF";
    is_active: boolean;
    location: { type: string; coordinates: number[] };
};

/* ================= COMPONENT ================= */
const API_BASE = import.meta.env.VITE_API_URL;
export default function BusSeatSelection() {
    const location = useLocation();
    const route_id = location.state?.tripId ?? "";
    const trips_id = location.state?.trip_id ?? "";
    console.log("trips id ỏe đặt vé là: ", trips_id)
    const bus_type_id = location.state?.bus_type_id ?? "";
    const justBookedLabels: string[] = location.state?.justBookedLabels ?? [];
    const restoredPickupId: string = location.state?.restoredPickupId ?? "";
    const restoredDropoffId: string = location.state?.restoredDropoffId ?? "";

    const [selectedFloor, setSelectedFloor] = useState<1 | 2>(1);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
    const [bookedSeatLabels, setBookedSeatLabels] = useState<string[]>(justBookedLabels);

    const [pickupPoints, setPickupPoints] = useState<StopPoint[]>([]);
    const [dropoffPoints, setDropoffPoints] = useState<StopPoint[]>([]);

    const [selectedPickupId, setSelectedPickupId] = useState<string>(restoredPickupId);
    const [selectedPickupStopId, setSelectedPickupStopId] = useState<string>("");
    const [selectedDropoffId, setSelectedDropoffId] = useState<string>(restoredDropoffId);
    const [selectedDropoffStopId, setSelectedDropoffStopId] = useState<string>("");

    const [pickupLocationPoints, setPickupLocationPoints] = useState<LocationPoint[]>([]);
    const [dropoffLocationPoints, setDropoffLocationPoints] = useState<LocationPoint[]>([]);
    const [selectedPickupLocationId, setSelectedPickupLocationId] = useState<string>("");
    const [selectedDropoffLocationId, setSelectedDropoffLocationId] = useState<string>("");
    const [loadingPickupLocations, setLoadingPickupLocations] = useState(false);
    const [loadingDropoffLocations, setLoadingDropoffLocations] = useState(false);

    const [ticketPrice, setTicketPrice] = useState<number | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    const [filters, setFilters] = useState({
        timeSlots: [] as string[],
        busTypes: [] as string[],
        tiers: [] as string[],
    });

    const [trip, setTrip] = useState<any>(null);

    // ── Mobile-only UI state ──────────────────────────────────────────────────
    const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
    const [mobileRouteOpen, setMobileRouteOpen] = useState(true);

    /* ── Fetch sơ đồ xe ── */
    useEffect(() => {
        if (!route_id) return;
        fetch(`${API_BASE}/api/customer/notcheck/diagram-bus`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route_id }),
        })
            .then(r => r.json())
            .then(res => setTrip(res.data))
            .catch(console.error);
    }, [route_id]);

    useEffect(() => {
        if (!trip?._id || !selectedPickupId || !selectedDropoffId) {
            setBookedSeatLabels(justBookedLabels);
            return;
        }
        fetch(`${API_BASE}/api/customer/notcheck/booked-seats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                trip_id: trip._id,
                start_id: selectedPickupId,
                end_id: selectedDropoffId,
            }),
        })
            .then(r => r.json())
            .then(res => {
                const fromBE: string[] = Array.isArray(res.data) ? res.data : [];
                const merged = [...new Set([...fromBE, ...justBookedLabels])];
                setBookedSeatLabels(merged);
            })
            .catch(console.error);
    }, [trip?._id, selectedPickupId, selectedDropoffId]);

    useEffect(() => {
        if (!route_id) return;
        fetch(`${API_BASE}/api/customer/notcheck/start-point`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route_id, trips_id }),
        })
            .then(r => r.json())
            .then(res => {
                const data: StopPoint[] = res.data ?? [];
                const sorted = data.sort((a, b) => a.stop_order - b.stop_order);
                setPickupPoints(sorted);
                if (restoredPickupId) {
                    const found = sorted.find(p => p._id === restoredPickupId);
                    if (found) setSelectedPickupStopId(found.stop_id._id);
                }
            })
            .catch(console.error);
    }, [route_id]);

    useEffect(() => {
        if (!route_id) return;
        if (!restoredDropoffId) {
            setSelectedDropoffId("");
            setSelectedDropoffStopId("");
        }
        setDropoffLocationPoints([]);
        setSelectedDropoffLocationId("");

        fetch(`${API_BASE}/api/customer/notcheck/end-point`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route_id, start_id: selectedPickupStopId, bus_type_id }),
        })
            .then(r => r.json())
            .then(res => {
                const data: StopPoint[] = res.data ?? [];
                const sorted = data.sort((a, b) => a.stop_order - b.stop_order);
                setDropoffPoints(sorted);
                if (restoredDropoffId) {
                    const found = sorted.find(p => p._id === restoredDropoffId);
                    if (found) setSelectedDropoffStopId(found.stop_id._id);
                }
            })
            .catch(console.error);
    }, [route_id, selectedPickupStopId]);

    useEffect(() => {
        if (!selectedPickupStopId || !route_id) {
            setPickupLocationPoints([]);
            setSelectedPickupLocationId("");
            return;
        }
        setLoadingPickupLocations(true);
        setSelectedPickupLocationId("");
        fetch(`${API_BASE}/api/customer/notcheck/location-point`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stop_id: selectedPickupStopId, route_id }),
        })
            .then(r => r.json())
            .then(res => {
                const data: LocationPoint[] = (res.data ?? []).filter(
                    (p: LocationPoint) => p.is_active && p.status
                );
                setPickupLocationPoints(data);
                if (data.length === 1) setSelectedPickupLocationId(data[0]._id);
            })
            .catch(console.error)
            .finally(() => setLoadingPickupLocations(false));
    }, [selectedPickupStopId, route_id]);

    useEffect(() => {
        if (!selectedDropoffStopId || !route_id) {
            setDropoffLocationPoints([]);
            setSelectedDropoffLocationId("");
            return;
        }
        setLoadingDropoffLocations(true);
        setSelectedDropoffLocationId("");
        fetch(`${API_BASE}/api/customer/notcheck/location-point`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ stop_id: selectedDropoffStopId, route_id }),
        })
            .then(r => r.json())
            .then(res => {
                const data: LocationPoint[] = (res.data ?? []).filter(
                    (p: LocationPoint) => p.is_active && p.status
                );
                setDropoffLocationPoints(data);
                if (data.length === 1) setSelectedDropoffLocationId(data[0]._id);
            })
            .catch(console.error)
            .finally(() => setLoadingDropoffLocations(false));
    }, [selectedDropoffStopId, route_id]);

    const selectedPickup = pickupPoints.find(p => p._id === selectedPickupId) ?? null;
    const selectedDropoff = dropoffPoints.find(p => p._id === selectedDropoffId) ?? null;
    const selectedPickupLocation = pickupLocationPoints.find(p => p._id === selectedPickupLocationId) ?? null;
    const selectedDropoffLocation = dropoffLocationPoints.find(p => p._id === selectedDropoffLocationId) ?? null;

    useEffect(() => {
        const start_id = selectedPickupStopId;
        const end_id = selectedDropoffStopId;
        const bt_id = bus_type_id ?? trip?.bus_id?.bus_type_id?._id;
        if (!start_id || !end_id || !route_id || !bt_id) {
            setTicketPrice(null);
            return;
        }
        setLoadingPrice(true);
        fetch(`${API_BASE}/api/customer/notcheck/getPrice`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ start_id, end_id, route_id, bus_type_id: bt_id }),
        })
            .then(r => r.json())
            .then(res => setTicketPrice(typeof res.data === "number" ? res.data : null))
            .catch(console.error)
            .finally(() => setLoadingPrice(false));
    }, [selectedPickupStopId, selectedDropoffStopId, route_id, bus_type_id, trip]);

    const generateSeatsFromLayout = (floor: number): Seat[] => {
        if (!trip?.bus_id?.seat_layout) return [];
        const { rows, columns, row_overrides } = trip.bus_id.seat_layout;
        const seats: Seat[] = [];
        let seatCounter = 1;
        for (let row = 1; row <= rows; row++) {
            const override = row_overrides?.find((r: any) => r.row_index === row && r.floor === floor);
            columns.forEach((col: any, colIndex: number) => {
                let seatsInColumn = col.seats_per_row;
                if (override) {
                    const colOverride = override.column_overrides.find((c: any) => c.column_name === col.name);
                    if (colOverride) seatsInColumn = colOverride.seats;
                }
                for (let i = 0; i < seatsInColumn; i++) {
                    const label = `A${seatCounter++}`;
                    const isBooked = bookedSeatLabels.includes(label);
                    seats.push({
                        id: `${floor}-${row}-${colIndex}-${i}`,
                        floor: floor as 1 | 2,
                        row,
                        col: colIndex,
                        status: isBooked ? "booked" : "available",
                        label,
                    });
                }
            });
        }
        return seats;
    };

    const floor1Seats = useMemo(() => generateSeatsFromLayout(1), [trip, bookedSeatLabels]);
    const floor2Seats = useMemo(() => generateSeatsFromLayout(2), [trip, bookedSeatLabels]);
    const currentSeats = selectedFloor === 1 ? floor1Seats : floor2Seats;

    const availableSeats = useMemo(
        () => currentSeats.filter(s => s.status === "available" && !selectedSeats.includes(s.id)).length,
        [currentSeats, selectedSeats]
    );

    const timeSlots = ["Sáng sớm: 0h - 6h", "Buổi Sáng: 6h - 12h", "Buổi Chiều: 12h - 18h", "Buổi Tối: 18h - 24h"];
    const busTypes = ["Ghế ngồi", "Giường nằm", "Limousine"];
    const tiers = ["Tầng trên", "Tầng dưới"];

    const toggleFilter = (category: keyof typeof filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value) ? prev[category].filter(i => i !== value) : [...prev[category], value],
        }));
    };

    const toggleSeat = (seatId: string, status: SeatStatus) => {
        if (status === "booked") return;
        setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(id => id !== seatId) : [...prev, seatId]);
    };

    const getSeatStatus = (seat: Seat): SeatStatus => {
        if (seat.status === "booked") return "booked";
        if (selectedSeats.includes(seat.id)) return "selected";
        return "available";
    };

    const clearFilters = () => setFilters({ timeSlots: [], busTypes: [], tiers: [] });

    const groupedSeats = useMemo(() => {
        const grouped: Record<number, { LEFT: Seat[]; RIGHT: Seat[] }> = {};
        currentSeats.forEach(seat => {
            if (!grouped[seat.row]) grouped[seat.row] = { LEFT: [], RIGHT: [] };
            if (seat.col === 0) grouped[seat.row].LEFT.push(seat);
            else grouped[seat.row].RIGHT.push(seat);
        });
        return grouped;
    }, [currentSeats]);

    const renderSeat = (seat: Seat) => {
        const status = getSeatStatus(seat);
        const v = {
            available: { detail: "border-green-400 bg-green-50", frame: "border-green-400 bg-white text-green-700", leg: "bg-green-400" },
            selected: { detail: "border-orange-500 bg-orange-100", frame: "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg", leg: "bg-orange-500" },
            booked: { detail: "border-slate-300 bg-slate-100", frame: "border-slate-300 bg-slate-200 text-slate-400", leg: "bg-slate-300" },
        }[status];
        return (
            <button
                key={seat.id}
                onClick={() => toggleSeat(seat.id, status)}
                disabled={status === "booked"}
                title={status === "booked" ? `Ghế ${seat.label} đã được đặt` : `Ghế ${seat.label}`}
                className={`relative h-[32px] w-[62px] transition-all duration-300 ${status === "available" ? "hover:scale-110 cursor-pointer active:scale-95" :
                    status === "selected" ? "scale-110" : "cursor-not-allowed opacity-60"}`}
            >
                <span className={`absolute left-[13px] top-0.5 h-1.5 w-[35px] rounded-t-[4px] border-[1.5px] border-b-0 ${v.detail}`} />
                <span className={`absolute left-[7px] top-2 flex h-[14px] w-[48px] items-center justify-center rounded-[4px] border-[1.5px] text-[9px] font-black ${v.frame}`}>{seat.label}</span>
                <span className={`absolute left-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
                <span className={`absolute right-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
            </button>
        );
    };

    const formatTime = (d?: string) => { if (!d) return "--:--"; return new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }); };
    const formatDate = (d?: string) => { if (!d) return ""; return new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); };
    const calculateDuration = (s?: string, e?: string) => { if (!s || !e) return ""; return `${Math.floor((new Date(e).getTime() - new Date(s).getTime()) / 3600000)} giờ`; };

    const canContinue =
        selectedSeats.length > 0 &&
        selectedPickupId !== "" &&
        selectedDropoffId !== "" &&
        (pickupLocationPoints.length === 0 || selectedPickupLocationId !== "") &&
        (dropoffLocationPoints.length === 0 || selectedDropoffLocationId !== "");

    const validationMessage = () => {
        if (!selectedPickupId && !selectedDropoffId) return "Vui lòng chọn điểm đón & điểm trả";
        if (!selectedPickupId) return "Vui lòng chọn điểm đón";
        if (!selectedDropoffId) return "Vui lòng chọn điểm trả";
        if (pickupLocationPoints.length > 0 && !selectedPickupLocationId) return "Vui lòng chọn vị trí cụ thể điểm đón";
        if (dropoffLocationPoints.length > 0 && !selectedDropoffLocationId) return "Vui lòng chọn vị trí cụ thể điểm trả";
        return "";
    };

    const activeFilterCount = filters.timeSlots.length + filters.busTypes.length + filters.tiers.length;

    const Chevron = () => (
        <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </span>
    );

    /* ─────────────────────────────────────────────────────────────────────────
       MOBILE FILTER SHEET
    ───────────────────────────────────────────────────────────────────────── */
    const MobileFilterSheet = () => (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setMobileFilterOpen(false)}
            />
            {/* Sheet */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl lg:hidden max-h-[80vh] overflow-y-auto">
                <div className="sticky top-0 bg-white rounded-t-3xl pt-4 px-6 pb-3 border-b border-slate-100 z-10">
                    <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-lg text-slate-800">Bộ lọc</span>
                        <button onClick={clearFilters} className="text-sm text-orange-500 font-semibold">Bỏ tất cả</button>
                    </div>
                </div>
                <div className="px-6 py-4 space-y-6">
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Giờ đi</p>
                        <div className="flex flex-wrap gap-2">
                            {timeSlots.map(slot => (
                                <button key={slot} onClick={() => toggleFilter("timeSlots", slot)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${filters.timeSlots.includes(slot) ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                                    {slot.split(":")[0]}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Loại xe</p>
                        <div className="flex flex-wrap gap-2">
                            {busTypes.map(type => (
                                <button key={type} onClick={() => toggleFilter("busTypes", type)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${filters.busTypes.includes(type) ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Tầng</p>
                        <div className="flex flex-wrap gap-2">
                            {tiers.map(tier => (
                                <button key={tier} onClick={() => toggleFilter("tiers", tier)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all ${filters.tiers.includes(tier) ? "bg-orange-500 border-orange-500 text-white" : "bg-white border-slate-200 text-slate-600"}`}>
                                    {tier}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setMobileFilterOpen(false)}
                        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                        Áp dụng
                    </button>
                </div>
            </div>
        </>
    );

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-orange-50/30 to-slate-100">

            {/* ── MOBILE FILTER SHEET ── */}
            {mobileFilterOpen && <MobileFilterSheet />}

            {/* ══════════════════════════════════════════════
                DESKTOP ONLY: Background + Bus animation + Hero
            ══════════════════════════════════════════════ */}
            <div className="hidden lg:block">
                <div className="absolute inset-0 bg-[linear-gradient(96deg,rgba(255,255,255,0.98)_0%,rgba(255,255,255,0.93)_34%,rgba(255,255,255,0.64)_56%,rgba(255,255,255,0.16)_78%,rgba(255,255,255,0)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-b from-transparent via-[#f3ece5] to-[#ece7e2]" />
                <div className="absolute inset-x-0 bottom-0 h-px bg-[#ece7e2]" />
            </div>

            {/* Bus Animation — desktop only */}
            <div className="hidden lg:block pointer-events-none absolute top-[18%] right-[0%] z-10 w-[66%] max-w-[860px] md:top-[9%] md:w-[62%]">
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
                    <img src="/images/bus7.png" alt="Bus overlay" className="w-full object-contain block relative"
                        style={{ imageRendering: "auto", filter: "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))" }} />
                    <div className="pointer-events-none absolute inset-0">
                        <div className="bus-front-left-passenger"><img src="/images/loxe1.png" alt="Front passenger" className="bus-front-left-passenger-img" /></div>
                        <div className="bus-driver-fit"><img src="/images/1me1.png" alt="Driver" className="bus-driver-fit-img" /></div>
                    </div>
                </div>
            </div>

            {/* Hero — desktop only */}
            <div className="hidden lg:flex relative z-20 mx-auto min-h-[520px] w-full max-w-[1240px] items-center px-4 pb-16 pt-24 lg:min-h-[580px] lg:pt-20">
                <div className="page-enter-copy relative isolate -ml-8 max-w-[760px] space-y-6 sm:-ml-14 lg:-ml-24">
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.72)_0%,rgba(255,255,255,0.46)_34%,rgba(255,255,255,0.18)_56%,rgba(255,255,255,0)_78%)] blur-[26px]" />
                    <div className="pointer-events-none absolute left-[46%] top-[46%] z-0 h-[300px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(248,250,252,0.46)_0%,rgba(248,250,252,0.14)_58%,rgba(248,250,252,0)_84%)] blur-[18px]" />
                    <h1 className="hero-title relative z-10 py-1 text-[48px] font-black leading-[1.05] tracking-[-0.03em] text-[#0d142a] sm:text-[58px] lg:text-[72px]">
                        <span className="hero-title-line block whitespace-nowrap">Tìm và đặt ngay</span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap">những chuyến xe</span>
                        <span className="hero-title-line mt-2 block whitespace-nowrap font-extrabold italic">
                            <span className="text-[#0d142a]">thật</span>{" "}<span className="hero-title-shimmer">Dễ Dàng</span>
                        </span>
                    </h1>
                    <p className="relative z-10 max-w-[510px] text-base leading-relaxed text-[#475569] lg:text-lg">
                        Đặt vé mọi lúc mọi nơi, đi vững ngàn hành trình đa dạng và dịch vụ chất lượng cao nhất.
                    </p>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                MOBILE APP HEADER
            ══════════════════════════════════════════════ */}
            <div className="lg:hidden sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
                <div className="flex items-center justify-between px-4 py-3">
                    {/* Route summary */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Armchair size={15} className="text-white" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-sm font-black text-slate-800 truncate">
                                <span className="truncate">{trip?.route_id?.start_id?.province ?? "Điểm đi"}</span>
                                <ArrowRight size={13} className="text-orange-500 flex-shrink-0" />
                                <span className="truncate">{trip?.route_id?.stop_id?.province ?? "Điểm đến"}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium">
                                {formatTime(trip?.departure_time)} · {formatDate(trip?.departure_time)} · {availableSeats} chỗ trống
                            </div>
                        </div>
                    </div>
                    {/* Filter button */}
                    <button onClick={() => setMobileFilterOpen(true)}
                        className="relative flex-shrink-0 ml-2 flex items-center gap-1.5 px-3 py-2 bg-orange-50 border-2 border-orange-200 rounded-xl active:scale-95 transition-all">
                        <SlidersHorizontal size={15} className="text-orange-500" />
                        <span className="text-xs font-bold text-orange-600">Lọc</span>
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                MAIN LAYOUT
            ══════════════════════════════════════════════ */}
            <div className="relative z-20 lg:min-h-screen bg-gradient-to-br lg:from-slate-50 lg:via-orange-50/20 lg:to-slate-100 py-0 lg:py-8 pb-28 lg:pb-8 pt-[56px] lg:pt-0">
                <div className="max-w-7xl mx-auto px-0 lg:px-4">
                    <div className="grid grid-cols-1 gap-0 lg:gap-8">

                        {/* ── SIDEBAR — desktop only (hidden) ── */}
                        <aside className="hidden space-y-6 mt-6">
                            <div className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-orange-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
                                <div className="relative bg-white rounded-2xl shadow-xl border-2 border-orange-100/50 p-6">
                                    <div className="flex items-center justify-between mb-5">
                                        <h3 className="font-bold text-lg text-slate-800">Bộ lọc tìm kiếm</h3>
                                        <button onClick={clearFilters} className="text-orange-500 hover:text-orange-600 transition-colors"><X size={20} /></button>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Giờ đi</h4>
                                        <div className="space-y-2">{timeSlots.map(slot => (<label key={slot} className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all"><input type="checkbox" checked={filters.timeSlots.includes(slot)} onChange={() => toggleFilter("timeSlots", slot)} className="w-4 h-4 rounded border-2 border-slate-300 text-orange-500 cursor-pointer" /><span className="text-sm text-slate-700">{slot}</span></label>))}</div>
                                    </div>
                                    <div className="mb-6">
                                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Loại xe</h4>
                                        <div className="space-y-2">{busTypes.map(type => (<label key={type} className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all"><input type="checkbox" checked={filters.busTypes.includes(type)} onChange={() => toggleFilter("busTypes", type)} className="w-4 h-4 rounded border-2 border-slate-300 text-orange-500 cursor-pointer" /><span className="text-sm text-slate-700">{type}</span></label>))}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-sm text-slate-700 mb-3">Tầng</h4>
                                        <div className="space-y-2">{tiers.map(tier => (<label key={tier} className="flex items-center gap-2 cursor-pointer hover:bg-orange-50 p-2 rounded-lg transition-all"><input key={tier} type="checkbox" checked={filters.tiers.includes(tier)} onChange={() => toggleFilter("tiers", tier)} className="w-4 h-4 rounded border-2 border-slate-300 text-orange-500 cursor-pointer" /><span className="text-sm text-slate-700">{tier}</span></label>))}</div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={clearFilters} className="w-full bg-gradient-to-br from-slate-100 to-slate-200 hover:from-slate-200 hover:to-slate-300 text-slate-700 font-bold py-3 px-6 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg">Tìm lại</button>
                        </aside>

                        {/* ── MAIN CONTENT ── */}
                        <main className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/10 to-orange-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl hidden lg:block" />
                            <div className="relative bg-white lg:rounded-3xl shadow-none lg:shadow-2xl border-0 lg:border-2 lg:border-orange-100/50 p-0 lg:p-8 lg:mt-32">

                                {/* ══ TRIP HEADER ══ */}

                                {/* Desktop trip header */}
                                <div className="hidden lg:block mb-8 pb-6 border-b-2 border-orange-100">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                                        <div className="flex items-center gap-6 flex-wrap">
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-slate-800">{formatTime(trip?.departure_time)}</div>
                                                <div className="text-xs text-slate-500">{trip?.route_id?.start_id ? `${trip.route_id.start_id.province} (${trip.route_id.start_id.name})` : "Điểm đi"}</div>
                                            </div>
                                            <div className="flex items-center gap-2 px-4">
                                                <div className="w-2 h-2 rounded-full bg-orange-400" />
                                                <div className="h-0.5 w-20 bg-gradient-to-r from-orange-400 to-orange-600" />
                                                <div className="w-2 h-2 rounded-full bg-orange-600" />
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-black text-slate-800">{formatTime(trip?.arrival_time)}</div>
                                                <div className="text-xs text-slate-500">{trip?.route_id?.stop_id ? `${trip.route_id.stop_id.province} (${trip.route_id.stop_id.name})` : "Điểm đến"}</div>
                                            </div>
                                        </div>
                                        <div className="bg-orange-50 px-4 py-2 rounded-xl">
                                            <span className="text-xs font-bold text-orange-600">{calculateDuration(trip?.departure_time, trip?.arrival_time)}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">Chọn Ghế</span>
                                        <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600">Lịch Trình</span>
                                        <span className="bg-purple-50 px-3 py-1.5 rounded-lg text-xs font-bold text-purple-700 border border-purple-200">{trip?.bus_id?.bus_type_id?.name}</span>
                                        <span className="bg-green-50 px-3 py-1.5 rounded-lg text-xs font-bold text-green-700 border border-green-200">{availableSeats} CHỖ TRỐNG</span>
                                        {bookedSeatLabels.length > 0 && (
                                            <span className="bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 border border-slate-200">
                                                {bookedSeatLabels.length} ĐÃ BÁN
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Mobile trip card */}
                                <div className="lg:hidden mx-3 mt-3 mb-0 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 shadow-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white">{formatTime(trip?.departure_time)}</div>
                                            <div className="text-[11px] text-orange-100 font-medium mt-0.5 max-w-[90px] truncate">{trip?.route_id?.start_id?.province}</div>
                                        </div>
                                        <div className="flex flex-col items-center flex-1 px-3">
                                            <div className="flex items-center w-full gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-white/80 flex-shrink-0" />
                                                <div className="flex-1 h-px bg-white/40 relative">
                                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-center">
                                                        <div className="bg-white/20 rounded-full px-1.5 py-0.5">
                                                            <span className="text-[9px] font-bold text-white/90">{calculateDuration(trip?.departure_time, trip?.arrival_time)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                                            </div>
                                            <span className="text-[10px] text-orange-100 mt-1">{trip?.route_id?.distance_km ?? "--"} km</span>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-white">{formatTime(trip?.arrival_time)}</div>
                                            <div className="text-[11px] text-orange-100 font-medium mt-0.5 max-w-[90px] truncate">{trip?.route_id?.stop_id?.province}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {trip?.bus_id?.bus_type_id?.name && (
                                            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{trip.bus_id.bus_type_id.name}</span>
                                        )}
                                        <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">{availableSeats} chỗ trống</span>
                                        {bookedSeatLabels.length > 0 && (
                                            <span className="bg-white/15 text-orange-100 text-[10px] font-bold px-2.5 py-1 rounded-full">{bookedSeatLabels.length} đã bán</span>
                                        )}
                                    </div>
                                </div>

                                {/* ══ ĐIỂM ĐÓN & ĐIỂM TRẢ ══ */}
                                <div className="mx-0 lg:mx-0 mt-3 lg:mt-0 lg:mb-8 rounded-none lg:rounded-2xl border-0 lg:border-2 border-orange-100 overflow-hidden bg-gradient-to-br from-orange-50/60 to-amber-50/40">

                                    {/* Header — collapsible on mobile */}
                                    <button
                                        className="w-full flex items-center gap-2.5 px-4 lg:px-6 py-4 bg-white/70 border-b border-orange-100 lg:cursor-default"
                                        onClick={() => setMobileRouteOpen(v => !v)}
                                    >
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white flex-shrink-0">
                                            <MapPin size={14} />
                                        </div>
                                        <span className="font-bold text-sm lg:text-base text-slate-800 flex-1 text-left">Chọn điểm đón & điểm trả</span>
                                        <span className="text-[11px] font-semibold text-orange-500 bg-orange-100 px-2.5 py-0.5 rounded-full hidden lg:inline">Bắt buộc</span>
                                        {/* Mobile chevron */}
                                        <span className="lg:hidden text-slate-400">
                                            {mobileRouteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </span>
                                    </button>

                                    {/* Body */}
                                    <div className={`${mobileRouteOpen ? "block" : "hidden"} lg:block`}>
                                        <div className="p-4 lg:p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 lg:gap-y-5">

                                            {/* ĐIỂM ĐÓN */}
                                            <div className="space-y-2 lg:space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white text-[10px] font-black flex-shrink-0">A</span>
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Điểm đón</span>
                                                    {pickupPoints.length === 0 && <span className="ml-auto text-[11px] text-slate-400 italic">Đang tải...</span>}
                                                </div>
                                                <div className="relative">
                                                    <MapPin size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-500 pointer-events-none" />
                                                    <select value={selectedPickupId}
                                                        onChange={e => { const chosenId = e.target.value; setSelectedPickupId(chosenId); const found = pickupPoints.find(p => p._id === chosenId); setSelectedPickupStopId(found?.stop_id._id ?? ""); }}
                                                        disabled={pickupPoints.length === 0}
                                                        className="w-full appearance-none pl-9 pr-9 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all duration-200 focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <option value="">-- Chọn điểm đón --</option>
                                                        {pickupPoints.map(p => <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>)}
                                                    </select>
                                                    <Chevron />
                                                </div>
                                                {selectedPickupId && (loadingPickupLocations ? (
                                                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-green-50 border-2 border-green-100 rounded-xl">
                                                        <div className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                        <span className="text-xs text-green-600 italic">Đang tải vị trí chi tiết...</span>
                                                    </div>
                                                ) : pickupLocationPoints.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5 pl-0.5">
                                                            <div className="w-1 h-1 rounded-full bg-green-400" />
                                                            <span className="text-[11px] font-semibold text-green-600 uppercase tracking-wider">Vị trí cụ thể</span>
                                                            <span className="text-[10px] text-red-500 font-bold ml-0.5">*</span>
                                                        </div>
                                                        <div className="relative">
                                                            <MapPin size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-green-400 pointer-events-none" />
                                                            <select value={selectedPickupLocationId} onChange={e => setSelectedPickupLocationId(e.target.value)}
                                                                className="w-full appearance-none pl-9 pr-9 py-2.5 bg-green-50 border-2 border-green-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100">
                                                                <option value="">-- Chọn vị trí cụ thể --</option>
                                                                {pickupLocationPoints.map(lp => <option key={lp._id} value={lp._id}>{lp.location_name}</option>)}
                                                            </select>
                                                            <Chevron />
                                                        </div>
                                                        {selectedPickupLocation && (
                                                            <div className="flex items-start gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                                                <MapPin size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-[11px] text-green-700 font-medium leading-relaxed">{selectedPickupLocation.location_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null)}
                                            </div>

                                            {/* ĐIỂM TRẢ */}
                                            <div className="space-y-2 lg:space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-500 text-white text-[10px] font-black flex-shrink-0">B</span>
                                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Điểm trả</span>
                                                    {dropoffPoints.length === 0 && selectedPickupId && <span className="ml-auto text-[11px] text-slate-400 italic">Đang tải...</span>}
                                                </div>
                                                <div className="relative">
                                                    <Navigation size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                                                    <select value={selectedDropoffId}
                                                        onChange={e => { const chosenId = e.target.value; setSelectedDropoffId(chosenId); const found = dropoffPoints.find(p => p._id === chosenId); setSelectedDropoffStopId(found?.stop_id._id ?? ""); }}
                                                        disabled={!selectedPickupId || dropoffPoints.length === 0}
                                                        className="w-full appearance-none pl-9 pr-9 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all duration-200 focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <option value="">{!selectedPickupId ? "Chọn điểm đón trước" : "-- Chọn điểm trả --"}</option>
                                                        {dropoffPoints.map(p => <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>)}
                                                    </select>
                                                    <Chevron />
                                                </div>
                                                {selectedDropoffId && (loadingDropoffLocations ? (
                                                    <div className="flex items-center gap-2 px-3.5 py-2.5 bg-orange-50 border-2 border-orange-100 rounded-xl">
                                                        <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                        <span className="text-xs text-orange-600 italic">Đang tải vị trí chi tiết...</span>
                                                    </div>
                                                ) : dropoffLocationPoints.length > 0 ? (
                                                    <div className="space-y-1.5">
                                                        <div className="flex items-center gap-1.5 pl-0.5">
                                                            <div className="w-1 h-1 rounded-full bg-orange-400" />
                                                            <span className="text-[11px] font-semibold text-orange-600 uppercase tracking-wider">Vị trí cụ thể</span>
                                                            <span className="text-[10px] text-red-500 font-bold ml-0.5">*</span>
                                                        </div>
                                                        <div className="relative">
                                                            <Navigation size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400 pointer-events-none" />
                                                            <select value={selectedDropoffLocationId} onChange={e => setSelectedDropoffLocationId(e.target.value)}
                                                                className="w-full appearance-none pl-9 pr-9 py-2.5 bg-orange-50 border-2 border-orange-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                                                                <option value="">-- Chọn vị trí cụ thể --</option>
                                                                {dropoffLocationPoints.map(lp => <option key={lp._id} value={lp._id}>{lp.location_name}</option>)}
                                                            </select>
                                                            <Chevron />
                                                        </div>
                                                        {selectedDropoffLocation && (
                                                            <div className="flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                                                                <Navigation size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                                <span className="text-[11px] text-orange-700 font-medium leading-relaxed">{selectedDropoffLocation.location_name}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : null)}
                                            </div>
                                        </div>

                                        {selectedPickup && selectedDropoff && (
                                            <div className="mx-4 lg:mx-6 mb-4 lg:mb-5 flex items-center gap-3 px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-green-700 truncate">{selectedPickup.stop_id.name}</p>
                                                        <p className="text-[10px] text-green-500 truncate">{selectedPickupLocation ? selectedPickupLocation.location_name : selectedPickup.stop_id.province}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0 w-16 lg:w-20">
                                                    <div className="flex-1 h-px bg-gradient-to-r from-green-400 to-orange-500" />
                                                    <ArrowRight size={12} className="text-orange-500" />
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                                    <div className="min-w-0 text-right">
                                                        <p className="text-xs font-bold text-orange-700 truncate">{selectedDropoff.stop_id.name}</p>
                                                        <p className="text-[10px] text-orange-500 truncate">{selectedDropoffLocation ? selectedDropoffLocation.location_name : selectedDropoff.stop_id.province}</p>
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* ══ GIÁ VÉ ══ */}
                                {selectedPickupStopId && selectedDropoffStopId && (
                                    <div className="px-3 lg:px-0 mt-3 lg:mt-0 lg:mb-8">
                                        {loadingPrice ? (
                                            <div className="flex items-center gap-2.5 px-5 py-3.5 bg-orange-50 border-2 border-orange-100 rounded-xl">
                                                <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                                <span className="text-sm text-orange-600 italic font-medium">Đang tính giá vé...</span>
                                            </div>
                                        ) : ticketPrice !== null ? (
                                            <div className="flex items-center justify-between gap-4 px-4 lg:px-5 py-3.5 lg:py-4 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl shadow-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center justify-center w-8 lg:w-9 h-8 lg:h-9 rounded-full bg-white/20 flex-shrink-0">
                                                        <span className="text-white text-base font-black">₫</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] lg:text-[11px] font-bold text-orange-100 uppercase tracking-wider">Giá vé / 1 ghế</p>
                                                        <p className="text-xl lg:text-2xl font-black text-white leading-tight">{ticketPrice.toLocaleString("vi-VN")}₫</p>
                                                    </div>
                                                </div>
                                                {selectedSeats.length > 0 && (
                                                    <div className="text-right flex-shrink-0">
                                                        <p className="text-[10px] lg:text-[11px] font-bold text-orange-100 uppercase tracking-wider">{selectedSeats.length} ghế</p>
                                                        <p className="text-lg lg:text-xl font-black text-white leading-tight">{(ticketPrice * selectedSeats.length).toLocaleString("vi-VN")}₫</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* ══ FLOOR TABS ══ */}
                                {trip?.bus_id?.seat_layout?.floors > 0 && (
                                    <div className="flex gap-2 lg:gap-3 px-3 lg:px-0 mt-3 lg:mt-0 mb-3 lg:mb-6">
                                        {Array.from({ length: trip.bus_id.seat_layout.floors }, (_, index) => {
                                            const floorNumber = index + 1;
                                            return (
                                                <button key={floorNumber} onClick={() => setSelectedFloor(floorNumber as 1 | 2)}
                                                    className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm lg:text-base ${selectedFloor === floorNumber ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                                    <Armchair size={16} /> Tầng {floorNumber}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* ══ SEAT MAP ══ */}
                                {/* Mobile: horizontally scrollable, no extra padding */}
                                <div className="lg:hidden overflow-x-auto bg-slate-50 border-y border-slate-100">
                                    <div className="min-w-[360px] py-5 px-4">
                                        <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white shadow-inner">
                                            <div className="text-center text-slate-400 text-xs font-bold mb-6 tracking-widest">🚍 ĐẦU XE</div>
                                            <div className="flex flex-col gap-6 items-center w-full">
                                                {Object.keys(groupedSeats).map(rowKey => {
                                                    const row = groupedSeats[Number(rowKey)];
                                                    const totalSeats = row.LEFT.length + row.RIGHT.length;
                                                    if (totalSeats % 2 !== 0) {
                                                        return <div key={rowKey} className="flex justify-center gap-3 mb-4">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>;
                                                    }
                                                    return (
                                                        <div key={rowKey} className="grid grid-cols-[1fr_40px_1fr] items-center mb-4 w-full">
                                                            <div className="flex justify-end gap-3">{row.LEFT.map(renderSeat)}</div>
                                                            <div />
                                                            <div className="flex justify-start gap-3">{row.RIGHT.map(renderSeat)}</div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Desktop seat map */}
                                <div className="hidden lg:block bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-10 mb-8 border-2 border-orange-100">
                                    <div className="w-full max-w-6xl mx-auto border-2 border-slate-300 rounded-[40px] p-12 bg-white shadow-inner">
                                        <div className="text-center text-slate-400 font-bold mb-10 tracking-widest">🚍 ĐẦU XE</div>
                                        <div className="flex flex-col gap-10 items-center w-full">
                                            {Object.keys(groupedSeats).map(rowKey => {
                                                const row = groupedSeats[Number(rowKey)];
                                                const totalSeats = row.LEFT.length + row.RIGHT.length;
                                                if (totalSeats % 2 !== 0) {
                                                    return <div key={rowKey} className="flex justify-center gap-6 mb-10">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>;
                                                }
                                                return (
                                                    <div key={rowKey} className="grid grid-cols-[1fr_120px_1fr] items-center mb-10 w-full max-w-3xl mx-auto">
                                                        <div className="flex justify-end gap-6">{row.LEFT.map(renderSeat)}</div>
                                                        <div />
                                                        <div className="flex justify-start gap-6">{row.RIGHT.map(renderSeat)}</div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* ══ LEGEND ══ */}
                                <div className="flex items-center justify-center gap-4 lg:gap-6 py-3 lg:py-4 bg-slate-50 lg:rounded-xl flex-wrap border-t border-slate-100 lg:border-0">
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-white border-2 border-green-400" /><span className="text-xs font-medium text-slate-700">Trống</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-orange-600" /><span className="text-xs font-medium text-slate-700">Đang chọn</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-slate-200 border-2 border-slate-300" /><span className="text-xs font-medium text-slate-700">Đã bán</span></div>
                                </div>

                                {/* ══ CONTINUE BAR — Desktop ══ */}
                                {selectedSeats.length > 0 && (
                                    <div className="hidden lg:block mt-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-2xl p-6">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-1">Ghế đã chọn: {selectedSeats.length}</h4>
                                                {!canContinue ? (
                                                    <p className="text-sm text-orange-600 font-medium flex items-center gap-1.5">
                                                        <MapPin size={13} />{validationMessage()}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-slate-600">Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục</p>
                                                )}
                                            </div>
                                            {canContinue ? (
                                                <Link to="/thongtindatve" state={{
                                                    selectedSeats,
                                                    selectedSeatLabels: (() => {
                                                        const allSeats = [...floor1Seats, ...floor2Seats];
                                                        return allSeats.filter(s => selectedSeats.includes(s.id)).map(s => s.label);
                                                    })(),
                                                    trip, pickupPoint: selectedPickup, dropoffPoint: selectedDropoff,
                                                    pickupLocationPoint: selectedPickupLocation, dropoffLocationPoint: selectedDropoffLocation, ticketPrice,
                                                }}
                                                    className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:via-orange-700 hover:to-orange-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
                                                    Tiếp tục <ArrowRight size={20} />
                                                </Link>
                                            ) : (
                                                <button disabled className="bg-slate-200 text-slate-400 px-8 py-4 rounded-xl font-bold cursor-not-allowed flex items-center gap-2 whitespace-nowrap">
                                                    Tiếp tục <ArrowRight size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </main>
                    </div>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                MOBILE STICKY BOTTOM BAR
            ══════════════════════════════════════════════ */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-orange-100 shadow-2xl">
                {selectedSeats.length > 0 ? (
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <span className="text-xs text-slate-500 font-medium">Đã chọn </span>
                                <span className="text-sm font-black text-orange-600">{selectedSeats.length} ghế</span>
                                {ticketPrice && (
                                    <span className="text-xs text-slate-400 font-medium">
                                        {" "}· {(ticketPrice * selectedSeats.length).toLocaleString("vi-VN")}₫
                                    </span>
                                )}
                            </div>
                            {!canContinue && (
                                <span className="text-[11px] text-orange-500 font-semibold text-right max-w-[160px] leading-tight">{validationMessage()}</span>
                            )}
                        </div>
                        {canContinue ? (
                            <Link to="/thongtindatve" state={{
                                selectedSeats,
                                selectedSeatLabels: (() => {
                                    const allSeats = [...floor1Seats, ...floor2Seats];
                                    return allSeats.filter(s => selectedSeats.includes(s.id)).map(s => s.label);
                                })(),
                                trip, pickupPoint: selectedPickup, dropoffPoint: selectedDropoff,
                                pickupLocationPoint: selectedPickupLocation, dropoffLocationPoint: selectedDropoffLocation, ticketPrice,
                            }}
                                className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-base">
                                Tiếp tục đặt vé <ArrowRight size={18} />
                            </Link>
                        ) : (
                            <button disabled
                                className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-400 font-bold py-3.5 rounded-2xl cursor-not-allowed text-base">
                                Tiếp tục đặt vé <ArrowRight size={18} />
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="px-4 py-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Armchair size={18} className="text-orange-400" />
                            <span className="text-sm font-semibold text-slate-600">Chọn ghế để tiếp tục</span>
                        </div>
                        <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">{availableSeats} trống</span>
                    </div>
                )}
            </div>

            <style>{`
                .page-enter-copy{opacity:0;will-change:transform,opacity;animation:page-fade-up 1.08s cubic-bezier(0.22,1,0.36,1) forwards;animation-delay:.2s}
                .hero-title-line{opacity:0;transform:translateY(14px);animation:hero-title-reveal 1.12s cubic-bezier(0.2,0.8,0.2,1) forwards}
                .hero-title-line:nth-child(1){animation-delay:.36s}.hero-title-line:nth-child(2){animation-delay:.54s}.hero-title-line:nth-child(3){animation-delay:.72s}
                .hero-title-shimmer{color:#ff7a1b;display:inline-block;line-height:1.12;padding-bottom:.14em;background-image:repeating-linear-gradient(100deg,#ff7a1b 0px,#ff7a1b 120px,#ff9226 185px,#ffb347 260px,#ff9226 335px,#ff7a1b 400px,#e8791c 520px);background-size:520px 100%;background-position:0 50%;background-repeat:repeat;background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0 1px 0 rgba(255,181,88,.36),0 2px 0 rgba(234,121,27,.38),0 4px 0 rgba(178,76,16,.3),0 10px 16px rgba(94,40,9,.22);-webkit-text-stroke:.26px rgba(136,57,12,.26);filter:saturate(1.16) contrast(1.12) brightness(1.06);animation:hero-title-shimmer-soft 5.8s linear infinite;will-change:background-position}
                .bus-bob{animation:bus-bob 1.9s cubic-bezier(.36,.06,.29,.97) infinite;transform-origin:56% 74%;will-change:transform}
                .bus-aero-overlay{transform:rotate(12deg);transform-origin:22% 50%}
                .bus-cloud{animation:bus-cloud-drift 1.75s ease-out infinite;will-change:transform,opacity}
                .bus-cloud-1{animation-delay:.06s;animation-duration:1.95s}.bus-cloud-2{animation-delay:.26s;animation-duration:1.55s}.bus-cloud-3{animation-delay:.42s;animation-duration:1.58s}.bus-cloud-4{animation-delay:.62s;animation-duration:1.84s}.bus-cloud-5{animation-delay:.78s;animation-duration:1.72s}.bus-cloud-6{animation-delay:.94s;animation-duration:1.6s}
                .bus-aero-trail{transform:rotate(12deg);transform-origin:22% 50%}
                .bus-tail-cloud{animation:bus-trail-cloud 1.55s ease-out infinite;will-change:transform,opacity}
                .bus-tail-cloud-1{animation-delay:.06s}.bus-tail-cloud-2{animation-delay:.32s}.bus-tail-cloud-3{animation-delay:.54s}.bus-tail-cloud-4{animation-delay:.76s}.bus-tail-cloud-5{animation-delay:.9s;animation-duration:1.7s}.bus-tail-cloud-6{animation-delay:.22s;animation-duration:1.45s}.bus-tail-cloud-7{animation-delay:.48s;animation-duration:1.55s}
                .bus-driver-fit{position:absolute;left:26.3%;top:30.7%;width:11.6%;height:15.8%;overflow:hidden;clip-path:polygon(8% 1%,96% 5%,100% 95%,22% 98%,2% 56%);transform:perspective(760px) rotateY(-12deg) rotate(-.55deg);transform-origin:54% 50%;box-shadow:inset 0 -14px 16px rgba(2,6,23,.28);animation:bus-driver-settle 1.9s cubic-bezier(.36,.06,.29,.97) infinite}
                .bus-front-left-passenger{position:absolute;left:48.4%;top:26.2%;width:11.6%;height:15.6%;overflow:hidden;clip-path:polygon(18% 2%,94% 6%,98% 95%,10% 97%,4% 52%);transform:perspective(760px) rotateY(14deg) rotate(.7deg);transform-origin:50% 50%;box-shadow:inset 0 -14px 16px rgba(2,6,23,.34);animation:bus-driver-settle 2s cubic-bezier(.36,.06,.29,.97) infinite;z-index:1}
                .bus-front-left-passenger-img{position:absolute;left:2%;top:3%;width:130%;height:166%;object-fit:cover;object-position:center 10%;filter:saturate(.8) contrast(1.05) brightness(.88);opacity:.93;transform:scaleX(-1) rotate(-2deg);animation:bus-passenger-idle 1.8s ease-in-out infinite}
                .bus-driver-fit-img{position:absolute;left:-2%;top:3%;width:95%;height:112%;object-fit:cover;object-position:center 8%;filter:saturate(.82) contrast(1.08) brightness(.9);opacity:.95;transform:scaleX(-1) rotate(5deg);animation:bus-driver-idle 1.65s ease-in-out infinite;z-index:1}
                @keyframes bus-bob{0%,100%{transform:translateY(0) rotate(-.35deg)}32%{transform:translateY(-4px) rotate(.12deg)}62%{transform:translateY(-8px) rotate(.24deg)}82%{transform:translateY(2px) rotate(-.16deg)}}
                @keyframes bus-cloud-drift{0%{opacity:.2;transform:translateX(-18px) scale(.84)}36%{opacity:.76}100%{opacity:0;transform:translateX(172px) scale(1.3)}}
                @keyframes bus-trail-cloud{0%{opacity:.62;transform:translateX(-6px) scale(.78)}34%{opacity:.96}100%{opacity:0;transform:translateX(92px) scale(1.22)}}
                @keyframes bus-driver-settle{0%,100%{transform:perspective(760px) rotateY(-12deg) rotate(-.55deg) translateY(0)}34%{transform:perspective(760px) rotateY(-12deg) rotate(-.4deg) translateY(-1px)}68%{transform:perspective(760px) rotateY(-12deg) rotate(-.75deg) translateY(1px)}}
                @keyframes bus-driver-idle{0%,100%{transform:scaleX(-1) rotate(5deg) translateY(0)}28%{transform:scaleX(-1) rotate(4.1deg) translateY(-1px)}62%{transform:scaleX(-1) rotate(5.9deg) translateY(1px)}82%{transform:scaleX(-1) rotate(4.6deg) translateY(0)}}
                @keyframes bus-passenger-idle{0%,100%{transform:scaleX(-1) rotate(-2deg) translateY(0)}34%{transform:scaleX(-1) rotate(-1.3deg) translateY(-1px)}72%{transform:scaleX(-1) rotate(-2.6deg) translateY(1px)}}
                @keyframes page-fade-up{0%{opacity:0;transform:translateY(24px)}100%{opacity:1;transform:translateY(0)}}
                @keyframes hero-title-reveal{0%{opacity:0;transform:translateY(14px);filter:blur(3px)}100%{opacity:1;transform:translateY(0);filter:blur(0)}}
                @keyframes hero-title-shimmer-soft{0%{background-position:0 50%}100%{background-position:-520px 50%}}
                input[type="checkbox"]:checked{background-color:#f97316;border-color:#f97316}
                select{background-image:none!important}
                @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
            `}</style>
        </div>
    );
}