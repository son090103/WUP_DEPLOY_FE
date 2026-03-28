import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
    MapPin, Navigation, CalendarDays, Search, ArrowRight,
    Armchair, ChevronDown, ChevronUp, Loader2, CheckCircle,
    AlertCircle, X
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Step = "search" | "trips" | "seats" | "confirm";

interface SearchStop { _id: string; name: string; province: string; }

interface TripResult {
    _id: string; status: string;
    departure_time: string; arrival_time: string;
    route_id: {
        _id: string;
        start_id: { name: string; province: string };
        stop_id: { name: string; province: string };
        distance_km: number;
    };
    bus_id: {
        _id: string; license_plate: string;
        bus_type_id: { _id: string; name: string; seats_count: number };
        seat_layout: any;
    };
    time?: any[];
}

// StopPoint = RouteStop document
// _id       = RouteStop._id  → dùng cho booked-seats (start_id/end_id)
// stop_id._id = Stop._id     → dùng cho end-point, location-point, getPrice
interface StopPoint {
    _id: string;
    route_id: string;
    stop_order: number;
    is_pickup: boolean;
    stop_id: {
        _id: string;       // Stop._id — dùng cho location-point, getPrice, end-point
        name: string;
        province: string;
        is_active: boolean;
        location: { type: string; coordinates: number[] };
    };
}

interface LocationPoint {
    _id: string;
    stop_id: string;
    location_name: string;
    status: boolean;
    location_type: "PICKUP" | "DROPOFF";
    is_active: boolean;
    location?: { type: string; coordinates: number[] };
}

interface Seat {
    id: string; floor: 1 | 2; row: number; col: number;
    status: "available" | "booked"; label: string;
}

//
const API_BASE = import.meta.env.VITE_API_URL;
// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtTime = (d?: string) =>
    d ? new Date(d).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) : "--:--";
const fmtDate = (d?: string) =>
    d ? new Date(d).toLocaleDateString("vi-VN") : "--";
const calcDuration = (s?: string, e?: string) => {
    if (!s || !e) return "--";
    const diff = new Date(e).getTime() - new Date(s).getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.round((diff % 3600000) / 60000);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
};

// ─── Build seats ──────────────────────────────────────────────────────────────
function buildSeats(layout: any, bookedLabels: string[], floor: number): Seat[] {
    if (!layout) return [];
    const { rows, columns, row_overrides = [] } = layout;
    const seats: Seat[] = [];
    let counter = 1;
    for (let row = 1; row <= rows; row++) {
        const override = row_overrides.find((r: any) => r.row_index === row && r.floor === floor);
        columns.forEach((col: any, colIndex: number) => {
            let count = col.seats_per_row;
            if (override) {
                const c = override.column_overrides?.find((c: any) => c.column_name === col.name);
                if (c) count = c.seats;
            }
            for (let i = 0; i < count; i++) {
                const label = `A${counter++}`;
                seats.push({
                    id: `${floor}-${row}-${colIndex}-${i}`,
                    floor: floor as 1 | 2, row, col: colIndex,
                    status: bookedLabels.includes(label) ? "booked" : "available",
                    label,
                });
            }
        });
    }
    return seats;
}

