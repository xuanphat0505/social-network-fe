import { createContext, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";

import { AxiosContext } from "@/context/AxiosContext";
import { OpenContext } from "@/context/OpenContext";
import { loginSuccess } from "@/redux/authSlice";
import { useSocketManager } from "@/hooks/useSocketManager";
import { useSocketProviderValue } from "@/context/useSocketProviderValue";
import messageSound from "@/assets/sounds/facebook_message.mp3";

// eslint-disable-next-line react-refresh/only-export-components
export const SocketContext = createContext();

function SocketProvider({ children }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);

  const axiosContext = useContext(AxiosContext);
  const openContext = useContext(OpenContext);

  const socketState = useSocketManager({
    socket: axiosContext?.socket,
    user,
    dispatch,
    loginSuccess,
    axiosContext,
    openContext,
  });

  const value = useSocketProviderValue(axiosContext, socketState);

  return (
    <SocketContext.Provider value={value}>
      {children}
      <audio ref={socketState.messageAudioRef} preload="auto">
        <source src={messageSound} type="audio/mpeg" />
      </audio>
    </SocketContext.Provider>
  );
}

export default SocketProvider;
