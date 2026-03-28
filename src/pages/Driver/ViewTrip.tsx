import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Trip } from '../../model/trip';
import API_TRIP from '../../services/Driver/trips-api';
import { useNavigate } from 'react-router-dom';

export function ViewTrip() {
    const [trips, setTrip] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedTrip, setSelectedTrip] = useState<string | null>(null);

    const itemsPerPage = 1;
    const totalPages = Math.ceil(trips.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const displayedTrips = trips.slice(startIndex, startIndex + itemsPerPage);

    const navigate = useNavigate();

    const handleSelectTrip = (tripId: string) =>
        setSelectedTrip(selectedTrip === tripId ? null : tripId);

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                const res = await fetch(`${API_TRIP.trips}`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    }
                });
                if (!res.ok) throw new Error("Fetch trips failed");
                const result = await res.json();
                setTrip(result.data);
            } catch (error) {
                console.error("Lỗi lấy trips:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrips();
    }, []);

    const hanldSumit = async (id: string) => {
        try {
            const token = localStorage.getItem("accessToken");
            const res = await fetch(`${API_TRIP.trips}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ id })
            });
            if (!res.ok) throw new Error("Update trip failed");
            const result = await res.json();
            const updatedTrip = result.data;
            setTrip(prevTrips =>
                prevTrips.map(t => t._id === updatedTrip._id ? updatedTrip : t)
            );
        } catch (error) {
            console.error("Lỗi update trip:", error);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="w-full border border-black/10 rounded-3xl bg-white shadow-md p-4 lg:p-8">
            <h2 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-500 bg-clip-text text-transparent mb-5 lg:mb-8">
                Danh sách Chuyến lái
            </h2>

            <div className="space-y-4 lg:space-y-6">
                {displayedTrips.map(trip => {
                    // ✅ Dùng thẳng departure_time và arrival_time từ Trip
                    const departureTime = new Date(trip.departure_time);
                    const arrivalTime = new Date(trip.arrival_time ?? "")

                    // ✅ Tính duration từ 2 trường có sẵn, làm tròn lên giờ
                    const durationMs = arrivalTime.getTime() - departureTime.getTime();
                    const durationMinutes = Math.ceil(durationMs / (1000 * 60));
                    const hours = Math.floor(durationMinutes / 60);
                    const minutes = durationMinutes % 60;
                    const durationLabel = minutes === 0
                        ? `${hours}h`
                        : `${hours}h ${minutes}m`;

                    const myShift = trip.drivers.find((d: any) => {
                        const driverId = d.driver_id?._id || d.driver_id;
                        const userId = localStorage.getItem("userId");
                        return String(driverId) === String(userId);
                    });

                    return (
                        <div
                            key={trip._id}
                            className={`border-2 rounded-xl p-4 lg:p-6 transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${selectedTrip === trip._id
                                ? 'border-orange-500 bg-gradient-to-r from-orange-50 to-orange-100 shadow-lg'
                                : 'border-orange-200 hover:border-orange-400 hover:shadow-lg'
                                }`}
                            onClick={() => handleSelectTrip(trip._id)}
                        >
                            {/* Route & timing */}
                            <div className="flex items-center justify-between mb-3 lg:mb-4">
                                {/* Điểm đi */}
                                <div className="flex-1">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">
                                        {departureTime.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div className="text-xs lg:text-sm text-gray-600 mt-0.5">
                                        {trip.route_id.start_id.name}
                                    </div>
                                </div>

                                {/* Thời gian hành trình */}
                                <div className="flex-1 px-3 lg:px-8">
                                    <div className="flex items-center justify-center gap-2 mb-1.5">
                                        <div className="w-3 h-3 rounded-full border-2 border-green-500 bg-white" />
                                        <div className="flex-1 h-1 bg-gray-300" />
                                        <div className="w-3 h-3 rounded-full border-2 border-orange-300 bg-white" />
                                    </div>
                                    <div className="text-center">
                                        <div className="text-xs lg:text-sm font-semibold text-gray-900">
                                            {durationLabel}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {trip.route_id.distance_km} km
                                        </div>
                                    </div>
                                </div>

                                {/* Điểm đến */}
                                <div className="flex-1 text-right">
                                    <div className="text-xl lg:text-2xl font-bold text-gray-900">
                                        {arrivalTime.toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                    <div className="text-xs lg:text-sm text-gray-600 mt-0.5">
                                        {trip.route_id.stop_id.name}
                                    </div>
                                </div>
                            </div>

                            {/* actual_shift_start badge */}
                            {myShift?.actual_shift_start && (
                                <div className="mb-3 flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                    <span className="text-green-500 text-sm">✅</span>
                                    <span className="text-xs font-semibold text-green-700">
                                        Bắt đầu ca lúc:{" "}
                                        {new Date(myShift.actual_shift_start).toLocaleTimeString('vi-VN', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-200">
                                <div className="flex items-center gap-2 text-gray-600">
                                    <span className="text-sm">•</span>
                                    <span className="text-xs lg:text-sm font-medium">
                                        {trip.bus_id.bus_type_id.name ?? "Chưa có xe"}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(trip.created_at).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/driverBooking/tripdetail/${trip._id}`);
                                        }}
                                        className="border border-orange-500 text-orange-500 font-bold px-4 lg:px-6 py-1.5 lg:py-2 rounded-lg hover:bg-orange-50 text-sm transition-all"
                                    >
                                        Chi tiết
                                    </button>
                                    {trip.status === "SCHEDULED" && (
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                hanldSumit(trip._id);
                                            }}
                                            className="bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold px-4 lg:px-8 py-1.5 lg:py-2 rounded-lg text-sm active:scale-95 transition-all"
                                        >
                                            Xác nhận
                                        </button>
                                    )}
                                    {trip.status === "RUNNING" && (
                                        <button
                                            disabled
                                            className="bg-blue-500 text-white font-bold px-4 lg:px-8 py-1.5 lg:py-2 rounded-lg text-sm"
                                        >
                                            Đang đi
                                        </button>
                                    )}
                                    {trip.status === "FINISHED" && (
                                        <button
                                            disabled
                                            className="bg-gray-400 text-white font-bold px-4 lg:px-8 py-1.5 lg:py-2 rounded-lg text-sm"
                                        >
                                            Đã kết thúc
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-center gap-2 lg:gap-3 mt-6 lg:mt-10 p-4 lg:p-6 bg-orange-50 rounded-xl border-2 border-orange-200">
                <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-orange-200 disabled:opacity-40 hover:bg-orange-50 transition-all active:scale-95"
                >
                    <ChevronLeft size={18} className="text-orange-500" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-9 h-9 rounded-lg text-sm font-bold transition-all ${page === currentPage
                            ? "bg-orange-500 text-white shadow-md"
                            : "bg-white border border-orange-200 text-gray-700 hover:bg-orange-50"
                            }`}
                    >
                        {page}
                    </button>
                ))}
                <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="w-9 h-9 flex items-center justify-center rounded-lg bg-white border border-orange-200 disabled:opacity-40 hover:bg-orange-50 transition-all active:scale-95"
                >
                    <ChevronRight size={18} className="text-orange-500" />
                </button>
            </div>
        </div>
    );
}