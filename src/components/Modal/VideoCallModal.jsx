import { useContext } from 'react';
import { RiCloseFill, RiVidiconFill } from 'react-icons/ri';

import { OpenContext } from '../../context/OpenContext';
import { SocketContext } from '../../context/SocketContext';
import ReactPlayer from 'react-player';

import './modal.scss';

function VideoCallModal() {
  const { acceptCall, endCall, callState, callDuration, remoteVideoRef, localVideoRef } =
    useContext(SocketContext);
  const { openVideoCallModal, setOpenVideoCallModal } = useContext(OpenContext);

  if (!openVideoCallModal) return null;

  const { avatar, username } = openVideoCallModal;

  // format mm:ss
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };
  return (
    <div className="modal-container video-modal-container show">
      <div
        className="modal"
        onClick={() => {
          if (callState === 'inCall') {
            return;
          }
          setOpenVideoCallModal(null);
        }}
      >
        <div className="modal-centered video-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content video-modal-content relative">
            <div className="p-12 text-center">
              <div className="video-content mb-2">
                <ReactPlayer
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  style={{ display: 'none', width: '100%', height: '200px' }}
                />
                <ReactPlayer
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '200px', transform: 'scaleX(-1)' }}
                />
              </div>
              <div className="w-24 h-24 mb-6 mx-auto">
                <img
                  src={avatar}
                  alt="avatar"
                  className="rounded-[50%] bo rder-[1px] border-border-color p-1"
                />
              </div>
              <h5 className="text-[18.75px] mb-2">{username}</h5>

              {callState === 'incoming' && (
                <p className="mb-4 text-secondary-color">Incoming Video Call...</p>
              )}
              {callState === 'outgoing' && <p className="mb-4 text-secondary-color">Calling...</p>}
              {callState === 'inCall' && (
                <p className="mb-4 text-secondary-color">In call • {formatTime(callDuration)}</p>
              )}

              <div className="mt-12">
                <ul className="flex items-center justify-center gap-6">
                  {/* Nút End luôn có */}
                  <li onClick={endCall} className="w-auto cursor-pointer">
                    <span className="inline-flex items-center justify-center w-12 h-12 text-[20px] rounded-[50%] text-[#fff] bg-[#ef476f] hover:bg-[#cb3c5e]">
                      <RiCloseFill />
                    </span>
                  </li>

                  {/* Nút Accept chỉ hiện khi incoming */}
                  {callState === 'incoming' && (
                    <li onClick={acceptCall} className="w-auto cursor-pointer">
                      <span className="inline-flex items-center justify-center w-12 h-12 text-[20px] rounded-[50%] text-[#fff] bg-[#06d6a0] hover:bg-[#05b688]">
                        <RiVidiconFill />
                      </span>
                    </li>
                  )}
                </ul>
              </div>

              <span
                onClick={endCall}
                className="absolute top-[5px] right-[5px] cursor-pointer w-8 h-8 flex items-center justify-center text-[20px] hover:text-[#fff]"
              >
                <RiCloseFill />
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default VideoCallModal;
