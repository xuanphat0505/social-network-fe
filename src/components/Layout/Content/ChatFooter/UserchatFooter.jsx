import { useSelector } from 'react-redux';
import { Button } from 'antd';
import { useContext, useEffect, useRef, useState } from 'react';
import {
  RiAttachmentLine,
  RiEmotionHappyLine,
  RiFileTextFill,
  RiImageFill,
  RiSendPlane2Fill,
  RiCloseLine,
} from 'react-icons/ri';
import { toast } from 'react-toastify';
import Tippy from '@tippyjs/react';

import { ThemeContext } from '@/context/ThemeContext';
import ChatEmojiPicker from '@/shared/ChatEmojiPicker/ChatEmojiPicker';
import { BASE_URL } from '@/config/utils';
import { AxiosContext } from '@/context/AxiosContext';
import { SocketContext } from '@/context/SocketContext';
import useAxiosJWT from '@/config/axiosConfig';
import Loader from '@/shared/Loader/Loader';

import '../userchat.scss';
function UserchatFooter({ receiverId }) {
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const user = useSelector((state) => state.auth?.user);
  const { theme } = useContext(ThemeContext);
  const { socket, blockedBy } = useContext(SocketContext);
  const { setMessages, setChatList, isBlockedByReceiver } = useContext(AxiosContext);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]); // lưu nhiều file
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const fileInputRef = useRef();
  const typingTimeoutRef = useRef();
  const textareaRef = useRef();

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim() && selectedFiles.length === 0) {
      return; // Bỏ qua âm thầm (Silent Return) chuẩn UX chat app
    }

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      senderId: {
        _id: user._id,
        username: user.username,
        avatar: user.avatar,
      },
      receiverId: {
        _id: receiverId,
      },
      content: content,
      type: selectedFiles.length > 0 ? (selectedFiles.every(f => f.type.startsWith('image/')) ? 'image' : 'file') : 'text',
      files: selectedFiles.map(f => ({
        originalName: f.name,
        fileUrl: f.preview || '', // Preview URL for images
        type: f.type.startsWith('image/') ? 'image' : 'file',
      })),
      createdAt: new Date().toISOString(),
      status: "sending",
      isOptimistic: true,
    };

    // 1. Cập nhật UI ngay lập tức (Optimistic Update)
    setMessages((prev) => {
      const showAvatar = prev.length === 0 || prev[prev.length - 1].senderId._id !== user._id;
      return [...prev, { ...optimisticMessage, showAvatar }];
    });

    // 2. Cập nhật Chat List ngay lập tức
    setChatList((prev) => {
      const idx = prev.findIndex((chat) => {
        const partner = chat.senderId._id === user._id ? chat.receiverId._id : chat.senderId._id;
        return String(partner) === String(receiverId);
      });
      const next = [...prev];
      if (idx > -1) {
        const updatedChat = { ...next[idx], content: content || (selectedFiles.length > 0 ? "Đã gửi tệp đính kèm" : ""), createdAt: optimisticMessage.createdAt };
        next.splice(idx, 1);
        return [updatedChat, ...next];
      }
      return prev;
    });

    // 3. Clear input ngay lập tức
    setContent("");
    setSelectedFiles([]);
    setShowEmojiPicker(false);
    setIsLoading(false); // Không dùng loading state chặn UI nữa

    try {
      const formData = new FormData();
      formData.append("content", content);
      selectedFiles.forEach((f) => {
        formData.append("files", f.file);
      });

      await axiosJWT.post(`${BASE_URL}/messages/send/${receiverId}`, formData, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      // Không setMessages ở đây nữa, Socket sẽ đảm nhận việc nhận tin nhắn thật và thay thế tin nhắn tạm
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi gửi tin");
      // Xóa tin nhắn tạm nếu gửi lỗi
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    }
  };


  const handleFileSelect = (e) => {
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;

    const newFiles = Array.from(e.target.files)
      .filter((file) => {
        if (file.size > MAX_SIZE_BYTES) {
          toast.error(`${file.name} exceeds 5MB limit`);
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        name: file.name,
        type: file.type,
        size: file.size,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        _id: Math.random().toString(36).substring(2, 9),
      }));

    if (newFiles.length > 0) {
      setSelectedFiles((prev) => [...prev, ...newFiles]);

      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { senderId: user._id, receiverId });
      }

      clearTimeout(typingTimeoutRef.current);
    }

    e.target.value = null;
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setContent(value);

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { senderId: user._id, receiverId });
    }

    clearTimeout(typingTimeoutRef.current);
  };

  useEffect(() => {
    // clear timeout cũ mỗi lần content hoặc selectedFiles thay đổi
    const timeoutId = setTimeout(() => {
      if (content.trim() === '' && selectedFiles.length === 0 && isTyping) {
        setIsTyping(false);
        socket.emit('stopTyping', { senderId: user._id, receiverId });
      }
    }, 1500); // chờ 1.5 giây

    return () => clearTimeout(timeoutId); // cleanup khi deps thay đổi
  }, [content, selectedFiles]);

  // Tự động điều chỉnh chiều cao cho textarea khi nội dung thay đổi
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "24px"; // Reset về độ cao mặc định 1 dòng
      const scrollHeight = textareaRef.current.scrollHeight;
      // Cho phép textarea tự giãn nở dựa theo nội dung
      textareaRef.current.style.height = scrollHeight + "px";
    }
  }, [content]);

  return (
    <div className="user-chat_footer w-full p-6 border-t-[1px] border-border-color">
      <form className="w-full flex items-center flex-wrap">
        <div className="chat-box">
          <div className="input-with-files">
            {selectedFiles.length > 0 && (
              <div className="file-preview-inline">
                {selectedFiles.map((item) => (
                  <div
                    key={item._id}
                    className={item?.type?.startsWith('image/') ? 'image-chip' : 'file-chip'}
                  >
                    {item?.type?.startsWith('image/') ? (
                      <div className="relative">
                        <img
                          src={item.preview}
                          alt={item.name}
                          className="w-[35px] h-[35px] object-cover rounded"
                        />
                        <span
                          onClick={() =>
                            setSelectedFiles((prev) => prev.filter((f) => f._id !== item._id))
                          }
                          className="absolute top-[-2px] right-[-2px] text-[14px] cursor-pointer text-red-600"
                        >
                          <RiCloseLine />
                        </span>
                      </div>
                    ) : (
                      <>
                        <RiFileTextFill className="text-[14px] mr-[4px] flex-shrink-0" />
                        <span className="max-w-[100px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {item.name}
                        </span>
                        <span
                          onClick={() =>
                            setSelectedFiles((prev) => prev.filter((f) => f._id !== item._id))
                          }
                          className="text-[14px] ml-[4px] cursor-pointer text-red-600"
                        >
                          <RiCloseLine />
                        </span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
            <textarea
              ref={textareaRef}
              rows={1}
              className={`${
                user.blockedUsers.includes(receiverId) ||
                blockedBy[receiverId] ||
                isBlockedByReceiver
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
              onChange={handleChange}
              value={content}
              placeholder="Aa..."
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              disabled={
                user.blockedUsers.includes(receiverId) ||
                blockedBy[receiverId] ||
                isBlockedByReceiver
              }
            />
          </div>
        </div>

        <div className="chat-options ml-2">
          <ul className="w-full flex items-center">
            <li className="relative">
              <Button
                type="text"
                icon={<RiEmotionHappyLine />}
                className="chat-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker((prev) => !prev);
                }}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[999]">
                <ChatEmojiPicker
                  open={showEmojiPicker}
                  theme={theme}
                  width={300}
                  height={400}
                  onClickOutside={() => setShowEmojiPicker(false)}
                  onEmojiClick={(emojiData) => setContent((prev) => prev + emojiData.emoji)}
                />
              </div>
            </li>

            <Tippy content="Maximum size per file: 5MB" className="tippy-custom">
              <li>
                <Button
                  type="text"
                  icon={<RiAttachmentLine />}
                  className="chat-icon"
                  onClick={() => fileInputRef.current?.click()}
                />
              </li>
            </Tippy>

            <Tippy content="Maximum size per file: 5MB" className="tippy-custom">
              <li>
                <Button
                  type="text"
                  icon={<RiImageFill />}
                  className="chat-icon"
                  onClick={() => fileInputRef.current?.click()}
                />
              </li>
            </Tippy>

            <li>
              <Button
                type="primary"
                onClick={handleSendMessage}
                className="send-btn"
                disabled={
                  (!content.trim() && selectedFiles.length === 0) ||
                  user.blockedUsers.includes(receiverId) ||
                  blockedBy[receiverId] ||
                  isBlockedByReceiver
                }
              >
                {isLoading ? (
                  <Loader />
                ) : (
                  <span>
                    <RiSendPlane2Fill className="inline-flex" />
                  </span>
                )}
              </Button>
            </li>
          </ul>

          {/* input hidden để chọn nhiều file */}
          <input
            type="file"
            multiple
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </div>
      </form>
    </div>
  );
}

export default UserchatFooter;
