import { useContext, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Button, Form } from 'antd';
import { RiCloseFill } from 'react-icons/ri';

import useAxiosJWT from '@/config/axiosConfig';
import { OpenContext } from '@/context/OpenContext';
import { BASE_URL } from '@/config/utils';
import QRCodeTab from './QRCodeTab';

import './modal.scss';
function ContactModal() {
  const user = useSelector((state) => state?.auth?.user);
  const getAxiosJWT = useAxiosJWT();
  const axiosJWT = getAxiosJWT();
  const { openContactModal, setOpenContactModal } = useContext(OpenContext);
  const [receiverInfo, setReceiverInfo] = useState({
    code: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const [searchParams, setSearchParams] = useSearchParams();

  /**
   * Tự động xử lý khi có mã kết bạn:
   */
  useEffect(() => {
    if (!user) return;

    const codeFromUrl = searchParams.get('add-friend');
    const codeFromStorage = localStorage.getItem('pending_add_friend');
    const friendCode = codeFromUrl || codeFromStorage;

    if (!friendCode) return;

    setOpenContactModal(true);
    setActiveTab('code');
    setReceiverInfo({ code: friendCode });

    toast.info(`Đang tự động gửi lời mời kết bạn...`);
    handleSendInvitation({ code: friendCode });

    if (codeFromUrl) {
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('add-friend');
      setSearchParams(newParams, { replace: true });
    }
    if (codeFromStorage) {
      localStorage.removeItem('pending_add_friend');
    }
  }, [user]);

  /**
   * Xử lý Smart Search: Tự động tìm kiếm khi người dùng nhập
   */
  useEffect(() => {
    if (activeTab !== 'info' || !searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axiosJWT.get(`${BASE_URL}/user/search-users?keyword=${searchTerm}`, {
          headers: { Authorization: `Bearer ${user?.accessToken}` },
          withCredentials: true,
        });
        if (res.data.success) {
          setSearchResults(res.data.data);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, activeTab]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setReceiverInfo((prev) => ({ ...prev, [id]: value }));
  };

  const handleSendInvitation = async (payload) => {
    setIsLoading(true);
    try {
      const res = await axiosJWT.post(`${BASE_URL}/contacts/add`, payload, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        toast.success(result.message);
        setOpenContactModal(false);
      }
    } catch (error) {
      return toast.error(error?.response?.data?.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab === 'code') {
      handleSendInvitation({ code: receiverInfo.code });
    }
  };

  return (
    <div className={`modal-container contact-modal-container ${openContactModal ? 'show' : ''}`}>
      <div className="modal" onClick={() => setOpenContactModal(false)}>
        <div className="modal-centered contact-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content contact-modal-content">
            <div className="modal-title">
              <h5 className="capitalize text-[18.75px]">add contacts</h5>
              <span onClick={() => setOpenContactModal(false)}>
                <i>
                  <RiCloseFill />
                </i>
              </span>
            </div>
            <div className="flex relative">
              <button
                type="button"
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === 'info' ? 'text-[#7269ef]' : ''
                }`}
              >
                Smart Search
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === 'code' ? 'text-[#7269ef]' : ''
                }`}
              >
                User Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('qr')}
                className={`flex-1 py-2 text-sm font-medium transition-colors duration-200 hover:text-[#7269ef] ${
                  activeTab === 'qr' ? 'text-[#7269ef]' : ''
                }`}
              >
                QR Code
              </button>
              <span
                className={`absolute bottom-0 h-[2px] bg-[#7269ef] transition-transform duration-300 ease-in-out`}
                style={{
                  width: '33.33%',
                  transform:
                    activeTab === 'info'
                      ? 'translateX(0%)'
                      : activeTab === 'code'
                        ? 'translateX(100%)'
                        : 'translateX(200%)',
                }}
              />
            </div>

            <div className="modal-body p-6">
              <form className="w-full" onSubmit={handleSubmit}>
                {activeTab === 'info' && (
                  <div className="modal-input-group">
                    <label htmlFor="search">Username or Email</label>
                    <input
                      onChange={(e) => setSearchTerm(e.target.value)}
                      type="text"
                      id="search"
                      value={searchTerm}
                      placeholder="Enter username or email"
                      autoComplete="off"
                    ></input>

                    {/* Results Area */}
                    <div className="mt-4 max-h-[250px] overflow-y-auto">
                      {isSearching ? (
                        <p className="text-center text-sm text-secondary-color py-4">Searching...</p>
                      ) : searchResults.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {searchResults.map((result) => (
                            <div
                              key={result._id}
                              className="flex items-center justify-between p-3 rounded-lg bg-card-bg-color-2 hover:bg-[var(--hover-dropdown-btn-bg-color)] transition-all duration-200 border border-transparent hover:border-[#7269ef]/20"
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={result.avatar}
                                  alt={result.username}
                                  className="w-10 h-10 rounded-full object-cover border border-border-color"
                                />
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold text-heading-color">
                                    {result.username}
                                  </span>
                                  <span className="text-xs text-secondary-color">
                                    {result.email}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {result.isFriend ? (
                                  <span className="text-xs font-medium text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
                                    Friend
                                  </span>
                                ) : result.isPending ? (
                                  <span className="text-xs font-medium text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
                                    Pending
                                  </span>
                                ) : (
                                  <Button
                                    type="primary"
                                    size="small"
                                    className="bg-[#7269ef] hover:bg-[#6159cb] border-none text-xs px-4"
                                    onClick={() => handleSendInvitation({ code: result.code })}
                                    loading={isLoading}
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        searchTerm && (
                          <p className="text-center text-sm text-secondary-color py-4">
                            No users found
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'code' && (
                  <div className="modal-input-group">
                    <label htmlFor="code">Code</label>
                    <input
                      onChange={handleChange}
                      type="text"
                      id="code"
                      value={receiverInfo.code}
                      placeholder="Enter user code"
                    ></input>
                  </div>
                )}
                {activeTab === 'qr' && (
                  <QRCodeTab
                    user={user}
                    onScanSuccess={(code) => {
                      setReceiverInfo({ code });
                      toast.info('QR Scanned! Sending invitation...');
                      handleSendInvitation({ code });
                    }}
                  />
                )}
              </form>
            </div>
            <div className="modal-footer">
              <Button type="text" className="denied-btn" onClick={() => setOpenContactModal(false)}>
                Close
              </Button>
              {activeTab === 'code' && (
                <Button onClick={handleSubmit} type="primary" className="agree-btn">
                  Invite Contact
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop"></div>
    </div>
  );
}

export default ContactModal;
