import { Link, Outlet, useLocation } from "react-router-dom";
import { Bus, BarChart3, Ticket, Package } from "lucide-react";



const TripListPageLeTan: React.FC = () => {
    const location = useLocation();
    // ===== Pagination Logic =====

    const menuItems = [
        { label: "Danh sách chuyến đi", icon: Bus, path: "/letan/chuyendi" },
        { label: "Đặt vé cho khách hàng", icon: Ticket, path: "/letan/ticketBooking" },
        { label: "Hoàn Tiền cho khách", icon: Package, path: "/letan/hoan-tien" },

    ];
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 pt-28 px-6">
            <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">

                {/* Sidebar */}
                <aside className="col-span-3 bg-white rounded-3xl border shadow-sm sticky top-28 h-fit">
                    <h2 className="p-6 font-extrabold text-lg border-b">
                        Thanh công cụ
                    </h2>

                    <nav className="divide-y">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;

                            return (
                                <Link
                                    key={item.label}
                                    to={item.path}
                                    className={`flex items-center gap-3 px-6 py-4 transition-all duration-200
                  ${isActive
                                            ? "bg-orange-50 text-orange-500 font-bold border-r-4 border-orange-500"
                                            : "text-slate-600 hover:bg-slate-50"
                                        }`}
                                >
                                    <Icon size={18} />
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </aside>

                {/* Main Content */}
                <main className="col-span-9">
                    <Outlet />

                </main>
            </div>
        </div>
    );
};

export default TripListPageLeTan;
