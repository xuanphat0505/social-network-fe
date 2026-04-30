import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useContext, useEffect } from "react";

import { ToastContainer } from "react-toastify";
import { ThemeContext } from "./context/ThemeContext";
import { SkeletonTheme } from "react-loading-skeleton";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignIn from "./pages/SignIn";
import ForgetPassword from "./pages/ForgetPassword";
import StartedContainer from "./pages/StartedContainer";
import ResetPassword from "./pages/ResetPassword";
import OTPForm from "./pages/OTPForm";
import SystemBroadcastBanner from "./components/SystemBroadcastBanner";

/**
 * Hàm tạo Navigate element và lưu mã kết bạn pending vào localStorage
 * để xử lý sau khi đăng nhập thành công
 */
function ProtectedRedirect() {
  const location = useLocation();

  useEffect(() => {
    // Lưu mã kết bạn vào localStorage trước khi redirect sang trang login
    const params = new URLSearchParams(location.search);
    const friendCode = params.get("add-friend");
    if (friendCode) {
      localStorage.setItem("pending_add_friend", friendCode);
    }
  }, [location.search]);

  return <Navigate to="/login" replace />;
}

function App() {
  const { theme } = useContext(ThemeContext);
  const user = useSelector((state) => state.auth?.user);

  return (
    <SkeletonTheme
      baseColor={theme === "dark" ? "#3b4252" : "#e6e8eb"}
      highlightColor={theme === "dark" ? "#4c566a" : "#f5f7fa"}
    >
      <div className="app">
        <SystemBroadcastBanner />
        <Routes>
          <Route
            path="/"
            element={user ? <Home /> : <ProtectedRedirect />}
          ></Route>
          <Route path="/login" element={<Login />}></Route>
          <Route path="/register" element={<SignIn />}></Route>
          <Route path="/forget-password" element={<ForgetPassword />}></Route>
          <Route path="/started" element={<StartedContainer />}></Route>
          <Route path="/reset-password" element={<ResetPassword />}></Route>
          {/* Allow 2FA page when not logged in */}
          <Route path="/otp-form" element={<OTPForm />}></Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={1500} />
      </div>
    </SkeletonTheme>
  );
}

export default App;
