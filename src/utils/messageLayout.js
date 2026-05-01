import { isDifferentDay } from "@/utils/date";

const isTypingMessage = (message) => message?.type === "typing";

const getPreviousRenderableMessage = (messages, currentIndex) => {
  for (let i = currentIndex - 1; i >= 0; i -= 1) {
    const candidate = messages[i];
    if (!isTypingMessage(candidate)) return candidate;
  }
  return null;
};

const getNextRenderableMessage = (messages, currentIndex) => {
  for (let i = currentIndex + 1; i < messages.length; i += 1) {
    const candidate = messages[i];
    if (!isTypingMessage(candidate)) return candidate;
  }
  return null;
};

export const getMessageLayoutMeta = (messages, currentMessage, currentIndex) => {
  if (!currentMessage) {
    return {
      showAvatar: false,
      showTimestamp: false,
      isDifferentDay: false,
    };
  }

  if (isTypingMessage(currentMessage)) {
    return {
      showAvatar: false,
      showTimestamp: false,
      isDifferentDay: false,
    };
  }

  const list = messages || [];
  const prevMessage = getPreviousRenderableMessage(list, currentIndex);
  const nextMessage = getNextRenderableMessage(list, currentIndex);
  const isSameSenderBefore =
    prevMessage &&
    String(prevMessage?.senderId?._id || "") === String(currentMessage?.senderId?._id || "");
  const isSameSenderAfter =
    nextMessage &&
    String(nextMessage?.senderId?._id || "") === String(currentMessage?.senderId?._id || "");
  const isGroupStart = !isSameSenderBefore;
  const isGroupEnd = !isSameSenderAfter;

  return {
    showAvatar: isGroupEnd,
    showTimestamp: true,
    isDifferentDay: isDifferentDay(currentMessage.createdAt, prevMessage?.createdAt),
  };
};
