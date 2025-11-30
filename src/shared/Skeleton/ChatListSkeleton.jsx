import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function ChatListSkeleton() {
  return (
    <div
      className="flex items-center gap-3 p-3"
    >
      {/* Avatar */}
      <Skeleton circle width={48} height={48} />

      {/* Nội dung */}
      <div className="flex-1">
        {/* Tên */}
        <Skeleton width="50%" height={14} style={{ marginBottom: 8 }} />
        {/* Tin nhắn cuối */}
        <Skeleton width="80%" height={12} />
      </div>

      {/* Thời gian */}
      <Skeleton width={32} height={12} />
    </div>
  );
}

export default ChatListSkeleton;
