import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function MessageSkeleton({ count }) {
  return (
    <div className="message-skeleton ">
      <div
        className={`message-item flex items-center gap-4 ${
          count % 2 === 0 ? "flex-row-reverse text-right" : ""
        }`}
      >
        <div className="avatar-skeleton">
          <Skeleton circle width={40} height={40} />
        </div>
        <div className="content-skeleton">
          <div className="username-skeleton">
            <Skeleton width={120} height={16} />
          </div>
          <div className="message-skeleton">
            <Skeleton width={200} height={16} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default MessageSkeleton;
