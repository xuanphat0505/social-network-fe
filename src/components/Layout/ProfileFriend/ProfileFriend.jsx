import {
  RiMapPin2Line,
  RiUser3Line,
  RiMailLine,
  RiCloseLine,
  RiFileTextLine,
  RiDownloadLine,
  RiImageFill,
  RiPushpinLine,
  RiAttachmentLine,
  RiUser2Fill
} from "react-icons/ri";
import { STATUS_COLOR_CLASSES } from "@/config/statusColors";

const ProfileFriend = ({ open, onClose, receiver, files, pinnedMessages }) => {

  const formatTime = (dateString) => {
    if (!dateString) return "";

    const date = new Date(dateString);

    // Ví dụ: Aug 28
    const optionsDate = { month: "short", day: "numeric" };
    const formattedDate = date.toLocaleDateString("en-US", optionsDate);

    // Ví dụ: 9:10 AM
    const optionsTime = { hour: "numeric", minute: "2-digit", hour12: true };
    const formattedTime = date.toLocaleTimeString("en-US", optionsTime);

    return `${formattedDate}, ${formattedTime}`;
  };

  return (
    <div className={`profile-friend-container${open ? " show" : ""}`}>
      <div className="profile-friend-header flex items-center justify-between">
        <button className="close-btn" onClick={onClose}>
          <i>
            <RiCloseLine />
          </i>
        </button>
        <h5>Profile</h5>
      </div>

      <div className="profile-friend-content">
        <div className="user-profile-info">
          <div className="avatar-container">
            <img
              src={receiver?.avatar}
              alt="Profile"
              className="profile-avatar"
            />
            <span
              className={`status-badge ${STATUS_COLOR_CLASSES[receiver?.status]?.bg
                }`}
            ></span>
          </div>
          <h5 className="user-name">{receiver?.username}</h5>
          <p
            className={`text-[.9rem] ${STATUS_COLOR_CLASSES[receiver?.status]?.text
              } capitalize`}
          >
            {receiver?.status}
          </p>
        </div>

        {/* About */}
        <div className="profile-section">
          <h6 className="section-title">About</h6>
          <p className="about-text">{receiver?.slogan}</p>
        </div>

        {/* Personal Info */}
        <div className="profile-section">
          <h6 className="section-title flex items-center">
            <RiUser3Line className="mr-2 text-[#7269ef]" /> Personal Information
          </h6>
          <div className="info-list">
            <div className="info-item">
              <div className="info-icon">
                <RiUser2Fill />
              </div>
              <div className="info-content">
                <p className="info-label">Name</p>
                <p className="info-value">{receiver?.username}</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">
                <RiMailLine />
              </div>
              <div className="info-content">
                <p className="info-label">Email</p>
                <p className="info-value">{receiver?.email}</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">
                <RiMapPin2Line />
              </div>
              <div className="info-content">
                <p className="info-label">Location</p>
                <p className="info-value">{receiver?.location}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Attached Files */}
        <div className="profile-section">
          <h6 className="section-title flex items-center">
            <RiAttachmentLine className="mr-2 text-[#7269ef]" /> Attached Files
          </h6>
          <div className="files-list">
            {files.map((file, index) => (
              <div key={index} className="file-item card">
                <div className="flex items-center">
                  <div className="w-12 h-12 mr-4 cursor-pointer">
                    <div className="avatar-file">
                      {file.type === "file" ? (
                        <RiFileTextLine />
                      ) : (
                        <RiImageFill />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 overflow-hidden mr-2 cursor-pointer">
                    <div>
                      <h5 className="text-[14px] mb-1">{file?.originalName}</h5>
                      <p className="text-[13px] text-secondary-color">
                        {file?.sizeMB} MB
                      </p>
                    </div>
                  </div>
                  <div>
                    <ul className="file-actions">
                      <li className="action-item">
                        <a
                          href={file.fileUrl}
                          download
                          className="action-btn"
                          title="Download"
                        >
                          <RiDownloadLine />
                        </a>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pinned Messages */}
        <div className="profile-section">
          <h6 className="section-title flex items-center justify-between">
            <span className="flex items-center">
              <RiPushpinLine className="mr-2 text-[#7269ef]" /> Pinned Messages
            </span>
          </h6>
          <div className="pinned-messages-list mt-3 space-y-2 max-h-64 overflow-auto">
            {pinnedMessages.map((msg) => (
              <div
                key={msg._id}
                className="pinned-message card p-3 rounded-md border border-border-color hover:shadow-md transition"
              >
                <p className="text-sm mb-2 text-body-color">{msg.content}</p>
                <div className="text-xs text-secondary-color flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-[var(--file-bg-color)] text-[11px]">
                    {msg?.pinnedBy?.username}
                  </span>
                  <span className="text-[11px]">{formatTime(msg?.pinnedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileFriend;
