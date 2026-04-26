import { memo } from "react";

const RevokedMessage = memo(({ text }) => (
  <p className="italic text-gray-300">{text}</p>
));

export default RevokedMessage;
