import { useState, useContext } from "react";
import { Button } from "antd";
import { toast } from "react-toastify";
import { RiCloseFill, RiFileCopyLine } from "react-icons/ri";

import { OpenContext } from "../../context/OpenContext";

import "./modal.scss";
function UserCodeModal() {
  const { openUserCodeModal, setOpenUserCodeModal } = useContext(OpenContext);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(openUserCodeModal);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Không thể copy mã code");
    }
  };

  return (
    <div
      className={`modal-container code-modal-container ${
        openUserCodeModal ? "show" : ""
      }`}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-centered code-modal">
          <div className="modal-content code-modal-content">
            {/* Header */}
            <div className="modal-title flex items-center justify-between">
              <h5 className="capitalize text-[18.75px] font-semibold">
                Share User Code
              </h5>
              <span onClick={() => setOpenUserCodeModal(null)}>
                <RiCloseFill size={24} />
              </span>
            </div>

            {/* Nội dung */}
            <div className="py-6 flex flex-col items-center gap-4">
              <p className="text-body-color">
                Dùng mã này để chia sẻ với bạn bè:
              </p>
              <div className="flex items-center justify-between bg-transparent rounded-lg px-4 py-3  border border-border-color w-full max-w-xs">
                <span className="font-mono text-lg text-body-color">
                  {openUserCodeModal}
                </span>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-[#7269ef] hover:text-[#6159cb] transition"
                >
                  <RiFileCopyLine size={18} />
                  <span className="text-sm">{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <Button type="text" className="denied-btn">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal-backdrop"
        onClick={() => setOpenUserCodeModal(null)}
      ></div>
    </div>
  );
}

export default UserCodeModal;
