

export default function BusBookingForm() {

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="w-full max-w-6xl">
                {/* Tuyến xe phổ biến Section */}
                <div className="mt-12">
                    <div className="text-center mb-8">
                        <span className="inline-block bg-yellow-100 text-yellow-800 text-sm font-semibold px-4 py-2 rounded-full mb-4">
                            TUYẾN XE PHỔ BIẾN
                        </span>
                        <h2 className="text-2xl md:text-3xl font-bold text-gray-800">
                            Các tuyến xe phổ biến hiện nay
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Route Card 1 - Đà Lạt */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop"
                                    alt="Đà Lạt"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <h3 className="absolute bottom-4 left-4 text-white text-2xl font-bold">ĐÀ LẠT</h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">TP. HCM</span>
                                        <span className="font-bold text-gray-800">260.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">300km - 8h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Đà Lạt</span>
                                        <span className="font-bold text-gray-800">260.000 vnđ</span>
                                    </div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Đà Nẵng</span>
                                        <span className="font-bold text-gray-800">430.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">700km - 14h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Cần Thơ</span>
                                        <span className="font-bold text-gray-800">450.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">464km - 11h - 16/1/2026</div>
                                </div>
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                                    Rent Now
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Route Card 2 - TP Hồ Chí Minh */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=400&h=300&fit=crop&sat=-100"
                                    alt="TP Hồ Chí Minh"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <h3 className="absolute bottom-4 left-4 text-white text-xl font-bold">Xuất phát từ TP Hồ Chí Minh</h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Đà Lạt</span>
                                        <span className="font-bold text-gray-800">260.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">310km - 8h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Cần Thơ</span>
                                        <span className="font-bold text-gray-800">165.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">172km - 5h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Long Xuyên</span>
                                        <span className="font-bold text-gray-800">200.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">209km - 5h - 16/1/2026</div>
                                </div>
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                                    Rent Now
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Route Card 3 - Đà Nẵng */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src="./images/image 12.png"
                                    alt="Đà Nẵng"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <h3 className="absolute bottom-4 left-4 text-white text-2xl font-bold">ĐÀ NẴNG</h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">Đà Lạt</span>
                                        <span className="font-bold text-gray-800">430.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">700km - 14h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">BX. An Xương</span>
                                        <span className="font-bold text-gray-800">510.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">980km - 20h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Nha Trang</span>
                                        <span className="font-bold text-gray-800">390.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">550km - 10h - 16/1/2026</div>
                                </div>
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                                    Rent Now
                                    <span>→</span>
                                </button>
                            </div>
                        </div>

                        {/* Route Card 4 - Hà Nội */}
                        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                            <div className="relative h-48 overflow-hidden">
                                <img
                                    src="https://images.unsplash.com/photo-1509023464722-18d996393ca8?w=400&h=300&fit=crop"
                                    alt="Hà Nội"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                <h3 className="absolute bottom-4 left-4 text-white text-2xl font-bold">HÀ NỘI</h3>
                            </div>
                            <div className="p-4">
                                <div className="space-y-3 mb-4">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">TP. HCM</span>
                                        <span className="font-bold text-gray-800">260.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">300km - 8h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Đà Nẵng</span>
                                        <span className="font-bold text-gray-800">430.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">700km - 14h - 16/1/2026</div>

                                    <div className="flex justify-between items-center text-sm border-t pt-3">
                                        <span className="text-gray-600">Cần Thơ</span>
                                        <span className="font-bold text-gray-800">450.000 vnđ</span>
                                    </div>
                                    <div className="text-xs text-gray-500">464km - 11h - 16/1/2026</div>
                                </div>
                                <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2">
                                    Rent Now
                                    <span>→</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-8">
                        <button className="bg-white hover:bg-gray-50 text-gray-800 font-semibold px-8 py-3 rounded-lg border border-gray-300 transition flex items-center justify-center gap-2 mx-auto">
                            Xem tất cả các chuyến
                            <span>→</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}