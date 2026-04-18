import { useState, useContext, useRef } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  RiChatForwardLine,
  RiDeleteBinLine,
  RiFileCopyLine,
  RiSaveLine,
  RiChatSmile2Line,
} from "react-icons/ri";
import { useTranslation } from "react-i18next";
import Lottie from "lottie-react";
import emptyChat from "../../../assets/lottie/empty-chat.json";

import { OpenContext } from "../../../context/OpenContext";
import { AxiosContext } from "../../../context/AxiosContext";
import ProfileFriend from "../ProfileFriend/ProfileFriend";
import UserChatContent from "./UserChatContent";
import UserchatFooter from "./UserchatFooter";
import UserchatHeader from "./UserchatHeader";

import "./userchat.scss";
function UserChatContainer() {
  const user = useSelector((state) => state.auth?.user);
  const endRef = useRef();
  const { t } = useTranslation();
  const { openChatBox } = useContext(OpenContext);
  const {
    messages,
    chatList,
    receiver,
    handleReadMessage,
    setCount,
    setCurrentIndex,
    setSearchMessages,
    hasMoreMessages,
    loadingMoreMessages,
  } = useContext(AxiosContext);
  const [openProfileFriend, setOpenProfileFriend] = useState(false);
  const [openToolbox, setOpenToolbox] = useState(null);
  const [hightlightMessage, setHighlightMessage] = useState(null);

  const handleClearSearch = () => {
    setCount(null);
    setCurrentIndex(null);
    setSearchMessages([]);
    setHighlightMessage(null);

    // scroll cuối cùng
    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);
  };

  return receiver ? (
    <>
      <div
        onClick={() => {
          if (openChatBox) {
            // Kiểm tra xem partner này còn tin chưa đọc không
            const chat = chatList.find((c) => {
              const partnerId =
                c.senderId._id === user._id ? c.receiverId._id : c.senderId._id;
              return String(partnerId) === String(openChatBox);
            });

            if (chat && chat.unreadCount > 0) {
              handleReadMessage(openChatBox);
            }
          }
        }}
        className={`user-chat-container ${openChatBox !== null ? "show" : ""}`}
      >
        <UserchatHeader
          setOpenProfileFriend={setOpenProfileFriend}
          receiver={receiver?.receiver}
          handleClearSearch={handleClearSearch}
        />
        <UserChatContent
          endRef={endRef}
          setOpenToolbox={setOpenToolbox}
          messages={messages}
          receiver={receiver?.receiver}
          hightlightMessage={hightlightMessage}
          setHighlightMessage={setHighlightMessage}
        />
        <UserchatFooter receiverId={openChatBox} />
      </div>
      <ProfileFriend
        open={openProfileFriend}
        receiver={receiver?.receiver}
        files={receiver?.files}
        onClose={() => setOpenProfileFriend(false)}
        pinnedMessages={receiver?.pinnedMessages}
      />
      <div className={`chat-toolbox ${openToolbox ? "show" : ""}`}>
        <ul>
          <li className="chat-toolbox-item">
            <Link>
              <i>
                <RiFileCopyLine />
              </i>
              Copy
            </Link>
          </li>
          <li className="chat-toolbox-item">
            <Link>
              <i>
                <RiSaveLine />
              </i>
              Save
            </Link>
          </li>
          <li className="chat-toolbox-item">
            <Link>
              <i>
                <RiChatForwardLine />
              </i>
              Forward
            </Link>
          </li>
          <li className="chat-toolbox-item">
            <Link>
              <i>
                <RiDeleteBinLine />
              </i>
              Delete
            </Link>
          </li>
        </ul>
      </div>
    </>
  ) : (
    <div className="user-chat-container flex items-center justify-center">
      <div className="w-[300px] h-auto">
        <Lottie animationData={emptyChat} loop={true} />
      </div>
    </div>
  );
}

export default UserChatContainer;
