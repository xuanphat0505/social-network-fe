import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode"; 
import { loginSuccess, logoutSuccess } from "../redux/authSlice";
import { useCallback, useEffect } from "react";
import { BASE_URL } from "./utils";

const useAxiosJWT = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth.user);

  // Thêm kiểm tra server định kỳ
  useEffect(() => {
    if (!user) return;
    const checkServerStatus = async () => {
      try {
        await axios.get(`${BASE_URL}/health-check`, { timeout: 3000 });
      } catch (error) {
        console.log("Server không hoạt động - đăng xuất tự động");
        dispatch(logoutSuccess());
      }
    };

    checkServerStatus();

    const interval = setInterval(checkServerStatus, 30000);

    return () => clearInterval(interval);
  }, [dispatch, user]);

  const axiosJWT = useCallback(() => {
    const instance = axios.create();
    const handleRefreshToken = async () => {
      try {
        const res = await axios.post(
          `${BASE_URL}/auth/refreshToken`,
          {},
          {
            headers: {
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
        return res.data;
      } catch (error) {
        alert();
        throw error;
      }
    };

    instance.interceptors.request.use(
      async (config) => {
        let date = new Date();
        const decodedToken = jwtDecode(user?.accessToken);
        if (decodedToken.exp < date.getTime() / 1000) {
          const data = await handleRefreshToken();
          const refreshUser = { ...user, accessToken: data.accessToken };
          dispatch(loginSuccess(refreshUser));
          config.headers["Authorization"] = `Bearer ${data.accessToken}`;
        }
        return config;
      },
      (err) => {
        return Promise.reject(err);
      }
    );
    return instance;
  }, [dispatch, user]);
  return axiosJWT;
};

export default useAxiosJWT;
