/**
 * Định dạng thời gian từ chuỗi ISO sang định dạng hh:mm AM/PM hoặc 24h
 */
export const formatTime = (time) => {
  if (!time) return "";
  const date = new Date(time);
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const hours24 = hours.toString().padStart(2, "0");
  
  // Bạn có thể tùy chỉnh format ở đây
  return `${hours24}:${minutes} ${ampm}`;
};

/**
 * So sánh xem hai mốc thời gian có cùng một ngày hay không
 */
export const isDifferentDay = (date1, date2) => {
  if (!date1 || !date2) return true;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() !== d2.toDateString();
};
