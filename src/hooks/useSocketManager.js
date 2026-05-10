import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';

import { SOCKET_URL } from '@/config/utils';
import { loginSuccess } from '@/redux/authSlice';
import ringTone from '@/assets/sounds/facebook_call.mp3';
import { getMessageLayoutMeta } from '@/utils/messageLayout';

export function useSocketManager({ axiosContext, openContext }) {
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
    setNotifications,
    setFriendList,
    receiver,
    handleGetReceiver,
    handleGetMessage,
  } = axiosContext;
  const { setOpenAudioCallModal, setOpenVideoCallModal } = openContext;

  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [partnerId, setPartnerId] = useState('');
  const [blockedBy, setBlockedBy] = useState({});
  const [currentCallIsVideo, setCurrentCallIsVideo] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isVideoMinimized, setIsVideoMinimized] = useState(false);

  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioRef = useRef(null);
  const messageAudioRef = useRef(null);
  const callTimeoutRef = useRef(null);

  const cleanupCall = useCallback(() => {
    peerRef.current?.close();
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    peerRef.current = null;
    localStreamRef.current = null;

    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    if (localVideoRef.current) localVideoRef.current.srcObject = null;

    setOpenAudioCallModal(null);
    setOpenVideoCallModal(null);
    setIncomingCall(null);
    setCallState('idle');
    setCallDuration(0);
    setCurrentCallIsVideo(false);
    setLocalStream(null);
    setRemoteStream(null);
    setIsVideoMinimized(false);
  }, [setOpenAudioCallModal, setOpenVideoCallModal]);

  const handleAddedContact = useCallback(
    (notification) => {
      setNotifications((prev) => [...prev, notification]);
      dispatch(
        loginSuccess({
          ...user,
          notifications: [...(user?.notifications || []), notification._id],
        })
      );
    },
    [dispatch, setNotifications, user]
  );

  const handleSendMessage = useCallback(
    (message) => {
      if (message?.senderId?._id !== user?._id) {
        let muted = [];
        try {
          const raw = localStorage.getItem('muted_users');
          muted = raw ? JSON.parse(raw) : [];
        } catch {
          muted = [];
        }

        const senderId = String(message?.senderId?._id || '');
        if (!muted.includes(senderId) && messageAudioRef.current) {
          try {
            messageAudioRef.current.currentTime = 0;
            messageAudioRef.current.play().catch((error) => {
              console.log('Không thể phát âm thanh tin nhắn:', error);
            });
          } catch (error) {
            console.log('Lỗi phát âm thanh tin nhắn:', error);
          }
        }

        setChatList((prev) => {
          const existingChatIndex = prev.findIndex((chat) => {
            const partner =
              chat.senderId._id === user?._id ? chat.receiverId._id : chat.senderId._id;
            return String(partner) === String(senderId);
          });

          if (existingChatIndex !== -1) {
            const existingChat = prev[existingChatIndex];
            const updatedChat = {
              ...existingChat,
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount:
                receiver && receiver._id === senderId
                  ? existingChat.unreadCount
                  : (existingChat.unreadCount || 0) + 1,
            };
            const updatedList = [...prev];
            updatedList.splice(existingChatIndex, 1);
            return [updatedChat, ...updatedList];
          }

          return [
            {
              senderId: message.senderId,
              receiverId: message.receiverId,
              lastMessage: message.content,
              lastMessageTime: message.createdAt,
              unreadCount: 1,
            },
            ...prev,
          ];
        });
      }

      const isMessageForCurrentUser =
        String(message?.senderId?._id) === String(user?._id) ||
        String(message?.receiverId?._id) === String(user?._id);

      const currentReceiverId = String(receiver?._id || receiver?.receiver?._id || '');
      const isCurrentChat =
        receiver &&
        (currentReceiverId === String(message?.senderId?._id) ||
          currentReceiverId === String(message?.receiverId?._id));

      if (isMessageForCurrentUser && isCurrentChat) {
        setMessages((prev) => {
          // Tránh lặp tin nhắn nếu tin nhắn đã tồn tại (check _id)
          if (prev.some((m) => m._id === message._id)) return prev;

          // Tìm tin nhắn tạm (optimistic) để thay thế
          // Ưu tiên khớp content và senderId
          const optimisticIdx = prev.findIndex(
            (m) =>
              m.isOptimistic &&
              String(m.senderId._id) === String(message.senderId._id) &&
              m.content === message.content
          );

          if (optimisticIdx !== -1) {
            const updatedMessages = [...prev];
            const meta = getMessageLayoutMeta(prev, message, optimisticIdx);
            updatedMessages[optimisticIdx] = { ...message, showAvatar: meta.showAvatar };
            return updatedMessages;
          }

          const showAvatar = getMessageLayoutMeta(prev, message, prev.length).showAvatar;
          return [...prev, { ...message, showAvatar }];
        });
      } else if (isMessageForCurrentUser && !receiver) {

        const partner =
          String(message?.senderId?._id) === String(user?._id)
            ? message?.receiverId?._id
            : message?.senderId?._id;
        if (partner) {
          handleGetReceiver(partner);
          handleGetMessage(partner, true);
        }
      }
    },
    [handleGetMessage, handleGetReceiver, receiver, setChatList, setMessages, user]
  );

  const handleReactMessage = useCallback(
    (data) => {
      const { messageId, emoji } = data;
      setMessages((prev) => prev.map((msg) => (msg._id === messageId ? { ...msg, emoji } : msg)));
    },
    [setMessages]
  );

  const handleChangeStatus = useCallback(
    ({ userId, status }) => {
      setReceiver((prev) => {
        if (!prev) return prev;
        if (prev._id && String(prev._id) === String(userId)) return { ...prev, status };
        if (prev.receiver && String(prev.receiver._id) === String(userId)) {
          return { ...prev, receiver: { ...prev.receiver, status } };
        }
        return prev;
      });

      setChatList((prev) =>
        prev.map((chat) => {
          const partner = chat.senderId._id === user?._id ? chat.receiverId : chat.senderId;
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
        })
      );
    },
    [setChatList, setReceiver, user]
  );

  const handleUpdateChatList = useCallback(
    ({ partnerId: partner, lastMessage, unreadCount }) => {
      setChatList((prev) => {
        const idx = prev.findIndex(
          (c) => c.senderId._id === partner || c.receiverId._id === partner
        );
        if (idx !== -1) {
          return [
            { ...prev[idx], ...lastMessage, unreadCount },
            ...prev.filter((_, i) => i !== idx),
          ];
        }
        return [{ ...lastMessage, unreadCount }, ...prev];
      });
    },
    [setChatList]
  );

  const handleReadMessage = useCallback(
    (message) => {
      setUnreadMessages(message);
      setChatList((prev) =>
        prev.map((chat) => {
          const partner =
            chat.senderId._id === message?.senderId?._id ? chat.senderId._id : chat.receiverId._id;
          return partner === message?.senderId?._id ? { ...chat, unreadCount: 0 } : chat;
        })
      );
    },
    [setChatList, setUnreadMessages]
  );

  const handleRevokeMessage = useCallback(
    ({ messageId, isRevoked }) => {
      setMessages((prevMessages) =>
        prevMessages.map((msg) => (msg._id === messageId ? { ...msg, isRevoked } : msg))
      );
    },
    [setMessages]
  );

  const handlePinnedMessage = useCallback(
    (data) => {
      setMessages((prev) =>
        prev.map((msg) => (msg._id === data._id ? { ...msg, isPinned: data.isPinned } : msg))
      );
    },
    [setMessages]
  );

  const handleReceiveCall = useCallback(
    ({ from, signalData, isVideo, start }) => {
      if (peerRef.current) return;
      setIncomingCall({ from, signalData, isVideo, start });
      setCallState('incoming');
      setPartnerId(from._id);
      setCurrentCallIsVideo(isVideo);
      if (isVideo) setOpenVideoCallModal(from);
      else setOpenAudioCallModal(from);
    },
    [setOpenAudioCallModal, setOpenVideoCallModal]
  );

  const handleAnswer = useCallback(async ({ signalData }) => {
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (peerRef.current) {
      await peerRef.current.setRemoteDescription(new RTCSessionDescription(signalData));
    }
    setCallState('inCall');
    setCallDuration(0);
  }, []);

  const handleNewICE = useCallback(async ({ candidate }) => {
    try {
      if (peerRef.current) {
        await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      return toast.error('❌ Error adding ICE candidate:', error);
    }
  }, []);

  const startCall = useCallback(
    async ({ _id, username, avatar }, isVideo = true) => {
      try {
        if (peerRef.current) return;
        setCallState('outgoing');
        setPartnerId(_id);
        setCurrentCallIsVideo(isVideo);
        if (isVideo) setOpenVideoCallModal({ _id, username, avatar });
        else setOpenAudioCallModal({ _id, username, avatar });

        const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
        localStreamRef.current = stream;
        setLocalStream(stream);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerRef.current = peer;
        if (peer.getSenders().length === 0) {
          stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        }
        peer.onicecandidate = (event) => {
          if (event.candidate) {
            socket.current.emit('iceCandidate', {
              to: _id,
              candidate: event.candidate,
            });
          }
        };
        peer.ontrack = (event) => {
          const remote = event.streams[0];
          remoteStreamRef.current = remote;
          setRemoteStream(remote);
          if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
        };

        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const start = Date.now();
        socket.current.emit('callUser', {
          to: _id,
          from: { _id: user._id, username: user.username, avatar: user.avatar },
          signalData: offer,
          type: 'offer',
          isVideo,
          start,
        });

        callTimeoutRef.current = setTimeout(() => {
          socket.current.emit('missedCall', {
            to: _id,
            from: { _id: user._id, username: user.username, avatar: user.avatar },
            isVideo,
          });
          cleanupCall();
        }, 10000);

        setCallDuration(0);
      } catch (error) {
        toast.error('❌ startCall error: ' + error.message);
      }
    },
    [cleanupCall, setOpenAudioCallModal, setOpenVideoCallModal, user]
  );

  const acceptCall = useCallback(async () => {
    try {
      const { from, signalData, isVideo, start } = incomingCall || {};
      if (!from || !signalData) return;

      const stream = await navigator.mediaDevices.getUserMedia({ video: isVideo, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const peer = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });
      peerRef.current = peer;
      if (peer.getSenders().length === 0) {
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      }
      peer.onicecandidate = (event) => {
        if (event.candidate) {
          socket.current.emit('iceCandidate', {
            to: from._id,
            candidate: event.candidate,
          });
        }
      };
      peer.ontrack = (event) => {
        const remote = event.streams[0];
        remoteStreamRef.current = remote;
        setRemoteStream(remote);
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = remote;
      };

      await peer.setRemoteDescription(new RTCSessionDescription(signalData));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.current.emit('answerCall', {
        to: from._id,
        signalData: answer,
        type: 'answer',
      });
      setIncomingCall(null);
      setCallState('inCall');
      setCallDuration(start ? Math.floor((Date.now() - start) / 1000) : 0);
    } catch (error) {
      console.error('❌ acceptCall error:', error);
      toast.error('❌ acceptCall error: ' + error.message);
    }
  }, [incomingCall]);

  const endCall = useCallback(() => {
    const otherId = incomingCall ? incomingCall.from._id : partnerId;

    if (otherId && callState === 'inCall') {
      socket.current.emit('endCall', {
        to: otherId,
        from: { _id: user._id, username: user.username, avatar: user.avatar },
        duration: callDuration,
        isVideo: currentCallIsVideo,
      });
    } else if (otherId) {
      socket.current.emit('endCall', { to: otherId });
    }

    cleanupCall();
  }, [callDuration, callState, cleanupCall, currentCallIsVideo, incomingCall, partnerId, user]);

  const handleCallEnded = useCallback(() => {
    cleanupCall();
  }, [cleanupCall]);

  useEffect(() => {
    let interval;
    if (callState === 'inCall') {
      interval = setInterval(() => setCallDuration((prev) => prev + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (!user?._id) return;

    socket.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket'],
    });

    return () => {
      socket.current?.disconnect();
      socket.current = null;
    };
  }, [user?._id]);

  useEffect(() => {
    if (!socket.current || !user?._id) return;

    const socketInstance = socket.current;
    const onConnect = () => {
      socketInstance.emit('join', user._id);
      dispatch(loginSuccess({ ...user, status: 'available' }));
    };

    const onTyping = ({ senderId }) => setTypingUserId(senderId);
    const onStopTyping = () => setTypingUserId(null);
    const onUnreadMessage = ({ message }) => {
      setUnreadMessages((prev) => [...prev, message]);
    };
    const onFriendOnline = (friend) => {
      setFriendList((prev) => {
        const exists = prev.some((f) => f._id === friend._id);
        if (exists) {
          return friend.status === 'available'
            ? prev.map((f) => (f._id === friend._id ? { ...f, status: friend.status } : f))
            : prev.filter((f) => f._id !== friend._id);
        }
        return friend.status === 'available' ? [...prev, friend] : prev;
      });
    };
    const onBlockedByUser = ({ userId }) => setBlockedBy((prev) => ({ ...prev, [userId]: true }));
    const onUnblockedByUser = ({ userId }) =>
      setBlockedBy((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    const onBroadcastNotification = (data) => setBroadcastMessage(data);
    const onMissedCall = () => {
      cleanupCall();
    };

    const onMissedCallNotification = (noti) => {
      setNotifications((prev) => [noti, ...prev]);
      dispatch(
        loginSuccess({
          ...user,
          notifications: [...(user?.notifications || []), noti._id],
        })
      );
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('addedContact', handleAddedContact);
    socketInstance.on('contactAccepted', handleGetContacts);
    socketInstance.on('contactDeleted', handleGetContacts);
    socketInstance.on('sendMessage', handleSendMessage);
    socketInstance.on('reactMessage', handleReactMessage);
    socketInstance.on('typing', onTyping);
    socketInstance.on('stopTyping', onStopTyping);
    socketInstance.on('unreadMessage', onUnreadMessage);
    socketInstance.on('readMessage', handleReadMessage);
    socketInstance.on('revokeMessage', handleRevokeMessage);
    socketInstance.on('pinnedMessage', handlePinnedMessage);
    socketInstance.on('changeStatus', handleChangeStatus);
    socketInstance.on('updateChatList', handleUpdateChatList);
    socketInstance.on('friendOnline', onFriendOnline);
    socketInstance.on('blockedByUser', onBlockedByUser);
    socketInstance.on('unblockedByUser', onUnblockedByUser);
    socketInstance.on('broadcastNotification', onBroadcastNotification);
    socketInstance.on('callUser', handleReceiveCall);
    socketInstance.on('answerCall', handleAnswer);
    socketInstance.on('iceCandidate', handleNewICE);
    socketInstance.on('missedCall', onMissedCall);
    socketInstance.on('missedCallNotification', onMissedCallNotification);
    socketInstance.on('callEnded', handleCallEnded);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('addedContact', handleAddedContact);
      socketInstance.off('contactAccepted', handleGetContacts);
      socketInstance.off('contactDeleted', handleGetContacts);
      socketInstance.off('sendMessage', handleSendMessage);
      socketInstance.off('reactMessage', handleReactMessage);
      socketInstance.off('typing', onTyping);
      socketInstance.off('stopTyping', onStopTyping);
      socketInstance.off('unreadMessage', onUnreadMessage);
      socketInstance.off('readMessage', handleReadMessage);
      socketInstance.off('revokeMessage', handleRevokeMessage);
      socketInstance.off('pinnedMessage', handlePinnedMessage);
      socketInstance.off('changeStatus', handleChangeStatus);
      socketInstance.off('updateChatList', handleUpdateChatList);
      socketInstance.off('friendOnline', onFriendOnline);
      socketInstance.off('blockedByUser', onBlockedByUser);
      socketInstance.off('unblockedByUser', onUnblockedByUser);
      socketInstance.off('broadcastNotification', onBroadcastNotification);
      socketInstance.off('callUser', handleReceiveCall);
      socketInstance.off('answerCall', handleAnswer);
      socketInstance.off('iceCandidate', handleNewICE);
      socketInstance.off('missedCall', onMissedCall);
      socketInstance.off('missedCallNotification', onMissedCallNotification);
      socketInstance.off('callEnded', handleCallEnded);
    };
  }, [
    dispatch,
    endCall,
    handleCallEnded,
    handleAddedContact,
    handleAnswer,
    handleChangeStatus,
    handleGetContacts,
    handleNewICE,
    handlePinnedMessage,
    handleReadMessage,
    handleReactMessage,
    handleRevokeMessage,
    handleReceiveCall,
    handleSendMessage,
    handleUpdateChatList,
    setFriendList,
    setNotifications,
    setOpenAudioCallModal,
    setOpenVideoCallModal,
    setTypingUserId,
    setUnreadMessages,
    user,
  ]);

  useEffect(() => {
    if (callState === 'outgoing' || callState === 'incoming') {
      audioRef.current = new Audio(ringTone);
      audioRef.current.loop = true;
      audioRef.current.play().catch((err) => console.error('Autoplay blocked:', err));
    } else if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [callState]);

  return {
    socket: socket.current,
    incomingCall,
    callState,
    callDuration,
    partnerId,
    blockedBy,
    currentCallIsVideo,
    broadcastMessage,
    localStream,
    remoteStream,
    isVideoMinimized,
    setIsVideoMinimized,
    startCall,
    endCall,
    acceptCall,
    clearBroadcast: () => setBroadcastMessage(null),
    localVideoRef,
    remoteVideoRef,
    remoteStreamRef,
    messageAudioRef,
  };
}
