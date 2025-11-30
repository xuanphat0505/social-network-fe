import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import { RiShieldCheckLine, RiSmartphoneLine, RiNotificationLine } from 'react-icons/ri';
import { toast } from 'react-toastify';
import { BASE_URL } from '../../config/utils';
import useAxiosJWT from '../../config/axiosConfig';
import { loginSuccess } from '../../redux/authSlice';

function Security({ toggleSetting, settingOption, info }) {
  const user = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const { t } = useTranslation();

  const [securityToggle, setSecurityToggle] = useState({
    twoFA: user?.is2FAEnabled || false,
    deviceVerification: user?.isDeviceVerificationEnabled || false,
    loginAlerts: user?.isLoginAlertEnabled || false,
  });

  const handleToggle = async (key) => {
    if (key === 'twoFA') {
      await handleToggle2FA();
    } else if (key === 'deviceVerification') {
      await handleToggleDeviceVerification();
    } else if (key === 'loginAlerts') {
      await handleToggleLoginAlerts();
    }
  };

  const handleToggle2FA = async () => {
    try {
      const enable = !securityToggle.twoFA;
      const res = await axiosJWT.post(`${BASE_URL}/user/toggle2fa`, JSON.stringify({ enable }), {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });

      const result = res.data;
      if (result.success) {
        setSecurityToggle((prev) => ({ ...prev, twoFA: enable }));
        dispatch(loginSuccess({ ...user, ...result.data }));
      }
    } catch (error) {
      return toast.error(error.response?.data?.message || 'Failed to update 2FA settings');
    }
  };

  const handleToggleDeviceVerification = async () => {
    try {
      const enable = !securityToggle.deviceVerification;
      const res = await axiosJWT.post(
        `${BASE_URL}/user/toggle-device-verification`,
        JSON.stringify({ enable }),
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
        setSecurityToggle((prev) => ({ ...prev, deviceVerification: enable }));
        dispatch(loginSuccess({ ...user, ...result.data }));
      }
    } catch (error) {
      return toast.error(
        error.response?.data?.message || 'Failed to update Device Verification settings'
      );
    }
  };

  const handleToggleLoginAlerts = async () => {
    try {
      const enable = !securityToggle.loginAlerts;
      const res = await axiosJWT.post(
        `${BASE_URL}/user/toggle-login-alert`,
        JSON.stringify({ enable }),
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
        setSecurityToggle((prev) => ({ ...prev, loginAlerts: enable }));
        dispatch(loginSuccess({ ...user, ...result.data }));
      }
    } catch (error) {
      return toast.error(error.response?.data?.message || 'Failed to update Login Alerts settings');
    }
  };

  return (
    <div className="setting-container card mb-2 bg-[#0000] border-[1px] border-border-color">
      <Link className="text-heading-color" onClick={() => toggleSetting('security')}>
        <div className="flex items-center justify-between  bg-[#a6b0cf08] py-3 px-5">
          <h5 className="text-[14px] m-0">{info.header}</h5>
          <i className="ml-1">{settingOption.security ? <IoChevronUp /> : <IoChevronDown />}</i>
        </div>
      </Link>
      <div className={`setting-list security-list ${settingOption.security ? 'show' : ''}`}>
        <div className="p-5 space-y-3">
          {/* Two-Factor Authentication (2FA) */}
          <div className="py-3 border-b border-border-color last:border-none">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition">
              <div className="flex items-start">
                <i className="text-[#7269ef] text-[18px] mt-0.5 mr-3">
                  <RiShieldCheckLine />
                </i>
                <div>
                  <h5 className="m-0 text-[14px] cursor-default">
                    {t('settingSecurity.twoFAHeader', {
                      defaultValue: 'Two-Factor Authentication (2FA)',
                    })}
                  </h5>
                  <p className="text-[12px] text-secondary-color mt-1 cursor-default">
                    {t('settingSecurity.twoFADesc', {
                      defaultValue: 'Add an extra layer of security at sign in.',
                    })}
                  </p>
                </div>
              </div>
              <div className="ml-2 flex items-center">
                <div onClick={() => handleToggle('twoFA')} className="cursor-pointer">
                  <div className={`toggle-btn ${user?.is2FAEnabled ? 'active' : ''}`}>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Device Verification */}
          <div className="py-3 border-b border-border-color last:border-none">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition">
              <div className="flex items-start">
                <i className="text-[#7269ef] text-[18px] mt-0.5 mr-3">
                  <RiSmartphoneLine />
                </i>
                <div>
                  <h5 className="m-0 text-[14px] cursor-default">
                    {t('settingSecurity.deviceVerificationHeader', {
                      defaultValue: 'Device Verification',
                    })}
                  </h5>
                  <p className="text-[12px] text-secondary-color mt-1 cursor-default">
                    {t('settingSecurity.deviceVerificationDesc', {
                      defaultValue: 'Require approval for new device logins.',
                    })}
                  </p>
                </div>
              </div>
              <div className="ml-2" onClick={() => handleToggle('deviceVerification')}>
                <div className={`toggle-btn ${user?.isDeviceVerificationEnabled ? 'active' : ''}`}>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Alerts */}
          <div className="py-3">
            <div className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition">
              <div className="flex items-start">
                <i className="text-[#7269ef] text-[18px] mt-0.5 mr-3">
                  <RiNotificationLine />
                </i>
                <div>
                  <h5 className="m-0 text-[14px] cursor-default">
                    {t('settingSecurity.loginAlertsHeader', { defaultValue: 'Login Alerts' })}
                  </h5>
                  <p className="text-[12px] text-secondary-color mt-1 cursor-default">
                    {t('settingSecurity.loginAlertsDesc', {
                      defaultValue: 'Get notified when your account is accessed.',
                    })}
                  </p>
                </div>
              </div>
              <div className="ml-2" onClick={() => handleToggle('loginAlerts')}>
                <div className={`toggle-btn ${user?.isLoginAlertEnabled ? 'active' : ''}`}>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Security;
