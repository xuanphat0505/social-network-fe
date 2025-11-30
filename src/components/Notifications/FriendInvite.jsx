import { useDispatch, useSelector } from 'react-redux';
import { RiCheckFill, RiCloseFill } from 'react-icons/ri';
import { toast } from 'react-toastify';

import useAxiosJWT from '../../config/axiosConfig';
import { loginSuccess } from '../../redux/authSlice';
import { BASE_URL } from '../../config/utils';

import './notification.scss';
function FriendInvite({ notification, handleReadSingleNotification }) {
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

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

  const handleResponse = async (e, status) => {
    e.preventDefault();
    try {
      const res = await axiosJWT.post(
        `${BASE_URL}/contacts/response`,
        {
          notificationId: notification._id,
          senderId: notification.sender._id,
          status,
        },
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        }
      );

      const result = res.data;

      if (result.success) {
        // Cập nhật state Redux bằng cách xoá notification đã xử lý
        const updatedNotifications = user.notifications.filter((n) => n._id !== notification._id);

        dispatch(
          loginSuccess({
            ...user,
            notifications: updatedNotifications,
          })
        );

        toast.success(result.message);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  return (
    <div
      onClick={() => handleReadSingleNotification(notification._id)}
      className={`notification-item flex items-center p-3 rounded-xl transition cursor-pointer ${
        !notification.isRead ? 'bg-notification-bg' : 'bg-notification-read-bg'
      }`}
    >
      {/* Avatar */}
      <div className="w-10 h-10 mr-3 flex-shrink-0">
        <img
          src={notification.sender.avatar}
          alt="avatar"
          className="w-10 h-10 rounded-full object-cover border border-[#7269ef]/40"
        />
      </div>

      {/* Nội dung */}
      <div className="flex-1">
        <p className="text-sm text-body-color leading-snug">
          <b className="text-[#7269ef]">{notification.sender.username}</b> has sent you a{' '}
          <span className="font-medium text-body-color">friend request</span>
        </p>
        {notification?.createdAt && (
          <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.createdAt)}</p>
        )}
      </div>

      {/* Nút hành động */}
      <div className="flex flex-shrink-0 gap-2 ml-3">
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-notification-accept-bg text-notification-accept hover:bg-notification-accept-bg-hover transition"
          onClick={(e) => handleResponse(e, 'success')}
        >
          <RiCheckFill size={18} />
        </button>
        <button
          className="flex items-center justify-center w-8 h-8 rounded-full bg-notification-denied-bg text-notification-denied hover:bg-notification-denied-bg-hover transition"
          onClick={(e) => handleResponse(e, 'denied')}
        >
          <RiCloseFill size={18} />
        </button>
      </div>
    </div>
  );
}

export default FriendInvite;
