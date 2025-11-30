import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

function ContactSkeleton() {
  return (
    <div
      className="flex items-center justify-between"
      style={{ minHeight: "40px" }}
    >
      {/* Tên contact */}
      <Skeleton width={150} height={16} />
      {/* Nút menu */}
      <Skeleton width={10} height={16} />
    </div>
  );
}

export default ContactSkeleton;
