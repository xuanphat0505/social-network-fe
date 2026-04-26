import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config/utils';

/**
 * Hook xử lý thông tin người nhận (Receiver) đang hội thoại
 */
export const useReceiverData = (axiosJWT, user) => {
  const [receiver, setReceiver] = useState(null);
  const [isBlockedByReceiver, setIsBlockedByReceiver] = useState(false);

  const handleGetReceiver = useCallback(async (receiverId) => {
    if (!user) return;
    try {
      const res = await axiosJWT.get(`${BASE_URL}/user/receiver/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      if (res.data.success) {
        setIsBlockedByReceiver(res.data.isBlockedByReceiver);
        setReceiver(res.data.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  }, [axiosJWT, user]);

  return {
    receiver,
    setReceiver,
    isBlockedByReceiver,
    setIsBlockedByReceiver,
    handleGetReceiver
  };
};
