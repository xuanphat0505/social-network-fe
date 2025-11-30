import { useContext, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  RiSearchLine,
  RiUserAddLine,
  RiMore2Fill,
  RiShareLine,
  RiForbidLine,
  RiDeleteBinLine,
  RiMessage3Line,
  RiLockUnlockLine,
} from 'react-icons/ri';
import { Button, Popconfirm } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { toast } from 'react-toastify';
import Tippy from '@tippyjs/react';

import { BASE_URL } from '../../config/utils';
import { OpenContext } from '../../context/OpenContext';
import { AxiosContext } from '../../context/AxiosContext';
import useAxiosJWT from '../../config/axiosConfig';
import ContactSkeleton from '../../shared/Skeleton/ContactSkeleton';

function Contacts({ navLink }) {
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const user = useSelector((state) => state.auth?.user);
  const { t } = useTranslation();
  const { setOpenContactModal, setOpenChatBox, setOpenUserCodeModal } = useContext(OpenContext);
  const {
    contacts,
    handleGetContacts,
    contactsLoading,
    setContacts,
    handleDeleteContacts,
    handleGetMessage,
    handleReadMessage,
    handleGetReceiver,
    handleBlockUser,
  } = useContext(AxiosContext);
  const [dropdownMenu, setDropdownMenu] = useState(null);
  const [keyword, setKeyword] = useState('');

  const handleOpenChatBoxAndGetMessages = (partnerId) => {
    setOpenChatBox((prev) => {
      const next = prev === partnerId ? null : partnerId;
      if (next) handleGetMessage(next);
      return next;
    });
    handleReadMessage(partnerId);
    handleGetReceiver(partnerId);
    setDropdownMenu(null);
  };

  const handleDropdownToggle = (index) => {
    setDropdownMenu((prev) => (prev === index ? null : index));
  };

  const handleGetUserCode = async (receiverId) => {
    try {
      const res = await axiosJWT.get(`${BASE_URL}/user/code/${receiverId}`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setOpenUserCodeModal(result.data);
      }
    } catch (error) {
      return toast.error(error.response?.data?.message);
    }
  };

  useEffect(() => {
    const handleSearch = async () => {
      try {
        const res = await axiosJWT.post(
          `${BASE_URL}/contacts/search?keyword=${keyword}`,
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
          setContacts(result.data);
        }
      } catch (error) {
        return toast.error(error.response?.data?.message);
      }
    };
    if (keyword) {
      handleSearch();
    } else {
      handleGetContacts();
    }
  }, [keyword]);

  return (
    <div className={`tab-pane ${navLink === 'contacts' ? 'active' : ''}`}>
      <div className="card-header pb-6">
        <div className="flex items-center justify-between w-full mb-6">
          <h4 className="text-[21px]">{t('contactHeader')}</h4>
          <Tippy
            content={t('addContact', { defaultValue: 'Add contact' })}
            className="tippy-custom"
          >
            <div>
              <Button
                onClick={() => setOpenContactModal(true)}
                type="text"
                className="add-btn contact-btn"
                icon={<RiUserAddLine />}
              ></Button>
            </div>
          </Tippy>
        </div>
        {user?.contacts?.length > 0 && (
          <div className="input-group">
            <span>
              <i>
                <RiSearchLine />
              </i>
            </span>
            <input
              onChange={(e) => setKeyword(e.target.value)}
              type="text"
              placeholder={t('contactInputPlaceholder')}
            ></input>
          </div>
        )}
      </div>
      {contacts.length > 0 ? (
        <ul className="simple-bar-wrapper contact-list border-t-[1px] border-border-color">
          {contacts.map((contact, index) => (
            <div className="contacts" key={index}>
              <div className="p-4 font-bold text-[#7269ef] ">{contact.contactLetter}</div>
              <ul className="mb-4">
                {contact.contactList.map((item) => (
                  <li
                    className="flex items-center justify-between mb-2 py-[10px] px-[20px] cursor-pointer"
                    key={item._id}
                  >
                    <h5>{item.username}</h5>
                    <Tippy
                      className="dropdown"
                      visible={dropdownMenu === item._id}
                      arrow={false}
                      interactive={true}
                      content={
                        <div className={`dropdown-menu show`}>
                          <button onClick={() => handleOpenChatBoxAndGetMessages(item._id)}>
                            {t('chat', { defaultValue: 'Chat' })}
                            <i>
                              <RiMessage3Line />
                            </i>
                          </button>
                          <button
                            onClick={() => {
                              handleGetUserCode(item._id);
                              setDropdownMenu(null);
                            }}
                          >
                            {t('share', { defaultValue: 'Share' })}
                            <i>
                              <RiShareLine />
                            </i>
                          </button>
                          <Popconfirm
                            title={
                              user.blockedUsers?.includes(item?._id)
                                ? t('unblockConfirmTitle', { defaultValue: 'Unblock this user?' })
                                : t('blockConfirmTitle', { defaultValue: 'Block this user?' })
                            }
                            description={
                              user.blockedUsers?.includes(item?._id)
                                ? t('unblockConfirmDesc', {
                                    defaultValue: 'They will be able to send you messages again.',
                                  })
                                : t('blockConfirmDesc', {
                                    defaultValue:
                                      'They will not be able to send you messages anymore.',
                                  })
                            }
                            okText={t('yes', { defaultValue: 'Yes' })}
                            cancelText={t('no', { defaultValue: 'No' })}
                            placement="bottom"
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                            arrow={false}
                            okButtonProps={{
                              type: 'none',
                              className:
                                'bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-1 font-medium shadow-md transition',
                            }}
                            cancelButtonProps={{
                              type: 'none',
                              className:
                                'border border-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg px-4 py-1 font-medium text-gray-300 transition',
                            }}
                            onConfirm={() => handleBlockUser(item?._id)}
                          >
                            <button
                              onClick={() => {
                                setDropdownMenu(null);
                              }}
                            >
                              {user.blockedUsers?.includes(item?._id) ? (
                                <>
                                  {t('unblock', { defaultValue: 'Unblock' })}
                                  <i>
                                    <RiLockUnlockLine />
                                  </i>
                                </>
                              ) : (
                                <>
                                  {t('block', { defaultValue: 'Block' })}
                                  <i>
                                    <RiForbidLine />
                                  </i>
                                </>
                              )}
                            </button>
                          </Popconfirm>
                          <button onClick={() => handleDeleteContacts(item?._id)}>
                            {t('remove', { defaultValue: 'Remove' })}
                            <i>
                              <RiDeleteBinLine />
                            </i>
                          </button>
                        </div>
                      }
                    >
                      <Link
                        className="text-secondary-color"
                        onClick={() => handleDropdownToggle(item._id)}
                      >
                        <i className="">
                          <RiMore2Fill />
                        </i>
                      </Link>
                    </Tippy>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </ul>
      ) : contactsLoading ? (
        [...Array(10)].map((_, index) => <ContactSkeleton key={index} />)
      ) : (
        <div
          className="flex items-center justify-center"
          style={{ minHeight: 'calc(80vh - 50px)' }}
        >
          <p className="text-[15px] text-body-color text-center">You don’t have any contacts</p>
        </div>
      )}
    </div>
  );
}

export default Contacts;
