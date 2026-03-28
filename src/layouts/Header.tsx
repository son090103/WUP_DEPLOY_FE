import { Link, Outlet } from "react-router-dom";
import BustripLogo from "../components/BustripLogo";
import { NavLink } from "react-router-dom";
import type { RootState } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import type { user } from "../model/user";
import { loginSuccess } from "../store/slices/userSlice";
import { useEffect, useState } from "react";
const API_BASE = import.meta.env.VITE_API_URL;
export default function Header() {
    const users = useSelector((state: RootState) => state.user.user as user);
    const dispatch = useDispatch();
    const [open, setOpen] = useState(false);

    const menus = [
        { label: "Trang chủ", path: "/" },
        { label: "Lịch trình", path: "/lich-trinh" },
        { label: "Tra cứu vé", path: "/tra-cuu-ve" },
        { label: "Hóa đơn", path: "/hoa-don" },
        { label: "Thêm", path: "/them" },
    ];

    const token = localStorage.getItem("accessToken");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(
                    `${API_BASE}/api/customer/check/getuser`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );

                if (!response.ok) return;

                const dataProfile = await response.json();
                dispatch(loginSuccess(dataProfile.data));
            } catch (err) {
                console.error(err);
            }
        };

        if (token) fetchProfile();
    }, []);

    return (
        <>
            <nav className="relative z-30">
                {/* Background (KHÔNG ĂN CLICK) */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-pink-50 to-orange-50 pointer-events-none" />

                {/* Header */}
                <div className="relative z-40 max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center space-x-2">
                        <BustripLogo className="w-10 h-10 sm:w-14 sm:h-14" />
                        <span className="text-orange-500 font-bold text-xl sm:text-2xl">
                            BUSTRIP
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-8">
                        {menus.map((item) => (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive
                                        ? "text-orange-500 font-medium"
                                        : "text-gray-700 hover:text-orange-500 font-medium"
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </div>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center space-x-4">
                        {!users ? (
                            <>
                                <Link to="/login" className="hover:text-orange-500">
                                    Sign in
                                </Link>
                                <Link
                                    to="/register"
                                    className="bg-orange-500 text-white px-4 py-2 rounded-lg"
                                >
                                    Sign up
                                </Link>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link to={"profile"}>
                                    <img
                                        src={users.avatar?.url || "/avatar-default.png"}
                                        className="w-9 h-9 rounded-full object-cover"
                                    />
                                </Link>

                                <span className="text-sm font-medium">{users.name}</span>
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("accessToken");
                                        window.location.href = "/";
                                    }}
                                    className="text-red-500 text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Mobile Button */}
                    <button
                        onClick={() => setOpen(!open)}
                        className="md:hidden text-2xl text-gray-700 focus:outline-none"
                        aria-label="Toggle menu"
                    >
                        ☰
                    </button>
                </div>

                {/* Mobile Menu */}
                {open && (
                    <div className="md:hidden absolute top-16 left-0 right-0 bg-white shadow-xl z-50">
                        <div className="flex flex-col px-4 py-4 space-y-4">
                            {menus.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setOpen(false)}
                                    className={({ isActive }) =>
                                        isActive
                                            ? "text-orange-500 font-medium"
                                            : "text-gray-700 hover:text-orange-500 font-medium"
                                    }
                                >
                                    {item.label}
                                </NavLink>
                            ))}

                            <hr />

                            {!users ? (
                                <>
                                    <Link
                                        to="/login"
                                        onClick={() => setOpen(false)}
                                        className="text-gray-700"
                                    >
                                        Sign in
                                    </Link>
                                    <Link
                                        to="/register"
                                        onClick={() => setOpen(false)}
                                        className="bg-orange-500 text-white text-center py-2 rounded-lg"
                                    >
                                        Sign up
                                    </Link>
                                </>
                            ) : (
                                <button
                                    onClick={() => {
                                        localStorage.removeItem("accessToken");
                                        window.location.href = "/";
                                    }}
                                    className="text-red-500 text-left"
                                >
                                    Logout
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </nav>


            <Outlet />
        </>
    );
}
