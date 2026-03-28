import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Footer from "./Footer";
import type { RootState } from "../store/store";
import { useDispatch, useSelector } from "react-redux";
import type { user } from "../model/user";
import { useEffect, useState } from "react";
import { loginSuccess } from "../store/slices/userSlice";
const API_BASE = import.meta.env.VITE_API_URL;
export default function Header2() {
  const users = useSelector((state: RootState) => state.user.user as user);
  const dispatch = useDispatch();
  const token = localStorage.getItem("accessToken");
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${API_BASE}/api/common/check/getprofile`,
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
  }, [token, dispatch]);
  const navItems = [
    { name: "Trang chủ", path: "/" },
    { name: "Lịch trình", path: "/lichtrinh" },
    { name: "Tra cứu vé", path: "/user/orderhistory" },
    { name: "Tin tức", path: "/news" },
    { name: "Gửi hàng", path: "/dathang" },
  ];
  const location = useLocation();
  const noBgExact = ["/loginCamera", "/registerCamera", "/changePass", "/verifi", "/news", "/thongtindatve"];

  const showBackground =
    !noBgExact.includes(location.pathname) &&
    !location.pathname.startsWith("/driverBooking") &&
    !location.pathname.startsWith("/user") &&
    !location.pathname.startsWith("/assistant") &&
    !location.pathname.startsWith("/letan");

  return (
    <>
      <div className="overflow-x-hidden bg-[#ece7e2] text-[#2e1f16]">
        <section className="relative overflow-hidden bg-[#ece7e2]">
          {/* Background Image - QUAN TRỌNG: Không bỏ phần này */}
          {showBackground && (
            <img
              src="/images/bg4.png"
              alt="Hero background"
              className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
              // giới hạn chiều cao để không đẩy layout trên mobile / tránh overflow ngang
              style={{ maxHeight: "720px" }}
            />
          )}

          {/* Gradient Overlay */}
          <div className="pointer-events-none absolute inset-x-0 top-0 z-30 h-[96px] bg-gradient-to-b from-[#fefcfb]/90 via-[#fefcfb]/58 to-transparent" />

          {/* Navigation */}
          <div className="page-enter-nav absolute inset-x-0 top-0 z-40">
            <div className="mx-auto flex h-[74px] w-full max-w-[1240px] items-center justify-between px-4">
              {/* Logo */}
              {/* NOTE: loại bỏ negative margin trên breakpoint nhỏ để tránh dịch lệch */}
              <div className="relative flex h-14 items-center w-[260px] pl-0 sm:pl-0 md:pl-0 lg:-ml-[111px]">
                <img
                  src="/images/logo1.png"
                  alt="CoachTrip logo"
                  className="h-14 w-auto object-contain"
                />
                <span className="absolute left-[58px] top-1/2 -translate-y-1/2 text-[24px] font-black uppercase leading-none tracking-[-0.01em] text-[#f28320]">
                  COACHTRIP
                </span>
              </div>

              {/* Menu Navigation (desktop) */}
              <nav className="hidden items-center gap-8 md:flex">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `relative py-7 text-[13px] font-semibold ${isActive
                        ? "text-[#2f2118] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:rounded-full after:bg-[#e8a255]"
                        : "text-[#7c5f4a]"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              {/* Mobile menu button */}
              <div className="md:hidden flex items-center gap-2">
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  aria-label={mobileOpen ? "Close menu" : "Open menu"}
                  className="relative z-50 inline-flex h-10 w-10 items-center justify-center rounded-md bg-white/90 text-[#2e1f16] shadow-sm ring-1 ring-black/5 transition hover:scale-[1.02] focus:outline-none"
                >
                  <span className="sr-only">
                    {mobileOpen ? "Close menu" : "Open menu"}
                  </span>
                  {!mobileOpen ? (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M4 6h16M4 12h16M4 18h16"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Auth Buttons / User Profile (desktop) */}
              <div className="hidden items-center gap-4 md:flex md:translate-x-3 lg:translate-x-14">
                {!users ? (
                  <>
                    <Link
                      to="/register"
                      className="rounded-xl border border-[#e6bc93] bg-[#fff4e8] px-4 py-2 text-sm font-semibold text-[#5f3e28] shadow-[0_8px_18px_-14px_rgba(165,96,35,0.7)] transition duration-200 hover:border-[#df9a5e] hover:bg-[#ffeddc] hover:text-[#b05e1b]"
                    >
                      Đăng ký
                    </Link>
                    <Link
                      to="/login"
                      className="rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-5 py-2 text-sm font-bold text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
                    >
                      Đăng nhập
                    </Link>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link to="/user/profile">
                      <img
                        src={users.avatar?.url || "/avatar-default.png"}
                        alt="User avatar"
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    </Link>
                    <span className="text-sm font-medium text-[#2e1f16]">
                      {users.name}
                    </span>
                    <button
                      onClick={() => {
                        localStorage.removeItem("accessToken");
                        window.location.href = "/";
                      }}
                      className="text-sm font-semibold text-red-600 hover:text-red-700"
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile menu panel */}
            <div
              className={`md:hidden absolute inset-x-0 top-[74px] z-50 transform origin-top-right transition-all ${mobileOpen
                ? "scale-y-100 opacity-100"
                : "scale-y-0 opacity-0 pointer-events-none"
                }`}
              style={{ transformOrigin: "top" }}
            >
              <div className="mx-auto w-full max-w-[1240px] px-4">
                <div className="rounded-b-lg bg-white/95 p-4 shadow-lg ring-1 ring-black/5">
                  <nav className="flex flex-col gap-2 py-2">
                    {navItems.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `block rounded-md px-3 py-2 text-base font-semibold ${isActive
                            ? "text-[#2f2118] bg-[#fff3e7]"
                            : "text-[#4b3a2e] hover:bg-[#fff6f0]"
                          }`
                        }
                      >
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>

                  <div className="mt-3 border-t border-[#efe7df] pt-3">
                    {!users ? (
                      <div className="flex flex-col gap-2">
                        <Link
                          to="/register"
                          onClick={() => setMobileOpen(false)}
                          className="w-full rounded-xl border border-[#e6bc93] bg-[#fff4e8] px-4 py-2 text-center text-sm font-semibold text-[#5f3e28] transition"
                        >
                          Đăng ký
                        </Link>
                        <Link
                          to="/login"
                          onClick={() => setMobileOpen(false)}
                          className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-2 text-center text-sm font-bold text-white"
                        >
                          Đăng nhập
                        </Link>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-3">
                        <Link
                          to="/user/profile"
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-3"
                        >
                          <img
                            src={users.avatar?.url || "/avatar-default.png"}
                            alt="User avatar"
                            className="h-9 w-9 rounded-full object-cover"
                          />
                          <span className="text-sm font-medium text-[#2e1f16]">
                            {users.name}
                          </span>
                        </Link>
                        <button
                          onClick={() => {
                            localStorage.removeItem("accessToken");
                            window.location.href = "/";
                          }}
                          className="text-sm font-semibold text-red-600 hover:text-red-700"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content từ các page con sẽ render ở đây */}
          <Outlet />
        </section>
      </div>
      <Footer />
    </>
  );
}
