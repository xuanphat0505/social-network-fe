import { memo } from "react";

const TextMessage = memo(({ 
  text, 
  messageId, 
  messageRefs, 
  hightlightMessage 
}) => (
  <p
    ref={(el) => (messageRefs.current[messageId] = el)}
    className={`select-text ${
      hightlightMessage === messageId ? "highlight" : ""
    }`}
  >
    {text}
  </p>
));

export default TextMessage;
