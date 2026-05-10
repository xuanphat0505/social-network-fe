import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiMailLine,
  RiLock2Line,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { IoMdHeart } from "react-icons/io";
import axios from "axios";

import { loginStart, loginSuccess, loginFailed } from "../redux/authSlice";
import { toast } from "react-toastify";
import { BASE_URL } from "../config/utils";
import Loader from "../shared/Loader/Loader";
import fullLogo from "../assets/images/full-logo.png";

function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [useInfo, setUserInfo] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const remembered = localStorage.getItem("remember_me") === "1";
    const rememberedEmail = localStorage.getItem("remember_email") || "";
    if (remembered) {
      setRememberMe(true);
      setUserInfo((prev) => ({ ...prev, email: rememberedEmail }));
    }
  }, []);
  const handleChange = (e) => {
    setUserInfo((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    setIsLoading(true);
    try {
      // persistent deviceId (generate once and reuse)
      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        deviceId =
          Math.random().toString(36).slice(2) + Date.now().toString(36);
        localStorage.setItem("device_id", deviceId);
      }

      const res = await axios.post(
        `${BASE_URL}/auth/login`,
        JSON.stringify({ ...useInfo, deviceId }),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        if (result.requires2FA) {
          // store minimal context so OTP page can function
          localStorage.setItem("temp_password", useInfo.password);
          localStorage.setItem("2fa_email", useInfo.email);
          if (result.expiresAt) {
            localStorage.setItem("2fa_expiresAt", result.expiresAt);
          }
          navigate("/otp-form", {
            state: {
              email: useInfo.email,
              expiresAt: result.expiresAt,
            },
          });
        } else {
          dispatch(loginSuccess(result.data));
          // Remember me: store email only
          if (rememberMe) {
            localStorage.setItem("remember_me", "1");
            localStorage.setItem("remember_email", useInfo.email);
          } else {
            localStorage.removeItem("remember_me");
            localStorage.removeItem("remember_email");
          }
          toast.success(result.message);
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        }
      }
    } catch (error) {
      dispatch(loginFailed());
      return toast.error(error.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper form-wrapper login-wrapper">
      <div className="form-container" style={{ margin: 0 }}>
        <div className="form-content login-form-content">
          <div className="form-header">
            <Link to={"/"}>
              <img src={fullLogo} alt="logo"></img>
            </Link>
            <h4>Sign in</h4>
            <p>Sign in to continue to Chatvia.</p>
          </div>
          <div className="card mb-6 bg-card-bg-color">
            <div className="px-10">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="block text-left mb-2">
                    <label>Email</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiMailLine />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      id="email"
                      type="email"
                      value={useInfo.email}
                      placeholder="Enter email"
                    ></input>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label>Password</label>
                    <Link
                      to={"/forget-password"}
                      className="text-secondary-color text-[13px] hover:underline"
                      style={{ margin: 0 }}
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiLock2Line />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      id="password"
                      type={`${showPassword ? "text" : "password"}`}
                      value={useInfo.password}
                      placeholder="Enter password"
                    ></input>
                    <i
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="icon-eye"
                    >
                      {showPassword ? <RiEyeLine /> : <RiEyeOffLine />}
                    </i>
                  </div>
                </div>
                <div className="form-check">
                  <input
                    type="checkbox"
                    id="remember-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  ></input>
                  <label htmlFor="remember-checkbox">Remember me</label>
                </div>
                <div className="w-full h-auto">
                  <button type="submit">
                    {isLoading ? <Loader /> : "Sign in"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="text-footer">
            <p>
              Don't have an account? <Link to={"/register"}>Sign up</Link>
            </p>
            <p>
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

export default Login;
