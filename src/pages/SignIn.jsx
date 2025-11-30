import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { IoMdHeart } from "react-icons/io";
import {
  RiLock2Line,
  RiUser2Line,
  RiMailLine,
  RiEyeLine,
  RiEyeOffLine,
} from "react-icons/ri";
import axios from "axios";

import { BASE_URL } from "../config/utils";
import {
  registerStart,
  registerSuccess,
  registerFailed,
} from "../redux/authSlice";
import fullLogo from "../assets/images/full-logo.png";
import Loader from "../shared/Loader/Loader";
import { toast } from "react-toastify";

function SignIn() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isLoading = useSelector((state) => state.auth.isLoading);
  const [showPassword, setShowPassword] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: "",
    email: "",
    password: "",
  });
  const handleChange = (e) => {
    setUserInfo((prev) => ({
      ...prev,
      [e.target.id]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setLoading(true);
    dispatch(registerStart());
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/register`,
        JSON.stringify(userInfo),
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        dispatch(registerSuccess());
        navigate("/login");
      }
    } catch (error) {
      dispatch(registerFailed());
      return toast.error(error.response?.data?.message);
    }
  };

  return (
    <div className="main-wrapper form-wrapper signin-wrapper">
      <div className="form-container" style={{ margin: 0 }}>
        <div className="form-content signin-form-content">
          <div className="form-header">
            <Link to={"/"}>
              <img src={fullLogo} alt="logo"></img>
            </Link>
            <h4>Register</h4>
            <p>Get your Chatvia account now.</p>
          </div>
          <div className="card mb-4 bg-card-bg-color">
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
                      required
                      id="email"
                      type="email"
                      placeholder="Enter email"
                    ></input>
                  </div>
                </div>
                <div className="mb-4">
                  <div className="block text-left mb-2">
                    <label>Username</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiUser2Line />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      required
                      id="username"
                      type="text"
                      placeholder="Enter username"
                    ></input>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="block text-left mb-2">
                    <label>Password</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiLock2Line />
                      </i>
                    </span>
                    <input
                      onChange={handleChange}
                      required
                      id="password"
                      type={`${showPassword ? "text" : "password"}`}
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
                <div className="w-full h-auto">
                  <button type="submit">
                    {isLoading ? <Loader /> : "Register"}
                  </button>
                </div>
                <div className="mt-6 text-center">
                  <p className="text-secondary-color" >
                    By registering you agree to the Chatvia.{" "}
                    <Link className="text-[#7269ef] hover:underline">
                      Terms of Use
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
          <div className="text-footer" style={{ margin: 0 }}>
            <p>
              Already have an account? <Link className="hover:underline" to={"/login"}>Sign in</Link>
            </p>
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

export default SignIn;
