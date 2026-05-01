import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { BASE_URL } from "@/config/utils";
import useAxiosJWT from "@/config/axiosConfig";
import { OpenContext } from "@/context/OpenContext";
import { loginSuccess } from "@/redux/authSlice";

// Import Custom Hooks
import { useContactData } from "@/hooks/useContactData";
import { useMessageData } from "@/hooks/useMessageData";
import { useChatListData } from "@/hooks/useChatListData";
import { useReceiverData } from "@/hooks/useReceiverData";
import { useFriendData } from "@/hooks/useFriendData";
import { useNotificationData } from "@/hooks/useNotificationData";

export const AxiosContext = createContext();

export function AxiosProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state?.auth?.user);
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();

  const { setOpenChatBox } = useContext(OpenContext);

  // Initialize Hooks
  const {
    contacts,
    setContacts,
    contactsLoading,
    handleGetContacts,
    handleSortedContacts,
  } = useContactData(axiosJWT, user);

  const {
    messages,
    setMessages,
    loadingMessages,
    unreadMessages,
    setUnreadMessages,
    searchMessages,
    setSearchMessages,
    currentIndex,
    setCurrentIndex,
    count,
    setCount,
    messagePage,
    setMessagePage,
    hasMoreMessages,
    setHasMoreMessages,
    loadingMoreMessages,
    loadingRevokeMessage,
    setLoadingRevokeMessage,
    handleGetMessage,
    handleReactionMessage,
    handleGetUnreadMessages,
    handleSearchMessage,
  } = useMessageData(axiosJWT, user);

  const { chatList, setChatList, loadingChatList, handleGetChatList } =
    useChatListData(axiosJWT, user);

  const {
    receiver,
    setReceiver,
    isBlockedByReceiver,
    setIsBlockedByReceiver,
    handleGetReceiver,
  } = useReceiverData(axiosJWT, user);

  const { friendList, setFriendList, loadingAvailable, handleGetListFriend } =
    useFriendData(axiosJWT, user);

  const { 
    notifications, setNotifications, handleGetNotifications,
    handleReadAllNotifications, handleReadSingleNotification 
  } = useNotificationData(axiosJWT, user);

  const [typingUserId, setTypingUserId] = useState(null);
  const didRunRef = useRef(false);
  const lastLoadedUserIdRef = useRef(null);

  // --- Specialized Functions (Coordinating between multiple states) ---

  const handleDeleteContacts = async (contactId) => {
    try {
      const res = await axiosJWT.delete(
        `${BASE_URL}/contacts/delete/${contactId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setContacts(handleSortedContacts(res.data.data));

        setChatList((prev) => {
          const updated = prev.filter((chat) => {
            const partnerId =
              chat.senderId._id === user._id
                ? chat.receiverId._id
                : chat.senderId._id;
            return String(partnerId) !== String(contactId);
          });

          if (updated.length > 0) {
            const nextPartnerId =
              updated[0].senderId._id === user._id
                ? updated[0].receiverId._id
                : updated[0].senderId._id;
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

  const handleReadMessage = async (senderId) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/messages/read/${senderId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        setUnreadMessages(res.data.data);
        setChatList((prev) =>
          prev.map((chat) => {
            const partnerId =
              chat.senderId._id === user._id
                ? chat.receiverId._id
                : chat.senderId._id;
            if (String(partnerId) === String(senderId))
              return { ...chat, unreadCount: 0 };
            return chat;
          }),
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
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
            "Content-Type": "application/json",
          },
        },
      );
      if (res.data.success) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg._id === res.data.data._id ? res.data.data : msg,
          ),
        );
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
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
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setLoadingRevokeMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await axiosJWT.delete(
        `${BASE_URL}/messages/delete/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    }
  };

  const handleDeleteAllMessage = async (receiverId) => {
    try {
      const res = await axiosJWT.delete(
        `${BASE_URL}/messages/delete-all/${receiverId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        toast.success(res.data.message);
        setChatList((prev) => {
          const updated = prev.filter((chat) => {
            const partnerId =
              chat.senderId._id === user._id
                ? chat.receiverId._id
                : chat.senderId._id;
            return String(partnerId) !== String(receiverId);
          });
          if (updated.length > 0) {
            const nextPartnerId =
              updated[0].senderId._id === user._id
                ? updated[0].receiverId._id
                : updated[0].senderId._id;
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
      toast.error(
        error.response?.data?.message || "Failed to delete conversation",
      );
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
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
    } catch (error) {
      toast.error(error.reponse?.data?.message);
    }
  };

  const handleLoadMoreMessages = (receiverId) => {
    if (!hasMoreMessages || loadingMoreMessages) return;
    return handleGetMessage(receiverId, false, true);
  };

  const handleBlockUser = async (receiverId) => {
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/user/block/${receiverId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        },
      );
      if (res.data.success) {
        const updatedUser = { ...user };
        if (res.data.blocked) {
          updatedUser.blockedUsers = [...user.blockedUsers, receiverId];
        } else {
          updatedUser.blockedUsers = user.blockedUsers.filter(
            (id) => id !== receiverId,
          );
        }
        dispatch(loginSuccess(updatedUser));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (user) {
      didRunRef.current = false;
      lastLoadedUserIdRef.current = null;
      handleGetChatList();
      handleGetContacts();
      handleGetNotifications();
      handleGetUnreadMessages();
      handleGetListFriend();
    } else {
      didRunRef.current = false;
      lastLoadedUserIdRef.current = null;
      setContacts([]);
      setMessages([]);
      setChatList([]);
      setUnreadMessages([]);
      setNotifications([]);
      setFriendList([]);
      setReceiver(null);
    }
  }, [user]);

  useEffect(() => {
    if (!chatList.length || !user?._id) return;

    const firstChat = chatList[0];
    const partner =
      firstChat.senderId._id === user._id
        ? firstChat.receiverId
        : firstChat.senderId;

    if (lastLoadedUserIdRef.current === partner._id) return;

    const isMobile = window.innerWidth <= 768;
    if (!isMobile) {
      setOpenChatBox(partner._id);
      handleGetMessage(partner._id, true);
    }
    handleGetReceiver(partner._id);
    lastLoadedUserIdRef.current = partner._id;
  }, [chatList, handleGetMessage, handleGetReceiver, setOpenChatBox, user]);

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
        handlePinnedMessage,
        handleGetNotifications,
        handleGetListFriend,
        handleBlockUser,
        handleReadAllNotifications,
        handleReadSingleNotification
      }}
    >
      {children}
    </AxiosContext.Provider>
  );
}
