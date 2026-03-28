import React, { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {

  Bus,
  BusFront,
  Map,
  CalendarCheck2,
  LayoutDashboard,
  Shield,
  Menu,
  X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "../../store/store";
import type { user } from "../../model/user";
import { loginSuccess } from "../../store/slices/userSlice";

const ADMIN_SIDEBAR_ITEMS = [

  {
    id: "finance",
    label: "Tổng quan & Quản lý thu chi",
    icon: LayoutDashboard,
    path: "/admin/manage-revenue",
  },
  {
    id: "buses",
    label: "Quản lý xe",
    icon: BusFront,
    path: "/admin/manage-buses",
  },
  {
    id: "routes",
    label: "Quản lý tuyến xe",
    icon: CalendarCheck2,
    path: "/admin/manage-routes",
  },

  {
    id: "trips",
    label: "Quản lý chuyến xe",
    icon: Map,
    path: "/admin/manage-trips",
  },
  {
    id: "buses",
    label: "Quản lý các loại xe",
    icon: BusFront,
    path: "/admin/types-bus",
  },
  {
    id: "create-route",
    label: "Thêm tuyến xe",
    icon: Bus,
    path: "/admin/create-route",
  },
  {
    id: "stops-stopocations",
    label: "Quản lý tỉnh thành và điểm dừng",
    icon: Bus,
    path: "/admin/manage-stop-locations",
  },
  {
    id: "roles",
    label: "Quản lý phân quyền",
    icon: Shield,
    path: "/admin/manage-users",
  },
  {
    id: "pracel",
    label: "Quản lý giá vé đặt hàng",
    icon: Shield,
    path: "/admin/order-price",
  },

];

export default function HomeAdmin() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const users = useSelector((state: RootState) => state.user.user as user);
  const dispatch = useDispatch();
  const token = localStorage.getItem("accessToken");
  const api = import.meta.env.VITE_API_URL
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(
          `${api}/api/common/check/getprofile`,
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
  const SidebarContent = (
    <>
      <div className="border-b border-[#dde2ea] bg-white px-5 py-7">
        <div className="flex items-center gap-2.5">
          <img
            src="/images/logo1.png"
            alt="Bustrip logo"
            className="h-9 w-9 object-contain opacity-85"
          />
          <span className="text-[22px] font-black uppercase tracking-[-0.01em] text-[#eb8a45]">
            CoachTrip
          </span>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="overflow-hidden rounded-[2px] border border-[#d8dde6] bg-white">
          {ADMIN_SIDEBAR_ITEMS.map((item) => {
            const ItemIcon = item.icon;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/admin"}
                className={({ isActive }) =>
                  `flex h-10 w-full items-center gap-3 border-b border-[#d8dde6] border-l-4 px-3 text-left text-[13px] font-medium last:border-b-0
            ${isActive
                    ? "bg-[#FFF4EB] text-[#1f2937] border-l-[#FF5722]"
                    : "border-l-transparent text-[#374151] hover:bg-[#f3f4f6]"
                  }`
                }
                onClick={() => setMobileOpen(false)}
              >
                <ItemIcon size={14} className="shrink-0 text-[#111827]" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div className="mt-auto border-t border-[#dde2ea] bg-white px-4 py-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-black text-[#6b7280] ring-1 ring-[#d7dbe2]">
            AH
          </span>
          <div>
            <p className="text-[14px] font-black leading-none text-[#111827]">
              {users?.name}
            </p>
            <p className="mt-1 text-[11px] text-[#9ca3af]">{users?.phone}</p>
          </div>
        </div>

        <div className="ml-3 mt-3 grid grid-cols-2 gap-2">
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
      </div>
    </>
  );

  return (
    <div className="h-screen bg-[#f6f7f9] text-[#1f2937]">
      <section className="h-full w-full">
        <div className="grid h-full lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* DESKTOP SIDEBAR */}
          <aside className="hidden lg:flex h-full flex-col border-r border-[#dde2ea] bg-white">
            {SidebarContent}
          </aside>

          {/* MOBILE SIDEBAR (overlay) */}
          {mobileOpen && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden
              />
              <aside className="fixed inset-y-0 left-0 z-50 w-72 transform overflow-y-auto bg-white shadow-lg transition-transform lg:hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#dde2ea]">
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/images/logo1.png"
                      alt="Bustrip logo"
                      className="h-8 w-8 object-contain opacity-85"
                    />
                    <span className="text-[18px] font-black uppercase tracking-[-0.01em] text-[#eb8a45]">
                      CoachTrip
                    </span>
                  </div>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="rounded-md p-1.5 hover:bg-[#f3f4f6]"
                    aria-label="Close menu"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="px-2 py-4">{SidebarContent}</div>
              </aside>
            </>
          )}

          {/* MAIN CONTENT */}
          <main className="h-full overflow-y-auto">
            {/* MOBILE TOPBAR */}
            <div className="lg:hidden border-b border-[#dde2ea] bg-white">
              <div className="mx-auto flex max-w-[1380px] items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMobileOpen(true)}
                    className="rounded-md p-2 hover:bg-[#f3f4f6]"
                    aria-label="Open menu"
                  >
                    <Menu size={18} />
                  </button>
                  <div className="flex items-center gap-2.5">
                    <img
                      src="/images/logo1.png"
                      alt="Bustrip logo"
                      className="h-8 w-8 object-contain opacity-85"
                    />
                    <span className="text-[18px] font-black uppercase tracking-[-0.01em] text-[#eb8a45]">
                      CoachTrip
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button className="h-8 rounded-md bg-[#eb8a45] px-3 text-white text-[13px] font-semibold">
                    Thêm chuyến
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-[1380px] space-y-6 px-4 pb-16 pt-10">
              <Outlet />
            </div>
          </main>
        </div>
      </section>
    </div>
  );
}
