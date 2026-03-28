import { useEffect, useState } from "react";
import axios from "axios";
import { User, Ticket, Settings, MapPin } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

/* ================= CONFIG ================= */

const API_BASE_URL = import.meta.env.VITE_API_URL;

/* ================= TYPES ================= */

type UserProfile = {
  name: string;
  phone: string;
  avatar: { url: string } | null;
  role: string;
  joinDate: string;
};

/* ================= COMPONENT ================= */

export default function BusTripProfile() {
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<UserProfile>({
    name: "",
    phone: "",
    avatar: null,
    role: "",
    joinDate: "",
  });

  const token = localStorage.getItem("accessToken");
  const location = useLocation();
  /* ================= HELPERS ================= */

  /* ================= FETCH PROFILE ================= */

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/customer/check/getuser`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const raw = res.data;
        const u = raw?.data || raw?.user || raw;

        if (!u || !u.name) throw new Error("Profile data not found");

        setProfile({
          name: u.name ?? "",
          phone: u.phone ?? "",
          avatar: u.avatar ?? null,
          role: u.role?.name ?? "",
          joinDate: u.createdAt ?? "",
        });
      } catch (err) {
        console.error("FETCH PROFILE ERROR >>>", err);
        alert("Không lấy được thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  /* ================= AVATAR HANDLERS ================= */

  if (loading) return <div className="p-10">Loading...</div>;

  /* ================= UI ================= */

  return (
    <div className="font-['Plus_Jakarta_Sans',sans-serif] bg-slate-50 min-h-screen">
      {/* ================= MAIN ================= */}
      <main className="pt-28 max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* -------- Sidebar -------- */}
        <aside className="bg-white rounded-xl border sticky top-28 h-fit">
          <h2 className="p-6 font-extrabold">Tài khoản của tôi</h2>
          <nav className="divide-y">
            {[
              { label: "Thông tin cá nhân", icon: User, path: "/user/profile" },
              {
                label: "Lịch sử đặt vé",
                icon: Ticket,
                path: "/user/orderhistory",
              },
              {
                label: "Đánh giá chuyển đi",
                icon: Ticket,
                path: "/user/tripReview",
              },

              {
                label: "Lịch sử đánh giá",
                icon: Ticket,
                path: "/user/tripReviewHistory",
              },
              {
                label: "Lịch sử đặt hàng",
                icon: Ticket,
                path: "/user/parcel-history",
              },
              { label: "Địa chỉ", icon: MapPin, path: "/user/address" },
              {
                label: "Đổi mật khẩu",
                icon: Settings,
                path: "/user/changpassword",
              },
            ].map((item) => {
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

        {/* -------- Profile -------- */}
        <Outlet context={{ profile, setProfile }} />
      </main>
    </div>
  );
}
