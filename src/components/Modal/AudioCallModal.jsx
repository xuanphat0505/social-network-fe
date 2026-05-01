import { useContext } from "react";
import { OpenContext } from "@/context/OpenContext";
import CallModal from "@/shared/CallModal";

/**
 * Component hiển thị Modal Cuộc gọi Audio
 * Đã được refactor để tái sử dụng CallModal chung với UI hiện đại
 */
function AudioCallModal() {
  const { openAudioCallModal, setOpenAudioCallModal } = useContext(OpenContext);

  return (
    <CallModal
      type="audio"
      isOpen={openAudioCallModal}
      onClose={() => setOpenAudioCallModal(null)}
    />
  );
}

export default AudioCallModal;