// ─── StepBar ──────────────────────────────────────────────────────────────────
const StepBar: React.FC<{ step: Step }> = ({ step }) => {
    const steps: { key: Step; label: string; icon: string }[] = [
        { key: "search", label: "Tìm tuyến", icon: "🔍" },
        { key: "trips", label: "Chọn chuyến", icon: "🚌" },
        { key: "seats", label: "Chọn ghế", icon: "🪑" },
        { key: "confirm", label: "Xác nhận", icon: "✅" },
    ];
    const idx = steps.findIndex(s => s.key === step);
    return (
        <div className="flex items-center gap-0 mb-6">
            {steps.map((s, i) => (
                <React.Fragment key={s.key}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all
                        ${i === idx ? "bg-orange-500 text-white shadow-md"
                            : i < idx ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-400"}`}>
                        <span>{s.icon}</span>
                        <span className="hidden sm:inline">{s.label}</span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-1 ${i < idx ? "bg-green-400" : "bg-gray-200"}`} />
                    )}
                </React.Fragment>
            ))}
        </div>
    );
};

const Chevron = () => (
    <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    </span>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const StaffBookingAll: React.FC = () => {
    const token = localStorage.getItem("accessToken");
    const [step, setStep] = useState<Step>("search");

    // ── Step 1 ────────────────────────────────────────────────────────────────
    const [departure, setDeparture] = useState("");
    const [departureId, setDepartureId] = useState("");
    const [destination, setDestination] = useState("");
    const [destinationId, setDestinationId] = useState("");
    const [selectedDate, setSelectedDate] = useState("");
    const [depSuggestions, setDepSuggestions] = useState<SearchStop[]>([]);
    const [destSuggestions, setDestSuggestions] = useState<SearchStop[]>([]);
    const depRef = useRef<HTMLDivElement>(null);
    const destRef = useRef<HTMLDivElement>(null);
    const [depRect, setDepRect] = useState<DOMRect | null>(null);
    const [destRect, setDestRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (!departure.trim()) { setDepSuggestions([]); return; }
            try {
                const res = await fetch(`${API_BASE}/api/admin/notcheck/searchStop?keyword=${encodeURIComponent(departure)}`);
                setDepSuggestions(await res.json().then(d => Array.isArray(d) ? d : []));
            } catch { setDepSuggestions([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [departure]);

    useEffect(() => {
        const t = setTimeout(async () => {
            if (!destination.trim()) { setDestSuggestions([]); return; }
            try {
                const res = await fetch(`${API_BASE}/api/admin/notcheck/searchStop?keyword=${encodeURIComponent(destination)}`);
                setDestSuggestions(await res.json().then(d => Array.isArray(d) ? d : []));
            } catch { setDestSuggestions([]); }
        }, 300);
        return () => clearTimeout(t);
    }, [destination]);

    // ── Step 2 ────────────────────────────────────────────────────────────────
    const [routes, setRoutes] = useState<any[]>([]);
    const [trips, setTrips] = useState<TripResult[]>([]);
    const [loadingRoutes, setLoadingRoutes] = useState(false);
    const [loadingTrips, setLoadingTrips] = useState(false);
    const [selectedRoute, setSelectedRoute] = useState<any>(null);
    const [openSchedule, setOpenSchedule] = useState<string | null>(null);

    const searchRoutes = async () => {
        if (!departure && !departureId) return;
        setLoadingRoutes(true);
        try {
            const res = await fetch(`${API_BASE}/api/customer/notcheck/search`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    nodeId_start: departureId || null,
                    nodeId_end: destinationId || null,
                    name_start: !departureId ? departure : null,
                    name_end: !destinationId ? destination : null,
                    date: selectedDate,
                }),
            });
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data?.data ?? []);
            setRoutes(Array.isArray(list) ? list : []);
            setStep("trips");
        } catch { setRoutes([]); }
        finally { setLoadingRoutes(false); }
    };

    const selectRoute = async (route: any) => {
        setSelectedRoute(route);
        setLoadingTrips(true);
        setTrips([]); setOpenSchedule(null);
        try {
            const res = await fetch(`${API_BASE}/api/customer/notcheck/viewTrip`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ route_id: route._id }),
            });
            const data = await res.json();
            setTrips(Array.isArray(data.data) ? data.data : []);
        } catch { setTrips([]); }
        finally { setLoadingTrips(false); }
    };

    // ── Step 3: Seats ─────────────────────────────────────────────────────────
    const [selectedTrip, setSelectedTrip] = useState<TripResult | null>(null);
    const [tripDetail, setTripDetail] = useState<any>(null);
    const [loadingSeats, setLoadingSeats] = useState(false);
    const [mobileRouteOpen, setMobileRouteOpen] = useState(true);

    // ✅ route_id = trip._id (truyền vào diagram-bus, start-point, end-point, location-point, booked-seats, getPrice)
    const tripId = tripDetail?.route_id ?? "";
    const trip_booking_id = tripDetail?._id ?? "";
    // ✅ bus_type_id = bus_type_id._id
    const busTypeId = selectedTrip?.bus_id?.bus_type_id?._id ?? "";
    console.log("trip id là: ", tripId)

    const [bookedSeatLabels, setBookedSeatLabels] = useState<string[]>([]);
    const [selectedFloor, setSelectedFloor] = useState<1 | 2>(1);
    const [selectedSeats, setSelectedSeats] = useState<string[]>([]);

    // ✅ selectedPickupId      = RouteStop._id   → dùng cho booked-seats
    // ✅ selectedPickupStopId  = Stop._id        → dùng cho end-point, location-point, getPrice
    const [pickupPoints, setPickupPoints] = useState<StopPoint[]>([]);
    const [dropoffPoints, setDropoffPoints] = useState<StopPoint[]>([]);
    const [selectedPickupId, setSelectedPickupId] = useState(""); // RouteStop._id
    const [selectedPickupStopId, setSelectedPickupStopId] = useState(""); // Stop._id
    const [selectedDropoffId, setSelectedDropoffId] = useState(""); // RouteStop._id
    const [selectedDropoffStopId, setSelectedDropoffStopId] = useState(""); // Stop._id

    const [pickupLocationPoints, setPickupLocationPoints] = useState<LocationPoint[]>([]);
    const [dropoffLocationPoints, setDropoffLocationPoints] = useState<LocationPoint[]>([]);
    const [selectedPickupLocId, setSelectedPickupLocId] = useState("");
    const [selectedDropoffLocId, setSelectedDropoffLocId] = useState("");
    const [loadingPickupLocations, setLoadingPickupLocations] = useState(false);
    const [loadingDropoffLocations, setLoadingDropoffLocations] = useState(false);

    const [ticketPrice, setTicketPrice] = useState<number | null>(null);
    const [loadingPrice, setLoadingPrice] = useState(false);

    const enterSeats = async (trip: TripResult) => {
        setSelectedTrip(trip);
        setStep("seats");
        setLoadingSeats(true);

        // Reset
        setTripDetail(null);
        setBookedSeatLabels([]); setSelectedSeats([]);
        setSelectedPickupId(""); setSelectedPickupStopId("");
        setSelectedDropoffId(""); setSelectedDropoffStopId("");
        setPickupLocationPoints([]); setDropoffLocationPoints([]);
        setSelectedPickupLocId(""); setSelectedDropoffLocId("");
        setTicketPrice(null);
        setPickupPoints([]); setDropoffPoints([]);
        setSelectedFloor(1);

        try {
            // ✅ diagram-bus: route_id = trip._id
            const res = await fetch(`${API_BASE}/api/customer/notcheck/diagram-bus`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ route_id: trip.route_id }),
            });
            const d = await res.json();
            setTripDetail(d.data);
            console.log("trip detail là : ", d.data)
        } catch (e) { console.error(e); }
        finally { setLoadingSeats(false); }
    };

    // ✅ start-point: route_id = trip._id
    useEffect(() => {
        if (!tripId) return;
        fetch(`${API_BASE}/api/customer/notcheck/start-point`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ route_id: tripId }),
        }).then(r => r.json()).then(res => {
            const sorted = (res.data ?? []).sort((a: StopPoint, b: StopPoint) => a.stop_order - b.stop_order);
            setPickupPoints(sorted);
        }).catch(console.error);
    }, [tripId]);

    // ✅ end-point: route_id = trip._id, start_id = Stop._id (selectedPickupStopId), bus_type_id
    useEffect(() => {
        if (!tripId) return;
        if (!selectedPickupStopId) {
            setSelectedDropoffId(""); setSelectedDropoffStopId("");
            setDropoffPoints([]);
        }
        setDropoffLocationPoints([]); setSelectedDropoffLocId("");

        if (!selectedPickupStopId) return; // chờ chọn điểm đón trước

        fetch(`${API_BASE}/api/customer/notcheck/end-point`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                route_id: tripId,              // ✅ trip._id
                start_id: selectedPickupStopId, // ✅ Stop._id
                bus_type_id: busTypeId,            // ✅ bus_type_id._id
            }),
        }).then(r => r.json()).then(res => {
            setDropoffPoints((res.data ?? []).sort((a: StopPoint, b: StopPoint) => a.stop_order - b.stop_order));
        }).catch(console.error);
    }, [tripId, selectedPickupStopId]);

    // ✅ location-point cho pickup: stop_id = Stop._id, route_id = trip._id
    useEffect(() => {
        if (!selectedPickupStopId || !tripId) {
            setPickupLocationPoints([]); setSelectedPickupLocId(""); return;
        }
        setLoadingPickupLocations(true);
        setSelectedPickupLocId("");
        fetch(`${API_BASE}/api/customer/notcheck/location-point`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stop_id: selectedPickupStopId, // ✅ Stop._id
                route_id: tripId,               // ✅ trip._id
            }),
        }).then(r => r.json()).then(res => {
            const data = (res.data ?? []).filter((p: any) => p.is_active !== false && p.status !== false);
            setPickupLocationPoints(data);
            if (data.length === 1) setSelectedPickupLocId(data[0]._id);
        }).catch(console.error)
            .finally(() => setLoadingPickupLocations(false));
    }, [selectedPickupStopId, tripId]);

    // ✅ location-point cho dropoff: stop_id = Stop._id, route_id = trip._id
    useEffect(() => {
        if (!selectedDropoffStopId || !tripId) {
            setDropoffLocationPoints([]); setSelectedDropoffLocId(""); return;
        }
        setLoadingDropoffLocations(true);
        setSelectedDropoffLocId("");
        fetch(`${API_BASE}/api/customer/notcheck/location-point`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                stop_id: selectedDropoffStopId, // ✅ Stop._id
                route_id: tripId,                // ✅ trip._id
            }),
        }).then(r => r.json()).then(res => {
            const data = (res.data ?? []).filter((p: any) => p.is_active !== false && p.status !== false);
            setDropoffLocationPoints(data);
            if (data.length === 1) setSelectedDropoffLocId(data[0]._id);
        }).catch(console.error)
            .finally(() => setLoadingDropoffLocations(false));
    }, [selectedDropoffStopId, tripId]);

    // ✅ booked-seats: trip_id = trip._id, start_id = RouteStop._id, end_id = RouteStop._id
    useEffect(() => {
        if (!tripDetail?._id || !selectedPickupId || !selectedDropoffId) {
            setBookedSeatLabels([]); return;
        }
        fetch(`${API_BASE}/api/customer/notcheck/booked-seats`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                trip_id: tripDetail._id,     // ✅ Trip._id
                start_id: selectedPickupId,  // ✅ RouteStop._id
                end_id: selectedDropoffId,   // ✅ RouteStop._id
            }),
        }).then(r => r.json()).then(res => {
            setBookedSeatLabels(Array.isArray(res.data) ? res.data : []);
        }).catch(console.error);
    }, [tripDetail?._id, selectedPickupId, selectedDropoffId]);

    // ✅ getPrice: route_id = trip._id, start_id = Stop._id, end_id = Stop._id, bus_type_id
    useEffect(() => {
        if (!selectedPickupStopId || !selectedDropoffStopId || !tripId || !busTypeId) {
            setTicketPrice(null); return;
        }
        setLoadingPrice(true);
        fetch(`${API_BASE}/api/customer/notcheck/getPrice`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                route_id: tripId,              // ✅ trip._id
                start_id: selectedPickupStopId, // ✅ Stop._id
                end_id: selectedDropoffStopId,// ✅ Stop._id
                bus_type_id: busTypeId,            // ✅ bus_type_id._id
            }),
        }).then(r => r.json()).then(res => {
            setTicketPrice(typeof res.data === "number" ? res.data : null);
        }).catch(console.error)
            .finally(() => setLoadingPrice(false));
    }, [selectedPickupStopId, selectedDropoffStopId, tripId, busTypeId]);

    // Seats
    const floor1Seats = useMemo(() => {
        if (!tripDetail?.bus_id?.seat_layout) return [];
        return buildSeats(tripDetail.bus_id.seat_layout, bookedSeatLabels, 1);
    }, [tripDetail, bookedSeatLabels]);

    const floor2Seats = useMemo(() => {
        if (!tripDetail?.bus_id?.seat_layout) return [];
        if ((tripDetail.bus_id.seat_layout.floors ?? 1) < 2) return [];
        return buildSeats(tripDetail.bus_id.seat_layout, bookedSeatLabels, 2);
    }, [tripDetail, bookedSeatLabels]);

    const currentSeats = selectedFloor === 1 ? floor1Seats : floor2Seats;
    const numFloors = tripDetail?.bus_id?.seat_layout?.floors ?? 1;

    const availableSeatsCount = useMemo(() =>
        currentSeats.filter(s => s.status !== "booked" && !selectedSeats.includes(s.id)).length,
        [currentSeats, selectedSeats]);

    const groupedSeats = useMemo(() => {
        const g: Record<number, { LEFT: Seat[]; RIGHT: Seat[] }> = {};
        currentSeats.forEach(s => {
            if (!g[s.row]) g[s.row] = { LEFT: [], RIGHT: [] };
            if (s.col === 0) g[s.row].LEFT.push(s);
            else g[s.row].RIGHT.push(s);
        });
        return g;
    }, [currentSeats]);

    const getSeatStatus = (seat: Seat): "available" | "selected" | "booked" => {
        if (seat.status === "booked") return "booked";
        if (selectedSeats.includes(seat.id)) return "selected";
        return "available";
    };

    const renderSeat = (seat: Seat) => {
        const status = getSeatStatus(seat);
        const v = {
            available: { detail: "border-green-400 bg-green-50", frame: "border-green-400 bg-white text-green-700", leg: "bg-green-400" },
            selected: { detail: "border-orange-500 bg-orange-100", frame: "border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg", leg: "bg-orange-500" },
            booked: { detail: "border-slate-300 bg-slate-100", frame: "border-slate-300 bg-slate-200 text-slate-400", leg: "bg-slate-300" },
        }[status];
        return (
            <button key={seat.id}
                onClick={() => {
                    if (status === "booked") return;
                    setSelectedSeats(prev => prev.includes(seat.id) ? prev.filter(x => x !== seat.id) : [...prev, seat.id]);
                }}
                disabled={status === "booked"}
                title={status === "booked" ? `Ghế ${seat.label} đã đặt` : `Ghế ${seat.label}`}
                className={`relative h-[32px] w-[62px] transition-all duration-300
                    ${status === "available" ? "hover:scale-110 cursor-pointer active:scale-95" : ""}
                    ${status === "selected" ? "scale-110" : ""}
                    ${status === "booked" ? "cursor-not-allowed opacity-60" : ""}`}>
                <span className={`absolute left-[13px] top-0.5 h-1.5 w-[35px] rounded-t-[4px] border-[1.5px] border-b-0 ${v.detail}`} />
                <span className={`absolute left-[7px] top-2 flex h-[14px] w-[48px] items-center justify-center rounded-[4px] border-[1.5px] text-[9px] font-black ${v.frame}`}>{seat.label}</span>
                <span className={`absolute left-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
                <span className={`absolute right-[20px] top-[18px] h-[4px] w-[2px] ${v.leg}`} />
            </button>
        );
    };

    const selectedPickup = pickupPoints.find(p => p._id === selectedPickupId) ?? null;
    const selectedDropoff = dropoffPoints.find(p => p._id === selectedDropoffId) ?? null;
    const selectedPickupLoc = pickupLocationPoints.find(p => p._id === selectedPickupLocId) ?? null;
    const selectedDropoffLoc = dropoffLocationPoints.find(p => p._id === selectedDropoffLocId) ?? null;

    const selectedSeatLabels = useMemo(() => {
        const all = [...floor1Seats, ...floor2Seats];
        return all.filter(s => selectedSeats.includes(s.id)).map(s => s.label);
    }, [floor1Seats, floor2Seats, selectedSeats]);

    const totalPrice = selectedSeatLabels.length * (ticketPrice ?? 0);

    const canContinue =
        selectedSeats.length > 0 &&
        !!selectedPickupId && !!selectedDropoffId &&
        (pickupLocationPoints.length === 0 || !!selectedPickupLocId) &&
        (dropoffLocationPoints.length === 0 || !!selectedDropoffLocId);

    const validationMessage = () => {
        if (!selectedPickupId && !selectedDropoffId) return "Vui lòng chọn điểm đón & điểm trả";
        if (!selectedPickupId) return "Vui lòng chọn điểm đón";
        if (!selectedDropoffId) return "Vui lòng chọn điểm trả";
        if (pickupLocationPoints.length > 0 && !selectedPickupLocId) return "Vui lòng chọn vị trí cụ thể điểm đón";
        if (dropoffLocationPoints.length > 0 && !selectedDropoffLocId) return "Vui lòng chọn vị trí cụ thể điểm trả";
        if (selectedSeats.length === 0) return "Vui lòng chọn ghế";
        return "";
    };

    // ── Step 4 ────────────────────────────────────────────────────────────────
    const [form, setForm] = useState({ name: "", phone: "" });
    const [payMethod, setPayMethod] = useState<"CASH" | "CARD" | "QR">("CASH");
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [successOrder, setSuccessOrder] = useState<any>(null);

    const handleConfirm = async () => {
        if (!form.name.trim() || !form.phone.trim()) { setSubmitError("Vui lòng nhập họ tên và SĐT"); return; }
        if (!selectedSeatLabels.length) { setSubmitError("Vui lòng chọn ghế"); return; }
        setSubmitting(true); setSubmitError(null);
        try {
            const res = await fetch(`${API_BASE}/api/receptionist/check/create-booking`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    trip_id: trip_booking_id,
                    seat_labels: selectedSeatLabels,
                    ticket_price: ticketPrice,
                    passenger_name: form.name.trim(),
                    passenger_phone: form.phone.trim(),
                    payment_method: payMethod,
                    pickup_stop_id: selectedPickupId,   // RouteStop._id
                    dropoff_stop_id: selectedDropoffId,  // RouteStop._id
                    pickup_location_name: selectedPickupLoc?.location_name || selectedPickup?.stop_id.name || "",
                    dropoff_location_name: selectedDropoffLoc?.location_name || selectedDropoff?.stop_id.name || "",
                    pickup_city: selectedPickup?.stop_id.province || "",
                    dropoff_city: selectedDropoff?.stop_id.province || "",
                }),
            });
            const data = await res.json();
            if (!data.success) throw new Error(data.message);
            setSuccessOrder(data.data);
            setBookedSeatLabels(prev => [...new Set([...prev, ...selectedSeatLabels])]);
            setSelectedSeats([]);
        } catch (e) {
            setSubmitError(e instanceof Error ? e.message : "Lỗi đặt vé");
        } finally { setSubmitting(false); }
    };

    const resetAll = () => {
        setStep("search");
        setRoutes([]); setTrips([]); setSelectedTrip(null); setTripDetail(null);
        setBookedSeatLabels([]); setSelectedSeats([]);
        setSuccessOrder(null); setForm({ name: "", phone: "" });
        setSelectedPickupId(""); setSelectedDropoffId(""); setTicketPrice(null);
        setSelectedRoute(null);
    };

    // ── JSX ───────────────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 p-4 md:p-6"
            style={{ fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
            <div className="max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-lg flex-shrink-0">🏨</div>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-extrabold text-gray-800">Đặt vé cho khách hàng</h1>
                        <p className="text-xs text-gray-400">Lễ tân · Staff</p>
                    </div>
                    {step !== "search" && (
                        <button onClick={resetAll}
                            className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 flex-shrink-0">
                            <X size={13} /> Bắt đầu lại
                        </button>
                    )}
                </div>

                <StepBar step={step} />

                {/* ══ STEP 1 ══ */}
                {step === "search" && (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
                        <h2 className="text-base font-bold text-gray-700">🔍 Tìm tuyến xe</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div ref={depRef} style={{ position: "relative", zIndex: 200 }}>
                                <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Điểm đi</label>
                                <div className="relative">
                                    <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                                    <input type="text" value={departure} placeholder="Nhập điểm đi..."
                                        onFocus={() => setDepRect(depRef.current?.getBoundingClientRect() ?? null)}
                                        onChange={e => { setDeparture(e.target.value); setDepartureId(""); setDepRect(depRef.current?.getBoundingClientRect() ?? null); }}
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300" />
                                </div>
                                {depSuggestions.length > 0 && depRect && createPortal(
                                    <ul style={{ position: "fixed", top: depRect.bottom + 6, left: depRect.left, width: Math.max(depRect.width, 240), zIndex: 99999 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                        {depSuggestions.map(s => (
                                            <li key={s._id}
                                                onMouseDown={e => { e.preventDefault(); setDeparture(s.province); setDepartureId(s._id); setDepSuggestions([]); }}
                                                className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer hover:bg-orange-50">
                                                <div><p className="font-semibold text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.province}</p></div>
                                                <MapPin size={13} className="text-orange-400 flex-shrink-0" />
                                            </li>
                                        ))}
                                    </ul>, document.body
                                )}
                            </div>

                            <div ref={destRef} style={{ position: "relative", zIndex: 200 }}>
                                <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Điểm đến</label>
                                <div className="relative">
                                    <Navigation size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                                    <input type="text" value={destination} placeholder="Nhập điểm đến..."
                                        onFocus={() => setDestRect(destRef.current?.getBoundingClientRect() ?? null)}
                                        onChange={e => { setDestination(e.target.value); setDestinationId(""); setDestRect(destRef.current?.getBoundingClientRect() ?? null); }}
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300" />
                                </div>
                                {destSuggestions.length > 0 && destRect && createPortal(
                                    <ul style={{ position: "fixed", top: destRect.bottom + 6, left: destRect.left, width: Math.max(destRect.width, 240), zIndex: 99999 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-2xl overflow-hidden max-h-56 overflow-y-auto">
                                        {destSuggestions.map(s => (
                                            <li key={s._id}
                                                onMouseDown={e => { e.preventDefault(); setDestination(s.province); setDestinationId(s._id); setDestSuggestions([]); }}
                                                className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer hover:bg-orange-50">
                                                <div><p className="font-semibold text-gray-800">{s.name}</p><p className="text-xs text-gray-400">{s.province}</p></div>
                                                <Navigation size={13} className="text-orange-400 flex-shrink-0" />
                                            </li>
                                        ))}
                                    </ul>, document.body
                                )}
                            </div>

                            <div>
                                <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Ngày đi</label>
                                <div className="relative">
                                    <CalendarDays size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                                    <input type="date" value={selectedDate} min={new Date().toISOString().split("T")[0]}
                                        onChange={e => setSelectedDate(e.target.value)}
                                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300" />
                                </div>
                            </div>
                        </div>

                        <button onClick={searchRoutes} disabled={loadingRoutes || !departure}
                            className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                ${departure && !loadingRoutes
                                    ? "bg-gradient-to-r from-orange-400 to-orange-500 text-white hover:shadow-lg hover:scale-[1.01]"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}>
                            {loadingRoutes ? <><Loader2 size={16} className="animate-spin" />Đang tìm...</> : <><Search size={16} />Tìm tuyến xe</>}
                        </button>
                    </div>
                )}

                {/* ══ STEP 2 ══ */}
                {step === "trips" && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-orange-200 p-4 flex items-center gap-3 flex-wrap shadow-sm">
                            <span className="font-bold text-orange-600">{departure}</span>
                            <ArrowRight size={16} className="text-orange-400 flex-shrink-0" />
                            <span className="font-bold text-orange-600">{destination || "Tất cả"}</span>
                            {selectedDate && <span className="text-xs bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full font-semibold">{fmtDate(selectedDate)}</span>}
                            <button onClick={() => setStep("search")} className="ml-auto text-xs text-gray-400 hover:text-orange-500 font-semibold flex items-center gap-1">
                                <X size={12} /> Sửa
                            </button>
                        </div>

                        {routes.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
                                <p className="text-gray-400 text-lg font-semibold">😔 Không tìm thấy tuyến nào</p>
                            </div>
                        ) : routes.map(route => (
                            <div key={route._id}
                                className={`bg-white rounded-2xl border-2 shadow-sm overflow-hidden transition-all
                                    ${selectedRoute?._id === route._id ? "border-orange-400 shadow-orange-100" : "border-gray-200 hover:border-orange-200"}`}>

                                <div className="p-4 flex items-center gap-4 flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-extrabold text-orange-600 text-base">{route.start_id?.province ?? route.start_id?.name}</span>
                                            <ArrowRight size={15} className="text-orange-400 flex-shrink-0" />
                                            <span className="font-extrabold text-orange-600 text-base">{route.stop_id?.province ?? route.stop_id?.name}</span>
                                        </div>
                                        <div className="flex gap-3 text-xs text-gray-400 flex-wrap">
                                            <span>📍 {route.distance_km ?? "--"} km</span>
                                            <span>⏱ {route.estimated_duration ? `${Math.ceil(route.estimated_duration / 60)}h` : "--"}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => selectRoute(route)}
                                        className="bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5 flex-shrink-0">
                                        Tìm xe <ArrowRight size={14} />
                                    </button>
                                </div>

                                {selectedRoute?._id === route._id && (
                                    <div className="border-t border-orange-100 bg-orange-50/30">
                                        {loadingTrips ? (
                                            <div className="flex items-center justify-center py-10 gap-3">
                                                <Loader2 size={22} className="animate-spin text-orange-500" />
                                                <span className="text-sm text-gray-500 font-medium">Đang tải chuyến xe...</span>
                                            </div>
                                        ) : trips.length === 0 ? (
                                            <p className="text-center py-8 text-gray-400 text-sm">Không có chuyến nào</p>
                                        ) : trips.map(trip => {
                                            const isOpen = openSchedule === trip._id;
                                            return (
                                                <div key={trip._id} className="border-b border-orange-100 last:border-0">
                                                    <div className="p-4 flex items-center gap-4 flex-wrap">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-2xl font-black text-gray-900">{fmtTime(trip.departure_time)}</span>
                                                                <div className="flex items-center gap-1 flex-1 max-w-[100px]">
                                                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                                                    <div className="flex-1 h-px bg-gradient-to-r from-green-400 to-orange-400" />
                                                                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                                                </div>
                                                                <span className="text-2xl font-black text-gray-900">{fmtTime(trip.arrival_time)}</span>
                                                            </div>
                                                            <div className="flex gap-2 flex-wrap text-xs">
                                                                <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full font-semibold">{trip.bus_id?.bus_type_id?.name}</span>
                                                                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full">{calcDuration(trip.departure_time, trip.arrival_time)}</span>
                                                                <span className={`px-2.5 py-0.5 rounded-full font-semibold ${trip.status === "RUNNING" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                                                                    {trip.status === "RUNNING" ? "🚌 Đang chạy" : "🕐 Sắp đi"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            {trip.time && trip.time.length > 0 && (
                                                                <button onClick={() => setOpenSchedule(isOpen ? null : trip._id)}
                                                                    className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg border transition-all
                                                                        ${isOpen ? "bg-orange-50 border-orange-300 text-orange-600" : "bg-white border-gray-200 text-gray-500 hover:border-orange-200"}`}>
                                                                    <MapPin size={11} />Lịch trình
                                                                    {isOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                                                                </button>
                                                            )}
                                                            <button onClick={() => enterSeats(trip)}
                                                                className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-5 py-2 rounded-xl text-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1.5">
                                                                <Armchair size={14} /> Chọn ghế
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {isOpen && trip.time && (
                                                        <div className="px-4 pb-4">
                                                            <div className="bg-white rounded-xl border border-orange-100 p-4">
                                                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-3">Lịch trình · {trip.time.length} điểm</p>
                                                                <div className="relative">
                                                                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-gradient-to-b from-green-400 to-orange-500" />
                                                                    <div className="space-y-3">
                                                                        {(trip.time ?? [])
                                                                            .slice()
                                                                            .sort((a, b) => a.stop_order - b.stop_order)
                                                                            .map((stop, idx, arr) => (
                                                                                <div key={stop._id} className="flex items-start gap-3 pl-8 relative">

                                                                                    <div
                                                                                        className={`absolute left-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0
        ${idx === 0
                                                                                                ? "bg-green-500 text-white"
                                                                                                : idx === arr.length - 1
                                                                                                    ? "bg-orange-600 text-white"
                                                                                                    : "bg-white border-2 border-orange-300 text-orange-600"
                                                                                            }`}
                                                                                    >
                                                                                        {idx + 1}
                                                                                    </div>

                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="text-sm font-semibold text-gray-800">
                                                                                            {stop.stop_id?.province || stop.stop_id?.name}
                                                                                        </p>

                                                                                        {stop.stop_id?.name && stop.stop_id?.province && (
                                                                                            <p className="text-xs text-gray-400">{stop.stop_id.name}</p>
                                                                                        )}
                                                                                    </div>

                                                                                    {stop.estimated_time > 0 && (
                                                                                        <span className="text-[10px] text-orange-400 font-semibold flex-shrink-0">
                                                                                            +{stop.estimated_time}h
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                    </div>
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
                        ))}
                    </div>
                )}

                {/* ══ STEP 3 ══ */}
                {step === "seats" && (
                    <div className="space-y-4">

                        {/* Trip bar */}
                        {selectedTrip && (
                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 flex items-center gap-4 flex-wrap text-white shadow-lg">
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <div className="text-center flex-shrink-0">
                                        <p className="text-2xl font-black">{fmtTime(selectedTrip.departure_time)}</p>
                                        <p className="text-xs text-orange-100 truncate max-w-[90px]">{selectedTrip.route_id?.start_id?.province}</p>
                                    </div>
                                    <div className="flex-1 flex flex-col items-center px-2">
                                        <div className="flex items-center w-full gap-1">
                                            <div className="w-2 h-2 rounded-full bg-white/70 flex-shrink-0" />
                                            <div className="flex-1 h-px bg-white/40" />
                                            <div className="w-2 h-2 rounded-full bg-white flex-shrink-0" />
                                        </div>
                                        <span className="text-[10px] text-orange-100 mt-1">{calcDuration(selectedTrip.departure_time, selectedTrip.arrival_time)}</span>
                                    </div>
                                    <div className="text-center flex-shrink-0">
                                        <p className="text-2xl font-black">{fmtTime(selectedTrip.arrival_time)}</p>
                                        <p className="text-xs text-orange-100 truncate max-w-[90px]">{selectedTrip.route_id?.stop_id?.province}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{selectedTrip.bus_id?.bus_type_id?.name}</span>
                                    {!loadingSeats && <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">{availableSeatsCount} chỗ trống</span>}
                                    <button onClick={() => setStep("trips")} className="text-white/70 hover:text-white text-xs font-semibold flex items-center gap-1 ml-1">
                                        <X size={12} /> Đổi xe
                                    </button>
                                </div>
                            </div>
                        )}

                        {loadingSeats ? (
                            <div className="bg-white rounded-2xl border border-gray-200 p-16 flex items-center justify-center gap-3">
                                <Loader2 size={26} className="animate-spin text-orange-500" />
                                <span className="text-gray-500 font-medium">Đang tải sơ đồ ghế...</span>
                            </div>
                        ) : (
                            <>
                                {/* ── ĐIỂM ĐÓN & ĐIỂM TRẢ ── */}
                                <div className="rounded-none lg:rounded-2xl border-0 lg:border-2 border-orange-100 overflow-hidden bg-gradient-to-br from-orange-50/60 to-amber-50/40">
                                    <button className="w-full flex items-center gap-2.5 px-4 lg:px-6 py-4 bg-white/70 border-b border-orange-100 lg:cursor-default"
                                        onClick={() => setMobileRouteOpen(v => !v)}>
                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white flex-shrink-0"><MapPin size={14} /></div>
                                        <span className="font-bold text-sm lg:text-base text-slate-800 flex-1 text-left">Chọn điểm đón & điểm trả</span>
                                        <span className="text-[11px] font-semibold text-orange-500 bg-orange-100 px-2.5 py-0.5 rounded-full hidden lg:inline">Bắt buộc</span>
                                        <span className="lg:hidden text-slate-400">{mobileRouteOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</span>
                                    </button>

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
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            setSelectedPickupId(v); // RouteStop._id → dùng cho booked-seats
                                                            const found = pickupPoints.find(p => p._id === v);
                                                            setSelectedPickupStopId(found?.stop_id._id ?? ""); // Stop._id → end-point, location-point, getPrice
                                                        }}
                                                        disabled={pickupPoints.length === 0}
                                                        className="w-full appearance-none pl-9 pr-9 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <option value="">-- Chọn điểm đón --</option>
                                                        {pickupPoints.map(p => (
                                                            <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>
                                                        ))}
                                                    </select>
                                                    <Chevron />
                                                </div>

                                                {selectedPickupId && (
                                                    loadingPickupLocations ? (
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
                                                                <select value={selectedPickupLocId} onChange={e => setSelectedPickupLocId(e.target.value)}
                                                                    className="w-full appearance-none pl-9 pr-9 py-2.5 bg-green-50 border-2 border-green-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-green-400 focus:ring-4 focus:ring-green-100">
                                                                    <option value="">-- Chọn vị trí cụ thể --</option>
                                                                    {pickupLocationPoints.map(lp => (
                                                                        <option key={lp._id} value={lp._id}>{lp.location_name}</option>
                                                                    ))}
                                                                </select>
                                                                <Chevron />
                                                            </div>
                                                            {selectedPickupLoc && (
                                                                <div className="flex items-start gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                                                                    <MapPin size={12} className="text-green-500 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-[11px] text-green-700 font-medium leading-relaxed">{selectedPickupLoc.location_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null
                                                )}
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
                                                        onChange={e => {
                                                            const v = e.target.value;
                                                            setSelectedDropoffId(v); // RouteStop._id → dùng cho booked-seats
                                                            const found = dropoffPoints.find(p => p._id === v);
                                                            setSelectedDropoffStopId(found?.stop_id._id ?? ""); // Stop._id → location-point, getPrice
                                                        }}
                                                        disabled={!selectedPickupId || dropoffPoints.length === 0}
                                                        className="w-full appearance-none pl-9 pr-9 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 cursor-pointer transition-all focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100 disabled:opacity-50 disabled:cursor-not-allowed">
                                                        <option value="">{!selectedPickupId ? "Chọn điểm đón trước" : "-- Chọn điểm trả --"}</option>
                                                        {dropoffPoints.map(p => (
                                                            <option key={p._id} value={p._id}>{p.stop_order}. {p.stop_id.province}</option>
                                                        ))}
                                                    </select>
                                                    <Chevron />
                                                </div>

                                                {selectedDropoffId && (
                                                    loadingDropoffLocations ? (
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
                                                                <select value={selectedDropoffLocId} onChange={e => setSelectedDropoffLocId(e.target.value)}
                                                                    className="w-full appearance-none pl-9 pr-9 py-2.5 bg-orange-50 border-2 border-orange-200 rounded-xl text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                                                                    <option value="">-- Chọn vị trí cụ thể --</option>
                                                                    {dropoffLocationPoints.map(lp => (
                                                                        <option key={lp._id} value={lp._id}>{lp.location_name}</option>
                                                                    ))}
                                                                </select>
                                                                <Chevron />
                                                            </div>
                                                            {selectedDropoffLoc && (
                                                                <div className="flex items-start gap-2 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg">
                                                                    <Navigation size={12} className="text-orange-500 mt-0.5 flex-shrink-0" />
                                                                    <span className="text-[11px] text-orange-700 font-medium leading-relaxed">{selectedDropoffLoc.location_name}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : null
                                                )}
                                            </div>
                                        </div>

                                        {/* Preview bar */}
                                        {selectedPickup && selectedDropoff && (
                                            <div className="mx-4 lg:mx-6 mb-4 lg:mb-5 flex items-center gap-3 px-4 py-3 bg-white border-2 border-orange-200 rounded-xl shadow-sm">
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-green-700 truncate">{selectedPickup.stop_id.name}</p>
                                                        <p className="text-[10px] text-green-500 truncate">{selectedPickupLoc ? selectedPickupLoc.location_name : selectedPickup.stop_id.province}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 flex-shrink-0 w-16 lg:w-20">
                                                    <div className="flex-1 h-px bg-gradient-to-r from-green-400 to-orange-500" />
                                                    <ArrowRight size={12} className="text-orange-500" />
                                                </div>
                                                <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                                                    <div className="min-w-0 text-right">
                                                        <p className="text-xs font-bold text-orange-700 truncate">{selectedDropoff.stop_id.name}</p>
                                                        <p className="text-[10px] text-orange-500 truncate">{selectedDropoffLoc ? selectedDropoffLoc.location_name : selectedDropoff.stop_id.province}</p>
                                                    </div>
                                                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Giá vé */}
                                {selectedPickupStopId && selectedDropoffStopId && (
                                    <div className="px-3 lg:px-0">
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
                                                        <p className="text-lg lg:text-xl font-black text-white leading-tight">{totalPrice.toLocaleString("vi-VN")}₫</p>
                                                    </div>
                                                )}
                                            </div>
                                        ) : null}
                                    </div>
                                )}

                                {/* Floor tabs */}
                                {numFloors > 1 && (
                                    <div className="flex gap-2 lg:gap-3 px-3 lg:px-0">
                                        {Array.from({ length: numFloors }, (_, i) => i + 1).map(f => (
                                            <button key={f} onClick={() => setSelectedFloor(f as 1 | 2)}
                                                className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl font-bold transition-all flex items-center justify-center gap-2 text-sm lg:text-base
                                                    ${selectedFloor === f ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                                <Armchair size={16} /> Tầng {f}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Seat map mobile */}
                                <div className="lg:hidden overflow-x-auto bg-slate-50 border-y border-slate-100">
                                    <div className="min-w-[360px] py-5 px-4">
                                        <div className="border-2 border-slate-200 rounded-2xl p-5 bg-white shadow-inner">
                                            <div className="text-center text-slate-400 text-xs font-bold mb-6 tracking-widest">🚍 ĐẦU XE</div>
                                            <div className="flex flex-col gap-6 items-center w-full">
                                                {Object.keys(groupedSeats).map(rowKey => {
                                                    const row = groupedSeats[Number(rowKey)];
                                                    const total = row.LEFT.length + row.RIGHT.length;
                                                    if (total % 2 !== 0) return (
                                                        <div key={rowKey} className="flex justify-center gap-3 mb-4">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>
                                                    );
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

                                {/* Seat map desktop */}
                                <div className="hidden lg:block bg-gradient-to-br from-slate-50 to-orange-50/30 rounded-2xl p-10 mb-4 border-2 border-orange-100">
                                    <div className="w-full max-w-6xl mx-auto border-2 border-slate-300 rounded-[40px] p-12 bg-white shadow-inner">
                                        <div className="text-center text-slate-400 font-bold mb-10 tracking-widest">🚍 ĐẦU XE</div>
                                        <div className="flex flex-col gap-10 items-center w-full">
                                            {Object.keys(groupedSeats).map(rowKey => {
                                                const row = groupedSeats[Number(rowKey)];
                                                const total = row.LEFT.length + row.RIGHT.length;
                                                if (total % 2 !== 0) return (
                                                    <div key={rowKey} className="flex justify-center gap-6 mb-10">{[...row.LEFT, ...row.RIGHT].map(renderSeat)}</div>
                                                );
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

                                {/* Legend */}
                                <div className="flex items-center justify-center gap-4 lg:gap-6 py-3 lg:py-4 bg-slate-50 lg:rounded-xl flex-wrap border-t border-slate-100 lg:border-0">
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-white border-2 border-green-400" /><span className="text-xs font-medium text-slate-700">Trống</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-gradient-to-br from-orange-500 to-orange-600" /><span className="text-xs font-medium text-slate-700">Đang chọn</span></div>
                                    <div className="flex items-center gap-1.5"><div className="w-5 h-5 rounded-md bg-slate-200 border-2 border-slate-300" /><span className="text-xs font-medium text-slate-700">Đã bán</span></div>
                                </div>

                                {/* Continue bar desktop */}
                                {selectedSeats.length > 0 && (
                                    <div className="hidden lg:block mt-6 bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-200 rounded-2xl p-6">
                                        <div className="flex items-center justify-between flex-wrap gap-4">
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-1">Ghế đã chọn: {selectedSeats.length}</h4>
                                                {!canContinue
                                                    ? <p className="text-sm text-orange-600 font-medium flex items-center gap-1.5"><MapPin size={13} />{validationMessage()}</p>
                                                    : <p className="text-sm text-slate-600">Vui lòng kiểm tra kỹ thông tin trước khi tiếp tục</p>}
                                            </div>
                                            {canContinue ? (
                                                <button onClick={() => setStep("confirm")}
                                                    className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 hover:from-orange-600 hover:to-orange-800 text-white px-8 py-4 rounded-xl font-bold shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                                    Tiếp tục <ArrowRight size={20} />
                                                </button>
                                            ) : (
                                                <button disabled className="bg-slate-200 text-slate-400 px-8 py-4 rounded-xl font-bold cursor-not-allowed flex items-center gap-2">
                                                    Tiếp tục <ArrowRight size={20} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Mobile sticky bottom */}
                        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t-2 border-orange-100 shadow-2xl">
                            {selectedSeats.length > 0 ? (
                                <div className="px-4 py-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <span className="text-xs text-slate-500 font-medium">Đã chọn </span>
                                            <span className="text-sm font-black text-orange-600">{selectedSeats.length} ghế</span>
                                            {ticketPrice && <span className="text-xs text-slate-400 font-medium"> · {totalPrice.toLocaleString("vi-VN")}₫</span>}
                                        </div>
                                        {!canContinue && <span className="text-[11px] text-orange-500 font-semibold text-right max-w-[160px] leading-tight">{validationMessage()}</span>}
                                    </div>
                                    {canContinue ? (
                                        <button onClick={() => setStep("confirm")}
                                            className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold py-3.5 rounded-2xl shadow-lg active:scale-95 transition-all text-base">
                                            Tiếp tục đặt vé <ArrowRight size={18} />
                                        </button>
                                    ) : (
                                        <button disabled className="flex items-center justify-center gap-2 w-full bg-slate-200 text-slate-400 font-bold py-3.5 rounded-2xl cursor-not-allowed text-base">
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
                                    <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1.5 rounded-full font-medium">{availableSeatsCount} trống</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══ STEP 4 ══ */}
                {step === "confirm" && !successOrder && (
                    <div className="flex flex-col lg:flex-row gap-4 pb-20 lg:pb-0">
                        <div className="flex-1 space-y-4">
                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-4">
                                <h3 className="text-sm font-bold text-gray-700">👤 Thông tin khách hàng</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">Họ tên <span className="text-red-400">*</span></label>
                                        <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nhập tên khách hàng"
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-gray-500 mb-1.5 font-semibold uppercase tracking-wider">SĐT <span className="text-red-400">*</span></label>
                                        <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="0923..."
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm space-y-3">
                                <h3 className="text-sm font-bold text-gray-700">💳 Phương thức thanh toán</h3>
                                <div className="grid grid-cols-3 gap-2">
                                    {([["CASH", "💵", "Tiền mặt"], ["CARD", "💳", "Thẻ/POS"], ["QR", "📱", "Mã QR"]] as const).map(([val, icon, label]) => (
                                        <button key={val} onClick={() => setPayMethod(val)}
                                            className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 transition-all
                                                ${payMethod === val ? "border-orange-400 bg-orange-50 shadow-sm" : "border-gray-200 bg-white hover:border-orange-200"}`}>
                                            <span className="text-xl">{icon}</span>
                                            <span className={`text-xs font-semibold ${payMethod === val ? "text-orange-600" : "text-gray-600"}`}>{label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {submitError && (
                                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
                                    <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                                    <p className="text-xs text-red-600 font-medium">{submitError}</p>
                                </div>
                            )}

                            <button onClick={handleConfirm} disabled={submitting}
                                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all
                                    ${!submitting ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:shadow-lg hover:scale-[1.01]" : "bg-orange-300 text-white cursor-not-allowed"}`}>
                                {submitting ? <><Loader2 size={16} className="animate-spin" />Đang xử lý...</> : `✅ Xác nhận đặt ${selectedSeatLabels.length} ghế — ${totalPrice.toLocaleString("vi-VN")}₫`}
                            </button>
                        </div>

                        <div className="w-full lg:w-72 flex-shrink-0">
                            <div className="bg-gradient-to-br from-orange-50 to-orange-100/40 rounded-2xl border border-orange-200 p-5 shadow-sm sticky top-4 space-y-3">
                                <h3 className="text-sm font-bold text-gray-700">📋 Tóm tắt đơn</h3>
                                <div className="space-y-2 text-xs">
                                    <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Chuyến</span><span className="font-semibold text-right">{fmtTime(selectedTrip?.departure_time)} → {fmtTime(selectedTrip?.arrival_time)}</span></div>
                                    <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Tuyến</span><span className="font-semibold text-right">{selectedTrip?.route_id?.start_id?.province} → {selectedTrip?.route_id?.stop_id?.province}</span></div>
                                    {selectedPickup && <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Đón tại</span><span className="font-semibold text-right max-w-[140px]">{selectedPickup.stop_id.name}</span></div>}
                                    {selectedPickupLoc && <div className="flex justify-between text-gray-600 gap-2 pl-2"><span className="text-green-600 flex-shrink-0">↳</span><span className="text-green-600 text-right max-w-[140px]">{selectedPickupLoc.location_name}</span></div>}
                                    {selectedDropoff && <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Trả tại</span><span className="font-semibold text-right max-w-[140px]">{selectedDropoff.stop_id.name}</span></div>}
                                    {selectedDropoffLoc && <div className="flex justify-between text-gray-600 gap-2 pl-2"><span className="text-orange-600 flex-shrink-0">↳</span><span className="text-orange-600 text-right max-w-[140px]">{selectedDropoffLoc.location_name}</span></div>}
                                    <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Ghế</span><span className="font-bold text-orange-600 text-right">{selectedSeatLabels.join(", ")}</span></div>
                                    <div className="flex justify-between text-gray-600 gap-2"><span className="flex-shrink-0">Số ghế</span><span className="font-semibold">{selectedSeatLabels.length} × {(ticketPrice ?? 0).toLocaleString("vi-VN")}₫</span></div>
                                    <div className="pt-2 border-t border-orange-200 flex justify-between font-bold text-sm text-gray-800">
                                        <span>Tổng tiền</span><span className="text-orange-600">{totalPrice.toLocaleString("vi-VN")}₫</span>
                                    </div>
                                </div>
                                <button onClick={() => setStep("seats")} className="w-full text-xs text-gray-400 hover:text-orange-500 font-semibold py-1.5 transition-colors">
                                    ← Quay lại chọn ghế
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ══ SUCCESS ══ */}
                {successOrder && (
                    <div className="flex items-center justify-center py-8">
                        <div className="bg-white rounded-2xl shadow-xl border-2 border-green-200 p-8 text-center max-w-md w-full">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle size={36} className="text-green-500" />
                            </div>
                            <h2 className="text-xl font-black text-gray-900 mb-1">Đặt vé thành công! 🎉</h2>
                            <p className="text-gray-500 text-sm mb-5">Khách hàng <span className="font-bold text-gray-800">{form.name}</span> — {form.phone}</p>
                            <div className="bg-orange-50 rounded-xl p-4 mb-5 space-y-2 text-sm text-left">
                                <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">Mã đơn</span><span className="font-mono font-bold text-gray-800">{successOrder._id?.slice(-8).toUpperCase()}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">Chuyến</span><span className="font-semibold text-right">{fmtTime(selectedTrip?.departure_time)} → {fmtTime(selectedTrip?.arrival_time)}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">Ghế</span><span className="font-bold text-orange-600">{selectedSeatLabels.join(", ")}</span></div>
                                <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">Tổng tiền</span><span className="font-bold text-orange-600">{totalPrice.toLocaleString("vi-VN")}₫</span></div>
                                <div className="flex justify-between gap-2"><span className="text-gray-500 flex-shrink-0">Thanh toán</span><span className="font-bold">{payMethod === "CASH" ? "💵 Tiền mặt" : payMethod === "CARD" ? "💳 Thẻ/POS" : "📱 Mã QR"}</span></div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { setSuccessOrder(null); setForm({ name: "", phone: "" }); setStep("seats"); }}
                                    className="flex-1 py-2.5 rounded-xl border-2 border-orange-300 text-orange-600 font-bold text-sm hover:bg-orange-50">
                                    🪑 Đặt thêm ghế
                                </button>
                                <button onClick={resetAll}
                                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-sm hover:opacity-90">
                                    🔍 Tìm tuyến mới
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default StaffBookingAll;