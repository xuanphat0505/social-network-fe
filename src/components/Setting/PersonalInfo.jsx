import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { IoChevronDown, IoChevronUp } from "react-icons/io5";
import { RiEditFill, RiUser2Line, RiMailLine, RiMapPin2Line, RiQuillPenLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import useAxiosJWT from "../../config/axiosConfig";
import { loginSuccess } from "../../redux/authSlice";
import { BASE_URL } from "../../config/utils";
import Loader from "../../shared/Loader/Loader";

function PersonalInfo({ toggleSetting, settingOption, info }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const inputRef = useRef();
  const [isEdit, setIsEdit] = useState(false);
  const [userInfo, setUserInfo] = useState({
    username: user?.username,
    location: user?.location,
    slogan: user?.slogan,
  });
  const [initialUserInfo, setInitialUserInfo] = useState(userInfo);
  const handleChange = (e) => {
    setUserInfo((prev) => ({ ...prev, [e.target.id]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // always prevent default

    if (!isEdit) {
      setInitialUserInfo(userInfo);
      return setIsEdit(true);
    }


    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/user/update/info`,
        userInfo, // 👈 send directly unless backend expects { userInfo }
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      const result = res.data;

      if (result.success) {
        toast.success(result.message);
        dispatch(loginSuccess({ ...user, ...result.data }));
        setIsEdit(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Update failed");
    } 
  };

  const handleCancel = () => {
    setIsEdit(false);
    setUserInfo(initialUserInfo);
    inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  useEffect(() => {
    if (isEdit && inputRef.current) {
      inputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        inputRef.current.focus();
      }, 300); // delay để scroll xong rồi mới focus
    }
  }, [isEdit]);
  return (
    <div className="setting-container card mb-2 bg-[#0000] border-[1px] border-border-color">
      <Link
        onClick={() => toggleSetting("info")}
        className="text-heading-color"
      >
        <div className="flex items-center justify-between  bg-[#a6b0cf08] py-3 px-5">
          <h5 className="text-[14px] m-0">{info.header}</h5>
          <i>{settingOption.info ? <IoChevronUp /> : <IoChevronDown />}</i>
        </div>
      </Link>
      <div className={`setting-list ${settingOption.info ? "show" : ""}`}>
        <form className="p-5">
          {/* Name */}
          <div className="setting-item">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                <RiUser2Line />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-secondary-color mb-1">{info.name}</p>
                <input
                  ref={inputRef}
                  onChange={handleChange}
                  id="username"
                  type="text"
                  disabled={!isEdit}
                  value={userInfo.username}
                  className={`w-full py-2 rounded-md bg-input-bg-color border border-border-color outline-none text-[14px] ${!isEdit ? "opacity-90 cursor-not-allowed" : "focus:ring-2 focus:ring-[#7269ef]/40"}`}
                ></input>
              </div>
            </div>
          </div>
          {/* Email */}
          <div className="setting-item mt-6">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                <RiMailLine />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-secondary-color mb-1">{info.email}</p>
                <input
                  className="w-full py-2 rounded-md bg-input-bg-color border border-border-color outline-none text-[14px] opacity-80 cursor-not-allowed"
                  disabled={true}
                  type="email"
                  value={user?.email}
                ></input>
              </div>
            </div>
          </div>
          {/* Location */}
          <div className="setting-item mt-6">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                <RiMapPin2Line />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-secondary-color mb-1">{info.location}</p>
                <input
                  disabled={!isEdit}
                  onChange={handleChange}
                  id="location"
                  type="text"
                  value={userInfo.location}
                  className={`w-full py-2 rounded-md bg-input-bg-color border border-border-color outline-none text-[14px] ${!isEdit ? "opacity-90 cursor-not-allowed" : "focus:ring-2 focus:ring-[#7269ef]/40"}`}
                ></input>
              </div>
            </div>
          </div>
          {/* Slogan */}
          <div className="setting-item mt-6">
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                <RiQuillPenLine />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-secondary-color mb-1">Slogan</p>
                <textarea
                  disabled={!isEdit}
                  id="slogan"
                  onChange={handleChange}
                  placeholder="Enter your slogan"
                  onInput={(e) => {
                    e.target.style.height = "auto";
                    e.target.style.height = `${e.target.scrollHeight}px`;
                  }}
                  value={userInfo.slogan}
                  className={`w-full py-2 rounded-md bg-input-bg-color border border-border-color outline-none text-[14px] resize-none leading-6 ${!isEdit ? "opacity-90 cursor-not-allowed" : "focus:ring-2 focus:ring-[#7269ef]/40"}`}
                ></textarea>
              </div>
            </div>
          </div>
          {/* Actions */}
          <div className="mt-6 flex justify-end space-x-2">
            <button
              type="button"
              className="btn btn-primary inline-flex items-center px-4 py-2 rounded-md shadow-sm hover:shadow transition"
              onClick={handleSubmit}
            >
              {isEdit ? "Submit" : "Edit"}
            </button>
            <button
              type="button"
              className="btn btn-secondary inline-flex items-center px-4 py-2 rounded-md shadow-sm hover:shadow transition"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PersonalInfo;
