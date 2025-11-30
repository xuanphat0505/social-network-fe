// utils/chat.js
export const getDisplayContent = (message, currentUserId) => {
  // Nếu revoke cho tất cả
  if (message.isRevoked) {
    return {
      type: 'revoked',
      text: 'Tin nhắn đã được thu hồi',
    };
  }

  // Nếu revoke chỉ mình user
  if (Array.isArray(message.deletedBy) && message.deletedBy.includes(currentUserId)) {
    return {
      type: 'revoked',
      text: 'Tin nhắn đã được thu hồi',
    };
  }

  // Nếu là tin nhắn cuộc gọi
  if (message.type === 'call') {
    return {
      type: 'call',
      text: message.content,
      callData: message.callData,
    };
  }

  // Nếu còn nguyên thì trả về đúng type
  return {
    type: message.type,
    text: message.content,
    files: message.files,
  };
};
