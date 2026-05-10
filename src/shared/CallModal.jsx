import { useContext, useEffect, useRef, useState } from "react";
import {
  RiCloseFill,
  RiVidiconFill,
  RiPhoneFill,
  RiSubtractFill,
  RiExpandDiagonalFill,
  RiMicFill,
  RiMicOffFill,
} from "react-icons/ri";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

import { SocketContext } from "@/context/SocketContext";

import "@/components/Modal/modal.scss";

/**
 * Component dùng chung cho cả Audio Call và Video Call Modal
 */
function CallModal({ type = "video", isOpen, onClose }) {
  const {
    acceptCall,
    endCall,
    callState,
    callDuration,
    remoteVideoRef,
    localVideoRef,
    localStream,
    remoteStream,
    isVideoMinimized,
    setIsVideoMinimized,
  } = useContext(SocketContext);

  const dragConstraintsRef = useRef(null);
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  const [isMuted, setIsMuted] = useState(false);

  /**
   * Bật/Tắt Mic của bản thân
   */
  const toggleMute = (e) => {
    e.stopPropagation();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // Nếu đang bị tắt (isMuted = true) thì bật lại (enabled = true)
      });
      setIsMuted(!isMuted);
    }
  };

  /**
   * Reset vị trí kéo thả về ban đầu (0,0) khi thoát chế độ thu nhỏ
   */
  useEffect(() => {
    if (!isVideoMinimized) {
      dragX.set(0);
      dragY.set(0);
    }
  }, [isVideoMinimized, dragX, dragY]);

  /**
   * Cập nhật luồng video cục bộ (local stream) nếu là cuộc gọi video
   */
  useEffect(() => {
    if (type === "video" && localVideoRef?.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      // iOS Safari yêu cầu gọi play() tường minh sau khi gán srcObject
      localVideoRef.current.play().catch((err) => {
        console.warn("Không thể tự động phát video cục bộ:", err);
      });
    }
  }, [localVideoRef, localStream, isOpen, isVideoMinimized, type]);

  /**
   * Cập nhật luồng video/audio từ xa (remote stream) cho cả 2 loại cuộc gọi
   */
  useEffect(() => {
    if (remoteVideoRef?.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      // iOS Safari yêu cầu gọi play() tường minh sau khi gán srcObject
      remoteVideoRef.current.play().catch((err) => {
        console.warn("Không thể tự động phát media từ xa:", err);
      });
    }
  }, [remoteVideoRef, remoteStream, isOpen, isVideoMinimized]);

  if (!isOpen) return null;

  const { avatar, username } = isOpen;

  /**
   * Định dạng thời gian theo phút:giây (mm:ss)
   * @param {number} sec - Tổng số giây
   * @returns {string} Thời gian đã định dạng
   */
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <AnimatePresence>
      <div
        ref={dragConstraintsRef}
        className={`modal-container ${type}-modal-container show ${isVideoMinimized ? "minimized-wrapper" : ""}`}
        style={
          isVideoMinimized
            ? {
                pointerEvents: "none",
                background: "transparent",
                overflow: "hidden",
              }
            : {}
        }
      >
        {!isVideoMinimized && <div className="modal-backdrop"></div>}

        <div
          className="modal"
          onClick={() => {
            if (callState === "inCall" || isVideoMinimized) return;
            onClose();
          }}
          style={isVideoMinimized ? { pointerEvents: "none" } : {}}
        >
          <motion.div
            layout
            drag={isVideoMinimized}
            dragConstraints={dragConstraintsRef}
            dragElastic={0}
            dragMomentum={false}
            className={`modal-centered video-call-modal-modern ${isVideoMinimized ? "minimized" : ""}`}
            onClick={(e) => e.stopPropagation()}
            initial={false}
            animate={{ scale: 1, opacity: 1 }}
            style={{
              ...(isVideoMinimized
                ? { pointerEvents: "auto", cursor: "grab" }
                : {}),
              x: dragX,
              y: dragY,
            }}
          >
            <div
              className={`modal-content video-modal-content-modern relative overflow-hidden bg-[#1a1a1a] rounded-2xl shadow-2xl border-none`}
            >
              {/* Media Container */}
              <div className="remote-media-container absolute inset-0 z-0">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Fallback Overlay or Audio Default Overlay */}
                {(!remoteStream ||
                  callState !== "inCall" ||
                  type === "audio") && (
                  <div
                    className={`absolute inset-0 flex flex-col items-center justify-center ${type === "audio" ? "bg-gradient-to-b from-[#2c3e50] to-[#1a1a1a]" : "bg-[#1a1a1a]"} z-10`}
                  >
                    <div className="relative">
                      <img
                        src={avatar}
                        className={`${isVideoMinimized ? "w-16 h-16" : "w-32 h-32"} rounded-full border-4 border-white/10 mb-4 object-cover shadow-2xl ${callState !== "inCall" ? "animate-pulse" : ""} transition-all`}
                        alt="avatar"
                      />
                    </div>
                    {!isVideoMinimized && (
                      <>
                        <h2 className="text-white text-2xl font-bold tracking-wide">
                          {username}
                        </h2>
                        <p className="text-white/50 mt-3 font-medium uppercase text-xs tracking-widest">
                          {callState === "incoming"
                            ? `Incoming ${type === "video" ? "Video" : "Audio"} Call...`
                            : callState === "outgoing"
                              ? "Calling..."
                              : type === "audio" && callState === "inCall"
                                ? "In Call"
                                : "Connecting..."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Local Video (Floating) - Only for Video Call */}
              {type === "video" && (
                <motion.div
                  initial={false}
                  animate={{
                    opacity: isVideoMinimized ? 0 : 1,
                    scale: isVideoMinimized ? 0.8 : 1,
                  }}
                  style={{
                    pointerEvents: isVideoMinimized ? "none" : "auto",
                  }}
                  className={`local-video-container absolute bottom-32 right-6 w-32 md:w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-20 group transition-all hover:scale-105 ${isVideoMinimized ? "hidden" : ""}`}
                >
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover bg-[#2c2c2c]"
                    style={{ transform: "scaleX(-1)" }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium bg-black/40 px-2 py-1 rounded">
                      You
                    </span>
                  </div>
                </motion.div>
              )}

              {/* Controls Overlay - Bottom */}
              <div
                className={`controls-overlay absolute inset-x-0 bottom-0 p-6 flex flex-col items-center gap-6 z-30 transition-all ${isVideoMinimized ? "" : "bg-gradient-to-t from-black/80 via-black/40 to-transparent"}`}
              >
                {callState === "inCall" && !isVideoMinimized && (
                  <div className="timer bg-white/10 backdrop-blur-xl px-5 py-1.5 rounded-full text-white text-sm font-bold border border-white/20 shadow-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    {formatTime(callDuration)}
                  </div>
                )}

                <div className="flex items-center gap-6">
                  {/* End Call Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      endCall();
                    }}
                    className={`${isVideoMinimized ? "w-10 h-10 text-xl" : "w-14 h-14 text-2xl"} flex items-center justify-center rounded-full bg-[#ef476f] text-white hover:bg-[#cb3c5e] transition-all shadow-xl hover:scale-110 active:scale-95`}
                    title="Kết thúc"
                  >
                    <RiCloseFill />
                  </button>

                  {/* Mute Button - Chỉ hiện trong cuộc gọi */}
                  {callState === "inCall" && (
                    <button
                      onClick={toggleMute}
                      className={`${isVideoMinimized ? "w-10 h-10 text-xl" : "w-14 h-14 text-2xl"} flex items-center justify-center rounded-full ${isMuted ? "bg-gray-600 text-white hover:bg-gray-700" : "bg-white/20 text-white hover:bg-white/30 backdrop-blur-md"} transition-all shadow-xl hover:scale-110 active:scale-95`}
                      title={isMuted ? "Bật Mic" : "Tắt Mic"}
                    >
                      {isMuted ? <RiMicOffFill /> : <RiMicFill />}
                    </button>
                  )}

                  {/* Accept Button - Only for incoming and not minimized */}
                  {callState === "incoming" && !isVideoMinimized && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // "Mở khóa" context media trên iOS trước khi accept
                        if (remoteVideoRef?.current) {
                          remoteVideoRef.current.play().catch(() => {});
                        }
                        acceptCall();
                      }}
                      className="w-14 h-14 text-2xl flex items-center justify-center rounded-full bg-[#06d6a0] text-white hover:bg-[#05b688] transition-all shadow-xl hover:scale-110 active:scale-95 animate-bounce"
                      title="Chấp nhận"
                    >
                      {type === "video" ? <RiVidiconFill /> : <RiPhoneFill />}
                    </button>
                  )}
                </div>
              </div>

              {/* Window Controls - Top Right: Minimize/Expand + Close */}
              <div className="absolute top-3 right-3 z-40 flex items-center gap-1">
                {/* Minimize/Expand Button */}
                {callState === "inCall" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoMinimized(!isVideoMinimized);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-yellow-400/80 text-white hover:text-black transition-all"
                    title={isVideoMinimized ? "Phóng to" : "Thu nhỏ"}
                  >
                    {isVideoMinimized ? (
                      <RiExpandDiagonalFill size={14} />
                    ) : (
                      <RiSubtractFill size={14} />
                    )}
                  </button>
                )}

                {/* Close Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    endCall();
                  }}
                  className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-[#ef476f] text-white transition-all"
                  title="Đóng"
                >
                  <RiCloseFill size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}

export default CallModal;
