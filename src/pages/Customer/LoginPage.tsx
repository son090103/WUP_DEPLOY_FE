import { useState } from "react";
import PhoneInput from "react-phone-input-2";
import { Link, useNavigate } from "react-router-dom";
import { loginSuccess } from "../../store/slices/userSlice";
import { useDispatch } from "react-redux";
import { CircleCheck, TriangleAlert } from "lucide-react";
interface NoticeState {
  type: "success" | "error";
  title: string;
  message: string;
}

const BustripLogin = () => {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const url = import.meta.env.VITE_API_URL;

  const handleLogin = async (): Promise<void> => {
    if (!phone || !password) {
      setNotice({ type: "error", title: "Thất bại", message: "Đăng nhập thất bại. Vui lòng nhập đầy đủ thông tin" });
      return;
    }

    setLoading(true);

    try {
      // FORMAT PHONE: +84xxxxxxxxx
      const payload = {
        phone: phone.replace(/^\+/, ""), // xoá dấu + nếu có
        password: password,
      };

      const response = await fetch(
        `${url}/api/customer/notcheck/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      // ❌ HTTP status không phải 2xx
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Đăng nhập thất bại");
      }

      // ✅ Parse JSON
      const data: {
        token: string;
      } = await response.json();

      const { token } = data;
      // 💾 LƯU LOCALSTORAGE
      localStorage.setItem("accessToken", token);
      setNotice({ type: "success", title: "Thành công", message: "Đăng nhập thành công" }); setTimeout(() => { navigate("/"); }, 1500);
      const ResponseProfile = await fetch(
        `${url}/api/common/check/getprofile`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ⭐ QUAN TRỌNG
          },
        }
      );

      const dataProfile = await ResponseProfile.json();

      if (!ResponseProfile.ok) {
        throw new Error(dataProfile.message || "Profile fail");
      }

      // ✅ Chỉ lưu trạng thái đăng nhập (KHÔNG token)
      dispatch(
        loginSuccess({
          _id: dataProfile.data.id,
          name: dataProfile.data.name,
          phone: dataProfile.data.phone,
          avatar: dataProfile.data.avatar,
          role_id: dataProfile.data.role,
        })
      );
      console.log("data profile là : ", dataProfile)
      const roleName = dataProfile.data.role?.name;


      setTimeout(() => {
        if (roleName === "RECEPTIONIST") {
          navigate("/letan");
        } else if (roleName === "ADMIN") {
          navigate("/admin/manage-revenue");
        } else if (roleName === "DRIVER") {
          navigate("/loginCamera");
        } else if (roleName === "BUS_ASSISTANT") {
          navigate("/verifi");
        } else {
          navigate("/"); // CUSTOMER
        }
      }, 1500);

      // navigate("/home");

      // // 🔁 CHUYỂN TRANG
      // navigate("/");
    } catch (error: any) {
      console.error(error);
      setNotice({
        type: "error",
        title: "Đăng nhập thất bại",
        message: error.response?.data?.message || "Sai số điện thoại hoặc mật khẩu"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-[#2e1f16]">
      {/* ===== Background Image ===== */}
      <img
        src="/images/bg4.png"
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover object-[80%_center]"
        style={{ maxHeight: 1200 }}
      />
      <div className="absolute inset-0 bg-white/40" />

      {/* ===== Overlay chỉ phủ bên trái - ẩn trên màn nhỏ để tránh đẩy lệch ===== */}
      <div className="hidden md:block absolute left-0 top-0 h-full w-[50%] bg-gradient-to-r from-white/95 via-white/85 to-transparent" />

      {/* ===== Bus bên phải với hiệu ứng animated - chỉ hiện từ md trở lên ===== */}
      <div className="pointer-events-none absolute top-[53%] -translate-y-1/2 right-0 w-1/2 max-w-[820px] z-10 hidden md:block">
        {/* Cloud overlay */}
        <div className="login-bus-aero-overlay absolute inset-[-16%] z-0">
          <span className="login-bus-cloud login-bus-cloud-1 absolute left-[-10%] top-[-10%] h-[28%] w-[68%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.74)_0%,rgba(255,255,255,0.25)_54%,rgba(255,255,255,0)_100%)] blur-[30px]" />
          <span className="login-bus-cloud login-bus-cloud-2 absolute left-[-20%] top-[28%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.66)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
          <span className="login-bus-cloud login-bus-cloud-3 absolute right-[-16%] top-[34%] h-[26%] w-[42%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.18)_54%,rgba(255,255,255,0)_100%)] blur-[24px]" />
          <span className="login-bus-cloud login-bus-cloud-4 absolute left-[-16%] top-[66%] h-[30%] w-[58%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0.24)_54%,rgba(255,255,255,0)_100%)] blur-[28px]" />
          <span className="login-bus-cloud login-bus-cloud-5 absolute right-[-4%] top-[70%] h-[28%] w-[54%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.64)_0%,rgba(255,255,255,0.2)_54%,rgba(255,255,255,0)_100%)] blur-[26px]" />
        </div>

        {/* Trail clouds */}
        <div className="login-bus-aero-trail absolute right-[-14%] top-[30%] z-0 h-[54%] w-[46%]">
          <span className="login-bus-tail-cloud login-bus-tail-1 absolute right-[10%] top-[14%] h-[42%] w-[34%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0.48)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
          <span className="login-bus-tail-cloud login-bus-tail-2 absolute right-[28%] top-[28%] h-[38%] w-[32%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.84)_0%,rgba(255,255,255,0.4)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
          <span className="login-bus-tail-cloud login-bus-tail-3 absolute right-[12%] top-[50%] h-[34%] w-[30%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.8)_0%,rgba(255,255,255,0.36)_54%,rgba(255,255,255,0)_100%)] blur-[10px]" />
          <span className="login-bus-tail-cloud login-bus-tail-4 absolute right-[38%] top-[20%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.32)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
          <span className="login-bus-tail-cloud login-bus-tail-5 absolute right-[24%] top-[44%] h-[26%] w-[24%] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(255,255,255,0.38)_54%,rgba(255,255,255,0)_100%)] blur-[8px]" />
        </div>

        {/* Bus with bob animation */}
        <div className="login-bus-bob relative z-10">
          <img
            src="/images/bus7.png"
            alt="Bus"
            className="w-full object-contain"
            style={{
              filter:
                "drop-shadow(0 24px 28px rgba(15,23,42,0.28)) drop-shadow(0 0 22px rgba(255,255,255,0.5))",
            }}
          />

          {/* Passengers */}
          <div className="pointer-events-none absolute inset-0">
            <div className="login-bus-front-passenger">
              <img
                src="/images/loxe1.png"
                alt="Front passenger"
                className="login-bus-front-passenger-img"
              />
            </div>
            <div className="login-bus-driver">
              <img
                src="/images/1me1.png"
                alt="Driver"
                className="login-bus-driver-img"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bus animations */}
      <style>{`
                .login-bus-bob {
                    animation: login-bus-bob 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
                    transform-origin: 56% 74%;
                    will-change: transform;
                }
                .login-bus-aero-overlay {
                    transform: rotate(12deg);
                    transform-origin: 22% 50%;
                }
                .login-bus-cloud {
                    animation: login-cloud-drift 1.75s ease-out infinite;
                    will-change: transform, opacity;
                }
                .login-bus-cloud-1 { animation-delay: 0.06s; animation-duration: 1.95s; }
                .login-bus-cloud-2 { animation-delay: 0.26s; animation-duration: 1.55s; }
                .login-bus-cloud-3 { animation-delay: 0.42s; animation-duration: 1.58s; }
                .login-bus-cloud-4 { animation-delay: 0.62s; animation-duration: 1.84s; }
                .login-bus-cloud-5 { animation-delay: 0.78s; animation-duration: 1.72s; }
                .login-bus-aero-trail {
                    transform: rotate(12deg);
                    transform-origin: 22% 50%;
                }
                .login-bus-tail-cloud {
                    animation: login-trail-drift 1.55s ease-out infinite;
                    will-change: transform, opacity;
                }
                .login-bus-tail-1 { animation-delay: 0.06s; }
                .login-bus-tail-2 { animation-delay: 0.32s; }
                .login-bus-tail-3 { animation-delay: 0.54s; }
                .login-bus-tail-4 { animation-delay: 0.76s; }
                .login-bus-tail-5 { animation-delay: 0.22s; animation-duration: 1.45s; }

                .login-bus-driver {
                    position: absolute;
                    left: 26.3%; top: 30.7%; width: 11.6%; height: 15.8%;
                    overflow: hidden;
                    clip-path: polygon(8% 1%, 96% 5%, 100% 95%, 22% 98%, 2% 56%);
                    transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg);
                    transform-origin: 54% 50%;
                    animation: login-driver-settle 1.9s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
                    will-change: transform;
                }
                .login-bus-driver-img {
                    position: absolute;
                    left: -2%; top: 3%; width: 95%; height: 112%;
                    object-fit: cover; object-position: center 8%;
                    filter: saturate(0.82) contrast(1.08) brightness(0.9);
                    opacity: 0.95;
                    transform: scaleX(-1) rotate(5deg);
                    animation: login-driver-idle 1.65s ease-in-out infinite;
                    will-change: transform; z-index: 1;
                }
                .login-bus-front-passenger {
                    position: absolute;
                    left: 48.4%; top: 26.2%; width: 11.6%; height: 15.6%;
                    overflow: hidden;
                    clip-path: polygon(18% 2%, 94% 6%, 98% 95%, 10% 97%, 4% 52%);
                    transform: perspective(760px) rotateY(14deg) rotate(0.7deg);
                    transform-origin: 50% 50%;
                    animation: login-driver-settle 2s cubic-bezier(0.36, 0.06, 0.29, 0.97) infinite;
                    will-change: transform; z-index: 1;
                }
                .login-bus-front-passenger-img {
                    position: absolute;
                    left: 2%; top: 3%; width: 130%; height: 166%;
                    object-fit: cover; object-position: center 10%;
                    filter: saturate(0.8) contrast(1.05) brightness(0.88);
                    opacity: 0.93;
                    transform: scaleX(-1) rotate(-2deg);
                    animation: login-passenger-idle 1.8s ease-in-out infinite;
                    will-change: transform;
                }

                @keyframes login-bus-bob {
                    0%, 100% { transform: translateY(0) rotate(-0.35deg); }
                    32% { transform: translateY(-4px) rotate(0.12deg); }
                    62% { transform: translateY(-8px) rotate(0.24deg); }
                    82% { transform: translateY(2px) rotate(-0.16deg); }
                }
                @keyframes login-cloud-drift {
                    0% { opacity: 0.2; transform: translateX(-18px) scale(0.84); }
                    36% { opacity: 0.76; }
                    100% { opacity: 0; transform: translateX(172px) scale(1.3); }
                }
                @keyframes login-trail-drift {
                    0% { opacity: 0.62; transform: translateX(-6px) scale(0.78); }
                    34% { opacity: 0.96; }
                    100% { opacity: 0; transform: translateX(92px) scale(1.22); }
                }
                @keyframes login-driver-settle {
                    0%, 100% { transform: perspective(760px) rotateY(-12deg) rotate(-0.55deg) translateY(0); }
                    34% { transform: perspective(760px) rotateY(-12deg) rotate(-0.4deg) translateY(-1px); }
                    68% { transform: perspective(760px) rotateY(-12deg) rotate(-0.75deg) translateY(1px); }
                }
                @keyframes login-driver-idle {
                    0%, 100% { transform: scaleX(-1) rotate(5deg) translateY(0); }
                    28% { transform: scaleX(-1) rotate(4.1deg) translateY(-1px); }
                    62% { transform: scaleX(-1) rotate(5.9deg) translateY(1px); }
                    82% { transform: scaleX(-1) rotate(4.6deg) translateY(0); }
                }
                @keyframes login-passenger-idle {
                    0%, 100% { transform: scaleX(-1) rotate(-2deg) translateY(0); }
                    34% { transform: scaleX(-1) rotate(-1.3deg) translateY(-1px); }
                    72% { transform: scaleX(-1) rotate(-2.6deg) translateY(1px); }
                }

                @media (prefers-reduced-motion: reduce) {
                    .login-bus-bob, .login-bus-cloud, .login-bus-tail-cloud,
                    .login-bus-driver, .login-bus-driver-img,
                    .login-bus-front-passenger, .login-bus-front-passenger-img {
                        animation: none !important;
                        opacity: 1 !important;
                        transform: none !important;
                    }
                }
            `}</style>

      {/* ===== Form Container - responsive: center on small, right on md+ ===== */}
      <div className="relative z-20 flex min-h-screen w-full md:w-1/2 items-center justify-center md:justify-end px-4 sm:px-6 lg:px-20">
        <div className="w-full max-w-[560px] rounded-3xl border border-[#f2e5d8] bg-white/95 p-6 sm:p-8 md:p-12 shadow-[0_30px_60px_-25px_rgba(181,98,27,0.6)] backdrop-blur box-border">
          {/* Title - Giữ nguyên nhưng thêm text-center để đối xứng nội bộ */}
          <div className="mb-6 sm:mb-8 space-y-2 text-center">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2f2118]">
              Trở lại với{" "}
              <span className="bg-gradient-to-r from-[#f7a53a] to-[#e8791c] bg-clip-text text-transparent">
                CoachTrip
              </span>
            </h1>
            <p className="text-sm text-[#7c5f4a]">
              Đăng nhập để tiếp tục hành trình của bạn
            </p>
          </div>

          {/* Phone */}
          <div className="mb-4 sm:mb-5 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460]">
              Số điện thoại
            </label>

            <div className="rounded-lg border border-[#e6d5c3] bg-[#fffdfb] p-1 focus-within:border-[#f39a32] focus-within:ring-2 focus-within:ring-[#f39a32]/20">
              <PhoneInput
                country={"vn"}
                value={phone}
                onChange={setPhone}
                inputClass="!w-full !h-[44px] !bg-transparent !border-0 !text-[#4a3426] !font-semibold"
                buttonClass="!bg-transparent !border-0"
                containerClass="!bg-transparent"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-3 space-y-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460]">
              Mật khẩu
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ít nhất 8 ký tự"
              className="w-full rounded-lg border border-[#e6d5c3] bg-[#fffdfb] px-4 py-3 text-sm font-semibold text-[#4a3426] outline-none transition focus:border-[#f39a32] focus:ring-2 focus:ring-[#f39a32]/20"
            />
          </div>

          {/* Forgot - Text center để đối xứng */}
          <div className="mb-5 text-center">
            <Link
              to="/forgot"
              className="text-sm font-semibold text-[#e8791c] hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] px-6 py-3 text-sm sm:py-3.5 font-bold text-white shadow-[0_18px_30px_-14px_rgba(216,113,28,0.9)] transition hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>

          {/* Register - Text center */}
          <p className="mt-5 sm:mt-6 text-center text-sm text-[#6b4b39]">
            Bạn chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="font-bold text-[#e8791c] hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
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
};

export default BustripLogin;
