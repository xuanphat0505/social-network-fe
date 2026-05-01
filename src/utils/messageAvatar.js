export function getMessageShowAvatar(messages, currentMessage) {
  if (!currentMessage) return false;

  const prevMessage = [...(messages || [])]
    .reverse()
    .find((message) => message?.type !== "typing");

  if (!prevMessage) return true;

  return (
    String(prevMessage?.senderId?._id || "") !==
    String(currentMessage?.senderId?._id || "")
  );
}
