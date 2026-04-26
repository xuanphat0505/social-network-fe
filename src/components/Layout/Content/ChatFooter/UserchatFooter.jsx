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

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!content.trim() && selectedFiles.length === 0) {
      return toast.error('Vui lòng nhập tin nhắn hoặc chọn file');
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('content', content);

      // ✅ key phải trùng "files" (số nhiều)
      selectedFiles.forEach((f) => {
        formData.append('files', f.file); // gửi object File gốc
      });

      const res = await axiosJWT.post(`${BASE_URL}/messages/send/${receiverId}`, formData, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      const result = res.data;
      if (result.success) {
        // cập nhật messages
        setMessages((prev) => {
          if (prev.length > 0) {
            const lastMsg = prev[prev.length - 1];
            if (lastMsg.senderId._id === result.data.senderId._id) {
              const updated = [...prev];
              updated[updated.length - 1] = { ...lastMsg, showAvatar: false };
              return [...updated, { ...result.data, showAvatar: true }];
            }
          }
          return [...prev, { ...result.data, showAvatar: true }];
        });

        // cập nhật chat list
        setChatList((prev) => {
          const partnerIdOf = (m) =>
            m.senderId._id === user?._id ? m.receiverId._id : m.senderId._id;
          const partnerId = partnerIdOf(result.data);
          const idx = prev.findIndex((m) => partnerIdOf(m) === partnerId);
          const next = [...prev];
          if (idx > -1) next.splice(idx, 1);
          return [result.data, ...next];
        });
        setShowEmojiPicker(false);
        setContent('');
        setSelectedFiles([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi gửi tin');
    } finally {
      setIsLoading(false);
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
            <input
              className={`${
                user.blockedUsers.includes(receiverId) ||
                blockedBy[receiverId] ||
                isBlockedByReceiver
                  ? 'cursor-not-allowed opacity-50'
                  : ''
              }`}
              onChange={handleChange}
              value={content}
              type="text"
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
                onClick={() => setShowEmojiPicker((prev) => !prev)}
              />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[999]">
                <ChatEmojiPicker
                  open={showEmojiPicker}
                  theme={theme}
                  width={300}
                  height={400}
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
              <Button type="primary" onClick={handleSendMessage} className="send-btn">
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
