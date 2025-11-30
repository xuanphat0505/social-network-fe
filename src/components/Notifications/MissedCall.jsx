import { useContext } from 'react';
import { HiPhoneMissedCall } from 'react-icons/hi';

import { SocketContext } from '../../context/SocketContext';

import './notification.scss';
function MissedCall({ notification, handleReadSingleNotification }) {
  const { startCall } = useContext(SocketContext);

  const formatDateTime = (iso) => {
    try {
      const d = new Date(iso);
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const mo = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${hh}:${mm} · ${dd}/${mo}/${yyyy}`;
    } catch {
      return '';
    }
  };

  return (
    <div
      onClick={() => handleReadSingleNotification(notification._id)}
      className={`notification-item flex items-center p-3 rounded-xl transition cursor-pointer 
    ${
      !notification.isRead
        ? 'bg-notification-bg hover:bg-notification-hover-bg'
        : 'bg-notification-read-bg'
    }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 mr-3 flex-shrink-0">
        <img
          src={notification?.sender?.avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>

      {/* Nội dung */}
      <div className="flex-1 text-sm">
        <p className="flex items-center gap-1">
          <span className="text-gray-300">
            Missed {notification.isVideo ? 'video' : 'audio'} call from{' '}
            <b className="text-[#7269ef]">{notification?.sender?.username}</b>
          </span>
        </p>
        {notification?.createdAt && (
          <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.createdAt)}</p>
        )}
      </div>

      {/* Action */}
      <div className="flex flex-shrink-0">
        <button
          onClick={(e) => {
            e.stopPropagation();
            startCall(
              {
                _id: notification?.sender._id,
                username: notification?.sender?.username,
                avatar: notification?.sender?.avatar,
              },
              notification.isVideo
            );
          }}
          className="flex items-center justify-center w-8 h-8 rounded-full 
                 bg-notification-denied-bg text-notification-denied 
                 hover:bg-notification-denied-bg-hover transition"
        >
          <HiPhoneMissedCall size={16} />
        </button>
      </div>
    </div>
  );
}

export default MissedCall;
