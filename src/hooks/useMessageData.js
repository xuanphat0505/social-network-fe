import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '../config/utils';

/**
 * Hook xử lý logic liên quan đến tin nhắn: gửi, nhận, xóa, thu hồi, tìm kiếm, emoji
 */
export const useMessageData = (axiosJWT, user) => {
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [searchMessages, setSearchMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [count, setCount] = useState(null);
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);
  const [loadingRevokeMessage, setLoadingRevokeMessage] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const handleGetMessage = useCallback(async (receiverId, shouldScrollToBottom = false, isLoadMore = false) => {
    if (!user) return;
    if (isLoadMore) {
      setLoadingMoreMessages(true);
    } else {
      setLoadingMessages(true);
      setMessagePage(1);
      setHasMoreMessages(true);
    }

    try {
      const currentPage = isLoadMore ? messagePage + 1 : 1;
      const res = await axiosJWT.get(
        `${BASE_URL}/messages/${receiverId}?page=${currentPage}&limit=30`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );

      const result = res.data;
      if (result.success) {
        const filteredMessages = result.data.filter(
          (msg) => !(msg.deletedPermanentlyBy && msg.deletedPermanentlyBy.includes(user._id))
        );

        if (isLoadMore) {
          setMessages((prev) => [...filteredMessages, ...prev]);
          setMessagePage(currentPage);
        } else {
          setMessages(filteredMessages);
          setMessagePage(1);
        }

        setHasMoreMessages(result.pagination?.hasMore || false);

        if ((shouldScrollToBottom || isInitialLoad) && filteredMessages.length > 0 && !isLoadMore) {
          setTimeout(() => {
            const endRef = document.querySelector('.user-chat_body .list-none');
            if (endRef) {
              endRef.scrollIntoView({ behavior: 'smooth' });
            }
          }, 200);
          setIsInitialLoad(false);
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      if (isLoadMore) {
        setLoadingMoreMessages(false);
      } else {
        setLoadingMessages(false);
      }
    }
  }, [axiosJWT, user, messagePage, isInitialLoad]);

  const handleReactionMessage = useCallback(async (messageId, icon) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/messages/react/${messageId}`,
        { icon },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, emoji: res.data.data?.emoji || [] } : msg
          )
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  }, [axiosJWT, user]);

  const handleGetUnreadMessages = useCallback(async () => {
    if (!user) return;
    try {
      const res = await axiosJWT.get(`${BASE_URL}/messages/unread`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      if (res.data.success) {
        setUnreadMessages(res.data.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  }, [axiosJWT, user]);

  const handleSearchMessage = useCallback(async (receiverId, keyword) => {
    if (!keyword.trim()) return toast.error('Keyword is required');
    try {
      const res = await axiosJWT.post(
        `${BASE_URL}/messages/search/${receiverId}`,
        { keyword },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      if (res.data.success) {
        setCount(res.data.count);
        setSearchMessages(res.data.messages);
        setCurrentIndex(res.data.messages.length > 0 ? res.data.messages.length - 1 : -1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  }, [axiosJWT, user]);

  return {
    messages, setMessages,
    loadingMessages, unreadMessages, setUnreadMessages,
    searchMessages, setSearchMessages,
    currentIndex, setCurrentIndex,
    count, setCount,
    messagePage, setMessagePage,
    hasMoreMessages, setHasMoreMessages,
    loadingMoreMessages, loadingRevokeMessage, setLoadingRevokeMessage,
    handleGetMessage, handleReactionMessage,
    handleGetUnreadMessages, handleSearchMessage
  };
};
