import { useContext } from "react";

import { NavLinkContext } from "../../../context/NavLinkContext";
import Profile from "../../../components/Profile/Profile";
import ChatList from "../../ChatList/ChatList";
import Contacts from "../../Contacts/Contacts";
import Setting from "../../Setting/Setting";

function LeftSidebar() {
  const { navLink } = useContext(NavLinkContext);
  return (
    <div className="left-sidebar">
      <div className="tab-content">
        <Profile navLink={navLink} />
        <ChatList navLink={navLink} />
        <Contacts navLink={navLink} />
        <Setting navLink={navLink} />
      </div>
    </div>
  );
}

export default LeftSidebar;
