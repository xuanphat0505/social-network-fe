import { format } from 'date-fns';
import { vi } from 'date-fns/locale'; // nếu muốn tiếng Việt

function ChatDivider({ messageDate }) {
  if (!messageDate) return null;

  const today = new Date();
  const msgDate = new Date(messageDate);

  // Đảm bảo ngày hợp lệ
  if (isNaN(msgDate.getTime())) return null;

  // Tính số ngày chênh lệch
  const todayStart = new Date(today);
  todayStart.setHours(0, 0, 0, 0);

  const msgDateStart = new Date(msgDate);
  msgDateStart.setHours(0, 0, 0, 0);

  const diffTime = todayStart.getTime() - msgDateStart.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let label;
  if (diffDays === 0) {
    label = 'Today';
  } else if (diffDays === 1) {
    label = 'Yesterday';
  } else if (diffDays === -1) {
    label = 'Tomorrow';
  } else if (diffDays > 1) {
    // Hiện ngày tháng năm cho các ngày trong quá khứ
    label = format(msgDate, 'dd/MM/yyyy', { locale: vi });
  } else {
    // Hiện ngày tháng năm cho các ngày trong tương lai
    label = format(msgDate, 'dd/MM/yyyy', { locale: vi });
  }

  return (
    <li>
      <div className="chat-divider">
        <span className="capitalize">{label}</span>
      </div>
    </li>
  );
}

export default ChatDivider;
