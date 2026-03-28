import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from "firebase/auth";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Toaster, toast } from "react-hot-toast";
import { auth } from "../../util/firebase";

/* =====================
   Extend window (TS)
===================== */
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const BustripRegister = () => {
  const [fullName, setFullName] = useState<string>("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const url = import.meta.env.VITE_API_URL
  /* =====================
       SETUP CAPTCHA
    ===================== */
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        { size: "invisible" }
      );
    }
  };

  /* =====================
       SEND OTP
    ===================== */
  const checkPhoneExists = async (phone: string): Promise<boolean> => {
    try {
      const res = await fetch(
        `${url}/api/customer/notcheck/check-phone`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ phone }),
        }
      );

      if (!res.ok) {
        throw new Error("Check phone failed");
      }

      const data: { exists: boolean } = await res.json();
      return data.exists;
    } catch (error) {
      console.error("checkPhoneExists error:", error);
      throw error;
    }
  };

  const sendOTP = async () => {
    if (!phone) {
      toast.error("Vui lòng nhập số điện thoại");
      return;
    }
    const exists = await checkPhoneExists(phone);

    if (exists) {
      toast.error("Số điện thoại đã được đăng ký");
      setLoading(false);
      return;
    }
    setLoading(true);
    setupRecaptcha();

    try {
      const confirmation = await signInWithPhoneNumber(
        auth,
        "+" + phone,
        window.recaptchaVerifier!
      );

      window.confirmationResult = confirmation;
      setShowOTP(true);
      toast.success("Đã gửi mã OTP");
    } catch (err) {
      console.error(err);
      toast.error("Gửi OTP thất bại");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
       VERIFY OTP
    ===================== */
  const verifyOTP = async () => {
    if (!otp) {
      toast.error("Vui lòng nhập OTP");
      return;
    }

    setLoading(true);
    try {
      await window.confirmationResult!.confirm(otp);
      setIsPhoneVerified(true);
      setShowOTP(false);
      toast.success("Xác thực số điện thoại thành công");
    } catch (err) {
      console.log("lỗi chương trình trên là : ", err);
      toast.error("OTP không đúng");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
       REGISTER
    ===================== */
  const navigate = useNavigate();
  const handleRegister = async () => {
    // 🔐 BẮT BUỘC OTP ĐÃ VERIFY
    if (!isPhoneVerified) {
      toast.error("Vui lòng xác thực số điện thoại");
      return;
    }

    if (!fullName.trim()) {
      toast.error("Vui lòng nhập họ tên");
      return;
    }

    if (password.length < 8) {
      toast.error("Mật khẩu phải từ 8 ký tự");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp");
      return;
    }

    try {
      const payload = {
        name: fullName.trim(),
        phone: phone, // đã được OTP verify
        password: password,
        confirmPassword: confirmPassword,
      };

      console.log("📦 Sending register payload:", payload);

      const res = await fetch(
        `${url} / api / customer / notcheck / register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Đăng ký thất bại");
        return;
      }

      toast.success("Đăng ký thành công 🎉");

      // 👉 OPTIONAL: redirect login
      navigate("/login");
    } catch (error) {
      console.error("Register error:", error);
      toast.error("Không thể kết nối server");
    }
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden text-[#2e1f16]">
      {/* ===== Background ===== */}
      <img
        src="/images/bg4.png"
        alt="Background"
        className="absolute inset-0 h-full w-full object-cover object-[72%_center]"
      />
      <div className="absolute inset-0 bg-white/40"></div>

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
      <Toaster />
      <div id="recaptcha-container" />

      {/* ===== Layout 2 cột (responsive) ===== */}
      <div className="relative z-20 grid py-20 grid-cols-1 lg:grid-cols-2">
        {/* ================= LEFT - FORM ================= */}
        <div className="flex items-center justify-center lg:justify-end px-6 sm:px-12 lg:px-20 mt-8 lg:mt-16">
          <div className="w-full max-w-[560px] rounded-3xl border border-[#f2e5d8] bg-white/95 p-6 sm:p-8 md:p-10 lg:p-12 shadow-[0_30px_60px_-25px_rgba(181,98,27,0.6)] backdrop-blur">
            <div className="mb-6 sm:mb-8 text-center">
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#2f2118]">
                Đăng ký{" "}
                <span className="bg-gradient-to-r from-[#f7a53a] to-[#e8791c] bg-clip-text text-transparent">
                  CoachTrip
                </span>
              </h1>
              <p className="text-sm text-[#7c5f4a]">
                Tạo tài khoản để bắt đầu hành trình
              </p>
            </div>

            {/* PHONE */}
            <div className="mb-4 space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460]">
                Số điện thoại
              </label>

              <div className="flex gap-2">
                <div className="flex-1 rounded-lg border border-[#e6d5c3] bg-[#fffdfb] p-1 focus-within:ring-2 focus-within:ring-[#f39a32]/20">
                  <PhoneInput
                    country={"vn"}
                    value={phone}
                    onChange={setPhone}
                    inputClass="!w-full !h-[44px] !bg-transparent !border-0"
                    buttonClass="!border-0"
                  />
                </div>

                {!isPhoneVerified && (
                  <button
                    onClick={sendOTP}
                    disabled={loading}
                    className="px-4 h-[44px] rounded-lg bg-gradient-to-r from-[#f7a53a] to-[#e8791c] 
    text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 
    flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Đang gửi
                      </>
                    ) : (
                      "OTP"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* OTP */}
            {showOTP && (
              <div className="mb-4 flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="flex-1 rounded-lg border border-[#e6d5c3] px-4 py-2.5 focus:ring-2 focus:ring-[#f39a32]/20"
                />

                <button
                  onClick={verifyOTP}
                  disabled={loading}
                  className="px-4 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600"
                >
                  Xác nhận
                </button>
              </div>
            )}

            {isPhoneVerified && (
              <p className="text-green-600 text-sm mb-4 font-medium">
                ✔ Số điện thoại đã xác thực
              </p>
            )}

            {/* FULLNAME */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2">
                Họ và tên
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Văn A"
                className="w-full rounded-lg border border-[#e6d5c3] px-4 py-2.5 focus:ring-2 focus:ring-[#f39a32]/20"
              />
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2">
                Mật khẩu
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Ít nhất 8 ký tự"
                className="w-full rounded-lg border border-[#e6d5c3] px-4 py-2.5 focus:ring-2 focus:ring-[#f39a32]/20"
              />
            </div>

            {/* CONFIRM */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#b58460] mb-2">
                Nhập lại mật khẩu
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Xác nhận mật khẩu"
                className="w-full rounded-lg border border-[#e6d5c3] px-4 py-2.5 focus:ring-2 focus:ring-[#f39a32]/20"
              />
            </div>

            {/* REGISTER BUTTON */}
            <button
              onClick={handleRegister}
              className="w-full rounded-xl bg-gradient-to-r from-[#f7a53a] to-[#e8791c] py-2.5 text-sm font-bold text-white shadow-[0_18px_30px_-14px_rgba(216,113,28,0.9)] hover:opacity-90"
            >
              Đăng ký
            </button>

            <p className="mt-6 text-center text-sm text-[#6b4b39]">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="font-bold text-[#e8791c] hover:underline"
              >
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BustripRegister;
