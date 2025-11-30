import { useSelector } from "react-redux";
import { useContext } from "react";

import { OpenContext } from "../context/OpenContext";
import UserChatContainer from "../components/Layout/Content/UserChatContainer";
import LeftSidebar from "../components/Layout/LeftSidebar/LeftSidebar";
import Sidebar from "../components/Layout/Sidebar/Sidebar";
import AudioCallModal from "../components/Modal/AudioCallModal";
import ContactModal from "../components/Modal/ContactModal";
import VideoCallModal from "../components/Modal/VideoCallModal";
import AvatarModal from "../components/Modal/AvatarModal";
import ReactModal from "../components/Modal/ReactModal";
import RevokeMessageModal from "../components/Modal/RevokeMessageModal";
import UserCodeModal from "../components/Modal/UserCodeModal";

function Home() {
  const isFirstLogin = useSelector((state) => state.auth?.user?.isFirstLogin);

  return (
    <div className="main-wrapper">
      <Sidebar isFirstLogin={isFirstLogin} />
      <LeftSidebar />
      <UserChatContainer />
      <ContactModal />
      <AudioCallModal />
      <VideoCallModal />
      <AvatarModal />
      <ReactModal />
      <RevokeMessageModal />
      <UserCodeModal />
    </div>
  );
}

export default Home;
