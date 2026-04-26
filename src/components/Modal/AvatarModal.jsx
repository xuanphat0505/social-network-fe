import { useState, useContext, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RiCloseFill, RiUploadCloudLine, RiImageLine } from "react-icons/ri";
import { Button } from "antd";
import { toast } from "react-toastify";

import { loginSuccess } from "@/redux/authSlice";
import { OpenContext } from "@/context/OpenContext";
import { avatarList } from "@/assets/data/index";
import { BASE_URL } from "@/config/utils";
import useAxiosJWT from "@/config/axiosConfig";
import Loader from "@/shared/Loader/Loader";

import "./modal.scss";
function AvatarModal() {
  const user = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const { setOpenAvatarModal, openAvatarModal } = useContext(OpenContext);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("gallery"); // 'gallery' or 'upload'
  const [uploadedFile, setUploadedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileInputRef = useRef(null);
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return toast.error("Please select an image file");
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return toast.error("Image size must be less than 5MB");
    }

    setUploadedFile(file);
    setSelected(null); // Clear gallery selection

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleChangeAvatar = async () => {
    if (activeTab === "gallery" && !selected) {
      return toast.error("Please select an avatar");
    }
    if (activeTab === "upload" && !uploadedFile) {
      return toast.error("Please upload an image");
    }

    setIsLoading(true);
    try {
      let res;
      
      if (activeTab === "gallery") {
        // Update with selected avatar from gallery (send as JSON)
        res = await axiosJWT.put(
          `${BASE_URL}/user/update/avatar`,
          { avatar: selected },
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
              "Content-Type": "application/json",
            },
            withCredentials: true,
          }
        );
      } else {
        // Upload custom avatar (send as FormData)
        const formData = new FormData();
        formData.append("avatar", uploadedFile);

        res = await axiosJWT.put(
          `${BASE_URL}/user/update/avatar`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user?.accessToken}`,
              "Content-Type": "multipart/form-data",
            },
            withCredentials: true,
          }
        );
      }

      const result = res.data;
      if (result.success) {
        dispatch(loginSuccess({ ...user, avatar: result.data.avatar }));
        setOpenAvatarModal(false);
        setUploadedFile(null);
        setPreviewUrl(null);
        setSelected(null);
        return toast.success(result.message);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message || "Failed to update avatar");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "gallery") {
      setUploadedFile(null);
      setPreviewUrl(null);
    } else {
      setSelected(null);
    }
  };

  return (
    <div
      className={`modal-container avatar-modal-container ${
        openAvatarModal ? "show" : ""
      }`}
    >
      <div className="modal" onClick={() => setOpenAvatarModal(false)}>
        <div className="modal-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content avatar-modal-content relative">
            <span
              onClick={() => setOpenAvatarModal(false)}
              className="absolute top-[25px] right-[10px] cursor-pointer w-8 h-8 flex items-center justify-center text-[20px] hover:text-[#fff]"
            >
              <i>
                <RiCloseFill />
              </i>
            </span>
            <div className="modal-title">
              <h4 className="text-[16px]">Choose your avatar</h4>
            </div>

            {/* Tabs */}
            <div className="avatar-tabs">
              <button
                className={`tab-btn ${activeTab === "gallery" ? "active" : ""}`}
                onClick={() => handleTabChange("gallery")}
              >
                <RiImageLine className="mr-2" />
                Gallery
              </button>
              <button
                className={`tab-btn ${activeTab === "upload" ? "active" : ""}`}
                onClick={() => handleTabChange("upload")}
              >
                <RiUploadCloudLine className="mr-2" />
                Upload
              </button>
            </div>

            <div className="modal-body p-6">
              {activeTab === "gallery" ? (
                <div className="avatar-list">
                  {avatarList.map((src, index) => (
                    <div
                      key={index}
                      className={`avatar-item${
                        selected === src.image ? " selected" : ""
                      }`}
                      onClick={() => setSelected(src.image)}
                    >
                      <img src={src.image} alt={`avatar-${index + 1}`} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="upload-section">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />

                  {previewUrl ? (
                    <div className="preview-container">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="preview-image"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="change-image-btn"
                      >
                        Change Image
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-placeholder"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <RiUploadCloudLine className="upload-icon" />
                      <p className="upload-text">Click to upload image</p>
                      <p className="upload-hint">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <Button
                type="text"
                className="denied-btn"
                onClick={() => setOpenAvatarModal(false)}
              >
                Close
              </Button>
              <Button
                onClick={handleChangeAvatar}
                type="primary"
                className="agree-btn"
              >
                {isLoading ? <Loader /> : "Change Avatar"}
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default AvatarModal;
