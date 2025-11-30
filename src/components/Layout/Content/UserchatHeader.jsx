import { useSelector } from "react-redux";
import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button, Popconfirm } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import {
  RiArrowDownSLine,
  RiArrowLeftSLine,
  RiArrowUpSLine,
  RiCloseLine,
  RiDeleteBinLine,
  RiMoreFill,
  RiPhoneLine,
  RiRecordCircleFill,
  RiSearchLine,
  RiUser2Line,
  RiVidiconLine,
  RiVolumeMuteLine,
  RiForbidLine,
  RiLockUnlockLine,
} from "react-icons/ri";
import Tippy from "@tippyjs/react";
import { useTranslation } from "react-i18next";

import { STATUS_COLOR_CLASSES } from "../../../config/statusColors";
import { OpenContext } from "../../../context/OpenContext";
import { SocketContext } from "../../../context/SocketContext";
import { AxiosContext } from "../../../context/AxiosContext";

import "./userchat.scss";
function UserchatHeader({ setOpenProfileFriend, receiver, handleClearSearch }) {
  const user = useSelector((state) => state.auth?.user);
  const { t } = useTranslation();
  const { setOpenChatBox } = useContext(OpenContext);
  const { startCall } = useContext(SocketContext);
  const {
    handleBlockUser,
    handleSearchMessage,
    handleDeleteAllMessage,
    searchMessages,
    currentIndex,
    count,
    setCurrentIndex,
  } = useContext(AxiosContext);
  const [openMoreMenu, setOpenMoreMenu] = useState(false);
  const [openSearchMessage, setOpenSearchMessage] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [isMuted, setIsMuted] = useState(false);

  // ===== Mute helpers (localStorage) ===== //
  const getMutedUsers = () => {
    try {
      const raw = localStorage.getItem("muted_users");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  };

  const setMutedUsers = (list) => {
    try {
      localStorage.setItem("muted_users", JSON.stringify(list));
    } catch (e) { /* empty */ }
  };

  useEffect(() => {
    if (!receiver?._id) return;
    const list = getMutedUsers();
    setIsMuted(list.includes(receiver._id));
  }, [receiver?._id]);

  const handleToggleMute = () => {
    if (!receiver?._id) return;
    const list = getMutedUsers();
    const idx = list.indexOf(receiver._id);
    if (idx === -1) {
      list.push(receiver._id);
      setIsMuted(true);
    } else {
      list.splice(idx, 1);
      setIsMuted(false);
    }
    setMutedUsers(list);
  };

  const handleToggle = () => {
    setOpenMoreMenu(false);
    setOpenSearchMessage(false);
    setOpenProfileFriend((prev) => !prev);
  };

  // Up: tìm tin nhắn cũ hơn
  const handlePrevResult = () => {
    if (searchMessages.length === 0) return;

    setCurrentIndex((prev) => {
      if (prev <= 0) {
        return 0; // giữ ở kết quả cũ nhất
      }
      return prev - 1; // lùi lại 1
    });
  };

  // Down: tìm tin nhắn mới hơn
  const handleNextResult = () => {
    if (searchMessages.length === 0) return;

    setCurrentIndex((prev) => {
      if (prev >= searchMessages.length - 1) {
        return searchMessages.length - 1; // giữ ở kết quả mới nhất
      }
      return prev + 1; // tiến thêm 1
    });
  };

  return (
    <div className="user-chat_header p-6 border-b-[1px] border-border-color ">
      <div className="flex items-center mx-[-12px]">
        <div className="header-left px-[15px] flex items-center">
          <div className="prev-btn" onClick={() => setOpenChatBox(null)}>
            <Link className="block w-auto h-full text-[16px] text-secondary-color py-2 pr-4">
              <i>
                <RiArrowLeftSLine />
              </i>
            </Link>
          </div>
          <div className="mr-4">
            <img
              src={receiver?.avatar}
              alt={receiver?.username}
              className="w-[2.2rem] h-[2.2rem] rounded-[50%]"
            ></img>
          </div>
          <div className="flex-1 overflow-hidden">
            <h5 className="text-[16px] flex items-center">
              <Link
                to="#"
                className="overflow-hidden whitespace-nowrap text-ellipsis"
              >
                {receiver?.username}
              </Link>
              <i
                className={`inline-block text-[10px] ml-2 ${
                  STATUS_COLOR_CLASSES[receiver?.status]?.text
                }`}
              >
                <RiRecordCircleFill />
              </i>
            </h5>
          </div>
        </div>
        <div className="header-right px-[15px]">
          <ul className="flex items-center justify-end gap-x-2">
            <li className="inline-block relative ">
              <Tippy
                className="dropdown"
                visible={openSearchMessage}
                arrow={false}
                interactive={true}
                onClickOutside={() => setOpenSearchMessage(false)}
                content={
                  <div className="dropdown-menu show p-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-auto h-auto relative">
                        <input
                          onChange={(e) => setKeyword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSearchMessage(receiver._id, keyword);
                            }
                          }}
                          value={keyword}
                          type="text"
                          placeholder={t("chatOption.searchPlaceholder")}
                          className="flex-1 py-2 pl-3 pr-[20px] bg-input-bg-color border-none outline-none rounded-[.25rem] text-[14px]"
                        />
                        <span
                          onClick={() => {
                            handleClearSearch();
                            setKeyword("");
                          }}
                          className="absolute right-[5px] top-[50%] translate-y-[-50%] cursor-pointer"
                        >
                          <RiCloseLine size={18} />
                        </span>
                      </div>
                      {searchMessages?.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span
                            onClick={handlePrevResult}
                            className={`p-1 rounded hover:bg-input-bg-color ${
                              currentIndex === 0
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "cursor-pointer"
                            }`}
                          >
                            <RiArrowUpSLine size={20} />
                          </span>
                          <span
                            onClick={handleNextResult}
                            className={`p-1 rounded hover:bg-input-bg-color ${
                              currentIndex === count - 1
                                ? "opacity-50 cursor-not-allowed hover:bg-transparent"
                                : "cursor-pointer"
                            }`}
                          >
                            <RiArrowDownSLine size={20} />
                          </span>
                        </div>
                      )}
                    </div>
                    {count !== null && (
                      <p className="text-xs mt-2 text-body-color">
                        {count > 0
                          ? `${currentIndex + 1}/${count} ${t("chatOption.resultsFound")}`
                          : t("chatOption.noMessagesFound")}
                      </p>
                    )}
                  </div>
                }
              >
                <div className="cursor-pointer">
                  <Button
                    type="text"
                    onClick={() => setOpenSearchMessage((prev) => !prev)}
                    className="search-message-btn"
                    icon={<RiSearchLine />}
                  ></Button>
                </div>
              </Tippy>
            </li>
            <li className="inline-block">
              <div className="cursor-pointer">
                <Button
                  onClick={() =>
                    startCall(
                      {
                        _id: receiver._id,
                        username: receiver.username,
                        avatar: receiver.avatar,
                      },
                      false
                    )
                  }
                  type="text"
                  className="search-message-btn"
                  icon={<RiPhoneLine />}
                ></Button>
              </div>
            </li>
            <li className="inline-block">
              <div className="cursor-pointer">
                <Button
                  onClick={() =>
                    startCall(
                      {
                        _id: receiver._id,
                        username: receiver.username,
                        avatar: receiver.avatar,
                      },
                      true
                    )
                  }
                  type="text"
                  className="search-message-btn"
                  icon={<RiVidiconLine />}
                ></Button>
              </div>
            </li>
            <li className="inline-block">
              <div className="cursor-pointer">
                <Button
                  type="text"
                  className="search-message-btn"
                  onClick={handleToggle}
                  icon={<RiUser2Line />}
                ></Button>
              </div>
            </li>
            <li className="inline-block relative">
              <div className="cursor-pointer">
                <Tippy
                  className="dropdown"
                  visible={openMoreMenu}
                  arrow={false}
                  interactive={true}
                  content={
                    <div className={`dropdown-menu show`}>
                      <button onClick={handleToggleMute}>
                        {isMuted ? t("chatOption.unmute") : t("chatOption.mute")}
                        <i>
                          <RiVolumeMuteLine />
                        </i>
                      </button>
                      <Popconfirm
                        title={
                          user.blockedUsers?.includes(receiver._id)
                            ? t("chatOption.unblockConfirmTitle")
                            : t("chatOption.blockConfirmTitle")
                        }
                        description={
                          user.blockedUsers?.includes(receiver._id)
                            ? t("chatOption.unblockConfirmDesc")
                            : t("chatOption.blockConfirmDesc")
                        }
                        okText={t("chatOption.confirmYes")}
                        cancelText={t("chatOption.confirmNo")}
                        placement="topLeft"
                        icon={
                          <QuestionCircleOutlined style={{ color: "red" }} />
                        }
                        arrow={false}
                        okButtonProps={{
                          type: "none",
                          className:
                            "bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-1 font-medium shadow-md transition",
                        }}
                        cancelButtonProps={{
                          type: "none",
                          className:
                            "border border-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-1 font-medium text-gray-300 transition",
                        }}
                        onConfirm={() => handleBlockUser(receiver._id)}
                      >
                        <button onClick={() => setOpenMoreMenu(null)}>
                          {user.blockedUsers?.includes(receiver._id) ? (
                            <>
                              {t("chatOption.unblock")}
                              <i>
                                <RiLockUnlockLine />
                              </i>
                            </>
                          ) : (
                            <>
                              {t("chatOption.block")}
                              <i>
                                <RiForbidLine />
                              </i>
                            </>
                          )}
                        </button>
                      </Popconfirm>

                      <Popconfirm
                        title={t("chatOption.deleteConfirmTitle")}
                        description={t("chatOption.deleteConfirmDesc")}
                        okText={t("chatOption.confirmYes")}
                        cancelText={t("chatOption.confirmNo")}
                        placement="topRight"
                        icon={
                          <QuestionCircleOutlined style={{ color: "red" }} />
                        }
                        okButtonProps={{
                          type: "none",
                          className:
                            "bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-1 font-medium shadow-md transition",
                        }}
                        cancelButtonProps={{
                          type: "none",
                          className:
                            "border border-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-1 font-medium text-gray-300 transition",
                        }}
                        onConfirm={() => {
                          handleDeleteAllMessage(receiver._id);
                          setOpenMoreMenu(false);
                        }}
                        arrow={false}
                      >
                        <button onClick={() => setOpenMoreMenu(null)}>
                          {t("chatOption.delete")}
                          <i>
                            <RiDeleteBinLine />
                          </i>
                        </button>
                      </Popconfirm>
                      {window.innerWidth <= 992 && (
                        <>
                          <button
                            onClick={() =>
                              startCall(
                                {
                                  _id: receiver._id,
                                  username: receiver.username,
                                  avatar: receiver.avatar,
                                },
                                false
                              )
                            }
                          >
                            {t("chatOption.audioCall")}
                            <i>
                              <RiPhoneLine />
                            </i>
                          </button>
                          <button
                            onClick={() =>
                              startCall(
                                {
                                  _id: receiver._id,
                                  username: receiver.username,
                                  avatar: receiver.avatar,
                                },
                                true
                              )
                            }
                          >
                            {t("chatOption.videoCall")}
                            <i>
                              <RiVidiconLine />
                            </i>
                          </button>
                          <button
                            onClick={() => {
                              setOpenProfileFriend(true);
                              setOpenMoreMenu(false);
                            }}
                          >
                            {t("chatOption.viewProfile")}
                            <i>
                              <RiUser2Line />
                            </i>
                          </button>
                        </>
                      )}
                    </div>
                  }
                >
                  <Button
                    onClick={() => setOpenMoreMenu((prev) => !prev)}
                    type="text"
                    className="search-message-btn"
                    icon={<RiMoreFill />}
                  ></Button>
                </Tippy>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserchatHeader;
