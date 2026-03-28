import { MapPin, Bus, CalendarClock, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

export default function TransportBooking() {
    return (
        <div className="min-h-screen bg-gray-50">

            {/* ══════════════════════════════════════════════
                MOBILE BOTTOM NAV
            ══════════════════════════════════════════════ */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-black/10 shadow-2xl">
                <div className="flex items-stretch">
                    <NavLink
                        to="viewtrip"
                        className={({ isActive }) =>
                            `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all
                            ${isActive ? "text-orange-600 bg-orange-50" : "text-gray-500"}`
                        }
                    >
                        <Bus size={20} />
                        Chuyến lái
                    </NavLink>

                    <NavLink
                        to="viewSlot"
                        className={({ isActive }) =>
                            `flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold transition-all
                            ${isActive ? "text-orange-600 bg-orange-50" : "text-gray-500"}`
                        }
                    >
                        <CalendarClock size={20} />
                        Ca làm
                    </NavLink>

                    <button className="flex-1 flex flex-col items-center justify-center gap-1 py-3 text-[10px] font-bold text-gray-500 hover:text-orange-600 transition-all">
                        <LogOut size={20} />
                        Đăng xuất
                    </button>
                </div>
            </div>

            {/* ══════════════════════════════════════════════
                MAIN LAYOUT
            ══════════════════════════════════════════════ */}
            <div className="p-4 pb-20 lg:p-8 lg:pb-8 w-full max-w-7xl mx-auto">
                <div className="flex gap-8">

                    {/* ── Sidebar — desktop only ── */}
                    <aside className="hidden lg:block w-64 shrink-0 mt-12">
                        <div className="bg-white rounded-2xl shadow-md border border-black/10 overflow-hidden">

                            <NavLink
                                to="viewtrip"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-4 font-semibold transition
                                    ${isActive ? "bg-orange-100 text-orange-600" : "text-gray-800 hover:bg-orange-50"}`
                                }
                            >
                                <div className="w-6 h-6 bg-orange-500 rounded" />
                                Danh sách chuyến lái
                            </NavLink>

                            <NavLink
                                to="viewSlot"
                                className={({ isActive }) =>
                                    `flex items-center gap-3 p-4 font-semibold transition
                                    ${isActive ? "bg-orange-100 text-orange-600" : "text-gray-800 hover:bg-orange-50"}`
                                }
                            >
                                <div className="w-6 h-6 bg-orange-500 rounded" />
                                Danh sách Ca làm
                            </NavLink>

                            <div className="border-t border-black/10 p-4">
                                <button className="w-full flex items-center gap-3 text-gray-700 hover:text-orange-600 transition">
                                    <MapPin size={20} />
                                    Đăng xuất
                                </button>
                            </div>

                        </div>
                    </aside>

                    {/* ── Main content ── */}
                    <main className="flex-1 min-w-0 mt-0 lg:mt-12 pt-[56px] lg:pt-0">
                        <Outlet />
                    </main>

                </div>
            </div>
        </div>
    );
}