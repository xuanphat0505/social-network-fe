
import avatarImg from "../../assets/images/avatar.jpg";
import "./notification.scss";

function ResponseRequest({ notification }) {
  const isGroup = notification.type === "group_request";
  const senderName = notification.sender?.username || "Unknown";
  const groupName = notification.data?.groupName || "Group";
  const status = notification.data?.status || "accepted";

  return (
    <div className={`notification-item${!notification.isRead ? " unread" : ""}`}>
      <div className="w-10 h-10 mr-2 flex-shrink-0">
        <img
          src={notification.sender?.avatar || avatarImg}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
      <p className="flex-1 text-[14px]">
        {isGroup ? (
          <>
            <b className="text-[#7269ef]">{senderName}</b> has {status === "accepted" ? "accepted" : "declined"} your group invitation to <b className="text-[#7269ef]">{groupName}</b>
          </>
        ) : (
          <>
            <b className="text-[#7269ef]">{senderName}</b> has {status === "accepted" ? "accepted" : "declined"} your friend request
          </>
        )}
      </p>
    </div>
  );
}

export default ResponseRequest;