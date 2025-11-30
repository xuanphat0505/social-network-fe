import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoMdHeart } from "react-icons/io";
import { RiMailLine } from "react-icons/ri";
import axios from "axios";

import { BASE_URL } from "../config/utils";
import fullLogo from "../assets/images/full-logo.png";
import Loader from "../shared/Loader/Loader";

function ForgetPassword() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState(
    "Enter your Email and instructions will be sent to you!"
  );
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/user/forget-password`,
        { email },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        let timeLeft = 6;
        const timer = setInterval(() => {
          timeLeft -= 1;
          // setCountdown(timeLeft);
          setMessage(
            `${result.message} Redirecting to login page in ${timeLeft}s...`
          );
          if (timeLeft <= 0) {
            clearInterval(timer);
            navigate("/login");
          }
        }, 1000);
      }
    } catch (error) {
      setIsError(true);
      setMessage(error.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper form-wrapper forget-wrapper">
      <div className="form-container">
        <div className="form-content forget-form-content">
          <div className="form-header">
            <Link to={"/"}>
              <img src={fullLogo} alt="logo"></img>
            </Link>
            <h4>Sign in</h4>
            <p>Sign in to continue to Chatvia.</p>
          </div>
          <div className="card mb-6 bg-card-bg-color">
            <div className="p-10">
              <div
                className={`text-center mb-6 ${
                  isError
                    ? "bg-[#fdecea] text-[#611a15]  border-[#f5c2c7]"
                    : "bg-[#cdf7ec] text-[#025640] border-[#9befd9]"
                } border-[1px]  rounded-[.25rem] py-3 px-5`}
              >
                {message}
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <div className="block text-left mb-2">
                    <label>Username</label>
                  </div>
                  <div className="form-input">
                    <span>
                      <i>
                        <RiMailLine />
                      </i>
                    </span>
                    <input
                      required
                      onChange={(e) => setEmail(e.target.value)}
                      type="email"
                      placeholder="Enter email"
                    ></input>
                  </div>
                </div>
                <div className="w-full h-auto">
                  <button type="submit">
                    {isLoading ? <Loader /> : "Send"}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="text-footer">
            <p>
              Remember it? <Link to={"/login"}> Sign in</Link>
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

export default ForgetPassword;
