import { useContext, useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  RiGlobalLine,
  RiSunLine,
  RiMoonLine,
  RiLogoutCircleLine,
  RiArrowLeftSLine,
  RiRefreshLine,
} from "react-icons/ri";
import Tippy from "@tippyjs/react";
import { driver } from "driver.js";
import { toast } from "react-toastify";

import { sidebarIcons, languages } from "../../../assets/data/index";
import { NavLinkContext } from "../../../context/NavLinkContext";
import { ThemeContext } from "../../../context/ThemeContext";
import {
  logoutStart,
  logoutSuccess,
  logoutFailed,
} from "../../../redux/authSlice";
import { BASE_URL } from "@/config/utils";
import useAxiosJWT from "@/config/axiosConfig";
import logoImg from "@/assets/images/logo.svg";
import Loader from "@/shared/Loader/Loader";
import { AxiosContext } from "@/context/AxiosContext";

function Sidebar({ isFirstLogin }) {
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const isLoading = useSelector((state) => state.auth?.isLoading);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { navLink, setNavLink } = useContext(NavLinkContext);
  const { unreadMessages, notifications } = useContext(AxiosContext);
  const { i18n, t } = useTranslation();
  const [openAvatarMenu, setOpenAvatarMenu] = useState(false);
  const [openLanguageMenu, setOpenLanguageMenu] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Load saved language on component mount
  useEffect(() => {
    const savedLanguage = localStorage.getItem("selectedLanguage");
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Save language when changed
  const handleLanguageChange = (languageCode) => {
    i18n.changeLanguage(languageCode);
    localStorage.setItem("selectedLanguage", languageCode);
    setOpenLanguageMenu(false);
  };

  const handleToggleAvatarDropdown = () => {
    setOpenAvatarMenu((prev) => !prev);

    if (window.innerWidth < 992) {
      setTimeout(() => {
        setOpenLanguageMenu(false);
      }, 200);
    }
  };

  const driverObj = driver({
    showProgress: true,
    showButtons: ["next", "previous"],
    steps: [
      {
        popover: {
          title: "👋 Welcome!",
          description:
            "Welcome to our app. Let’s take a quick tour so you can get familiar with the main features.",
          side: "center", // hiển thị giữa màn hình
          align: "center",
        },
      },
      {
        element: ".list-tab_1 .nav-item:first-child",
        popover: {
          title: "Profile",
          description: "View and edit your personal profile information.",
          side: "right",
        },
      },
      {
        element: ".list-tab_1 .nav-item:nth-child(2)",
        popover: {
          title: "Chats",
          description: `Access your friend's conversations.`,
          side: "right",
        },
      },
      {
        element: ".list-tab_1 .nav-item:nth-child(3)",
        popover: {
          title: "Contacts",
          description: "See your contacts and add new friends.",
          side: "right",
        },
      },
      {
        element: ".list-tab_1 .nav-item:nth-child(4)",
        popover: {
          title: "Settings",
          description: "Change your preferences, privacy, and app settings.",
          side: "right",
        },
      },
      {
        element: ".list-tab_2 .nav-item:nth-child(1)",
        popover: {
          title: "Language",
          description: "Switch between available languages.",
          side: "right",
        },
      },
      {
        element: ".list-tab_2 .nav-item:nth-child(2)",
        popover: {
          title: "Theme",
          description: "Toggle between light and dark mode.",
          side: "right",
        },
      },
      {
        element: ".list-tab_2 .nav-item:nth-child(3)",
        popover: {
          title: "Avatar",
          description: "Manage your account, view profile, or log out.",
          side: "right",
        },
      },
    ],
  });

  /**
   * Xử lý đăng xuất người dùng
   * Sử dụng axios thường thay vì axiosJWT để tránh vòng lặp refresh token khi token đã hết hạn
   */
  const handleLogout = async () => {
    if (!user?.accessToken) {
      return toast.error("You're not logged in yet");
    }
    dispatch(logoutStart());
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        localStorage.removeItem("hasSeenTour");
        dispatch(logoutSuccess());
        toast.success(result.message);
        navigate("/login");
      }
    } catch (error) {
      // Nếu lỗi 401 (không được xác thực) khi logout, tức là session đã hết hạn trên server
      // Chúng ta vẫn tiến hành logout thành công ở client để xóa state
      if (error.response?.status === 401) {
        localStorage.removeItem("hasSeenTour");
        dispatch(logoutSuccess());
        navigate("/login");
        return;
      }
      dispatch(logoutFailed());
      return toast.error(error.response?.data?.message);
    }
  };

  useEffect(() => {
    if (isFirstLogin && !localStorage.getItem("hasSeenTour")) {
      driverObj.drive();
      localStorage.setItem("hasSeenTour", true);
    } else {
      return;
    }
  }, [isFirstLogin]);

  useEffect(() => {
    const countUnreadNotifications = notifications.filter(
      (n) => !n?.isRead
    ).length;
    setUnreadNotifications(countUnreadNotifications);
  }, [notifications]);

  return (
    <aside className={`sidebar bg-sidebar-bg`}>
      <div className="brand-box w-full h-[70px]">
        <Link
          to={"#"}
          className="inline-flex items-center justify-center w-full h-full"
        >
          <img src={logoImg} alt="logo" className="h-[30px] w-[30px]" />
        </Link>
      </div>
      <ul className="list-tab_1 w-full flex flex-col items-center justify-center my-auto">
        {sidebarIcons.map((icon, index) => (
          <Tippy
            key={index}
            content={icon.path}
            className="tippy-custom"
            trigger={window.innerWidth >= 992 ? "mouseenter focus" : "click"}
            hideOnClick={true}
            onShow={(instance) => {
              if (window.innerWidth < 992) {
                setTimeout(() => {
                  instance.hide();
                }, 1000);
              }
            }}
          >
            <li
              key={index}
              className="nav-item my-[2px]"
              onClick={() => setNavLink(icon.path)}
            >
              <Link
                to={"#"}
                className={`block w-[56px] h-[56px] leading-[56px] text-center text-[24px] rounded-[8px] mb-2 font-medium
                  ${
                    navLink === icon.path
                      ? `bg-sidebar-menu-item-active text-[#7269ef] `
                      : "text-body-color"
                  }
                  `}
              >
                {index === 0 && unreadNotifications > 0 && (
                  <span>{unreadNotifications}</span>
                )}

                {index === 1 && unreadMessages?.length > 0 && (
                  <span>{unreadMessages?.length}</span>
                )}

                <i className="inline-block relative">
                  <icon.icon />
                </i>
              </Link>
            </li>
          </Tippy>
        ))}
        <Tippy
          visible={openAvatarMenu && window.innerWidth < 992}
          className="dropdown"
          interactive={true}
          arrow={false}
          content={
            openLanguageMenu ? (
              <div className={`dropdown-menu show`}>
                <button
                  style={{
                    justifyContent: "flex-start",
                    textTransform: "capitalize",
                  }}
                  onClick={() => setOpenLanguageMenu(false)}
                >
                  <i style={{ marginRight: "12px" }}>
                    <RiArrowLeftSLine />
                  </i>
                  Back
                </button>
                {languages.map((item, index) => (
                  <button
                    key={index}
                    className={`${i18n.language === item.code ? "active" : ""}`}
                    onClick={() => handleLanguageChange(item.code)}
                    style={{
                      justifyContent: "flex-start",
                      textTransform: "capitalize",
                    }}
                  >
                    <img src={item.image} className="h-[12px] mr-2"></img>
                    {item.language}
                  </button>
                ))}
              </div>
            ) : (
              <div className="dropdown-menu show">
                <button onClick={() => setOpenLanguageMenu(true)}>
                  Language
                  <i>
                    <RiGlobalLine />
                  </i>
                </button>
                <button onClick={() => toggleTheme()}>
                  Theme
                  <i>{theme === "dark" ? <RiMoonLine /> : <RiSunLine />}</i>
                </button>
                <div className="dropdown-divider"></div>
                <button
                  type="button"
                  className="gap-2"
                  onClick={() => navigate("/reset-password")}
                >
                  {t("resetPassword")}
                  <i>
                    <RiRefreshLine />
                  </i>
                </button>
                <button onClick={handleLogout}>
                  {t("logout")}
                  <i>
                    <RiLogoutCircleLine />
                  </i>
                </button>
              </div>
            )
          }
        >
          <li className="nav-item avatar-sidebar my-[2px] hidden relative">
            <Link
              onClick={() => handleToggleAvatarDropdown()}
              to={"#"}
              className={`flex items-center justify-center w-[56px] h-[56px] leading-[56px] text-center text-[24px] rounded-[8px] text-body-color mb-2 font-medium`}
            >
              <img
                src={user?.avatar}
                className={`w-[36px] h-[36px] p-[3px] rounded-[50%] border-border-color `}
              ></img>
            </Link>
          </li>
        </Tippy>
      </ul>
      <ul className="list-tab_2 w-full flex flex-col items-center justify-center">
        <Tippy
          className="dropdown"
          interactive={true}
          arrow={false}
          visible={openLanguageMenu}
          content={
            <div className={`dropdown-menu show language-menu`}>
              {languages.map((item, index) => (
                <button
                  key={index}
                  className={`${i18n.language === item.code ? "active" : ""}`}
                  onClick={() => handleLanguageChange(item.code)}
                  style={{
                    justifyContent: "flex-start",
                    textTransform: "capitalize",
                  }}
                >
                  <img src={item.image} className="h-[12px] mr-2"></img>
                  {item.language}
                </button>
              ))}
            </div>
          }
        >
          <li className="nav-item my-[2px] relative">
            <Link
              onClick={() => setOpenLanguageMenu((prev) => !prev)}
              to={"#"}
              className={`block w-[56px] h-[56px] leading-[56px] text-center text-[24px] rounded-[8px] text-body-color mb-2 font-medium                  `}
            >
              <i className="inline-block">
                <RiGlobalLine />
              </i>
            </Link>
          </li>
        </Tippy>
        <Tippy
          content={theme === "dark" ? "light theme" : "dark theme"}
          className="tippy-custom"
        >
          <li className="nav-item my-[2px]" onClick={toggleTheme}>
            <Link
              to={"#"}
              className={`block w-[56px] h-[56px] leading-[56px] text-center text-[24px] rounded-[8px] text-body-color mb-2 font-medium                  `}
            >
              <i className="inline-block">
                {theme === "dark" ? <RiSunLine /> : <RiMoonLine />}
              </i>
            </Link>
          </li>
        </Tippy>
        <Tippy
          visible={openAvatarMenu && window.innerWidth >= 992}
          className="dropdown"
          interactive={true}
          arrow={false}
          content={
            <div className={`dropdown-menu show`}>
              <button type="button" onClick={handleLogout}>
                {t("logout")}
                <i>{isLoading ? <Loader /> : <RiLogoutCircleLine />}</i>
              </button>
              <button
                type="button"
                className="gap-2"
                onClick={() => navigate("/reset-password")}
              >
                {t("resetPassword")}
                <i>
                  <RiRefreshLine />
                </i>
              </button>
            </div>
          }
        >
          <li className="nav-item my-[2px] relative">
            <Link
              onClick={() => setOpenAvatarMenu((prev) => !prev)}
              to={"#"}
              className={`flex items-center justify-center w-[56px] h-[56px] leading-[56px] text-center text-[24px] rounded-[8px] text-body-color mb-2 font-medium`}
            >
              <img
                src={user?.avatar}
                className={`w-[36px] h-[36px] p-[3px] rounded-[50%] border-border-color `}
              ></img>
            </Link>
          </li>
        </Tippy>
      </ul>
    </aside>
  );
}

export default Sidebar;
