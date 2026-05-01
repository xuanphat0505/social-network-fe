import { useContext } from "react";
import { OpenContext } from "@/context/OpenContext";
import CallModal from "@/shared/CallModal";

/**
 * Component hiển thị Modal Cuộc gọi Video
 * Đã được refactor để tái sử dụng CallModal chung
 */
function VideoCallModal() {
  const { openVideoCallModal, setOpenVideoCallModal } = useContext(OpenContext);

  return (
    <CallModal
      type="video"
      isOpen={openVideoCallModal}
      onClose={() => setOpenVideoCallModal(null)}
    />
  );
}

export default VideoCallModal;
