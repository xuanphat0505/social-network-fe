import {
  useState,
  useContext,
  useEffect,
  useRef,
  Fragment,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  RiTimeLine,
  RiMore2Fill,
  RiFileCopyLine,
  RiSaveLine,
  RiChatForwardLine,
  RiDeleteBinLine,
  RiArrowGoBackLine,
  RiPushpinFill,
  RiPushpinLine,
  RiArrowDownSLine,
} from "react-icons/ri";
import { MdOutlineEmojiEmotions } from "react-icons/md";
import { SyncLoader } from "react-spinners";
import Tippy from "@tippyjs/react";
import EmojiPicker from "emoji-picker-react";

import { ThemeContext } from "../../../context/ThemeContext";
import { AxiosContext } from "../../../context/AxiosContext";
import { OpenContext } from "../../../context/OpenContext";
import { getDisplayContent } from "../../../utils/chat";
import ImagesChat from "./ImagesChat";
import FilesChat from "./FilesChat";
import MessageSkeleton from "../../../shared/Skeleton/MessageSkeleton";
import ChatDivider from "../../../shared/ChatDivider/ChatDivider";
import CallMessage from "./CallMessage";
import { SocketContext } from "../../../context/SocketContext";

import "./userchat.scss";
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
    // Thêm typing indicator nếu có typing event
    const displayMessages =
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
    for (const msg of displayMessages) {
      const key =
        msg && msg._id ? String(msg._id) : `temp-${msg?.type || "unknown"}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(msg);
      }
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

  const formatTime = (time) => {
    const date = new Date(time);
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

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
          const display = getDisplayContent(message, user?._id);
          const currentDate = new Date(message.createdAt);

          // Tìm tin nhắn trước đó (không phải typing indicator)
          let prevMessage = null;
          for (let i = index - 1; i >= 0; i--) {
            if (uniqueDisplayMessages[i].type !== "typing") {
              prevMessage = uniqueDisplayMessages[i];
              break;
            }
          }

          const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;

          // So sánh ngày (bỏ qua giờ/phút/giây)
          const isDifferentDay =
            !prevDate || currentDate.toDateString() !== prevDate.toDateString();
          const itemKey = `${message._id || "msg"}-${
            message.createdAt || index
          }-${index}`;

          // Render call messages
          if (message.type === "call" && message.callData) {
            const isOutgoing =
              String(message?.senderId?._id || "") === String(user?._id || "");
            return (
              <Fragment key={itemKey}>
                {isDifferentDay && (
                  <ChatDivider messageDate={message.createdAt} />
                )}
                <li className={isOutgoing ? "right" : ""}>
                  <CallMessage
                    isOutgoing={isOutgoing}
                    callType={message.callData?.isVideo ? "video" : "audio"}
                    status={message.callData?.status || "ended"}
                    duration={message.callData?.duration || 0}
                    timestamp={message.createdAt}
                    showAvatar={message.showAvatar}
                    avatar={message.senderId?.avatar}
                    username={message.senderId?.username}
                  />
                </li>
              </Fragment>
            );
          }

          return (
            <Fragment key={itemKey}>
              {isDifferentDay && (
                <ChatDivider messageDate={message.createdAt} />
              )}
              <li className={message.senderId._id === user?._id ? "right" : ""}>
                <div className="conversation-list">
                  <div className="message-avatar w-[36px] h-[36px]">
                    {message.showAvatar && (
                      <img src={message.senderId.avatar} alt="avatar" />
                    )}
                  </div>
                  <div className="message-content">
                    <div className="list-content">
                      <div className="content-item relative">
                        <div
                          className="wrap-content select-none"
                          onTouchStart={() => touchStart(message._id)}
                          onTouchEnd={touchEnd}
                        >
                          {display.type === "revoked" ? (
                            <p className="italic text-gray-300">
                              {display.text}
                            </p>
                          ) : (
                            <>
                              {display.type === "text" && (
                                <p
                                  ref={(el) =>
                                    (messageRefs.current[message._id] = el)
                                  }
                                  className={`select-text ${
                                    hightlightMessage === message._id
                                      ? "highlight"
                                      : ""
                                  }`}
                                >
                                  {display.text}
                                </p>
                              )}
                              {display.type === "image" && (
                                <ImagesChat images={display.files} />
                              )}
                              {display.type === "file" && (
                                <FilesChat files={display.files} />
                              )}
                            </>
                          )}

                          <p className="chat-time">
                            <i>
                              <RiTimeLine />
                            </i>
                            <span>{formatTime(message.createdAt)}</span>
                          </p>

                          {message?.emoji?.length > 0 &&
                            (() => {
                              const groupedEmoji = groupEmojiToArray(
                                message?.emoji || []
                              );

                              return (
                                <div
                                  onClick={() =>
                                    setOpenReactModal({
                                      messageId: message._id,
                                      emoji: groupedEmoji,
                                    })
                                  }
                                  className="reaction-group"
                                >
                                  {groupedEmoji.map(({ icon, users }) => (
                                    <span
                                      key={icon}
                                      className="flex items-center gap-1"
                                    >
                                      {icon}
                                      {users.length >= 2 && (
                                        <span className="font-medium">
                                          {users.length}
                                        </span>
                                      )}
                                    </span>
                                  ))}
                                </div>
                              );
                            })()}
                          {message?.isPinned && (
                            <div className="pin-icon">
                              <svg viewBox="0 0 36 36" height="16" width="16">
                                <g>
                                  <rect
                                    height="2"
                                    width="8"
                                    x="17"
                                    y="26"
                                  ></rect>
                                </g>
                                <path
                                  d="M23.9989 27.5928L23.9988 27.5383L24.0367 27.585C24.1817 27.7518 24.7409 28.2715 25.8875 27.9427C26.9382 27.6414 26.5281 26.8227 26.371 26.5705C26.3138 26.4819 26.2525 26.3965 26.1873 26.3135L16.8703 14.3899C16.2845 15.045 15.5884 15.6539 14.8084 16.0737L23.9989 27.5928Z"
                                  fill="url(#_r_pa_)"
                                ></path>
                                <path
                                  d="M11.5653 17.1305C15.7434 17.1305 19.1305 13.7434 19.1305 9.56526C19.1305 5.38708 15.7434 2 11.5653 2C7.38708 2 4 5.38708 4 9.56526C4 13.7434 7.38708 17.1305 11.5653 17.1305Z"
                                  fill="#FF0D0D"
                                ></path>
                                <path
                                  d="M9.19306 12.5345C6.38338 10.2164 5.72669 6.37369 7.72578 3.95078C9.72486 1.52787 13.6231 1.44245 16.432 3.76062C19.2417 6.07879 19.8984 9.92145 17.8993 12.3444C15.9002 14.7673 12.0019 14.8519 9.19306 12.5345Z"
                                  fill="url(#_r_pb_)"
                                ></path>
                                <defs>
                                  <filter
                                    colorInterpolationFilters="sRGB"
                                    filterUnits="userSpaceOnUse"
                                    height="2.8"
                                    id="_r_p8_"
                                    width="8.8"
                                    x="16.6"
                                    y="25.6"
                                  >
                                    <feFlood
                                      floodOpacity="0"
                                      result="BackgroundImageFix"
                                    ></feFlood>
                                    <feBlend
                                      in="SourceGraphic"
                                      in2="BackgroundImageFix"
                                      mode="normal"
                                      result="shape"
                                    ></feBlend>
                                    <feGaussianBlur
                                      result="effect1_foregroundBlur_28_51"
                                      stdDeviation="0.2"
                                    ></feGaussianBlur>
                                  </filter>
                                  <linearGradient
                                    gradientUnits="userSpaceOnUse"
                                    id="_r_p9_"
                                    x1="25"
                                    x2="17.6667"
                                    y1="27"
                                    y2="27"
                                  >
                                    <stop stopColor="#969495"></stop>
                                    <stop
                                      offset="1"
                                      stopColor="#D9D9D9"
                                      stopOpacity="0"
                                    ></stop>
                                  </linearGradient>
                                  <linearGradient
                                    gradientUnits="userSpaceOnUse"
                                    id="_r_pa_"
                                    x1="20.4956"
                                    x2="21.941"
                                    y1="22.4135"
                                    y2="21.2698"
                                  >
                                    <stop stopColor="#666666"></stop>
                                    <stop offset="1" stopColor="#CACCCD"></stop>
                                  </linearGradient>
                                  <radialGradient
                                    cx="0"
                                    cy="0"
                                    gradientTransform="translate(12.8132 8.1471) rotate(129.523) scale(5.68739 6.59482)"
                                    gradientUnits="userSpaceOnUse"
                                    id="_r_pb_"
                                    r="1"
                                  >
                                    <stop
                                      stopColor="white"
                                      stopOpacity="0.5"
                                    ></stop>
                                    <stop
                                      offset="1"
                                      stopColor="white"
                                      stopOpacity="0"
                                    ></stop>
                                  </radialGradient>
                                </defs>
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="relative icon-box h-max ml-1 cursor-pointer flex items-start">
                          <Tippy
                            visible={dropdownMenu === message._id}
                            className="dropdown"
                            interactive={true}
                            arrow={false}
                            content={
                              message.isRevoked ||
                              (Array.isArray(message.deletedBy) &&
                                message.deletedBy.includes(user?._id)) ? (
                                // Trường hợp tin nhắn đã thu hồi / xóa => chỉ hiện Delete
                                <div className="dropdown-menu show">
                                  <button
                                    onClick={() => {
                                      handleDeleteMessage(message._id);
                                      setDropdownMenu(null);
                                    }}
                                    type="button"
                                  >
                                    Delete
                                    <i>
                                      <RiDeleteBinLine />
                                    </i>
                                  </button>
                                </div>
                              ) : (
                                // Trường hợp tin nhắn bình thường => đủ menu
                                <div className="dropdown-menu show">
                                  <button>
                                    Copy
                                    <i>
                                      <RiFileCopyLine />
                                    </i>
                                  </button>
                                  {/* <button>
                                    Save
                                    <i>
                                      <RiSaveLine />
                                    </i>
                                  </button> */}
                                  <button
                                    onClick={() => {
                                      handlePinnedMessage(message?._id);
                                      setDropdownMenu(null);
                                    }}
                                  >
                                    {message?.isPinned
                                      ? "Unarchive"
                                      : "Archive"}
                                    <i className="ml-1">
                                      {message?.isPinned ? (
                                        <RiPushpinFill />
                                      ) : (
                                        <RiPushpinLine />
                                      )}
                                    </i>
                                  </button>
                                  <button>
                                    Forward
                                    <i>
                                      <RiChatForwardLine />
                                    </i>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDropdownMenu(null);
                                      setOpenRevokeMessageModal({
                                        messageId: message._id,
                                        senderId: message.senderId._id,
                                      });
                                    }}
                                  >
                                    Revoke
                                    <i>
                                      <RiArrowGoBackLine />
                                    </i>
                                  </button>
                                </div>
                              )
                            }
                          >
                            <Link
                              className="text-secondary-color text-[20px] p-1"
                              onClick={() => handleDropdownToggle(message._id)}
                            >
                              <i>
                                <RiMore2Fill />
                              </i>
                            </Link>
                          </Tippy>

                          {/* Chỉ hiện emoji nếu tin nhắn chưa bị thu hồi */}
                          {!(
                            message.isRevoked ||
                            (Array.isArray(message.deletedBy) &&
                              message.deletedBy.includes(user?._id))
                          ) && (
                            <>
                              <Link
                                onClick={() => handleReactionEmoji(message._id)}
                                className="text-secondary-color text-[20px] p-1 relative"
                              >
                                <i>
                                  <MdOutlineEmojiEmotions />
                                </i>
                              </Link>

                              {/* Emoji Picker */}
                              <div
                                ref={reactionRef}
                                onClick={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="emoji-picker-container"
                              >
                                <EmojiPicker
                                  open={openReactionEmoji === message._id}
                                  lazyLoadEmojis={true}
                                  theme={theme}
                                  width={300}
                                  height={300}
                                  reactionsDefaultOpen={true}
                                  onClickOutside={() =>
                                    handleReactionEmoji(null)
                                  }
                                  onEmojiClick={(emojiData) => {
                                    const isSame =
                                      message?.emoji?.icon === emojiData.emoji;
                                    handleReactionMessage(
                                      message._id,
                                      isSame ? null : emojiData.emoji
                                    );
                                    setOpenToolbox(null);
                                    handleReactionEmoji(null);
                                  }}
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {message.showAvatar && (
                      <div className="message-name text-[14px] font-medium">
                        {message.senderId.username}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            </Fragment>
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
