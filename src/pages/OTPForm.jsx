import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { IoMdHeart } from "react-icons/io";
import { RiShieldCheckLine, RiRefreshLine } from "react-icons/ri";
import { toast } from "react-toastify";
import { BASE_URL } from "../config/utils";
import Loader from "../shared/Loader/Loader";
import fullLogo from "../assets/images/full-logo.png";
import axios from "axios";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../redux/authSlice";

function OTPForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [email, setEmail] = useState("");
  const [expired, setExpired] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    // Get email from location state or localStorage
    const userEmail =
      location.state?.email || localStorage.getItem("2fa_email");
    if (userEmail) {
      setEmail(userEmail);
      localStorage.setItem("2fa_email", userEmail);
    } else {
      // Redirect to login if no email found
      navigate("/login");
    }

    // Get expiration time and initialize countdown
    const expiresAt =
      location.state?.expiresAt || localStorage.getItem("2fa_expiresAt");
    if (expiresAt) {
      const expireTime = new Date(expiresAt).getTime();
      const now = Date.now();
      const remainingTime = Math.max(0, Math.floor((expireTime - now) / 1000));

      if (remainingTime > 0) {
        setCountdown(remainingTime);
        setExpired(false);
      } else {
        setExpired(true);
        setCountdown(0);
      }
    }
  }, [location.state, navigate]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !expired) {
      // Check if we have an expiration time and it has passed
      const expiresAt =
        location.state?.expiresAt || localStorage.getItem("2fa_expiresAt");
      if (expiresAt) {
        const expireTime = new Date(expiresAt).getTime();
        const now = Date.now();
        if (now >= expireTime) {
          setExpired(true);
        }
      }
    }
    return () => clearTimeout(timer);
  }, [countdown, expired, location.state]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    const digit = value.replace(/\D/g, "");

    if (digit) {
      // Single digit input
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);

      // Auto focus next input
      if (index < 5) {
        inputRefs.current[index + 1]?.focus();
      } else {
        // Last digit entered, auto submit
        const otpString = newOtp.join("");
        if (otpString.length === 6 && !expired) {
          // Blur the last input to hide keyboard on mobile
          inputRefs.current[5]?.blur();
          // Auto submit after a short delay
          setTimeout(() => {
            handleSubmit(new Event("submit"), newOtp);
          }, 100);
        }
      }
    } else {
      // Clear current input
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];

      if (otp[index]) {
        // Clear current input
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = "";
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pastedData) {
      const newOtp = [...otp];
      pastedData.split("").forEach((digit, i) => {
        if (i < 6) {
          newOtp[i] = digit;
        }
      });
      setOtp(newOtp);

      // Focus on the last filled input or the 6th input
      const nextIndex = Math.min(pastedData.length, 5);
      inputRefs.current[nextIndex]?.focus();

      // Auto submit if 6 digits pasted
      if (pastedData.length === 6 && !expired) {
        setTimeout(() => {
          handleSubmit(new Event("submit"), newOtp);
        }, 100);
      }
    }
  };

  const handleSubmit = async (e, otpArray = otp) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const otpString = otpArray.join("");

    if (expired) {
      return toast.error(
        "Verification code has expired. Please resend a new code."
      );
    }
    if (otpString.length !== 6) {
      return toast.error("Please enter a valid 6-digit code");
    }

    if (isLoading) return; // Prevent double submission

    setIsLoading(true);
    try {
      const deviceId = localStorage.getItem("device_id");
      const res = await axios.post(
        `${BASE_URL}/auth/check-otp`,
        JSON.stringify({
          email: email,
          otp: otpString,
          deviceId,
        }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        dispatch(loginSuccess(result.data));
        // Clear temporary data
        localStorage.removeItem("2fa_email");
        localStorage.removeItem("2fa_expiresAt");

        toast.success(result.message);
        setTimeout(() => {
          window.location.href = "/";
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid verification code");
      // Clear OTP on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setIsResending(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/resend-otp`,
        JSON.stringify({ email: email }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        // Update expiration time and reset countdown
        if (result.expiresAt) {
          localStorage.setItem("2fa_expiresAt", result.expiresAt);
          const expireTime = new Date(result.expiresAt).getTime();
          const now = Date.now();
          const remainingTime = Math.max(
            0,
            Math.floor((expireTime - now) / 1000)
          );
          setCountdown(remainingTime);
          setExpired(false);
        } else {
          setCountdown(60); // 60 seconds cooldown fallback
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="main-wrapper form-wrapper login-wrapper">
      <div className="form-container " style={{ margin: 0 }}>
        <div className="form-content login-form-content">
          <div className="form-header">
            <Link to={"/"}>
              <img src={fullLogo} alt="logo"></img>
            </Link>
            <h4>Two-Factor Authentication</h4>
            <p>Enter the 6-digit code sent to your email to continue.</p>
          </div>
          <div className="card mb-6 bg-card-bg-color">
            <div className="px-10 ">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#7269ef]/10 flex items-center justify-center">
                  <RiShieldCheckLine className="text-3xl text-[#7269ef]" />
                </div>
                <p className="text-sm text-secondary-color">
                  We sent a verification code to
                </p>
                <p className="text-sm font-medium text-body-color">{email}</p>
                <p
                  className={`text-xs mt-1 ${
                    expired ? "text-red-500" : "text-secondary-color"
                  }`}
                >
                  {expired ? (
                    "Code expired. Please resend a new code."
                  ) : countdown > 0 ? (
                    <>
                      Code expires in{" "}
                      <span className="font-semibold text-body-color">
                        {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                        {String(countdown % 60).padStart(2, "0")}
                      </span>
                    </>
                  ) : (
                    "Code is ready for verification"
                  )}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-6">
                  <div className="block text-center mb-4">
                    <label className="text-sm font-medium">
                      Verification Code
                    </label>
                  </div>
                  <div className="flex justify-center gap-2 mb-4">
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        onFocus={(e) => e.target.select()}
                        onPaste={(e) => handlePaste(e)}
                        className="w-12 h-14 text-center text-2xl font-mono border border-border-color rounded-lg bg-input-bg-color text-heading-color focus:border-[#7269ef] focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        autoComplete="off"
                        disabled={expired || isLoading}
                      />
                    ))}
                  </div>

                  <div className="text-center mb-4">
                    <p className="text-sm text-secondary-color">
                      Didn't receive the code?{" "}
                      {countdown > 0 ? (
                        <span className="text-body-color font-medium">
                          Resend in{" "}
                          {String(Math.floor(countdown / 60)).padStart(2, "0")}:
                          {String(countdown % 60).padStart(2, "0")}
                        </span>
                      ) : (
                        <span
                          onClick={handleResendOTP}
                          className={`text-[#7269ef] font-medium underline cursor-pointer hover:text-[#6159cb] ${
                            isResending ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          {isResending ? "Sending..." : "Resend"}
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="w-full h-auto">
                    <button
                      type="submit"
                      disabled={
                        otp.join("").length !== 6 || isLoading || expired
                      }
                    >
                      {isLoading ? (
                        <Loader />
                      ) : expired ? (
                        "Code Expired"
                      ) : (
                        "Verify Code"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
          <div className="text-footer" style={{ margin: 0 }}>
            <p style={{ margin: 0 }}>
              © 2025 Chatvia. Crafted with
              <i className="inline-block text-[#ef476f]">
                <IoMdHeart />
              </i>
              by Themesbrand
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OTPForm;
