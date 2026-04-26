import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { loginSuccess, logoutSuccess } from "../redux/authSlice";
import { useCallback, useEffect, useMemo } from "react";
import { BASE_URL } from "./utils";

// Biến global để quản lý trạng thái refresh token trên toàn hệ thống
// Cần để ngoài hook để đảm bảo đồng bộ cho tất cả các request song song
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Hook tùy chỉnh để tạo axios instance có tự động refresh token
 * Xử lý triệt để lỗi "you're not authenticated" khi deploy (môi trường mạng có độ trễ)
 */
const useAxiosJWT = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth.user);

  // Kiểm tra trạng thái server (chế độ ping định kỳ)
  useEffect(() => {
    if (!user) return;
    const checkServerStatus = async () => {
      try {
        await axios.get(`${BASE_URL}/health-check`, { timeout: 10000 });
      } catch (error) {
        console.warn("Server hiện không phản hồi, vui lòng kiểm tra kết nối.");
      }
    };

    checkServerStatus();
    const interval = setInterval(checkServerStatus, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const handleRefreshToken = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/refreshToken`,
        {},
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      return res.data;
    } catch (error) {
      throw error;
    }
  };

  const axiosJWT = useMemo(() => {
    const instance = axios.create();

    // 1. Request Interceptor: Kiểm tra chủ động trước khi gửi
    instance.interceptors.request.use(
      async (config) => {
        if (!user?.accessToken) return config;

        let date = new Date();
        try {
          const decodedToken = jwtDecode(user.accessToken);
          
          if (decodedToken.exp < date.getTime() / 1000) {
            // Nếu đang có 1 request khác thực hiện refresh token
            if (isRefreshing) {
              return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
              })
                .then((token) => {
                  config.headers["Authorization"] = `Bearer ${token}`;
                  return config;
                })
                .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;
            try {
              const data = await handleRefreshToken();
              const refreshUser = { ...user, accessToken: data.accessToken };
              
              dispatch(loginSuccess(refreshUser));
              config.headers["Authorization"] = `Bearer ${data.accessToken}`;
              
              processQueue(null, data.accessToken);
              return config;
            } catch (error) {
              processQueue(error, null);
              dispatch(logoutSuccess());
              return Promise.reject(error);
            } finally {
              isRefreshing = false;
            }
          }
        } catch (error) {
          console.error("JWT Decode error:", error);
          return config;
        }

        // Đảm bảo luôn có token nếu chưa hết hạn
        if (!config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${user.accessToken}`;
        }
        
        return config;
      },
      (err) => Promise.reject(err)
    );

    // 2. Response Interceptor: Bắt lỗi 401 bất ngờ (đề phòng token bị thu hồi phía server)
    instance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                originalRequest.headers["Authorization"] = `Bearer ${token}`;
                return instance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const data = await handleRefreshToken();
            const refreshUser = { ...user, accessToken: data.accessToken };
            dispatch(loginSuccess(refreshUser));
            
            instance.defaults.headers.common["Authorization"] = `Bearer ${data.accessToken}`;
            originalRequest.headers["Authorization"] = `Bearer ${data.accessToken}`;
            
            processQueue(null, data.accessToken);
            return instance(originalRequest);
          } catch (refreshError) {
            processQueue(refreshError, null);
            dispatch(logoutSuccess());
            return Promise.reject(refreshError);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    return instance;
  }, [dispatch, user]);

  return useCallback(() => axiosJWT, [axiosJWT]);
};

export default useAxiosJWT;
