import { useState, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  RiRecordCircleFill,
  RiUser2Line,
} from 'react-icons/ri';
import { LuBellRing } from 'react-icons/lu';
import { IoChevronUp, IoChevronDown } from 'react-icons/io5';
import { FiUser, FiMail, FiMapPin, FiHash } from 'react-icons/fi';

import { AxiosContext } from '@/context/AxiosContext';
import { STATUS_COLOR_CLASSES } from '@/config/statusColors';
import FriendInvite from '@/components/Notifications/FriendInvite';
import MissedCall from '@/components/Notifications/MissedCall';
import ResponseRequest from '@/components/Notifications/ResponeRequest';

import './profile.scss';
function Profile({ navLink }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth?.user);
  const { 
    notifications, 
    handleReadAllNotifications, 
    handleReadSingleNotification 
  } = useContext(AxiosContext);
  const { t } = useTranslation();
  const [activeAboutTab, setActiveAboutTab] = useState(false);
  const [activeNotificationTab, setActiveNotificationTab] = useState(false);

  const notificationComponentMap = {
    friend_request: FriendInvite,
    missed_call: MissedCall,
    response_request: ResponseRequest,
  };


  return (
    <div className={`tab-pane ${navLink === 'profile' ? 'active' : ''}`}>
      <div>
        <div className="card-header flex items-center justify-between">
          <h4 className="mb-0 text-[21px] capitalize">{t('profileHeader')}</h4>
        </div>
        <div className="p-6 text-center border-b-[1px] border-border-color">
          <div className="inline-block mb-5">
            <img src={user?.avatar} alt="avatar" className="avatar"></img>
          </div>
          <h5 className="text-[16px] mb-1 ">{user?.username}</h5>
          <p className="text-more-btn-color mb-1 select-none capitalize">
            <i
              className={`text-[10px] mr-1 inline-block ${
                STATUS_COLOR_CLASSES[user?.status]?.text
              }`}
            >
              <RiRecordCircleFill />
            </i>

            {/* {t("profileStatus")} */}
            {t(`settingStatus.${user?.status || 'available'}`)}
          </p>
        </div>
        <div className="p-6 simple-bar-wrapper info-list">
          <div>
            <p className="mb-6 text-center">{user?.slogan}</p>
          </div>
          <div className="profile-user-info">
            <div className={`card border-[1px] border-border-color mb-2`}>
              <Link to={'#'} onClick={() => setActiveNotificationTab((prev) => !prev)}>
                <div className="rounded-t-[.25rem] bg-card-bg-color-2 border-b-[1px] border-border-color mb-0 px-5 py-3">
                  <h5 className="text-[14px] m-0">
                    <i className="inline-block mr-2">
                      <LuBellRing />
                    </i>
                    {t('profileLabel.notification')}
                    <i className="text-[16px] float-right">
                      {activeNotificationTab ? <IoChevronUp /> : <IoChevronDown />}
                    </i>
                  </h5>
                </div>
              </Link>
              <div
                className={`notification-list ${
                  activeNotificationTab && notifications.length > 0 ? 'show' : ''
                }`}
              >
                <div className="card-body p-5">
                  {notifications.length > 0 && (
                    <Link
                      onClick={() => handleReadAllNotifications()}
                      className="text-[12px] hover:underline"
                    >
                      Read all
                    </Link>
                  )}
                  {notifications.slice(0, 50).map((notifi) => {
                    const NotiComponent = notificationComponentMap[notifi.type] || null;
                    return NotiComponent ? (
                      <NotiComponent
                        key={notifi._id}
                        notification={notifi}
                        handleReadSingleNotification={handleReadSingleNotification}
                      />
                    ) : null;
                  })}
                </div>
              </div>
            </div>
            <div className={`card border-[1px] border-border-color mb-2`}>
              <Link to={'#'} onClick={() => setActiveAboutTab((prev) => !prev)}>
                <div className="rounded-t-[.25rem] bg-card-bg-color-2 border-b-[1px] border-border-color mb-0 px-5 py-3">
                  <h5 className="text-[14px] m-0">
                    <i className="inline-block mr-2">
                      <RiUser2Line />
                    </i>
                    {t('profileLabel.about')}
                    <i className="text-[16px] float-right">
                      {activeAboutTab ? <IoChevronUp /> : <IoChevronDown />}
                    </i>
                  </h5>
                </div>
              </Link>
              <div className={`about-info ${activeAboutTab ? 'show' : ''}`}>
                <div className="card-body p-5">
                  <div className="space-y-4">
                    {/* Name */}
                    <div className="flex items-start pb-4 border-b border-border-color last:border-none">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                        <FiUser />
                      </div>
                      <div>
                        <p className="text-[13px] text-secondary-color mb-1">
                          {t('userInfoLabel.name')}
                        </p>
                        <h5 className="text-[15px] font-medium text-body-color">
                          {user?.username || '-'}
                        </h5>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-start pb-4 border-b border-border-color last:border-none">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                        <FiMail />
                      </div>
                      <div>
                        <p className="text-[13px] text-secondary-color mb-1">
                          {t('userInfoLabel.email')}
                        </p>
                        <h5 className="text-[15px] font-medium text-body-color break-all">
                          {user?.email || '-'}
                        </h5>
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-start pb-4 border-b border-border-color last:border-none">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                        <FiMapPin />
                      </div>
                      <div>
                        <p className="text-[13px] text-secondary-color mb-1">
                          {t('userInfoLabel.location')}
                        </p>
                        <h5 className="text-[15px] font-medium text-body-color">
                          {user?.location || '-'}
                        </h5>
                      </div>
                    </div>

                    {/* User Code */}
                    <div className="flex items-start">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center mr-3 bg-[var(--file-bg-color)] text-[#7269ef]">
                        <FiHash />
                      </div>
                      <div>
                        <p className="text-[13px] text-secondary-color mb-1">User Code</p>
                        <h5 className="text-[15px] font-mono font-semibold text-[#7269ef]">
                          {user?.code || '-'}
                        </h5>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
