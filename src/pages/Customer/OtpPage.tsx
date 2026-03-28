import { useState } from "react";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { auth } from "../../util/firebase";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import OtpInput from "otp-input-react";
import { Toaster, toast } from "react-hot-toast";

import { BsFillShieldLockFill, BsTelephoneFill } from "react-icons/bs";
import { CgSpinner } from "react-icons/cg";

/* =====================
   Extend Window for TS
===================== */
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

const PhoneLogin: React.FC = () => {
  const [otp, setOtp] = useState<string>("");
  const [ph, setPh] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const onCaptchVerify = (): void => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            onSignup();
          },
          "expired-callback": () => {},
        }
      );
    }
  };

  const onSignup = async (): Promise<void> => {
    setLoading(true);
    onCaptchVerify();

    try {
      const appVerifier = window.recaptchaVerifier!;
      const formatPh = "+" + ph;

      const confirmation = await signInWithPhoneNumber(
        auth,
        formatPh,
        appVerifier
      );

      window.confirmationResult = confirmation;
      setShowOTP(true);
      toast.success("OTP sent successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const onOTPVerify = async (): Promise<void> => {
    setLoading(true);

    try {
      const res = await window.confirmationResult!.confirm(otp);
      setUser(res.user);
      toast.success("Login successful!");
    } catch (err) {
      console.error(err);
      toast.error("Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen flex items-center justify-center bg-emerald-500 p-4">
      <div>
        <Toaster toastOptions={{ duration: 4000 }} />
        <div id="recaptcha-container"></div>

        {user ? (
          <div className="w-full max-w-md mx-auto">
            <h2 className="text-center text-white font-medium text-2xl">
              👍 Login Success
            </h2>
          </div>
        ) : (
          <div
            className="w-full max-w-md mx-auto bg-gradient-to-br from-emerald-600 to-emerald-500
                                   rounded-lg p-6 sm:p-8 shadow-xl text-white
                                   flex flex-col gap-6"
          >
            <div className="text-center">
              <h1 className="leading-tight text-white font-semibold text-2xl sm:text-3xl">
                Welcome to
              </h1>
              <p className="mt-1 text-sm sm:text-base text-emerald-100">
                CODE A PROGRAM
              </p>
            </div>

            {showOTP ? (
              <div className="flex flex-col gap-4">
                <div className="bg-white text-emerald-500 w-16 h-16 mx-auto p-3 rounded-full flex items-center justify-center">
                  <BsFillShieldLockFill size={24} />
                </div>

                <label className="font-bold text-lg text-white text-center">
                  Enter your OTP
                </label>

                <div className="mx-auto">
                  <OtpInput
                    value={otp}
                    onChange={setOtp}
                    OTPLength={6}
                    otpType="number"
                    autoFocus
                    className="opt-container"
                  />
                </div>

                <button
                  onClick={onOTPVerify}
                  className="bg-emerald-700 w-full flex gap-2 items-center justify-center py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-60"
                >
                  {loading && (
                    <CgSpinner size={20} className="mt-1 animate-spin" />
                  )}
                  <span>Verify OTP</span>
                </button>

                <div className="text-center text-emerald-100 text-sm">
                  Didn't receive code?{" "}
                  <button
                    onClick={() => {
                      setShowOTP(false);
                      setOtp("");
                    }}
                    className="underline font-medium"
                  >
                    Change number
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="bg-white text-emerald-500 w-16 h-16 mx-auto p-3 rounded-full flex items-center justify-center">
                  <BsTelephoneFill size={24} />
                </div>

                <label className="font-bold text-lg text-white text-center">
                  Verify your phone number
                </label>

                <div className="w-full">
                  <PhoneInput
                    country={"vn"}
                    value={ph}
                    onChange={(value) => setPh(value)}
                    containerClass="w-full"
                    inputClass="!w-full !h-[44px] !rounded-md"
                  />
                </div>

                <button
                  onClick={onSignup}
                  className="bg-emerald-700 w-full flex gap-2 items-center justify-center py-2.5 rounded-lg text-white font-semibold transition disabled:opacity-60"
                >
                  {loading && (
                    <CgSpinner size={20} className="mt-1 animate-spin" />
                  )}
                  <span>Send code via SMS</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default PhoneLogin;
