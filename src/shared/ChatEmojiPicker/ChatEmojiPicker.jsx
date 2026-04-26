import { memo } from "react";
import EmojiPicker from "emoji-picker-react";

/**
 * Component Wrapper cho EmojiPicker để tái sử dụng và tối ưu hiệu năng
 */
const ChatEmojiPicker = memo(({ 
  open, 
  onEmojiClick, 
  theme = "light", 
  width = 300, 
  height = 400,
  reactionsDefaultOpen = false,
  onClickOutside
}) => {
  if (!open) return null;

  return (
    <EmojiPicker
      open={open}
      lazyLoadEmojis={true}
      theme={theme}
      width={width}
      height={height}
      reactionsDefaultOpen={reactionsDefaultOpen}
      onEmojiClick={onEmojiClick}
      onClickOutside={onClickOutside}
    />
  );
});

export default ChatEmojiPicker;
