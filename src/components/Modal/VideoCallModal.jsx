import { useContext, useEffect, useRef } from "react";
import {
  RiCloseFill,
  RiVidiconFill,
  RiSubtractFill,
  RiExpandDiagonalFill,
} from "react-icons/ri";
import { motion, AnimatePresence, useMotionValue } from "framer-motion";

import { OpenContext } from "@/context/OpenContext";
import { SocketContext } from "@/context/SocketContext";

import "./modal.scss";

function VideoCallModal() {
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
  const { openVideoCallModal, setOpenVideoCallModal } = useContext(OpenContext);
  const dragConstraintsRef = useRef(null);
  // Vị trí kéo thả - reset về 0 khi phóng to
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Reset vị trí về gốc khi thoát chế độ thu nhỏ
  useEffect(() => {
    if (!isVideoMinimized) {
      dragX.set(0);
      dragY.set(0);
    }
  }, [isVideoMinimized, dragX, dragY]);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localVideoRef, localStream, openVideoCallModal, isVideoMinimized]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteVideoRef, remoteStream, openVideoCallModal, isVideoMinimized]);

  if (!openVideoCallModal) return null;

  const { avatar, username } = openVideoCallModal;

  // format mm:ss
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
        className={`modal-container video-modal-container show ${isVideoMinimized ? "minimized-wrapper" : ""}`}
        style={
          isVideoMinimized
            ? { pointerEvents: "none", background: "transparent", overflow: "hidden" }
            : {}
        }
      >
        {!isVideoMinimized && <div className="modal-backdrop"></div>}

        <div
          className="modal"
          onClick={() => {
            if (callState === "inCall" || isVideoMinimized) return;
            setOpenVideoCallModal(null);
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
            animate={
              isVideoMinimized
                ? {
                    scale: 1,
                    opacity: 1,
                  }
                : {
                    scale: 1,
                    opacity: 1,
                  }
            }
            style={{
              ...(isVideoMinimized
                ? { pointerEvents: "auto", cursor: "grab" }
                : {}),
              x: dragX,
              y: dragY,
            }}
          >
            <div className="modal-content video-modal-content-modern relative overflow-hidden bg-[#1a1a1a] rounded-2xl shadow-2xl border-none">
              {/* Remote Video (Full) */}
              <div className="remote-video-container absolute inset-0 z-0">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Fallback Overlay */}
                {(!remoteStream || callState !== "inCall") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a] z-10">
                    <div className="relative">
                      <img
                        src={avatar}
                        className={`${isVideoMinimized ? "w-16 h-16" : "w-32 h-32"} rounded-full border-4 border-white/10 mb-4 object-cover shadow-2xl animate-pulse transition-all`}
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
                            ? "Incoming Video Call..."
                            : callState === "outgoing"
                              ? "Calling..."
                              : "Connecting..."}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Local Video (Floating) - Move to Bottom Right */}
              <motion.div
                initial={false}
                animate={{ 
                  opacity: isVideoMinimized ? 0 : 1, 
                  scale: isVideoMinimized ? 0.8 : 1 
                }}
                style={{
                  pointerEvents: isVideoMinimized ? "none" : "auto"
                }}
                className={`local-video-container absolute bottom-32 right-6 w-32 md:w-48 aspect-[3/4] rounded-xl overflow-hidden shadow-2xl border-2 border-white/10 z-20 group transition-all hover:scale-105 ${isVideoMinimized ? 'hidden' : ''}`}
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
                  {/* Nút End Call */}
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

                 

                  {/* Nút Accept - chỉ hiện khi full-screen và incoming */}
                  {callState === "incoming" && !isVideoMinimized && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acceptCall();
                      }}
                      className="w-14 h-14 text-2xl flex items-center justify-center rounded-full bg-[#06d6a0] text-white hover:bg-[#05b688] transition-all shadow-xl hover:scale-110 active:scale-95 animate-bounce"
                      title="Chấp nhận"
                    >
                      <RiVidiconFill />
                    </button>
                  )}
                </div>
              </div>

              {/* Window Controls - Top Right: Minimize/Expand + Close */}
              <div className="absolute top-3 right-3 z-40 flex items-center gap-1">
                {/* Nút Minimize (full-screen) / Expand (minimized) */}
                {callState === "inCall" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsVideoMinimized(!isVideoMinimized);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded bg-white/10 hover:bg-yellow-400/80 text-white hover:text-black transition-all"
                    title={isVideoMinimized ? "Phóng to" : "Thu nhỏ"}
                  >
                    {isVideoMinimized ? <RiExpandDiagonalFill size={14} /> : <RiSubtractFill size={14} />}
                  </button>
                )}

                {/* Nút Close */}
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
export default VideoCallModal;
