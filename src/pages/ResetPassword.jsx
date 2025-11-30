import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  RiLock2Line,
  RiUser2Line,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import { IoMdHeart } from "react-icons/io";
import { toast } from "react-toastify";
import axios from "axios";

import { BASE_URL } from "../config/utils";
import fullLogo from "../assets/images/full-logo.png";
import Loader from "../shared/Loader/Loader";

function ResetPassword() {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [info, setInfo] = useState({
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleConfirmBlur = () => {
    if (info.confirmPassword && info.newPassword !== info.confirmPassword) {
      setError("Passwords do not match");
    } else {
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (error) return;
    setIsLoading(true);
    try {
      const res = await axios.post(`${BASE_URL}/user/reset-password`, info, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        navigate("/");
        return toast.success(result.message);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
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
            <h4>Reset Password</h4>
            <p>Reset password to continue to Chatvia.</p>
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
                        <RiUser2Line />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      id="email"
                      type="email"
                      placeholder="Enter email"
                      required
                    ></input>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="block text-left mb-2">
                    <label>New Password</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiUser2Line />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      onBlur={handleConfirmBlur}
                      id="newPassword"
                      type={`${showNewPassword ? "text" : "password"}`}
                      placeholder="Enter new password"
                      required
                    ></input>
                    <i
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      className="icon-eye"
                    >
                      {showNewPassword ? <RiEyeLine /> : <RiEyeOffLine />}
                    </i>
                  </div>
                  {error && <div className="invalid-value">{error}</div>}
                </div>
                <div className="mb-6">
                  <div className="flex items-center mb-2">
                    <label>Confirm Password</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiLock2Line />
                      </i>
                    </span>
                    <input
                      onBlur={handleConfirmBlur}
                      onChange={handleChange}
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Enter confirm password"
                      required
                    ></input>
                    <i
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="icon-eye"
                    >
                      {showConfirmPassword ? <RiEyeLine /> : <RiEyeOffLine />}
                    </i>
                  </div>
                  {error && <div className="invalid-value">{error}</div>}
                </div>
                <div className="form-check">
                  <input type="checkbox" id="remember-checkbox"></input>
                  <label htmlFor="remember-checkbox">Remember me</label>
                </div>
                <div className="w-full h-auto">
                  <button type="submit">
                    {isLoading ? <Loader /> : "Reset"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="text-footer" style={{ margin: 0 }}>
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

export default ResetPassword;
