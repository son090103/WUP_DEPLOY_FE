import { useLocation } from "react-router-dom";
import BustripLogoBg from "../components/BusBig";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const hideBg =
    location.pathname.startsWith("/home2") ||
    location.pathname.startsWith("/admin/create-coach") ||
    location.pathname.startsWith("/admin/create-route");

  return (
    // dùng overflow-x-hidden để chặn scroll ngang gây lỗi trên mobile
    <div className="relative min-h-screen overflow-x-hidden">
      {!hideBg && <BustripLogoBg />}

      {/* CONTENT */}
      <div className="relative z-20">
        <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 md:px-8">
          {children}
        </div>
      </div>
    </div>
  );
}
