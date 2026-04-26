import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config/utils';

/**
 * Hook xử lý thông báo của hệ thống và người dùng
 */
export const useNotificationData = (axiosJWT, user) => {
  const [notifications, setNotifications] = useState([]);

  const handleGetNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosJWT.get(`${BASE_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setNotifications(result.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  }, [axiosJWT, user]);

  const handleReadAllNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosJWT.put(`${BASE_URL}/notifications/read`, {}, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to mark all as read');
    }
  }, [axiosJWT, user]);

  const handleReadSingleNotification = useCallback(async (notificationId) => {
    if (!user) return;
    try {
      const res = await axiosJWT.put(`${BASE_URL}/notifications/read/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${user?.accessToken}` },
        withCredentials: true,
      });
      if (res.data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to read notification');
    }
  }, [axiosJWT, user]);

  return {
    notifications,
    setNotifications,
    handleGetNotifications,
    handleReadAllNotifications,
    handleReadSingleNotification
  };
};
