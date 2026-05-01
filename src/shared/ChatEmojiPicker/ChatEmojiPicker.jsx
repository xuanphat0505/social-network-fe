import { memo, useEffect, useRef } from "react";
import EmojiPicker from "emoji-picker-react";

/**
 * Component Wrapper cho EmojiPicker để tái sử dụng và tối ưu hiệu năng
 */
const ChatEmojiPicker = memo(
  ({
    open,
    onEmojiClick,
    theme = "light",
    width = 300,
    height = 400,
    reactionsDefaultOpen = false,
    onClickOutside,
  }) => {
    const pickerRef = useRef(null);

    useEffect(() => {
      if (!open) return;

      const handleClickOutside = (event) => {
        if (pickerRef.current && !pickerRef.current.contains(event.target)) {
          onClickOutside?.();
        }
      };

      // Dùng mousedown để bắt sự kiện sớm hơn click và tránh xung đột stopPropagation
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }, [open, onClickOutside]);

    if (!open) return null;

    return (
      <div ref={pickerRef} className="emoji-picker-wrapper">
        <EmojiPicker
          open={open}
          lazyLoadEmojis={true}
          theme={theme}
          width={width}
          height={height}
          reactionsDefaultOpen={reactionsDefaultOpen}
          onEmojiClick={onEmojiClick}
        />
      </div>
    );
  },
);

export default ChatEmojiPicker;
