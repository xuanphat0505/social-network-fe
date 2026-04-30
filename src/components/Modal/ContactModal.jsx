import { useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button, Form } from "antd";
import { RiCloseFill } from "react-icons/ri";

import useAxiosJWT from "@/config/axiosConfig";
import { OpenContext } from "@/context/OpenContext";
import { BASE_URL } from "@/config/utils";
import QRCodeTab from "./QRCodeTab";

import "./modal.scss";
function ContactModal() {
  const user = useSelector((state) => state?.auth?.user);
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const { openContactModal, setOpenContactModal } = useContext(OpenContext);
  const [receiverInfo, setReceiverInfo] = useState({
    username: "",
    email: "",
    code: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Tự động xử lý khi có mã kết bạn:
   * - Ưu tiên đọc từ URL param (?add-friend=CODE) - trường hợp đã login sẵn
   * - Fallback đọc từ localStorage (pending_add_friend) - trường hợp vừa login xong
   */
  useEffect(() => {
    if (!user) return;

    // Ưu tiên lấy từ URL param
    const codeFromUrl = searchParams.get("add-friend");
    // Fallback lấy từ localStorage (được lưu trước khi redirect sang login)
    const codeFromStorage = localStorage.getItem("pending_add_friend");
    const friendCode = codeFromUrl || codeFromStorage;

    if (!friendCode) return;

    // Mở modal và chuyển sang tab nhập mã
    setOpenContactModal(true);
    setActiveTab("code");
    setReceiverInfo(prev => ({ ...prev, code: friendCode }));

    // Tự động gửi lời mời
    toast.info(`Đang tự động gửi lời mời kết bạn...`);
    handleSendInvitation({ username: "", email: "", code: friendCode });

    // Dọn dẹp: xóa URL param và localStorage để tránh lặp lại khi refresh
    if (codeFromUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("add-friend");
      setSearchParams(newParams, { replace: true });
    }
    if (codeFromStorage) {
      localStorage.removeItem("pending_add_friend");
    }
  }, [user]); // Chỉ chạy khi user thay đổi (login/logout)

  const handleChange = (e) => {
    const { id, value } = e.target;
    setReceiverInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleSendInvitation = async (payload) => {
    setIsLoading(true);
    try {
      const res = await axiosJWT.post(
        `${BASE_URL}/contacts/add`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        toast.success(result.message);
        setOpenContactModal(false);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleSendInvitation(receiverInfo);
  };
  
  return (
    <div
      className={`modal-container contact-modal-container ${
        openContactModal ? "show" : ""
      }`}
    >
      <div className="modal" onClick={() => setOpenContactModal(false)}>
        <div
          className="modal-centered contact-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content contact-modal-content">
            <div className="modal-title">
              <h5 className="capitalize text-[18.75px]">add contacts</h5>
              <span onClick={() => setOpenContactModal(false)}>
                <i>
                  <RiCloseFill />
                </i>
              </span>
            </div>
            <div className="flex relative">
              <button
                type="button"
                onClick={() => setActiveTab("info")}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === "info" ? "text-[#7269ef]" : ""
                }`}
              >
                Email / Username
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === "code" ? "text-[#7269ef]" : ""
                }`}
              >
                User Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === "qr" ? "text-[#7269ef]" : ""
                }`}
              >
                QR Code
              </button>
              <span
                className={`absolute bottom-0 h-[2px] bg-[#7269ef] transition-transform duration-300 ease-in-out`}
                style={{
                  width: "33.33%", // 3 tabs
                  transform:
                    activeTab === "info"
                      ? "translateX(0%)"
                      : activeTab === "code"
                      ? "translateX(100%)"
                      : "translateX(200%)",
                }}
              />
            </div>

            <div className="modal-body p-6">
              <form className="w-full">
                {activeTab === "code" && (
                  <div className="modal-input-group">
                    <label htmlFor="code">Code</label>
                    <input
                      onChange={handleChange}
                      type="text"
                      id="code"
                      value={receiverInfo.code}
                      placeholder="Enter user code"
                    ></input>
                  </div>
                )}
                {activeTab === "info" && (
                  <>
                    <div className="modal-input-group">
                      <label htmlFor="email" className="">
                        Email
                      </label>
                      <input
                        onChange={handleChange}
                        type="email"
                        id="email"
                        placeholder="Enter email"
                      ></input>
                    </div>
                    <div className="modal-input-group">
                      <label htmlFor="username" className="">
                        Username
                      </label>
                      <input
                        onChange={handleChange}
                        type="text"
                        id="username"
                        placeholder="Enter username"
                      ></input>
                    </div>
                  </>
                )}
                {activeTab === "qr" && (
                  <QRCodeTab
                    user={user}
                    onScanSuccess={(code) => {
                      setReceiverInfo({ username: "", email: "", code });
                      toast.info("QR Scanned! Sending invitation...");
                      handleSendInvitation({ username: "", email: "", code });
                    }}
                  />
                )}
              </form>
            </div>
            <div className="modal-footer">
              <Button
                type="text"
                className="denied-btn"
                onClick={() => setOpenContactModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleSubmit}
                type="primary"
                className="agree-btn"
              >
                Invite Contact
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default ContactModal;
