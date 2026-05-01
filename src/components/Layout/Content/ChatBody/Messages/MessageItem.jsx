import { Fragment, memo } from "react";
import { Link } from "react-router-dom";
import { RiTimeLine } from "react-icons/ri";
import { MdOutlineEmojiEmotions } from "react-icons/md";

import ImagesChat from "./ImagesChat";
import FilesChat from "./FilesChat";
import CallMessage from "./CallMessage";
import ChatDivider from "@/shared/ChatDivider/ChatDivider";
import ChatEmojiPicker from "@/shared/ChatEmojiPicker/ChatEmojiPicker";
import { getDisplayContent } from "@/utils/chat";
import { formatTime } from "@/utils/date";

// New Components
import {
  TextMessage,
  RevokedMessage,
  MessageDropdown,
  ReactionGroup,
  PinIndicator,
} from "@/components/Layout/Content/ChatBody/Messages/index";

/**
 * Component hiển thị một mục tin nhắn đơn lẻ trong cuộc hội thoại
 */
const MessageItem = memo(
  ({
    message,
    user,

    isDifferentDay,
    showAvatar,
    hightlightMessage,
    messageRefs,
    touchStart,
    touchEnd,
    dropdownMenu,
    handleDropdownToggle,
    handleDeleteMessage,
    handlePinnedMessage,
    setOpenRevokeMessageModal,
    handleReactionEmoji,
    openReactionEmoji,
    reactionRef,
    theme,
    handleReactionMessage,
    setOpenToolbox,
    setOpenReactModal,
    groupEmojiToArray,
  }) => {
    const display = getDisplayContent(message, user?._id);
    const isMe = message.senderId?._id === user?._id;
    const shouldShowAvatar = showAvatar ?? message.showAvatar ?? true;

    // Render call messages separately
    if (message.type === "call" && message.callData) {
      const isOutgoing =
        String(message?.senderId?._id || "") === String(user?._id || "");
      return (
        <Fragment>
          {isDifferentDay && <ChatDivider messageDate={message.createdAt} />}
          <li className={isOutgoing ? "right" : ""}>
            <CallMessage
              isOutgoing={isOutgoing}
              callType={message.callData?.isVideo ? "video" : "audio"}
              status={message.callData?.status || "ended"}
              duration={message.callData?.duration || 0}
              timestamp={message.createdAt}
              showAvatar={shouldShowAvatar}
              avatar={message.senderId?.avatar}
              username={message.senderId?.username}
            />
          </li>
        </Fragment>
      );
    }

    const isActuallyDeleted =
      Array.isArray(message.deletedBy) && message.deletedBy.includes(user?._id);

    return (
      <Fragment>
        {isDifferentDay && <ChatDivider messageDate={message.createdAt} />}
        <li className={isMe ? "right" : ""}>
          <div className="conversation-list">
            <div className="message-avatar w-[36px] h-[36px]">
              {shouldShowAvatar && <img src={message.senderId?.avatar} alt="avatar" />}
            </div>
            <div className="message-content">
              <div className="list-content">
                <div className="content-item relative">
                  <div
                    className={`wrap-content select-none ${message.status === 'sending' ? 'sending' : ''}`}
                    onTouchStart={() => touchStart(message._id)}
                    onTouchEnd={touchEnd}
                    onMouseDown={() => touchStart(message._id)}
                    onMouseUp={touchEnd}
                    onMouseLeave={touchEnd}
                  >
                    {display.type === "revoked" ? (
                      <RevokedMessage text={display.text} />
                    ) : (
                      <>
                        {display.type === "text" && (
                          <TextMessage
                            text={display.text}
                            messageId={message._id}
                            messageRefs={messageRefs}
                            hightlightMessage={hightlightMessage}
                          />
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

                    <ReactionGroup
                      emojiArray={message?.emoji}
                      messageId={message._id}
                      setOpenReactModal={setOpenReactModal}
                      groupEmojiToArray={groupEmojiToArray}
                    />

                    <PinIndicator isPinned={message?.isPinned} />
                  </div>

                  <div className="relative icon-box h-max ml-1 cursor-pointer flex items-start">
                    <MessageDropdown
                      message={message}
                      user={user}
                      dropdownMenu={dropdownMenu}
                      handleDropdownToggle={handleDropdownToggle}
                      handleDeleteMessage={handleDeleteMessage}
                      handlePinnedMessage={handlePinnedMessage}
                      setOpenRevokeMessageModal={setOpenRevokeMessageModal}
                    />

                    {!(message.isRevoked || isActuallyDeleted) && (
                      <>
                        <Link
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReactionEmoji(
                              openReactionEmoji === message._id ? null : message._id
                            );
                          }}
                          className="hidden lg:block text-secondary-color text-[20px] p-1 relative"
                        >
                          <i>
                            <MdOutlineEmojiEmotions />
                          </i>
                        </Link>

                        <div
                          ref={reactionRef}
                          onClick={(e) => e.stopPropagation()}
                          className="emoji-picker-container"
                        >
                          <ChatEmojiPicker
                            open={openReactionEmoji === message._id}
                            theme={theme}
                            width={300}
                            height={300}
                            reactionsDefaultOpen={true}
                            onEmojiClick={(emojiData) => {
                              const isSame =
                                message?.emoji?.icon === emojiData.emoji;
                              handleReactionMessage(
                                message._id,
                                isSame ? null : emojiData.emoji,
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

              {shouldShowAvatar && (
                <div className="message-name text-[14px] font-medium">
                  {message.senderId?.username}
                </div>
              )}
            </div>
          </div>
        </li>
      </Fragment>
    );
  },
);

export default MessageItem;
