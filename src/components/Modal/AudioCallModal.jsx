import { useContext } from 'react';
import { RiCloseFill, RiPhoneFill } from 'react-icons/ri';

import { OpenContext } from '../../context/OpenContext';
import { SocketContext } from '../../context/SocketContext';

import './modal.scss';
function AudioCallModal() {
  const { acceptCall, endCall, callState, callDuration } = useContext(SocketContext);
  const { openAudioCallModal, setOpenAudioCallModal } = useContext(OpenContext);

  if (!openAudioCallModal) return null;
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
      .toString()
      .padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div
      className={`modal-container audio-modal-container ${
        openAudioCallModal !== null ? 'show' : ''
      }`}
    >
      <div
        className="modal"
        onClick={() => {
          if (callState === 'inCall') {
            return;
          }
          setOpenAudioCallModal(null);
        }}
      >
        <div className="modal-centered audio-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content audio-modal-content relative">
            <div className="p-12 text-center">
              <div className="w-24 h-24 mb-6 mx-auto">
                <img
                  src={openAudioCallModal?.avatar}
                  alt="avatar"
                  className="rounded-[50%] border-[1px] border-border-color p-1"
                ></img>
              </div>
              <h5 className="text-[18.75px] mb-2">{openAudioCallModal?.username}</h5>
              {callState === 'incoming' && (
                <p className="mb-4 text-secondary-color">Incoming Audio Call...</p>
              )}
              {callState === 'outgoing' && <p className="mb-4 text-secondary-color">Calling...</p>}
              {callState === 'inCall' && (
                <p className="mb-4 text-secondary-color">In call • {formatTime(callDuration)}</p>
              )}

              <div className="mt-12">
                <ul className="flex items-center justify-center gap-6">
                  <li onClick={endCall} className="w-auto cursor-pointer">
                    <span className="inline-flex items-center justify-center w-12 h-12 text-[20px] rounded-[50%] text-[#fff] bg-[#ef476f] hover:bg-[#cb3c5e]">
                      <RiCloseFill />
                    </span>
                  </li>

                  {callState === 'incoming' && (
                    <li onClick={acceptCall} className="w-auto cursor-pointer">
                      <span className="inline-flex items-center justify-center w-12 h-12 text-[20px] rounded-[50%] text-[#fff] bg-[#06d6a0] hover:bg-[#05b688]">
                        <RiPhoneFill />
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              <span
                onClick={endCall}
                className="absolute top-[5px] right-[5px] cursor-pointer w-8 h-8 flex items-center justify-center text-[20px] hover:text-[#fff]"
              >
                <i>
                  <RiCloseFill />
                </i>
              </span>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default AudioCallModal;
