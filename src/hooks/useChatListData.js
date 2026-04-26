import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/config/utils';

/**
 * Hook xử lý danh sách các cuộc hội thoại gần đây (Recent Chats)
 */
export const useChatListData = (axiosJWT, user) => {
  const [chatList, setChatList] = useState([]);
  const [loadingChatList, setLoadingChatList] = useState(false);

  const handleGetChatList = useCallback(async () => {
    if (!user) return;
    setLoadingChatList(true);
    try {
      const res = await axiosJWT.get(`${BASE_URL}/messages/recent`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      if (res.data.success) {
        setChatList(res.data.data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setLoadingChatList(false);
    }
  }, [axiosJWT, user]);

  return {
    chatList,
    setChatList,
    loadingChatList,
    handleGetChatList
  };
};
