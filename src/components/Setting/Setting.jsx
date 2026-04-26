import { useDispatch, useSelector } from 'react-redux';
import { useState, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { RiPencilFill, RiRecordCircleFill } from 'react-icons/ri';
import { IoChevronUp, IoChevronDown } from 'react-icons/io5';
import { toast } from 'react-toastify';
import Tippy from '@tippyjs/react';

import { loginSuccess } from '@/redux/authSlice';
import { statusOnline } from '@/assets/data';
import { BASE_URL } from '@/config/utils';
import { OpenContext } from '@/context/OpenContext';
import useAxiosJWT from '@/config/axiosConfig';
import PersonalInfo from './PersonalInfo';
import Security from './Security';
import Help from './Help';

function Setting({ navLink }) {
  const user = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const { setOpenAvatarModal } = useContext(OpenContext);
  const { t } = useTranslation();
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();

  const [openStatus, setOpenStatus] = useState(false);
  const [status, setStatus] = useState(user?.status);
  const [settingOption, setSettingOption] = useState({
    info: false,
    security: false,
    help: false,
    privacy: false,
  });
  const toggleSetting = (key) => {
    setSettingOption((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const handleStatus = async (status) => {
    setStatus(status);
    try {
      const res = await axiosJWT.put(
        `${BASE_URL}/user/change?status=${status}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
            'Content-Type': 'application/json',
          },
          withCredentials: true,
        }
      );
      const result = res.data;
      if (result.success) {
        setOpenStatus(false);
        dispatch(loginSuccess({ ...user, ...result.data }));
      }
    } catch (error) {
      return toast.error(error?.response?.data?.messsage);
    }
  };

  return (
    <div className={`tab-pane ${navLink === 'settings' ? 'active' : ''}`}>
      <div className="card-header">
        <h4 className="text-[21px]">{t('settingHeader')}</h4>
      </div>
      <div className="p-6 text-center border-b-[1px] border-border-color">
        <div className="inline-block mb-6 relative">
          <img src={user?.avatar} alt="" className="avatar"></img>
          <span
            onClick={() => setOpenAvatarModal(true)}
            className="edit-btn absolute bottom-0 right-0 h-[2.2rem] w-[2.2rem] text-[0.9375rem] rounded-[50%]"
          >
            <i>
              <RiPencilFill />
            </i>
          </span>
        </div>
        <h5 className="text-[16px] mb-1">{user?.username}</h5>
        <div className="inline-block relative mb-1 cursor-pointer">
          <Tippy
            interactive={true}
            arrow={false}
            visible={openStatus}
            className="dropdown"
            placement="bottom"
            offset={[0, 0]}
            content={
              <div className="dropdown-menu show">
                {statusOnline.map((sta, index) => (
                  <button
                    onClick={() => handleStatus(sta.status)}
                    key={index}
                    style={{
                      justifyContent: 'flex-start',
                      gap: '5px',
                      textTransform: 'capitalize',
                    }}
                  >
                    <i className="inline-block text-[10px]" style={{ color: sta.color }}>
                      <sta.icon />
                    </i>
                    {sta.status}
                  </button>
                ))}
              </div>
            }
          >
            <Link
              onClick={() => setOpenStatus((prev) => !prev)}
              className="flex items-center  pb-1 capitalize"
            >
              <i
                style={{
                  color:
                    status === 'available'
                      ? 'rgba(6,214,160,1)'
                      : status === 'busy'
                      ? 'rgba(239,71,111,1)'
                      : status === 'invisible'
                      ? 'rgba(156,163,175,1)'
                      : 'rgba(107,114,128,0.5)',
                }}
                className={`inline-block text-[10px] mr-1`}
              >
                <RiRecordCircleFill />
              </i>
              {t(`settingStatus.${status || 'available'}`)}
              <i className="ml-1">{openStatus ? <IoChevronUp /> : <IoChevronDown />}</i>
            </Link>
          </Tippy>
        </div>
      </div>
      <div className="simple-bar-wrapper setting-options">
        <PersonalInfo
          toggleSetting={toggleSetting}
          settingOption={settingOption}
          info={{
            header: t('userInfoLabel.header'),
            name: t('userInfoLabel.name'),
            email: t('userInfoLabel.email'),
            time: t('userInfoLabel.time'),
            location: t('userInfoLabel.location'),
          }}
        />
        {/* <Privacy
          toggleSetting={toggleSetting}
          settingOption={settingOption}
          info={{
            header: t("settingPrivacy.privacyHeader"),
            photo: t("settingPrivacy.photo"),
            seen: t("settingPrivacy.seen"),
            status: t("settingPrivacy.status"),
            receipts: t("settingPrivacy.receipts"),
            groups: t("settingPrivacy.groups"),
          }}
        /> */}
        <Security
          toggleSetting={toggleSetting}
          settingOption={settingOption}
          info={{
            header: t('settingSecurity.securityHeader'),
            notification: t('settingSecurity.notification'),
          }}
        />
        <Help
          toggleSetting={toggleSetting}
          settingOption={settingOption}
          info={{
            header: t('settingHelp.helpHeader'),
            faq: t('settingHelp.faq'),
            contact: t('settingHelp.contact'),
            policy: t('settingHelp.policy'),
          }}
        />
      </div>
    </div>
  );
}

export default Setting;
