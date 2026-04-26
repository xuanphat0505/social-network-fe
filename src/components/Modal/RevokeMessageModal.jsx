import { useState, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { RiCloseFill } from "react-icons/ri";
import { OpenContext } from "@/context/OpenContext";
import { AxiosContext } from "@/context/AxiosContext";

import Loader from "@/shared/Loader/Loader";

import "./modal.scss";
function RevokeMessageModal() {
  const user = useSelector((state) => state.auth?.user);

  const { openRevokeMessageModal, setOpenRevokeMessageModal } =
    useContext(OpenContext);
  const {
    loadingRevokeMessage,
    handleRevokeMessageForSelf,
    handleRevokeMessageForBoth,
  } = useContext(AxiosContext);
  const [selectedOption, setSelectedOption] = useState("me");

  const handleSubmit = () => {
    if (selectedOption === "me") {
      handleRevokeMessageForSelf(openRevokeMessageModal?.messageId);
    } else {
      // chỗ này sau này bạn xử lý revoke for everyone
      handleRevokeMessageForBoth(openRevokeMessageModal?.messageId);
    }
    setOpenRevokeMessageModal(null);
  };

  useEffect(() => {
    if (!openRevokeMessageModal || !user?._id) return;

    setSelectedOption(
      openRevokeMessageModal?.senderId === user?._id ? "everyone" : "me"
    );
  }, [openRevokeMessageModal, user]);

  return (
    <div
      className={`modal-container revoke-modal-container ${
        openRevokeMessageModal !== null ? "show" : ""
      }`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-centered revoke-modal">
          <div className="modal-content revoke-modal-content relative">
            <span
              onClick={() => setOpenRevokeMessageModal(null)}
              className="absolute top-[25px] right-[10px] cursor-pointer w-8 h-8 flex items-center justify-center text-[20px] hover:text-[#fff]"
            >
              <i>
                <RiCloseFill />
              </i>
            </span>
            <div className="p-6">
              <h2 className="text-lg font-semibold mb-4">Thu hồi tin nhắn</h2>

              {/* Thu hồi với mọi người */}
              {openRevokeMessageModal?.senderId === user._id && (
                <div
                  onClick={() => setSelectedOption("everyone")}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer mb-3"
                >
                  <div
                    className={`
    flex-shrink-0 w-5 h-5 rounded-full border-[2px] mt-1 flex items-center justify-center
    transition-all duration-200 hover:shadow-[0_0_0_7px_rgba(114,105,239,0.2)]
    ${
      selectedOption === "everyone"
        ? "border-[#7269ef] shadow-[0_0_0_7px_rgba(114,105,239,0.2)]"
        : "border-gray-400"
    }
  `}
                  >
                    {selectedOption === "everyone" && (
                      <div className="w-2.5 h-2.5 rounded-full bg-[#7269ef] transition-all duration-200"></div>
                    )}
                  </div>

                  <div>
                    <p className="font-medium">Thu hồi với mọi người</p>
                    <p className="text-sm text-gray-500">
                      Tin nhắn này sẽ bị thu hồi với mọi người trong đoạn chat.
                      Những người khác có thể đã xem hoặc chuyển tiếp tin nhắn
                      đó.
                    </p>
                  </div>
                </div>
              )}

              {/* Thu hồi với bạn */}
              <div
                onClick={() => setSelectedOption("me")}
                className="flex items-start gap-3 p-3 rounded-lg  cursor-pointer mb-5"
              >
                <div
                  className={`
    flex-shrink-0 w-5 h-5 rounded-full border-[2px] mt-1 flex items-center justify-center
    transition-all duration-200 hover:shadow-[0_0_0_7px_rgba(114,105,239,0.2)]
    ${
      selectedOption === "me"
        ? "border-[#7269ef] shadow-[0_0_0_7px_rgba(114,105,239,0.2)]"
        : "border-gray-400"
    }
  `}
                >
                  {selectedOption === "me" && (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#7269ef] transition-all duration-200"></div>
                  )}
                </div>

                <div>
                  <p className="font-medium">Thu hồi với bạn</p>
                  <p className="text-sm text-gray-500">
                    Tin nhắn này sẽ bị thu hồi khỏi thiết bị của bạn, nhưng vẫn
                    hiển thị với các thành viên khác trong đoạn chat.
                  </p>
                </div>
              </div>

              {/* Nút hành động */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setOpenRevokeMessageModal(null)}
                  className="px-4 py-2 rounded hover:underline text-sm font-medium"
                >
                  Hủy
                </button>
                <button
                  onClick={() => handleSubmit()}
                  className="px-4 py-2 rounded bg-[#7269ef] hover:bg-[#6159cb] text-white text-sm font-medium"
                >
                  {loadingRevokeMessage ? <Loader /> : "Gỡ/Xóa"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={() => setOpenRevokeMessageModal(false)}
      ></div>
    </div>
  );
}

export default RevokeMessageModal;
