import { useDispatch, useSelector } from "react-redux";
import { createContext, useEffect, useRef, useState, useContext } from "react";
import { io } from "socket.io-client";

import { SOCKET_URL } from "../config/utils";
import { loginSuccess } from "../redux/authSlice";
import { AxiosContext } from "./AxiosContext";
import { toast } from "react-toastify";
import { OpenContext } from "./OpenContext";
import ringTone from "../assets/sounds/facebook_call.mp3";
import messageSound from "../assets/sounds/facebook_message.mp3";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext();

function SocketProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const socket = useRef(null);

  const {
    handleGetContacts,
    setMessages,
    setReceiver,
    setChatList,
    setUnreadMessages,
    setTypingUserId,
    notifications,
    setNotifications,
    setFriendList,
    receiver,
    handleGetReceiver,
    handleGetMessage,
  } = useContext(AxiosContext);
  const { setOpenAudioCallModal, setOpenVideoCallModal } =
    useContext(OpenContext);

  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState("idle");
  const [callDuration, setCallDuration] = useState(0);
  const [partnerId, setPartnerId] = useState("");
  const [blockedBy, setBlockedBy] = useState({});
  const [currentCallIsVideo, setCurrentCallIsVideo] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(null);

  // ref for calls
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);
  const messageAudioRef = useRef(null);
  const callTimeoutRef = useRef(null);

  const handleAddedContact = (notification) => {
    console.log("📨 New friend request:", notification);

    setNotifications((prev) => [...prev, notification]);

    // Cập nhật redux state user
    dispatch(
      loginSuccess({
        ...user,
        notifications: [...(user?.notifications || []), notification._id],
      }),
    );
  };

  const handleSendMessage = (message) => {
    console.log("📨 New message received:", message);
    console.log("📨 Current user ID:", user?._id);
    console.log("📨 Message sender ID:", message?.senderId?._id);

    // Phát âm thanh khi nhận tin nhắn mới (chỉ khi không phải tin nhắn của chính mình)
    if (message?.senderId?._id !== user?._id) {
      // Kiểm tra danh sách user bị mute (localStorage)
      let muted = [];
      try {
        const raw = localStorage.getItem("muted_users");
        muted = raw ? JSON.parse(raw) : [];
      } catch (error) {
        muted = [];
      }
      const senderId = String(message?.senderId?._id || "");
      const isMuted = muted.includes(senderId);
      if (!isMuted) {
        try {
          if (messageAudioRef.current) {
            messageAudioRef.current.currentTime = 0; // Reset về đầu file
            messageAudioRef.current.play().catch((error) => {
              console.log("Không thể phát âm thanh tin nhắn:", error);
            });
          }
        } catch (error) {
          console.log("Lỗi phát âm thanh tin nhắn:", error);
        }
      }

      // Cập nhật chat list khi nhận tin nhắn từ người khác
      setChatList((prev) => {
        const senderId = message?.senderId?._id;
        const existingChatIndex = prev.findIndex((chat) => {
          const partnerId =
            chat.senderId._id === user?._id
              ? chat.receiverId._id
              : chat.senderId._id;
          return String(partnerId) === String(senderId);
        });

        if (existingChatIndex !== -1) {
          // Cập nhật chat hiện có và di chuyển lên đầu
          const existingChat = prev[existingChatIndex];
          const updatedChat = {
            ...existingChat,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            // Chỉ tăng unreadCount nếu không phải chat hiện tại đang mở
            unreadCount:
              receiver && receiver._id === senderId
                ? existingChat.unreadCount
                : (existingChat.unreadCount || 0) + 1,
          };

          // Di chuyển chat lên đầu danh sách
          const updatedList = [...prev];
          updatedList.splice(existingChatIndex, 1);
          return [updatedChat, ...updatedList];
        } else {
          // Tạo chat mới nếu chưa tồn tại
          const newChat = {
            senderId: message.senderId,
            receiverId: message.receiverId,
            lastMessage: message.content,
            lastMessageTime: message.createdAt,
            unreadCount: 1,
          };
          return [newChat, ...prev];
        }
      });
    }

    // Cập nhật messages nếu tin nhắn liên quan đến user hiện tại
    // Check if message is for current user (either as sender or receiver)
    const isMessageForCurrentUser =
      String(message?.senderId?._id) === String(user?._id) || // Mình là người gửi
      String(message?.receiverId?._id) === String(user?._id); // Mình là người nhận

    // Check if this is the currently open chat
    // Check both direct receiver structure and nested receiver structure
    const isCurrentChat =
      receiver &&
      (String(receiver._id || receiver?.receiver?._id) ===
        String(message?.senderId?._id) ||
        String(receiver._id || receiver?.receiver?._id) ===
          String(message?.receiverId?._id));

    if (isMessageForCurrentUser && isCurrentChat) {
      setMessages((prev) => {
        if (prev.length > 0) {
          const lastMsg = prev[prev.length - 1];

          if (lastMsg.senderId._id === message?.senderId?._id) {
            // Tắt avatar ở tin trước
            const updated = [...prev];
            updated[updated.length - 1] = { ...lastMsg, showAvatar: false };

            // Bật avatar cho tin mới - giữ nguyên showAvatar từ server
            return [...updated, { ...message, showAvatar: message.showAvatar }];
          }
        }

        // Nếu sender khác -> giữ nguyên showAvatar từ server
        return [...prev, { ...message, showAvatar: message.showAvatar }];
      });
    } else if (isMessageForCurrentUser && !receiver) {
      // Xác định partner ID (người đang chat với user hiện tại)
      const partnerId =
        String(message?.senderId?._id) === String(user?._id)
          ? message?.receiverId?._id
          : message?.senderId?._id;
      if (partnerId) {
        // Set receiver và load messages
        handleGetReceiver(partnerId);
        handleGetMessage(partnerId, true);
      }
    }
  };

  const handleReactMessage = (data) => {
    console.log("data", data);

    const { messageId, emoji } = data;

    setMessages((prev) =>
      prev.map((msg) => (msg._id === messageId ? { ...msg, emoji } : msg)),
    );
  };

  const handleChangeStatus = ({ userId, status }) => {
    // Cập nhật receiver ở cả 2 trường hợp: receiver là user object trực tiếp hoặc nested ở prev.receiver
    setReceiver((prev) => {
      if (!prev) return prev;
      // Trường hợp receiver lưu trực tiếp là user
      if (prev._id && String(prev._id) === String(userId)) {
        return { ...prev, status };
      }
      // Trường hợp receiver là object bao gồm { receiver, files, pinnedMessages, ... }
      if (prev.receiver && String(prev.receiver._id) === String(userId)) {
        return { ...prev, receiver: { ...prev.receiver, status } };
      }
      return prev;
    });

    // Cập nhật status trong chatList
    setChatList((prev) =>
      prev.map((chat) => {
        const partner =
          chat.senderId._id === user?._id ? chat.receiverId : chat.senderId;
        return String(partner._id) === String(userId)
          ? {
              ...chat,
              senderId:
                String(chat.senderId._id) === String(userId)
                  ? { ...chat.senderId, status }
                  : chat.senderId,
              receiverId:
                String(chat.receiverId._id) === String(userId)
                  ? { ...chat.receiverId, status }
                  : chat.receiverId,
            }
          : chat;
      }),
    );
  };

  const handleUpdateChatList = ({ partnerId, lastMessage, unreadCount }) => {
    setChatList((prev) => {
      const idx = prev.findIndex(
        (c) => c.senderId._id === partnerId || c.receiverId._id === partnerId,
      );

      if (idx !== -1) {
        // update item cũ → format lại cho chuẩn
        const updated = {
          ...prev[idx],
          ...lastMessage, // cập nhật nội dung cuối
          unreadCount, // số tin chưa đọc mới
        };
        return [updated, ...prev.filter((_, i) => i !== idx)];
      } else {
        // nếu chưa có → tạo object mới đúng format
        const newItem = {
          ...lastMessage,
          unreadCount,
        };
        return [newItem, ...prev];
      }
    });
  };

  const handleReadMessage = (message) => {
    setUnreadMessages(message);
    setChatList((prev) => {
      return prev.map((chat) => {
        const partnerId =
          chat.senderId._id === message?.senderId?._id
            ? chat.senderId._id
            : chat.receiverId._id;

        // Nếu partner trùng với sender trong sự kiện readMessage → reset unreadCount về 0
        if (partnerId === message?.senderId?._id) {
          return {
            ...chat,
            unreadCount: 0,
          };
        }
        return chat;
      });
    });
  };

  const handleRevokeMessage = ({ messageId, isRevoked }) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg._id === messageId ? { ...msg, isRevoked } : msg,
      ),
    );
  };

  const handlePinnedMessage = (data) => {
    console.log("pin message", data);
    setMessages((prev) =>
      prev.map((msg) =>
        msg._id === data._id ? { ...msg, isPinned: data.isPinned } : msg,
      ),
    );
  };

  // Caller bắt đầu gọi
  const startCall = async ({ _id, username, avatar }, isVideo = true) => {
    try {
      if (peerRef.current) {
        console.warn("⚠️ Peer đã tồn tại, không tạo mới");
        return;
      }

      setCallState("outgoing");
      setPartnerId(_id);
      setCurrentCallIsVideo(isVideo);

      // 🔹 mở modal ngay cho caller
      if (isVideo) {
        setOpenVideoCallModal({ _id, username, avatar });
      } else {
        setOpenAudioCallModal({ _id, username, avatar });
      }

      console.log("📞 [startCall] Bắt đầu gọi...", { _id, isVideo });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;

      // Add track nếu chưa có
      if (peer.getSenders().length === 0) {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("iceCandidate", {
            to: _id,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      const offer = await peer.createOffer();
      await peer.setLocalDescription(offer);
      const start = Date.now();

      socket.current.emit("callUser", {
        to: _id,
        from: { _id: user._id, username: user.username, avatar: user.avatar },
        signalData: offer,
        type: "offer",
        isVideo,
        start,
      });
      // ⏱ Timeout check missed call
      callTimeoutRef.current = setTimeout(() => {
        socket.current.emit("missedCall", {
          to: _id,
          from: { _id: user._id, username: user.username, avatar: user.avatar },
          isVideo,
        });
        endCall(); // đóng modal, reset state
      }, 10000);

      setCallDuration(0);
      console.log("📡 Offer gửi tới partner:", _id);
    } catch (error) {
      console.error("❌ startCall error:", error);
      toast.error("❌ startCall error: " + error.message);
    }
  };

  // Khi có cuộc gọi đến → chỉ lưu state, chưa trả lời ngay
  const handleReceiveCall = ({ from, signalData, isVideo, start }) => {
    if (peerRef.current) {
      console.warn("⚠️ Đang trong cuộc gọi, không nhận thêm");
      return;
    }
    setIncomingCall({ from, signalData, isVideo, start });
    setCallState("incoming");
    setPartnerId(from._id);
    setCurrentCallIsVideo(isVideo);

    if (isVideo) {
      setOpenVideoCallModal(from);
    } else {
      setOpenAudioCallModal(from);
    }
  };

  const handleAnswer = async ({ signalData }) => {
    // ⏹ Clear timeout khi bên kia bắt máy
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    if (peerRef.current) {
      await peerRef.current.setRemoteDescription(
        new RTCSessionDescription(signalData),
      );
    }
    setCallState("inCall");
    setCallDuration(0);
  };

  const handleNewICE = async ({ candidate }) => {
    try {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      return toast.error("❌ Error adding ICE candidate:", error);
    }
  };

  // Khi user bấm Accept → mới tạo peer và gửi answer
  const acceptCall = async () => {
    try {
      const { from, signalData, isVideo, start } = incomingCall;
      console.log(from);
      if (!from || !signalData) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true,
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      peerRef.current = peer;

      if (peer.getSenders().length === 0) {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      }

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit("iceCandidate", {
            to: from,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      await peer.setRemoteDescription(new RTCSessionDescription(signalData));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);

      socket.current.emit("answerCall", {
        to: from._id,
        signalData: answer,
        type: "answer",
      });
      setIncomingCall(null);
      setCallState("inCall");
      if (start) {
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setCallDuration(elapsed);
      } else {
        setCallDuration(0);
      }
    } catch (error) {
      console.error("❌ acceptCall error:", error);
      toast.error("❌ acceptCall error: " + error.message);
    }
  };

  const endCall = () => {
    const otherId = incomingCall ? incomingCall.from._id : partnerId; // id người kia khi đang in/outgoing

    if (otherId && callState === "inCall") {
      // Chỉ lưu cuộc gọi nếu đã kết nối thành công
      socket.current.emit("endCall", {
        to: otherId,
        from: { _id: user._id, username: user.username, avatar: user.avatar },
        duration: callDuration,
        isVideo: currentCallIsVideo,
      });
    } else if (otherId) {
      // Nếu chưa kết nối thì chỉ emit endCall đơn giản
      socket.current.emit("endCall", { to: otherId });
    }

    // Dọn peer & stream
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current = null;
    localStreamRef.current = null;

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    // Đóng modal và reset state
    setOpenAudioCallModal(null);
    setOpenVideoCallModal(null);
    setIncomingCall(null);
    setCallState("idle");
    setCallDuration(0);
    setCurrentCallIsVideo(false);
  };

  useEffect(() => {
    let interval;
    if (callState === "inCall") {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (!user?._id) return; // Chỉ connect socket khi đã có user

    socket.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ["websocket"],
    });

    socket.current.on("connect", () => {
      console.log("✅ Socket connected successfully");
      console.log("🔗 Joining room for user:", user._id);
      socket.current.emit("join", user._id); // Join room theo userId
      dispatch(loginSuccess({ ...user, status: "available" }));
    });

    // contact socket
    socket.current.on("addedContact", handleAddedContact);
    socket.current.on("contactAccepted", () => {
      handleGetContacts();
    });
    socket.current.on("contactDeleted", () => {
      handleGetContacts();
    });
    // -------- //

    // message socket //
    socket.current.on("sendMessage", (data) => {
      console.log("🎧 Received sendMessage event:", data);
      handleSendMessage(data);
    });
    socket.current.on("reactMessage", handleReactMessage);
    socket.current.on("typing", ({ senderId }) => {
      setTypingUserId(senderId);
    });
    socket.current.on("stopTyping", ({ senderId }) => {
      console.log("sender:", senderId);
      setTypingUserId(null);
    });
    socket.current.on("unreadMessage", ({ message }) => {
      console.log("message:", message);
      setUnreadMessages((prev) => [...prev, message]);
    });
    socket.current.on("readMessage", handleReadMessage);
    socket.current.on("revokeMessage", handleRevokeMessage);
    socket.current.on("pinnedMessage", handlePinnedMessage);

    // -------- //

    // user socket //
    socket.current.on("changeStatus", handleChangeStatus);
    socket.current.on("updateChatList", handleUpdateChatList);
    socket.current.on("friendOnline", (friend) => {
      setFriendList((prev) => {
        const exists = prev.some((f) => f._id === friend._id);
        if (exists) {
          return friend.status === "available"
            ? prev.map((f) =>
                f._id === friend._id ? { ...f, status: friend.status } : f,
              )
            : prev.filter((f) => f._id !== friend._id);
        }
        return friend.status === "available" ? [...prev, friend] : prev;
      });
    });

    socket.current.on("blockedByUser", ({ userId }) => {
      console.log("🚫 Bạn đã bị block bởi:", userId);
      setBlockedBy((prev) => ({ ...prev, [userId]: true }));
    });

    socket.current.on("unblockedByUser", ({ userId }) => {
      console.log("🔓 Bạn đã được unblock bởi:", userId);
      setBlockedBy((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    });
    // -------- //

    // broadcast from admin
    socket.current.on("broadcastNotification", (data) => {
      console.log("📢 Broadcast received:", data);
      setBroadcastMessage(data);
    });
    // -------- //

    //======= CALL EVENTS ====== //
    socket.current.on("callUser", handleReceiveCall);
    socket.current.on("answerCall", handleAnswer);
    socket.current.on("iceCandidate", handleNewICE);
    socket.current.on("missedCall", () => {
      // Show thông báo "cuộc gọi nhỡ"
      setCallState("idle");
      setOpenVideoCallModal(null);
      setOpenAudioCallModal(null);
    });
    socket.current.on("missedCallNotification", (noti) => {
      console.log("🔔 Missed call mới:", noti);
      // Ví dụ: push vào state notifications
      setNotifications((prev) => [noti, ...prev]);
      dispatch(
        loginSuccess({
          ...user,
          notifications: [
            ...(user?.notifications || []),
            noti._id, // chỉ push ID
          ],
        }),
      );
    });

    socket.current.on("callEnded", () => {
      endCall();
    });
    //============================//

    return () => {
      socket.current.off("connect");
      socket.current.off("addedContact");
      socket.current.off("contactAccepted");
      socket.current.off("contactDeleted");
      socket.current.off("sendMessage");
      socket.current.off("reactMessage");
      socket.current.off("changeStatus");
      socket.current.off("typing");
      socket.current.off("stopTyping");
      socket.current.off("unreadMessage");
      socket.current.off("readMessage");
      socket.current.off("updateChatList");
      socket.current.off("revokeMessage");
      socket.current.off("callUser");
      socket.current.off("answerCall");
      socket.current.off("iceCandidate");
      socket.current.off("callEnded");
      socket.current.off("blockedByUser");
      socket.current.off("unblockedByUser");
      socket.current.off("pinnedMessage");
      socket.current.off("broadcastNotification");

      socket.current.disconnect();
    };
  }, [user?._id]); // Reconnect khi user thay đổi

  useEffect(() => {
    if (callState === "outgoing" || callState === "incoming") {
      audioRef.current = new Audio(ringTone);
      audioRef.current.loop = true;
      audioRef.current
        .play()
        .catch((err) => console.error("Autoplay blocked:", err));
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [callState]);

  return (
    <SocketContext.Provider
      value={{
        notifications,
        socket: socket.current,
        localVideoRef,
        remoteVideoRef,
        remoteStreamRef,
        callDuration,
        callState,
        blockedBy,
        startCall,
        endCall,
        acceptCall,
        broadcastMessage,
        clearBroadcast: () => setBroadcastMessage(null),
      }}
    >
      {children}
      {/* Audio element cho âm thanh tin nhắn */}
      <audio ref={messageAudioRef} preload="auto">
        <source src={messageSound} type="audio/mpeg" />
      </audio>
    </SocketContext.Provider>
  );
}

export default SocketProvider;
