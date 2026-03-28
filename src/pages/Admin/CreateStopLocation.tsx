import { useEffect, useState } from "react";
import { ChevronLeft, ChevronDown, CircleCheck, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import baseAPIAuth from "../../api/auth";
import type { allStops } from "../../model/allStops";
import type { geoLocation } from "../../model/stopLocation";

type LocationType = "PICKUP" | "DROPOFF" | "BOTH";

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

export default function CreateStopLocation() {
  const navigate = useNavigate();

  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [location, setLocation] = useState<geoLocation>({
    type: "Point",
    coordinates: [0, 0],
  });
  const [stopId, setStopId] = useState("");
  const [locationName, setLocationName] = useState("");
  const [address, setAddress] = useState("");
  const [locationType, setLocationType] = useState<LocationType>("BOTH");
  const [status, setStatus] = useState(true);
  const [stops, setStops] = useState<allStops[]>([]);

  const getGeoLocation = async () => {
    try {
      const res = await baseAPIAuth.post(
        "/api/admin/check/getGeoStopLocation",
        {
          stop_id: stopId,
          location_name: locationName,
          address: address,
        },
      );
      setLocation({
        type: "Point",
        coordinates: [res.data.coordinates.lng, res.data.coordinates.lat],
      });
      console.log(res.data);
      setNotice({ type: "success", title: "Thành công", message: "Lấy tọa độ vị trí thành công" });
    } catch (error: any) {
      console.error(error);
      setNotice({ type: "error", title: "Thất bại", message: error.response?.data?.message || "Lấy vị trí thất bại, không đúng địa chỉ hoặc địa chỉ ko tồn tại." });
    }
  };

  const createNewStopLocation = async () => {
    try {
      const res = await baseAPIAuth.post(
        "/api/admin/check/createStopLocation",
        {
          stop_id: stopId,
          location_name: locationName,
          address: address,
          status: status,
          location: location,
          location_type: locationType,
        },
      );
      console.log(res.data);
      setNotice({ type: "success", title: "Thành công", message: "Thêm mới vị trí thành công" });
    } catch (error: any) {
      console.error(error);
      setNotice({ type: "error", title: "Thất bại", message: error.response?.data?.message || "Thêm mới vị trí thất bại" });
    }
  };

  useEffect(() => {
    getAllStops();
  }, []);

  const getAllStops = async () => {
    try {
      const res = await baseAPIAuth.get("/api/admin/check/getAllStops");
      console.log("Tất cả các điểm đi:", res.data);
      setStops(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#1f2937]">
      <section className="w-full">
        <div className="mx-auto w-full max-w-[1100px] space-y-6 px-4 pb-16 pt-10 lg:px-4">
          <div className="mb-6 flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex h-12 w-12 items-center justify-center rounded-[10px] border border-[#e1e5ec] !bg-white text-[#c2c8d2] transition duration-200 hover:!bg-white active:!bg-white hover:text-[#9aa3b1]"
              aria-label="Quay lai"
            >
              <ChevronLeft size={25} strokeWidth={2.3} />
            </button>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-[24px] font-black leading-[1.05] tracking-[-0.015em] text-[#111827]">
                    Thêm vị trí lên/xuống tỉnh thành
                  </h1>
                  <p className="mt-1 text-[13px] font-medium text-[#9aa2af]">
                    Cấu hình vị trí đón/trả khách cố định cho từng tỉnh thành
                  </p>
                </div>
              </div>
            </div>
          </div>

          <form className="mt-10 space-y-5 rounded-[20px] border border-[#e7eaf0] bg-white p-5 shadow-[0_16px_36px_-26px_rgba(15,23,42,0.34)]">
            <section className="space-y-4">
              <h2 className="text-lg font-black text-[#1f2430]">
                Thông tin vị trí
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Tỉnh thành
                  </span>
                  <div className="relative">
                    <select
                      value={stopId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setStopId(id);
                      }}
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    >
                      <option value="">Chọn điểm xuất phát</option>
                      {stops.map((stop) => (
                        <option key={stop._id} value={stop._id}>
                          {stop.province}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                    />
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Tên vị trí của tỉnh thành
                  </span>
                  <input
                    type="text"
                    value={locationName}
                    onChange={(event) => setLocationName(event.target.value)}
                    placeholder="Cây xăng Trường Đại học Bách Khoa"
                    className="h-11 w-full rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    required
                  />
                </label>
              </div>
            </section>

            <section className="space-y-2">
              <label className="space-y-1">
                <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                  Địa chỉ chi tiết
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="07 Tây Sơn, KV4, P.Quang Trung, TP.Quy Nhơn, Tỉnh Bình Định"
                    className="h-11 flex-1 rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                  />
                  <button
                    type="button"
                    onClick={() => getGeoLocation()}
                    className="h-11 whitespace-nowrap rounded-[8px] border border-[#d1d5db] bg-white px-4 text-xs font-semibold text-[#374151] hover:bg-[#f3f4f6]"
                  >
                    Lấy tọa độ vị trí
                  </button>
                </div>
              </label>
            </section>

            <section className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Loại vị trí
                  </span>
                  <div className="relative">
                    <select
                      value={locationType}
                      onChange={(event) =>
                        setLocationType(event.target.value as LocationType)
                      }
                      className="h-11 w-full appearance-none rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 pr-9 text-sm font-semibold text-[#374151] outline-none transition focus:border-[#9ca3af]"
                    >
                      <option value="PICKUP">Điểm đón</option>
                      <option value="DROPOFF">Điểm trả</option>
                      <option value="BOTH">Đón &amp; trả</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7280]"
                    />
                  </div>
                </label>

                <label className="space-y-1">
                  <span className="block text-[11px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">
                    Trạng thái
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatus((prev) => !prev)}
                    className="inline-flex h-11 w-full items-center justify-between rounded-[8px] border border-[#d1d5db] bg-[#f8fafc] px-3 text-sm font-semibold text-[#374151] transition"
                  >
                    <span>
                      {status ? "Đang sử dụng (true)" : "Không sử dụng (false)"}
                    </span>
                    <span
                      className={`inline-flex h-5 w-10 items-center rounded-full p-[2px] transition ${status ? "bg-green-500" : "bg-gray-300"}`}
                    >
                      <span
                        className={`h-4 w-4 rounded-full bg-white shadow transition-transform ${status ? "translate-x-5" : "translate-x-0"}`}
                      />
                    </span>
                  </button>
                </label>
              </div>
            </section>

            <div className="pt-4">
              <button
                type="button"
                onClick={createNewStopLocation}
                className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-5 py-3 text-sm font-black uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_-16px_rgba(216,113,28,0.95)] transition duration-200 hover:from-[#f8af4f] hover:to-[#ef8a31] hover:shadow-[0_16px_30px_-16px_rgba(216,113,28,1)]"
              >
                Thêm mới vị trí
              </button>
            </div>
          </form>
        </div>
      </section>

      {notice ? (
        <>
          <style>{`
          @keyframes routeNoticeIn {
            0% { opacity: 0; transform: translateY(10px) scale(0.95); }
            70% { transform: translateY(-2px) scale(1.02); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes routeNoticeIcon {
            0% { transform: scale(0.4) rotate(-25deg); opacity: 0; }
            55% { transform: scale(1.18) rotate(8deg); opacity: 1; }
            80% { transform: scale(0.95) rotate(-4deg); }
            100% { transform: scale(1) rotate(0); }
          }
          @keyframes routeNoticePulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.32); }
            100% { box-shadow: 0 0 0 16px rgba(16, 185, 129, 0); }
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