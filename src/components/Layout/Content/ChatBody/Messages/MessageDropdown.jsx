import { memo } from "react";
import Tippy from "@tippyjs/react";
import { Link } from "react-router-dom";
import { RiMore2Fill, RiDeleteBinLine } from "react-icons/ri";

const MessageDropdown = memo(({ 
  message, 
  user, 
  dropdownMenu, 
  handleDropdownToggle, 
  handleDeleteMessage, 
  handlePinnedMessage, 
  setOpenRevokeMessageModal 
}) => {
  const isDeleted = Array.isArray(message.deletedBy) && message.deletedBy.includes(user?._id);
  const showBasicMenu = message.isRevoked || isDeleted;

  return (
    <Tippy
      visible={dropdownMenu === message._id}
      className="dropdown"
      interactive={true}
      arrow={false}
      content={
        showBasicMenu ? (
          <div className="dropdown-menu show">
            <button
              onClick={() => {
                handleDeleteMessage(message._id);
                handleDropdownToggle(null);
              }}
              type="button"
            >
              Delete
              <i><RiDeleteBinLine /></i>
            </button>
          </div>
        ) : (
          <div className="dropdown-menu show">
            <button>Copy</button>
            <button
              onClick={() => {
                handlePinnedMessage(message?._id);
                handleDropdownToggle(null);
              }}
            >
              {message?.isPinned ? "Unarchive" : "Archive"}
            </button>
            <button>Forward</button>
            <button
              type="button"
              onClick={() => {
                handleDropdownToggle(null);
                setOpenRevokeMessageModal({
                  messageId: message._id,
                  senderId: message.senderId?._id,
                });
              }}
            >
              Revoke
            </button>
          </div>
        )
      }
    >
      <Link
        className="text-secondary-color text-[20px] p-1"
        onClick={() => handleDropdownToggle(message._id)}
      >
        <i><RiMore2Fill /></i>
      </Link>
    </Tippy>
  );
});

export default MessageDropdown;
