import { useContext } from "react";
import { Link,  } from "react-router-dom";
import { RiUserAddLine, RiEdit2Line, RiChatSmile2Line } from "react-icons/ri";

import { OpenContext } from "../context/OpenContext";
import { NavLinkContext } from "../context/NavLinkContext";
import avatarImg from "../assets/images/avatar.jpg";

const StartedContainer = ({ user }) => {
  const { setNavLink } = useContext(NavLinkContext);
  const { setOpenContactModal } = useContext(OpenContext);
  const handleToContacts = () => {
    // navigate("/");
    setNavLink("contacts");
    setTimeout(() => {
      setOpenContactModal(true);
    }, 300);
  };
  return (
    <div className="started-container flex flex-col items-center justify-center min-h-screen">
      <div className="welcome-avatar mb-4">
        <img
          src={user?.avatar || avatarImg}
          alt="avatar"
          className="rounded-full w-20 h-20 border-4 border-[#7269ef22] shadow"
        />
      </div>
      <h2 className="text-2xl font-bold mb-2 text-[#7269ef]">
        Welcome, {user?.username || "User"}!
      </h2>
      <p className="text-lg text-secondary-color mb-6 text-center max-w-md">
        Your account has been created successfully. Start exploring all the
        features of our social network!
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl mb-8">
        <Link
          to="/"
          onClick={() => setNavLink("settings")}
          className="started-card"
        >
          <div className="icon-wrapper">
            <RiEdit2Line />
          </div>
          <h3>Update Profile</h3>
          <p>
            Add your personal information and avatar so friends can recognize
            you easily.
          </p>
        </Link>
        <Link to={"/"} onClick={handleToContacts} className="started-card">
          <div className="icon-wrapper">
            <RiUserAddLine />
          </div>
          <h3>Find Friends</h3>
          <p>Connect with friends and colleagues to start chatting.</p>
        </Link>
        <Link
          to="/"
          onClick={() => setNavLink("chats")}
          className="started-card"
        >
          <div className="icon-wrapper">
            <RiChatSmile2Line />
          </div>
          <h3>Start Chatting</h3>
          <p>Send messages, images, files and much more with your friends.</p>
        </Link>
      </div>
      <div className="text-footer text-center text-sm text-gray-400">
        <p>
          If you need help, please visit the{" "}
          <Link to="/help" className="text-[#7269ef] underline">
            Help Center
          </Link>{" "}
          or contact admin.
        </p>
      </div>
    </div>
  );
};

export default StartedContainer;
