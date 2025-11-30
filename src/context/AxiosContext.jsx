import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';

import { BASE_URL } from '../config/utils';
import useAxiosJWT from '../config/axiosConfig';
import { OpenContext } from './OpenContext';
import { loginSuccess } from '../redux/authSlice';

export const AxiosContext = createContext();

function AxiosProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user);
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();

  const { setOpenChatBox } = useContext(OpenContext);
  const [contacts, setContacts] = useState([]);
  const [messages, setMessages] = useState([]);
  const [chatList, setChatList] = useState([]);
  const [receiver, setReceiver] = useState(null);
  const [typingUserId, setTypingUserId] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [friendList, setFriendList] = useState([]);
  const [searchMessages, setSearchMessages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(null);
  const [count, setCount] = useState(null);
  const [isBlockedByReceiver, setIsBlockedByReceiver] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Pagination state for messages
  const [messagePage, setMessagePage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false);

  // loading state
  const [contactsLoading, setContactsLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingChatList, setLoadingChatList] = useState(false);
  const [loadingRevokeMessage, setLoadingRevokeMessage] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  // ref
  const didRunRef = useRef(false);

  const handleSortedContacts = (contacts) => {
    const result = contacts.sort((a, b) => a.contactLetter.localeCompare(b.contactLetter));
    return result;
  };

  const handleGetContacts = async () => {
    setContactsLoading(true);
    try {
      const res = await axiosJWT.get(`${BASE_URL}/contacts`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        const sortedContacts = handleSortedContacts(result.data);
        setContacts(sortedContacts);
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setContactsLoading(false);
    }
  };

  const handleDeleteContacts = async (contactId) => {
    try {
      const res = await axiosJWT.delete(`${BASE_URL}/contacts/delete/${contactId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        toast.success(result.message);
        const sortedContacts = handleSortedContacts(result.data);
        setContacts(sortedContacts);

        // Remove the conversation from chatList and activate the first remaining chat
        setChatList((prev) => {
          const updated = prev.filter((chat) => {
            const partnerId =
              chat.senderId._id === user._id ? chat.receiverId._id : chat.senderId._id;
            return String(partnerId) !== String(contactId);
          });

          if (updated.length > 0) {
            const firstChat = updated[0];
            const nextPartnerId =
              firstChat.senderId._id === user._id
                ? firstChat.receiverId._id
                : firstChat.senderId._id;
            setOpenChatBox(nextPartnerId);
            handleGetReceiver(nextPartnerId);
            handleGetMessage(nextPartnerId, true);
          } else {
            setOpenChatBox(null);
            setReceiver(null);
            setMessages([]);
          }
          return updated;
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  // messages
  const handleGetMessage = async (receiverId, shouldScrollToBottom = false, isLoadMore = false) => {
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
        // lọc bỏ các message mà user đã delete (trong deletedBy có chứa user._id)
        const filteredMessages = result.data.filter(
          (msg) => !(msg.deletedPermanentlyBy && msg.deletedPermanentlyBy.includes(user._id))
        );

        if (isLoadMore) {
          // Thêm tin nhắn cũ vào đầu danh sách
          setMessages((prev) => [...filteredMessages, ...prev]);
          setMessagePage(currentPage);
        } else {
          // Load tin nhắn mới nhất
          setMessages(filteredMessages);
          setMessagePage(1);
        }

        // Cập nhật trạng thái có còn tin nhắn cũ hơn không
        setHasMoreMessages(result.pagination?.hasMore || false);

        // Trigger scroll to bottom for initial load after login
        if ((shouldScrollToBottom || isInitialLoad) && filteredMessages.length > 0 && !isLoadMore) {
          setTimeout(() => {
            const endRef = document.querySelector('.user-chat_body .list-none');
            if (endRef) {
              endRef.scrollIntoView({ behavior: 'smooth' });
            }
          }, 200);
          setIsInitialLoad(false); // Mark as no longer initial load
        }
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    } finally {
      if (isLoadMore) {
        setLoadingMoreMessages(false);
      } else {
        setLoadingMessages(false);
      }
    }
  };

  const handleReactionMessage = async (messageId, icon) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/messages/react/${messageId}`,
        {
          icon,
        },
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
        // Cập nhật messages FE
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === messageId ? { ...msg, emoji: result.data?.emoji || [] } : msg
          )
        );
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    }
  };

  const handleGetUnreadMessages = async () => {
    try {
      const res = await axiosJWT.get(`${BASE_URL}/messages/unread`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setUnreadMessages(result.data);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    }
  };

  const handleReadMessage = async (senderId) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/messages/read/${senderId}`,
        {},
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
        setUnreadMessages(result.data);
        setChatList((prev) =>
          prev.map((chat) => {
            const partnerId =
              chat.senderId._id === user._id ? chat.receiverId._id : chat.senderId._id;

            if (String(partnerId) === String(senderId)) {
              return { ...chat, unreadCount: 0 };
            }
            return chat;
          })
        );
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    }
  };

  const handleRevokeMessageForSelf = async (messageId) => {
    setLoadingRevokeMessage(true);
    try {
      const res = await axiosJWT.post(
        `${BASE_URL}/messages/revoke/single/${messageId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const result = res.data;
      if (result.success) {
        const updatedMsg = result.data; // server trả về message mới

        setMessages((prevMessages) =>
          prevMessages.map((msg) => (msg._id === updatedMsg._id ? updatedMsg : msg))
        );
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    } finally {
      setLoadingRevokeMessage(false);
    }
  };

  const handleRevokeMessageForBoth = async (messageId) => {
    setLoadingRevokeMessage(true);
    try {
      await axiosJWT.post(
        `${BASE_URL}/messages/revoke/both/${messageId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      return toast.error(error.response?.data?.message);
    } finally {
      setLoadingRevokeMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await axiosJWT.delete(`${BASE_URL}/messages/delete/${messageId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    }
  };

  const handleDeleteAllMessage = async (receiverId) => {
    try {
      const res = await axiosJWT.delete(`${BASE_URL}/messages/delete-all/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        toast.success(result.message);
        // Remove the conversation from chatList and activate the first remaining chat
        setChatList((prev) => {
          const updated = prev.filter((chat) => {
            const partnerId =
              chat.senderId._id === user._id ? chat.receiverId._id : chat.senderId._id;
            return String(partnerId) !== String(receiverId);
          });

          if (updated.length > 0) {
            const firstChat = updated[0];
            const nextPartnerId =
              firstChat.senderId._id === user._id
                ? firstChat.receiverId._id
                : firstChat.senderId._id;
            setOpenChatBox(nextPartnerId);
            handleGetReceiver(nextPartnerId);
            handleGetMessage(nextPartnerId, true);
          } else {
            setOpenChatBox(null);
            setMessages([]);
          }

          return updated;
        });
      }
    } catch (error) {
      return toast.error(error.response?.data?.message || 'Failed to delete conversation');
    }
  };

  const handleSearchMessage = async (receiverId, keyword) => {
    if (!keyword.trim()) {
      return toast.error('Keyword is required');
    }
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
      const result = res.data;
      if (result.success) {
        setCount(result.count);
        setSearchMessages(result.messages);
        setCurrentIndex(result.messages.length > 0 ? result.messages.length - 1 : -1);
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    }
  };

  const handlePinnedMessage = async (messageId) => {
    try {
      await axiosJWT.post(
        `${BASE_URL}/messages/pinned/${messageId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
    } catch (error) {
      return toast.error(error.reponse?.data?.message);
    }
  };

  // Load more messages for pagination
  const handleLoadMoreMessages = async (receiverId) => {
    if (!hasMoreMessages || loadingMoreMessages) return;
    return handleGetMessage(receiverId, false, true);
  };

  // chat list
  const handleGetChatList = async () => {
    setLoadingChatList(true);
    try {
      const res = await axiosJWT.get(`${BASE_URL}/messages/recent`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setChatList(result.data);
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    } finally {
      setLoadingChatList(false);
    }
  };

  // user
  const handleGetReceiver = async (receiverId) => {
    try {
      const res = await axiosJWT.get(`${BASE_URL}/user/receiver/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setIsBlockedByReceiver(result.isBlockedByReceiver);
        setReceiver(result.data);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    }
  };

  const handleGetNotifications = async () => {
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
      return toast.error(error.response?.data?.message);
    }
  };

  const handleGetListFriend = async () => {
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
      return toast.error(error.response?.data?.message);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleBlockUser = async (receiverId) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/user/block/${receiverId}`,
        {},
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
        if (result.blocked) {
          // ✅ Block user → add vào danh sách
          dispatch(
            loginSuccess({
              ...user,
              blockedUsers: [...user.blockedUsers, receiverId],
            })
          );
        } else {
          // ✅ Unblock user → remove khỏi danh sách
          dispatch(
            loginSuccess({
              ...user,
              blockedUsers: user.blockedUsers.filter((id) => id !== receiverId),
            })
          );
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    }
  };

  useEffect(() => {
    handleGetChatList();
    handleGetContacts();
    handleGetNotifications();
    handleGetUnreadMessages();
    handleGetListFriend();
  }, [user]);

  useEffect(() => {
    const isMobile = window.innerWidth <= 768;

    if (!didRunRef.current && chatList.length > 0 && user?._id) {
      const firstChat = chatList[0];
      const currentUserId = user._id;
      const partner =
        firstChat.senderId._id === currentUserId ? firstChat.receiverId : firstChat.senderId;

      // Mở chat box chỉ nếu không mobile
      if (!isMobile) {
        setOpenChatBox(partner._id);
        handleGetMessage(partner._id, true); // true để scroll xuống cuối khi load lần đầu
      }

      // 📌 Luôn lấy receiver kể cả mobile
      handleGetReceiver(partner._id);
      didRunRef.current = true;
    }
  }, [chatList, user]);

  return (
    <AxiosContext.Provider
      value={{
        contactsLoading,
        loadingRevokeMessage,
        loadingMessages,
        loadingChatList,
        loadingAvailable,
        loadingMoreMessages,
        contacts,
        messages,
        chatList,
        receiver,
        typingUserId,
        unreadMessages,
        notifications,
        friendList,
        searchMessages,
        currentIndex,
        count,
        isBlockedByReceiver,
        hasMoreMessages,
        messagePage,
        setFriendList,
        setMessages,
        setContacts,
        setReceiver,
        setChatList,
        setTypingUserId,
        setUnreadMessages,
        setNotifications,
        setCurrentIndex,
        setCount,
        setSearchMessages,
        handleGetContacts,
        handleDeleteContacts,
        handleGetMessage,
        handleLoadMoreMessages,
        handleGetChatList,
        handleReactionMessage,
        handleGetReceiver,
        handleReadMessage,
        handleRevokeMessageForSelf,
        handleRevokeMessageForBoth,
        handleDeleteMessage,
        handleDeleteAllMessage,
        handleSearchMessage,
        handleBlockUser,
        handlePinnedMessage,
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
}

export default AxiosProvider;
