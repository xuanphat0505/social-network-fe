import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/config/utils';

/**
 * Hook xử lý danh sách bạn bè
 */
export const useFriendData = (axiosJWT, user) => {
  const [friendList, setFriendList] = useState([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);

  const handleGetListFriend = useCallback(async () => {
    if (!user) return;
    setLoadingAvailable(true);
    try {
      const res = await axiosJWT.get(`${BASE_URL}/user/friends`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setFriendList(result.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setLoadingAvailable(false);
    }
  }, [axiosJWT, user]);

  return {
    friendList,
    setFriendList,
    loadingAvailable,
    handleGetListFriend
  };
};
