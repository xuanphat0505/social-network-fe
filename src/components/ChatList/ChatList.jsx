import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import {
  RiSearchLine,
  RiImageFill,
  RiAttachmentLine,
  RiPhoneFill,
  RiVidiconFill,
} from "react-icons/ri";
import { SyncLoader } from "react-spinners";

import { OpenContext } from "../../context/OpenContext";
import { AxiosContext } from "../../context/AxiosContext";
import { STATUS_COLOR_CLASSES } from "../../config/statusColors";
import ChatListSkeleton from "../../shared/Skeleton/ChatListSkeleton";
import AvailableSkeleton from "../../shared/Skeleton/AvailableSkeleton";
import { formatTime } from "../../utils/date";

function ChatList({ navLink }) {
  const user = useSelector((state) => state?.auth?.user);

  const { t } = useTranslation();
  const { setOpenChatBox, openChatBox } = useContext(OpenContext);
  const {
    loadingChatList,
    chatList,
    typingUserId,
    handleGetMessage,
    handleReadMessage,
    handleGetReceiver,
    friendList,
    loadingAvailable,
  } = useContext(AxiosContext);

  const handleOpenChatBoxAndGetMessages = useCallback(
    (partnerId) => {
      if (!partnerId) return;

      const shouldClose = openChatBox === partnerId;
      setOpenChatBox(shouldClose ? null : partnerId);

      if (shouldClose) return;

      handleReadMessage(partnerId);
      handleGetReceiver(partnerId);
      handleGetMessage(partnerId, true);
    },
    [handleGetMessage, handleGetReceiver, handleReadMessage, openChatBox, setOpenChatBox],
  );

  // Responsive skeleton count for available section
  const [availableSkeletonCount, setAvailableSkeletonCount] = useState(4);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const computeItems = () => {
      const w = window.innerWidth;
      if (w >= 1280) return 5; // desktop
      if (w >= 1024) return 4; // laptop (your current desired value)
      if (w >= 768) return 10; // tablet -> show more than laptop as requested
      return 4; // mobile
    };

    const update = () => setAvailableSkeletonCount(computeItems());
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const filteredChatList = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return chatList;

    return chatList.filter((chat) => {
      const isMe = chat?.senderId?._id === user?._id;
      const partner = isMe ? chat?.receiverId : chat?.senderId;
      const username = partner?.username?.toLowerCase() || "";
      const content = chat?.content?.toLowerCase() || "";
      const typeLabel = chat?.type?.toLowerCase() || "";
      return (
        username.includes(query) ||
        content.includes(query) ||
        typeLabel.includes(query)
      );
    });
  }, [chatList, searchTerm, user?._id]);

  return (
    <div className={`tab-pane ${navLink === "chats" ? "active" : ""}`}>
      <div>
        <div className="card-header">
          <h4 className="mb-6 text-[21px]">{t("chatHeader")}</h4>
          <div className="chat-search-box">
            <div className="input-group">
              <span>
                <i>
                  <RiSearchLine />
                </i>
              </span>
              <input
                type="text"
                placeholder={t("chatInputPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        {loadingAvailable ? (
          <AvailableSkeleton items={availableSkeletonCount} />
        ) : friendList ? (
          <div className="px-6 pb-6">
            <Swiper slidesPerView={"4"} spaceBetween={16}>
              {friendList?.map((friend) => (
                <SwiperSlide key={friend._id}>
                  <div
                    onClick={() => handleOpenChatBoxAndGetMessages(friend._id)}
                    className="slide-item"
                  >
                    <div>
                      <Link>
                        <div className="slide-avatar">
                          <img
                            src={friend?.avatar}
                            alt="avatar"
                            className="rounded-[50%] h-full"
                          />
                          <span></span>
                        </div>
                        <h5 className="text-[13px] mb-1 mt-4 text-ellipsis overflow-hidden whitespace-nowrap">
                          {friend?.username}
                        </h5>
                      </Link>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : null}

        <div>
          <h5 className="px-6 mb-4 text-[16px]">{t("chatRecent")}</h5>
          {loadingChatList ? (
            <ul className="simple-bar-wrapper chat-list">
              {[...Array(10)].map((_, index) => (
                <ChatListSkeleton key={index} />
              ))}
            </ul>
          ) : filteredChatList.length > 0 ? (
            <ul className="simple-bar-wrapper chat-list">
              {filteredChatList.map((chat) => {
                const isMe = chat?.senderId?._id === user?._id;
                const partner = isMe ? chat?.receiverId : chat?.senderId;

                return (
                  <li
                    className="item list-item"
                    key={chat._id}
                    onClick={() => handleOpenChatBoxAndGetMessages(partner._id)}
                  >
                    <Link
                      className={`${
                        openChatBox === partner._id ? "active" : ""
                      }`}
                    >
                      <div className="chat-avatar">
                        <img src={partner?.avatar} alt="chat-avatar" />
                        <span
                          className={STATUS_COLOR_CLASSES[partner?.status].bg}
                        ></span>
                      </div>

                      <div className="flex-1 overflow-hidden">
                        <h5 className="ml-4 mb-1 text-[15px]">
                          {partner?.username}
                        </h5>

                        {typingUserId === partner._id ? (
                          <p className="flex items-center ml-4 mb-0 text-[14px] text-[#7269ef] font-medium">
                            {t("chatTyping")}
                            <SyncLoader
                              className="loading"
                              margin={1}
                              color="#7269ef"
                              loading
                              size={4}
                              speedMultiplier={0.5}
                              style={{ marginLeft: ".25rem" }}
                            />
                          </p>
                        ) : chat?.type === "call" ? (
                          <p className="flex items-center text-[14px] ml-4 mb-0">
                            <i
                              className={`mr-1 align-middle ${
                                chat?.callData?.status === "missed"
                                  ? "text-red-400"
                                  : "text-green-400"
                              }`}
                            >
                              {chat?.callData?.isVideo ? (
                                <RiVidiconFill />
                              ) : (
                                <RiPhoneFill />
                              )}
                            </i>
                            <span
                              className={`overflow-hidden text-ellipsis whitespace-nowrap max-w-full ${
                                chat?.callData?.status === "missed"
                                  ? "text-red-400"
                                  : ""
                              }`}
                            >
                              {chat?.callData?.status === "missed"
                                ? isMe
                                  ? "Missed call"
                                  : "Missed call"
                                : isMe
                                ? "Outgoing call"
                                : "Incoming call"}
                            </span>
                          </p>
                        ) : chat?.type === "text" ? (
                          <p className="text-[14px] ml-4 mb-0 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                            {chat?.content}
                          </p>
                        ) : chat?.type === "image" ? (
                          <p className="flex items-center text-[14px] ml-4 mb-0">
                            <i className="mr-1 align-middle">
                              <RiImageFill />
                            </i>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                              {chat.content}
                            </span>
                          </p>
                        ) : chat?.type === "file" ? (
                          <p className="flex items-center text-[14px] ml-4 mb-0">
                            <i className="mr-1 align-middle">
                              <RiAttachmentLine />
                            </i>
                            <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                              {chat.content}
                            </span>
                          </p>
                        ) : null}
                      </div>

                      <div className="block h-full w-auto">
                        <div className="text-[11px]">
                          {formatTime(chat?.createdAt)}
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="badge text-[10px] font-semibold leading-[16px] mt-[5px]">
                            {chat.unreadCount < 10
                              ? `0${chat.unreadCount}`
                              : chat.unreadCount}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : searchTerm.trim() ? (
            <div
              className="flex items-center justify-center"
              style={{ minHeight: "calc(90vh - 250px)" }}
            >
              <p className="text-[15px] text-body-color text-center">
                {t("noMessages")}
              </p>
            </div>
          ) : (
            <div
              className="flex items-center justify-center"
              style={{ minHeight: "calc(90vh - 250px)" }}
            >
              <p className="text-[15px] text-body-color text-center">
                {t("noMessages")}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ChatList;
