import React, { useEffect, useState, useCallback } from 'react';
import { MapPin, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';
import type { user } from '../../model/user';

interface TripStop { time: string; location: string; address: string; isArrival?: boolean; }

interface ShiftView {
    _id: string;
    name: string;
    time: string;
    status: string;
    actual_shift_start: string | null;
    actual_shift_end: string | null;
}

interface TripDetailProps {
    departureTime: string; departureLocation: string;
    arrivalTime: string; arrivalLocation: string;
    duration: string; distance: string; date: string;
    stops: TripStop[]; vehicleType: string; shifts: ShiftView[];
    tripId: string;
    onCompleteShift: (tripId: string) => Promise<void>;
    completingId: string | null;
}

interface Stop { _id: string; name: string; city?: string; type?: string; latitude?: number; longitude?: number; }
interface RouterStop { _id: string; route_id: string; stop_id: Stop | null; stop_order: number; is_pickup: boolean; }

interface DriverShift {
    shift_start: string;
    shift_end: string;
    actual_shift_start: string | null;
    actual_shift_end: string | null;
    status: string;
    driver_id: { _id: string; name: string; status: string; };
}

interface TripData {
    departure_time: string;
    route_id: { start_id: Stop; stop_id: Stop; distance_km: number; };
    bus_id: { bus_type_id: { name: string; }; };
    drivers: DriverShift[];
    router_stops: RouterStop[];
}

const API_BASE = import.meta.env.VITE_API_URL;

const TripDetail: React.FC<TripDetailProps> = ({
    departureTime, departureLocation, arrivalTime, arrivalLocation,
    duration, distance, date, stops, vehicleType, shifts,
    tripId, onCompleteShift, completingId
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const users = useSelector((state: RootState) => state.user.user as user);

    return (
        <div className="w-full">
            {/* Summary Card */}
            <div className="bg-white border border-black/10 rounded-2xl p-4 lg:p-6 mb-4 lg:mb-6 hover:border-orange-300 transition-all duration-300 shadow-sm hover:shadow-md">
                <div className="flex items-center justify-between mb-3 lg:mb-4">
                    <div className="flex-1">
                        <div className="text-xl lg:text-2xl font-bold text-gray-900">{departureTime}</div>
                        <div className="text-xs lg:text-sm text-gray-600 mt-0.5">{departureLocation}</div>
                    </div>
                    <div className="flex-1 px-3 lg:px-8">
                        <div className="flex items-center justify-center gap-2 mb-1.5 lg:mb-2">
                            <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white" />
                            <div className="flex-1 h-1 bg-gray-300" />
                            <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-white" />
                        </div>
                        <div className="text-center">
                            <div className="text-xs lg:text-sm font-semibold text-gray-900">{duration}</div>
                            <div className="text-xs text-gray-500">{distance}</div>
                        </div>
                    </div>
                    <div className="flex-1 text-right">
                        <div className="text-xl lg:text-2xl font-bold text-gray-900">{arrivalTime}</div>
                        <div className="text-xs lg:text-sm text-gray-600 mt-0.5">{arrivalLocation}</div>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-sm">•</span>
                        <span className="text-xs lg:text-sm font-medium">{vehicleType}</span>
                        <span className="text-xs text-gray-500 ml-1 lg:ml-2">{date}</span>
                    </div>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-1 lg:gap-2 text-orange-600 font-semibold hover:text-orange-700 transition-colors text-sm"
                    >
                        {isExpanded
                            ? <><span>Thu gọn</span><ChevronUp size={18} /></>
                            : <><span>Chi tiết</span><ChevronDown size={18} /></>}
                    </button>
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
                <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 lg:p-8 animate-in fade-in duration-300">
                    <h3 className="text-base lg:text-lg font-bold text-gray-900 mb-4 lg:mb-6">Lộ trình chuyến đi</h3>

                    {/* Ca lái */}
                    <div className="mb-6 lg:mb-8">
                        <h4 className="text-sm lg:text-base font-bold text-gray-900 mb-3">Ca lái</h4>
                        <div className="space-y-2">
                            {shifts.length > 0 ? shifts.map((s, i) => {
                                const isMyShift = String(users?._id) === String(s._id);
                                const statusUp = s.status?.toUpperCase();

                                let statusLabel = 'Chưa xác định';
                                let statusColor = 'bg-gray-100 text-gray-700';
                                switch (statusUp) {
                                    case 'PENDING': statusLabel = 'Sắp tới'; statusColor = 'bg-blue-100 text-blue-700'; break;
                                    case 'RUNNING': statusLabel = 'Đang đi'; statusColor = 'bg-green-100 text-green-700'; break;
                                    case 'DONE': statusLabel = 'Đã hoàn thành'; statusColor = 'bg-purple-100 text-purple-700'; break;
                                    default: statusLabel = s.status || 'Không xác định';
                                }

                                const isCompleting = completingId === tripId;

                                return (
                                    <div
                                        key={i}
                                        className={`flex items-center justify-between p-3 lg:p-4 rounded-lg border ${isMyShift ? 'border-orange-400 bg-orange-50/50' : 'border-gray-200 bg-gray-50'}`}
                                    >
                                        <div className="flex flex-col min-w-0 flex-1">
                                            <span className="font-semibold text-gray-900 text-sm truncate">{s.name}</span>
                                            <span className="text-xs text-gray-600">{s.time}</span>

                                            {s.actual_shift_start && (
                                                <span className="text-xs text-green-600 font-semibold mt-1 flex items-center gap-1">
                                                    ✅ Bắt đầu thực tế: {s.actual_shift_start}
                                                </span>
                                            )}
                                            {s.actual_shift_end && (
                                                <span className="text-xs text-purple-600 font-semibold mt-0.5 flex items-center gap-1">
                                                    🏁 Kết thúc thực tế: {s.actual_shift_end}
                                                </span>
                                            )}
                                            {isMyShift && !s.actual_shift_start && (
                                                <span className="text-xs text-gray-400 mt-1 italic">Chưa bắt đầu ca</span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                            <span className={`text-xs font-medium px-2 lg:px-3 py-1 rounded-full ${statusColor}`}>
                                                {statusLabel}
                                            </span>

                                            {isMyShift && statusUp === 'RUNNING' && (
                                                <button
                                                    onClick={() => onCompleteShift(tripId)}
                                                    disabled={isCompleting}
                                                    className="px-3 lg:px-5 py-1.5 lg:py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg shadow-sm transition-all"
                                                >
                                                    {isCompleting ? 'Đang xử lý...' : 'Hoàn thành'}
                                                </button>
                                            )}

                                            {!isMyShift && (
                                                <span className="text-xs text-gray-500 italic hidden lg:inline">Ca của tài xế khác</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            }) : <p className="text-gray-500 italic text-sm">Chưa có thông tin ca lái</p>}
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="relative mt-4 lg:mt-6">
                        <div className="absolute left-4 lg:left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 via-gray-300 to-orange-500" />
                        <div className="space-y-6 lg:space-y-10">
                            {stops.map((stop, index) => (
                                <div key={index} className="relative pl-12 lg:pl-16">
                                    <div className={`absolute left-0 w-9 h-9 lg:w-12 lg:h-12 rounded-full flex items-center justify-center border-4 bg-white ${index === 0 ? 'border-green-500 bg-green-50' : index === stops.length - 1 ? 'border-orange-500 bg-orange-50' : 'border-gray-400 bg-gray-50'}`}>
                                        <MapPin size={16} className={index === 0 ? 'text-green-600' : index === stops.length - 1 ? 'text-orange-600' : 'text-gray-600'} />
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 lg:p-5 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-300">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock size={14} className="text-gray-500" />
                                                    <span className="text-sm font-bold text-gray-900">{stop.time}</span>
                                                </div>
                                                <div className="font-semibold text-gray-900 text-sm">{stop.location}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{stop.address}</div>
                                            </div>
                                            {index === 0 && <span className="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">Khởi hành</span>}
                                            {index === stops.length - 1 && <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">Kết thúc</span>}
                                            {index > 0 && index < stops.length - 1 && <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0">Điểm dừng</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default function TripDetailsDemo() {
    const { id } = useParams<{ id: string }>();
    const [trip, setTrip] = useState<Omit<TripDetailProps, 'tripId' | 'onCompleteShift' | 'completingId'> | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [completingId, setCompletingId] = useState<string | null>(null);

    const mapTripData = (data: TripData): Omit<TripDetailProps, 'tripId' | 'onCompleteShift' | 'completingId'> => {
        // ✅ Guard: đảm bảo router_stops tồn tại
        const rawStops: RouterStop[] = Array.isArray(data.router_stops) ? data.router_stops : [];

        const validStops = rawStops
            .filter((s): s is RouterStop & { stop_id: Stop } => s.stop_id !== null)
            .sort((a, b) => a.stop_order - b.stop_order);

        if (validStops.length < 2) throw new Error('Dữ liệu lộ trình không hợp lệ');

        const startDate = new Date(data.departure_time);
        const endDate = data.drivers.length > 0
            ? new Date(data.drivers[data.drivers.length - 1].shift_end)
            : startDate;

        const totalMs = endDate.getTime() - startDate.getTime();
        const totalMinutes = Math.floor(totalMs / (1000 * 60));
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        const durationStr = `${hours > 0 ? hours + 'h ' : ''}${minutes > 0 ? minutes + 'p' : ''}`.trim() || '—';

        const numIntervals = validStops.length - 1;
        const timePerInterval = numIntervals > 0 ? totalMs / numIntervals : 0;

        const mappedStops: TripStop[] = validStops.map((s, index) => {
            const stopTime = new Date(startDate.getTime() + index * timePerInterval);
            return {
                time: stopTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
                location: s.stop_id.name,
                address: s.stop_id.city || s.stop_id.type || '—'
            };
        });

        const mappedShifts: ShiftView[] = (data.drivers || []).map((d) => ({
            _id: d.driver_id._id,
            name: d.driver_id.name,
            time: `${new Date(d.shift_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(d.shift_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
            status: d.status || 'PENDING',
            actual_shift_start: d.actual_shift_start
                ? new Date(d.actual_shift_start).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : null,
            actual_shift_end: d.actual_shift_end
                ? new Date(d.actual_shift_end).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
                : null,
        }));

        return {
            departureTime: startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Ho_Chi_Minh' }),
            departureLocation: validStops[0].stop_id.name,
            arrivalTime: mappedStops[mappedStops.length - 1].time,
            arrivalLocation: validStops[validStops.length - 1].stop_id.name,
            duration: durationStr,
            distance: `${data.route_id?.distance_km || '?'} km`,
            date: startDate.toLocaleDateString('vi-VN'),
            vehicleType: data.bus_id?.bus_type_id?.name || 'Không xác định',
            stops: mappedStops,
            shifts: mappedShifts,
        };
    };

    // ✅ useCallback để dùng lại trong handleCompleteShift
    const fetchTrip = useCallback(async () => {
        if (!id) { setError('Không tìm thấy ID chuyến đi'); return; }
        const token = localStorage.getItem('accessToken');
        if (!token) { setError('Vui lòng đăng nhập lại'); return; }

        try {
            const res = await fetch(`${API_BASE}/api/driver/check/trip/${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Không thể tải thông tin chuyến đi');
            const json = await res.json();
            setTrip(mapTripData(json.data));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Có lỗi xảy ra khi tải dữ liệu');
        }
    }, [id]);

    useEffect(() => { fetchTrip(); }, [fetchTrip]);

    const handleCompleteShift = async (tripId: string) => {
        if (!confirm('Xác nhận hoàn thành ca lái?')) return;

        const token = localStorage.getItem('accessToken');
        if (!token) { alert('Vui lòng đăng nhập lại'); return; }

        setCompletingId(tripId);
        try {
            const res = await fetch(`${API_BASE}/api/driver/check/complete-shift`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ id: tripId }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.message || 'Có lỗi xảy ra');
                return;
            }

            // ✅ Fetch lại đầy đủ thay vì remap response (tránh thiếu router_stops)
            await fetchTrip();
        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối server');
        } finally {
            setCompletingId(null);
        }
    };

    if (error) return <div className="text-center py-10 text-red-600 font-medium">{error}</div>;
    if (!trip) return <div className="text-center py-10">Đang tải thông tin chuyến đi...</div>;

    return (
        <div className="w-full max-w-7xl mx-auto px-3 lg:px-4 md:px-8 py-4 lg:py-6">
            <div className="border border-black/10 rounded-3xl bg-white shadow-md p-4 lg:p-6 md:p-8">
                <div className="mb-4 lg:mb-8">
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">Chi tiết chuyến đi</h1>
                    <p className="text-sm text-gray-600">Thông tin lộ trình, điểm dừng và ca lái</p>
                </div>
                <TripDetail
                    {...trip}
                    tripId={id!}
                    onCompleteShift={handleCompleteShift}
                    completingId={completingId}
                />
            </div>
        </div>
    );
}