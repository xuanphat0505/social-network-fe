import { useContext, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "react-toastify";
import { Button, Form } from "antd";
import { RiCloseFill } from "react-icons/ri";

import useAxiosJWT from "../../config/axiosConfig";
import { OpenContext } from "../../context/OpenContext";
import { BASE_URL } from "../../config/utils";
import Loader from "../../shared/Loader/Loader";

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

  const handleChange = (e) => {
    const { id, value } = e.target;
    setReceiverInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await axiosJWT.post(
        `${BASE_URL}/contacts/add`,
        receiverInfo,
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
              <span
                className={`absolute bottom-0 h-[2px] bg-[#7269ef] transition-transform duration-300 ease-in-out`}
                style={{
                  width: "50%", // vì có 2 tab nên 50%
                  transform:
                    activeTab === "info"
                      ? "translateX(0%)"
                      : "translateX(100%)",
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
