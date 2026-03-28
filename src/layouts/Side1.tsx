import React from "react";
import { Calendar, MapPin, Users } from "lucide-react";

const BusBookingApp: React.FC = () => {
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-orange-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 min-w-0">
          {/* Main Card */}
          <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-3xl overflow-hidden relative min-w-0">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-orange-100 opacity-30 rounded-full blur-3xl hidden sm:block" />
            <div className="absolute bottom-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-pink-100 opacity-30 rounded-full blur-3xl hidden sm:block" />

            <div className="relative grid md:grid-cols-2 gap-8 py-10 sm:py-12 md:py-16 items-start min-w-0">
              {/* Left Side - Content */}
              <div className="flex flex-col justify-center space-y-6 px-6 sm:px-8 md:pl-16 lg:pl-24 pr-6 text-center sm:text-left min-w-0">
                <div className="min-w-0">
                  <h1 className="font-extrabold text-gray-900 leading-tight mb-2 text-center sm:text-left whitespace-normal break-words text-[clamp(1.6rem,4.5vw,3.25rem)]">
                    Tìm và đặt
                  </h1>
                  <h2 className="font-extrabold text-gray-900 leading-tight mb-2 text-center sm:text-left whitespace-normal break-words text-[clamp(1.6rem,4.5vw,3.25rem)]">
                    ngay chuyến xe
                  </h2>
                  <h3 className="font-extrabold leading-tight mb-4 text-center sm:text-left whitespace-normal break-words text-[clamp(1.6rem,4.5vw,3.25rem)]">
                    thật <span className="text-orange-500">Dễ Dàng</span>
                  </h3>
                  <p className="text-gray-600 text-base sm:text-lg text-center sm:text-left">
                    Đặt vé mọi lúc mọi nơi
                  </p>
                </div>
              </div>

              {/* Right Side - Bus Illustration */}
              <div className="flex items-center justify-center relative px-6 min-w-0">
                <div className="hidden lg:flex items-center justify-center relative w-full">
                  <div className="absolute -top-10 -left-10 w-40 h-40 md:w-64 md:h-64 bg-orange-300 rounded-full opacity-30 blur-2xl" />
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 md:w-64 md:h-64 bg-yellow-300 rounded-full opacity-30 blur-2xl" />

                  <img
                    src="/images/otocheck.png"
                    alt="Bus illustration"
                    className="relative z-10 w-[90%] max-w-none object-contain"
                  />
                </div>
              </div>

              {/* FORM ĐẶT VÉ */}
              <div className="md:col-span-2 flex justify-center md:justify-start -mt-10 sm:-mt-12 md:-mt-20 mb-12 px-4 md:pl-16 lg:pl-24 min-w-0">
                <div className="w-full max-w-4xl md:max-w-6xl mx-auto md:mx-0 bg-white rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 box-border overflow-hidden min-w-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end min-w-0">
                    {/* Điểm đi */}
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điểm đi
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          aria-label="Điểm đi"
                          type="text"
                          placeholder="Vị trí hiện tại"
                          className="w-full min-w-0 pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Điểm đến */}
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điểm đến
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          aria-label="Điểm đến"
                          type="text"
                          placeholder="Chọn điểm đến"
                          className="w-full min-w-0 pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Ngày */}
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ngày đặt vé
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          aria-label="Ngày đặt vé"
                          type="date"
                          className="w-full min-w-0 pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Số vé */}
                    <div className="min-w-0">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Số lượng vé
                      </label>
                      <div className="relative">
                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          aria-label="Số lượng vé"
                          type="number"
                          min={1}
                          max={20}
                          className="w-full min-w-0 pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    {/* Nút đặt vé */}
                    <div className="flex md:col-span-2 lg:col-span-1 min-w-0">
                      <button
                        className="w-full h-[52px] rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition shadow-lg"
                        type="button"
                        aria-label="Đặt vé"
                      >
                        🚍 Đặt vé
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BusBookingApp;
