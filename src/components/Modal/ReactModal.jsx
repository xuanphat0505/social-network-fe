import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { RiCloseFill } from "react-icons/ri";

import { OpenContext } from "@/context/OpenContext";
import { AxiosContext } from "@/context/AxiosContext";

import "./modal.scss";

function ReactModal() {
  const user = useSelector((state) => state?.auth?.user);
  const { openReactModal, setOpenReactModal } = useContext(OpenContext);
  const { handleReactionMessage } = useContext(AxiosContext);

  const [activeTab, setActiveTab] = useState("all");

  if (!openReactModal) return null;

  // emoji ở đây là array [{ icon: "👍", users: [{_id, username, avatar}, ...] }, ...]
  const emojiArray = Array.isArray(openReactModal?.emoji)
    ? openReactModal.emoji
    : [];
  const totalReactions = emojiArray.reduce(
    (sum, item) => sum + item.users.length,
    0
  );

  const handleRemoveReactionMessage = (messageId) => {
    setOpenReactModal(null);
    handleReactionMessage(messageId, null);
  };

  const reactionsToShow =
    activeTab === "all"
      ? emojiArray.flatMap((e) => e.users.map((u) => ({ ...u, icon: e.icon })))
      : emojiArray
          .find((e) => e.icon === activeTab)
          ?.users.map((u) => ({ ...u, icon: activeTab })) || [];

  return (
    <div
      className={`modal-container react-modal-container ${
        openReactModal ? "show" : ""
      }`}
    >
      <div className="modal" onClick={() => setOpenReactModal(null)}>
        <div
          className="modal-centered react-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content react-modal-content relative">
            {/* Nút đóng */}
            <span
              onClick={() => setOpenReactModal(null)}
              className="absolute top-[25px] right-[10px] cursor-pointer w-8 h-8 flex items-center justify-center text-[20px] hover:text-[#fff]"
            >
              <i>
                <RiCloseFill />
              </i>
            </span>

            <div className="py-12 px-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[1rem] font-semibold text-[#eff2f7]">
                  Reaction to the message
                </h2>
              </div>

              {/* Tabs icon */}
              <div className="flex gap-3 mb-4">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`font-medium px-3 py-1 ${
                    activeTab === "all"
                      ? "border-b-2 border-[#7269ef] text-[#7269ef]"
                      : "hover:border-b-2 hover:border-[#7269ef]"
                  }`}
                >
                  All <span>({totalReactions})</span>
                </button>

                {emojiArray.map(({ icon, users }) => (
                  <button
                    key={icon}
                    onClick={() => setActiveTab(icon)}
                    className={`font-medium px-3 py-1 flex items-center gap-1 ${
                      activeTab === icon
                        ? "border-b-2 border-[#7269ef] text-[#7269ef]"
                        : "hover:border-b-2 hover:border-[#7269ef]"
                    }`}
                  >
                    {icon} <span>({users.length})</span>
                  </button>
                ))}
              </div>

              {/* Danh sách người đã react */}
              <div className="flex flex-col gap-4">
                {reactionsToShow.map((client) => {
                  const isMine = client._id === user._id;
                  return (
                    <div
                      key={client._id + client.icon}
                      onClick={() =>
                        isMine &&
                        handleRemoveReactionMessage(openReactModal.messageId)
                      }
                      className={`flex items-center justify-between bg-[#a6b0cf08] px-3 py-2 rounded-md ${
                        isMine
                          ? "cursor-pointer"
                          : "cursor-not-allowed opacity-70"
                      }`}
                    >
                      <img
                        src={client?.avatar}
                        alt={client?.username}
                        className="w-[48px] h-[48px] rounded-full"
                      />
                      <div className="flex-1 ml-3">
                        <strong className="text-[#eff2f7]">
                          {client?.username}
                        </strong>
                        <div className="text-[0.85rem] text-[#abb4d2]">
                          {isMine ? "Click to remove" : "Can't remove"}
                        </div>
                      </div>
                      <div className="text-[1.5rem]">{client.icon}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
                
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default ReactModal;
