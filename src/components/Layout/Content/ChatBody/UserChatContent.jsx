import {
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { SyncLoader } from "react-spinners";

import { ThemeContext } from "@/context/ThemeContext";
import { OpenContext } from "@/context/OpenContext";
import MessageSkeleton from "@/shared/Skeleton/MessageSkeleton";
import { SocketContext } from "@/context/SocketContext";
import { AxiosContext } from "@/context/AxiosContext";
import { MessageItem } from "./Messages";
import { getMessageLayoutMeta } from "@/utils/messageLayout";

import "../userchat.scss";
function UserChatContent({
  messages,
  receiver,
  endRef,
  hightlightMessage,
  setHighlightMessage,
}) {
  const user = useSelector((state) => state?.auth?.user);
  const reactionRef = useRef();
  const messageRefs = useRef({});
  const prevMessagesLength = useRef(0);
  const chatRef = useRef(null);

  const { theme } = useContext(ThemeContext);
  const { setOpenReactModal, setOpenRevokeMessageModal, setOpenToolbox } =
    useContext(OpenContext);
  const {
    loadingMessages,
    loadingMoreMessages,
    handleLoadMoreMessages,
    hasMoreMessages,
    handleDeleteMessage,
    handlePinnedMessage,
    handleReactionMessage,
    searchMessages,
    currentIndex,
  } = useContext(AxiosContext);
  const { blockedBy, typingUserId } = useContext(SocketContext);

  const [dropdownMenu, setDropdownMenu] = useState(null);
  const [openReactionEmoji, setOpenReactionEmoji] = useState(null);
  const [longpress, setLongpress] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Loại bỏ trùng _id trước khi render để tránh trùng key
  const uniqueDisplayMessages = useMemo(() => {
    const baseMessages =
      typingUserId === receiver?._id
        ? [
            ...messages,
            {
              _id: "typing-indicator",
              type: "typing",
              avatar: receiver.avatar,
            },
          ]
        : messages;

    const seen = new Set();
    const result = [];

    for (const msg of baseMessages) {
      const key =
        msg && msg._id ? String(msg._id) : `temp-${msg?.type || "unknown"}`;

      if (seen.has(key)) continue;
      seen.add(key);
      result.push(msg);
    }

    return result;
  }, [messages, typingUserId, receiver?._id, receiver?.avatar]);

  const handleDropdownToggle = (index) => {
    setDropdownMenu((prev) => (prev === index ? null : index));
  };

  const handleReactionEmoji = (id) => {
    setOpenReactionEmoji((prev) => (prev === id ? null : id));
  };

  const touchStart = (id) => {
    if (window.innerWidth < 768) {
      const timer = setTimeout(() => {
        setOpenReactionEmoji(id);
        setOpenToolbox(id);
      }, 500);
      setLongpress(timer);
    }
  };

  const touchEnd = () => clearTimeout(longpress);

  // Scroll listener: load thêm khi lên đầu
  const handleScroll = useCallback(() => {
    const chatContainer = chatRef.current;
    if (!chatContainer) return;

    const { scrollTop } = chatContainer;

    // Đánh dấu đã scroll
    setHasScrolled(true);

    // Chỉ load more khi:
    // 1. Đã scroll (không phải lần đầu mount)
    // 2. Scroll gần đến đầu (trong vòng 100px)
    // 3. Còn tin nhắn cũ hơn
    // 4. Không đang load
    // 5. Có receiver
    if (
      hasScrolled &&
      scrollTop <= 100 &&
      hasMoreMessages &&
      !loadingMoreMessages &&
      receiver?._id
    ) {
      const prevScrollHeight = chatContainer.scrollHeight;
      const prevScrollTop = chatContainer.scrollTop;

      // Gọi load more và sau khi render xong thì giữ nguyên vị trí tương đối
      Promise.resolve(handleLoadMoreMessages(receiver._id)).then(() => {
        // Đợi DOM render xong
        setTimeout(() => {
          const newScrollHeight = chatContainer.scrollHeight;
          const heightDiff = newScrollHeight - prevScrollHeight;
          // Giữ nguyên vị trí hiện tại theo chiều cao đã tăng
          chatContainer.scrollTop = prevScrollTop + heightDiff;
        }, 0);
      });
    }
  }, [
    hasMoreMessages,
    loadingMoreMessages,
    receiver?._id,
    handleLoadMoreMessages,
    hasScrolled,
  ]);

  const groupEmojiToArray = (emojiArray) => {
    if (!Array.isArray(emojiArray)) return [];
    const grouped = {};
    emojiArray.forEach((e) => {
      if (!grouped[e.icon]) grouped[e.icon] = [];
      grouped[e.icon].push(e.userId);
    });
    return Object.entries(grouped).map(([icon, users]) => ({ icon, users }));
  };

  // Đóng reaction khi click ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        window.innerWidth < 576 &&
        reactionRef.current &&
        !reactionRef.current.contains(e.target)
      ) {
        setOpenReactionEmoji(null);
        setOpenToolbox(null);
      }
    };
    if (openReactionEmoji) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [openReactionEmoji, setOpenToolbox]);

  // Auto scroll xuống cuối khi có tin nhắn mới hoặc lần đầu load
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    const isInitialLoad =
      prevMessagesLength.current === 0 && messages.length > 0;

    // Chỉ auto scroll khi:
    // - Lần đầu load, hoặc
    // - Có tin nhắn mới realtime và user đang ở gần cuối, và không phải đang load thêm tin cũ
    const chatContainer = chatRef.current;
    const nearBottom = chatContainer
      ? chatContainer.scrollHeight -
          (chatContainer.scrollTop + chatContainer.clientHeight) <=
        150
      : false;

    if (isInitialLoad && endRef.current) {
      // Đợi DOM render hoàn toàn và container height ổn định
      setTimeout(() => {
        if (endRef.current && chatContainer) {
          // Scroll trực tiếp container thay vì scrollIntoView để tránh giật
          chatContainer.scrollTop = chatContainer.scrollHeight;
        }
      }, 100);
    } else if (
      isNewMessage &&
      nearBottom &&
      endRef.current &&
      !loadingMoreMessages
    ) {
      setTimeout(() => {
        if (endRef.current) {
          endRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }
      }, 100);
    }

    prevMessagesLength.current = messages.length;
  }, [messages, user, blockedBy, endRef, loadingMoreMessages]);

  // Reset hasScrolled khi chuyển receiver
  useEffect(() => {
    setHasScrolled(false);
    // Reset bộ đếm để coi lần mở chat này như lần load đầu
    prevMessagesLength.current = 0;

    // Scroll xuống cuối khi chuyển chat (sau khi DOM mount)
    setTimeout(() => {
      const chatContainer = chatRef.current;
      if (chatContainer) {
        // Scroll trực tiếp container để tránh giật
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  }, [receiver?._id]);

  // Gắn listener scroll
  useEffect(() => {
    const el = chatRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      return () => el.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll, chatRef]);

  // Scroll tới tin nhắn tìm kiếm
  useEffect(() => {
    if (searchMessages.length === 0 || currentIndex < 0) {
      setHighlightMessage(null);
      return;
    }
    const targetId = searchMessages[currentIndex]?._id;
    if (!targetId) return;
    setHighlightMessage(targetId);
    const el = messageRefs.current[targetId];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTimeout(() => {
        messageRefs.current[targetId]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
    }
  }, [currentIndex, searchMessages, setHighlightMessage]);

  return (
    <div
      ref={chatRef}
      // onScroll={handleScroll}
      className="simple-bar-wrapper user-chat_body relative"
    >
      {/* Scroll to bottom button */}
      {/* {showScrollToBottom && (
        <button
          onClick={handleScrollToBottom}
          className="fixed bottom-28 right-6 z-50 bg-[#7269ef] hover:bg-[#6159cb] text-white rounded-full p-3 shadow-lg transition-all duration-300 hover:scale-110 border border-transparent hover:border-[#7269ef]/20"
          title="Scroll to bottom"
          style={{
            boxShadow: '0 4px 12px rgba(114, 105, 239, 0.3), 0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          <RiArrowDownSLine className="text-xl transition-transform duration-200 hover:translate-y-0.5" />
        </button>
      )} */}
      <ul>
        {/* Loading indicator khi load thêm tin nhắn */}
        {loadingMoreMessages && (
          <li className="w-full text-center py-3">
            <SyncLoader
              className="loading"
              margin={2}
              color="#7269ef"
              loading
              size={6}
              speedMultiplier={0.8}
            />
          </li>
        )}

        {uniqueDisplayMessages.map((message, index) => {
          if (message.type === "typing") {
            return (
              <li key={`typing-${index}`}>
                <div className="conversation-list">
                  <div className="message-avatar w-[36px] h-[36px]">
                    <img src={message.avatar} alt="avatar" />
                  </div>
                  <div className="message-content">
                    <div className="list-content">
                      <div className="content-item relative">
                        <div className="wrap-content select-none">
                          <p className="mb-0 ">
                            typing
                            <SyncLoader
                              className="loading"
                              margin={1}
                              color="#fff"
                              loading
                              size={4}
                              speedMultiplier={0.5}
                              style={{ marginLeft: ".25rem" }}
                            />
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          }

          const { showAvatar, showTimestamp, isDifferentDay } =
            getMessageLayoutMeta(uniqueDisplayMessages, message, index);

          return (
            <MessageItem
              key={message._id || index}
              message={message}
              user={user}
              index={index}
              isDifferentDay={isDifferentDay}
              showAvatar={showAvatar}
              showTimestamp={showTimestamp}
              hightlightMessage={hightlightMessage}
              messageRefs={messageRefs}
              touchStart={touchStart}
              touchEnd={touchEnd}
              dropdownMenu={dropdownMenu}
              handleDropdownToggle={handleDropdownToggle}
              handleDeleteMessage={handleDeleteMessage}
              handlePinnedMessage={handlePinnedMessage}
              setOpenRevokeMessageModal={setOpenRevokeMessageModal}
              handleReactionEmoji={handleReactionEmoji}
              openReactionEmoji={openReactionEmoji}
              reactionRef={reactionRef}
              theme={theme}
              handleReactionMessage={handleReactionMessage}
              setOpenToolbox={setOpenToolbox}
              setOpenReactModal={setOpenReactModal}
              groupEmojiToArray={groupEmojiToArray}
            />
          );
        })}

        {/* Chỉ hiện skeleton khi load lần đầu */}
        {loadingMessages &&
          [...Array(10)].map((_, index) => (
            <MessageSkeleton key={index} count={index} />
          ))}
      </ul>
      <div ref={endRef} className="list-none">
        {(user.blockedUsers?.includes(receiver?._id) ||
          blockedBy[receiver?._id]) && (
          <li className="w-full text-center py-3">
            <p className="inline-block px-3 py-1 text-xs rounded-md font-semibold bg-input-bg-color text-body-color italic">
              You can't reply to this conversation.
            </p>
          </li>
        )}
      </div>
    </div>
  );
}

export default UserChatContent;
