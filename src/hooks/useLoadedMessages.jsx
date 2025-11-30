import { useRef, useCallback } from "react";

/**
 * Hook quản lý các chat đã load messages để tránh gọi API trùng lặp
 * @param {Function} fetchMessages - Hàm API để lấy tin nhắn (partnerId) => void
 * @returns {{ openChat: Function, isLoaded: Function, resetLoaded: Function }}
 */
export function useLoadedMessages(fetchMessages) {
  // Dùng Set để lưu partnerId đã load
  const loadedChatsRef = useRef(new Set());

  /**
   * Mở chat và load tin nhắn nếu chưa có
   * @param {string} partnerId
   */
  const openChat = useCallback(
    (partnerId) => {
      if (!loadedChatsRef.current.has(partnerId)) {
        fetchMessages(partnerId);
        loadedChatsRef.current.add(partnerId);
      }
    },
    [fetchMessages]
  );

  /**
   * Kiểm tra xem chat đã load chưa
   */
  const isLoaded = useCallback((partnerId) => {
    return loadedChatsRef.current.has(partnerId);
  }, []);

  /**
   * Reset danh sách loaded (ví dụ khi logout)
   */
  const resetLoaded = useCallback(() => {
    loadedChatsRef.current.clear();
  }, []);

  return { openChat, isLoaded, resetLoaded };
}
