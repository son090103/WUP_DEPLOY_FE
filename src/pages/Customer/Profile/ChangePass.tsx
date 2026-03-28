import { useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, TriangleAlert } from "lucide-react";
import baseAPIAuth from "../../../api/auth";

interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

const BustripChangePassword: React.FC = () => {
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmNewPass, setConfirmNewPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  const changePass = async () => {
    setLoading(true);
    try {
      const res = await baseAPIAuth.put("/api/customer/check/changPassword",
        {
          oldPass: oldPass,
          newPass: newPass,
          confirmNewPass: confirmNewPass
        });
      setNotice({
        type: "success",
        title: "Đổi mật khẩu thành công",
        message: res.data?.message || "Thông tin đã được lưu.",
      });
    } catch (error: any) {
      setNotice({
        type: "error",
        title: "Đổi mật khẩu thất bại",
        message:
          error.response?.data?.message ||
          "Đã có lỗi xảy ra, vui lòng thử lại.",
      });
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="flex items-center justify-center px-4 py-8">

      <div className="w-full max-w-md bg-white rounded-3xl shadow-lg p-8">

        <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
          Đổi <span className="text-orange-500">Mật Khẩu</span>
        </h1>

        <form className="space-y-5">

          {/* Old Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu cũ
            </label>
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu mới
            </label>
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận mật khẩu mới
            </label>
            <input
              type="password"
              value={confirmNewPass}
              onChange={(e) => setConfirmNewPass(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none"
            />
          </div>

          <button
            type="button"
            onClick={changePass}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg shadow-md transition disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Xác Nhận Đổi Mật Khẩu"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Quay lại{" "}
          <Link to="/user/profile" className="text-orange-500 hover:underline font-medium">
            Trang cá nhân
          </Link>
        </p>
      </div>

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
                  <h3 className="text-base font-semibold text-[#111827]">
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
};

export default BustripChangePassword;