import { useEffect } from "react";
import { useSelector } from "react-redux";
import { requestFcmToken, onMessage, messaging } from "../config/firebase";
import axios from "axios";
import { BASE_URL } from "../config/utils";

/**
 * Hook xử lý việc lấy FCM Token và gửi lên Server
 */
const useFcmToken = () => {
  const user = useSelector((state) => state.auth?.user);

  useEffect(() => {
    const setupFCM = async () => {
      // Chỉ thực hiện khi user đã đăng nhập
      if (user && user.accessToken) {
        const token = await requestFcmToken();
        if (token) {
          try {
            // Gửi token lên backend để lưu vào danh sách fcmTokens của user
            await axios.put(
              `${BASE_URL}/user/fcm-token`,
              { fcmToken: token },
              {
                headers: { Authorization: `Bearer ${user.accessToken}` },
              }
            );
          } catch (error) {
            console.error("❌ Failed to sync FCM Token:", error);
          }
        }
      }
    };

    setupFCM();
  }, [user]);

  useEffect(() => {
    // Lắng nghe tin nhắn khi ứng dụng đang mở (Foreground)
    const unsubscribe = onMessage(messaging, (payload) => {
      // Ở đây bạn có thể hiển thị một Toast hoặc UI thông báo tùy chỉnh
    });

    return () => unsubscribe();
  }, []);
};

export default useFcmToken;
