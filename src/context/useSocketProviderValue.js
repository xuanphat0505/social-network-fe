import { useMemo } from 'react';

export function useSocketProviderValue(axiosContext, socketState) {
  return useMemo(
    () => ({
      notifications: axiosContext?.notifications,
      socket: socketState.socket,
      localVideoRef: socketState.localVideoRef,
      remoteVideoRef: socketState.remoteVideoRef,
      remoteStreamRef: socketState.remoteStreamRef,
      callDuration: socketState.callDuration,
      callState: socketState.callState,
      blockedBy: socketState.blockedBy,
      startCall: socketState.startCall,
      endCall: socketState.endCall,
      acceptCall: socketState.acceptCall,
      broadcastMessage: socketState.broadcastMessage,
      localStream: socketState.localStream,
      remoteStream: socketState.remoteStream,
      isVideoMinimized: socketState.isVideoMinimized,
      setIsVideoMinimized: socketState.setIsVideoMinimized,
      clearBroadcast: socketState.clearBroadcast,
    }),
    [axiosContext?.notifications, socketState]
  );
}
