import { useState, useEffect } from "react";
import { ChevronLeft, CircleCheck, TriangleAlert, } from "lucide-react";
import { useNavigate } from "react-router-dom";
import baseAPIAuth from "../../api/auth";
import type { AllRoutes } from "../../model/getRoutes";

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

export default function BulkCreateTrips() {
  const navigate = useNavigate();
  const [routes, setRoutes] = useState<AllRoutes[]>([]);
  const [routeId, setRouteId] = useState("");
  const [departureHour, setDepartureHour] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  // Use Effect lấy route
  useEffect(() => {
    fetchRoutes();
  }, []);

  // Hàm lấy route
  const fetchRoutes = async () => {
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getRoutes");
      setRoutes(res.data);
    } catch (error) {
      console.error(error);
    }
  };


  const selectedRoute = routes.find((r) => r._id === routeId);

  const createSeriesOfTrip = async () => {
    try {
      const res = await baseAPIAuth.post("/api/admin/check/seriesOfTrips", {
        route_id: routeId,
        departure_hour: departureHour,
        start_date: startDate,
        end_date: endDate,
      });
      setNotice({
        type: "success",
        title: "Tạo hàng loạt chuyến thành công",
        message: res.data?.message || "Thông tin chuyến đã được tạo.",
      });
    } catch (err: unknown) {
      console.error(err);

      let message = "Tạo chuyến thất bại.";

      if (err instanceof Error) {
        message = err.message;
      }

      // check kiểu object có response (kiểu axios)
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err
      ) {
        const response = (err as {
          response?: {
            data?: {
              message?: string;
            };
          };
        }).response;

        if (response?.data?.message) {
          message = response.data.message;
        }
      }

      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#1f2937]">
      <section className="w-full">
        <div className="mx-auto w-full max-w-[1200px] space-y-6 px-4 pb-16 pt-10 lg:px-4">
          {/* HEADER */}
          <div className="mb-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] bg-white text-[#c2c8d2]"
            >
              <ChevronLeft size={25} strokeWidth={2.3} />
            </button>
            <div>
              <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
                Tạo chuyến đi hàng loạt
              </h1>
              <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
                Tạo nhiều chuyến cùng lúc theo khoảng ngày. Gán xe và tài xế
                sau tại trang quản lý chuyến.
              </p>
            </div>
          </div>

          {/* FORM */}
          <form
            onSubmit={(e) => e.preventDefault()}
            className="mt-6 space-y-5 rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]"
          >
            {/* Chọn tuyến */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-[#1f2430]">Chọn tuyến</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Tuyến xe
                  </span>
                  <select
                    value={routeId}
                    onChange={(e) => setRouteId(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  >
                    <option value="">-- Chọn tuyến --</option>
                    {routes.map((route) => (
                      <option key={route._id} value={route._id}>
                        {route.start_id.name} - {route.stop_id.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Thời gian dự kiến (giờ)
                  </span>
                  <input
                    type="text"
                    value={
                      selectedRoute?.estimated_duration
                        ? `${selectedRoute.estimated_duration} giờ`
                        : "Chọn tuyến để xem"
                    }
                    disabled
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f0f0f0] px-3 text-sm font-semibold text-[#374151] outline-none"
                  />
                </label>
              </div>
            </section>

            {/* Thời gian */}
            <section className="space-y-4">
              <h2 className="text-lg font-black text-[#1f2430]">
                Thời gian
              </h2>
              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Giờ khởi hành
                  </span>
                  <input
                    type="time"
                    value={departureHour}
                    onChange={(e) => setDepartureHour(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Từ ngày
                  </span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Đến ngày
                  </span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>
              </div>
            </section>

            {/* Error / Success */}
            {formError && (
              <div className="rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                {formError}
              </div>
            )}
            {/* Submit */}
            <button
              type="button"
              onClick={createSeriesOfTrip}
              disabled={loading}
              className="mt-2 w-full rounded-[12px] bg-[#f59e0b] py-3 text-[15px] font-black uppercase tracking-wider text-white shadow-md transition hover:bg-[#d97706] disabled:opacity-50"
            >
              {loading ? "Đang tạo..." : "Tạo hàng loạt chuyến"}
            </button>
          </form>
        </div>
      </section>
      {notice ? (
        <>
          <style>{`
                @keyframes routeNoticeIn {
                  0% {
                    opacity: 0;
                    transform: translateY(10px) scale(0.95);
                  }
                  70% {
                    transform: translateY(-2px) scale(1.02);
                  }
                  100% {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                  }
                }
      
                @keyframes routeNoticeIcon {
                  0% {
                    transform: scale(0.4) rotate(-25deg);
                    opacity: 0;
                  }
                  55% {
                    transform: scale(1.18) rotate(8deg);
                    opacity: 1;
                  }
                  80% {
                    transform: scale(0.95) rotate(-4deg);
                  }
                  100% {
                    transform: scale(1) rotate(0);
                  }
                }
      
                @keyframes routeNoticePulse {
                  0% {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32);
                  }
                  100% {
                    box-shadow: 0 0 0 16px rgba(16, 185, 129, 0);
                  }
                }
              `}</style>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0f172a]/35 px-4"
            onClick={() => setNotice(null)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.7)]"
              onClick={(event) => event.stopPropagation()}
              style={{
                animation:
                  notice.type === "success"
                    ? "routeNoticeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1)"
                    : "routeNoticeIn 0.35s ease",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-full ${notice.type === "success"
                    ? "bg-[#ecfdf3] text-[#16a34a]"
                    : "bg-[#fff7ed] text-[#ea580c]"
                    }`}
                  style={{
                    animation:
                      notice.type === "success"
                        ? "routeNoticePulse 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards"
                        : undefined,
                  }}
                >
                  {notice.type === "success" ? (
                    <CircleCheck
                      size={20}
                      style={{
                        animation:
                          notice.type === "success"
                            ? "routeNoticeIcon 0.55s cubic-bezier(0.22, 1, 0.36, 1)"
                            : undefined,
                      }}
                    />
                  ) : (
                    <TriangleAlert size={20} />
                  )}
                </span>
                <div className="flex-1">
                  <h3 className="text-base font-black text-[#111827]">
                    {notice.title}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-[#4b5563]">
                    {notice.message}
                  </p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  className="rounded-lg bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-4 py-2 text-sm font-bold text-white transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31]"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
