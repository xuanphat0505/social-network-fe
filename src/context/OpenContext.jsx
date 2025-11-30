import { createContext, useState } from "react";

// eslint-disable-next-line react-refresh/only-export-components
export const OpenContext = createContext();

function OpenProvider({ children }) {
  // group infos
  const [groupInfo, setGroupInfo] = useState({
    name: "",
    description: "",
    members: [],
  });

  const [openContactModal, setOpenContactModal] = useState(false);
  const [openAudioCallModal, setOpenAudioCallModal] = useState(null);
  const [openVideoCallModal, setOpenVideoCallModal] = useState(null);
  const [openAvatarModal, setOpenAvatarModal] = useState(false);
  const [openReactModal, setOpenReactModal] = useState(null);
  const [openRevokeMessageModal, setOpenRevokeMessageModal] = useState(null);
  const [openUserCodeModal, setOpenUserCodeModal] = useState(null);
  const [openChatBox, setOpenChatBox] = useState(null);



 

  return (
    <OpenContext.Provider
      value={{
        // State variables
        openContactModal,
        openAudioCallModal,
        openVideoCallModal,
        openAvatarModal,
        openChatBox,
        openReactModal,
        openRevokeMessageModal,
        openUserCodeModal,
        groupInfo,
        // Functions to set the state of modals
        setGroupInfo,
        setOpenContactModal,
        setOpenAudioCallModal,
        setOpenVideoCallModal,
        setOpenAvatarModal,
        setOpenReactModal,
        setOpenChatBox,
        setOpenRevokeMessageModal,
        setOpenUserCodeModal,
      }}
    >
      {children}
    </OpenContext.Provider>
  );
}

export default OpenProvider;
