import { memo } from "react";

const ReactionGroup = memo(({ emojiArray, messageId, setOpenReactModal, groupEmojiToArray }) => {
  if (!emojiArray || emojiArray.length === 0) return null;
  
  const groupedEmoji = groupEmojiToArray(emojiArray);
  
  return (
    <div
      onClick={() =>
        setOpenReactModal({
          messageId: messageId,
          emoji: groupedEmoji,
        })
      }
      className="reaction-group"
    >
      {groupedEmoji.map(({ icon, users }) => (
        <span key={icon} className="flex items-center gap-1">
          {icon}
          {users.length >= 2 && (
            <span className="font-medium">{users.length}</span>
          )}
        </span>
      ))}
    </div>
  );
});

export default ReactionGroup;
