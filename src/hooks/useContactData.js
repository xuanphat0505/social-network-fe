import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { BASE_URL } from '@/config/utils';

/**
 * Hook xử lý danh sách liên hệ (Contacts)
 */
export const useContactData = (axiosJWT, user) => {
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);

  const handleSortedContacts = (contactsList) => {
    return [...contactsList].sort((a, b) => a.contactLetter.localeCompare(b.contactLetter));
  };

  const handleGetContacts = useCallback(async () => {
    if (!user) return;
    setContactsLoading(true);
    try {
      const res = await axiosJWT.get(`${BASE_URL}/contacts`, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      });
      const result = res.data;
      if (result.success) {
        setContacts(handleSortedContacts(result.data));
      }
    } catch (error) {
      toast.error(error.response?.data?.message);
    } finally {
      setContactsLoading(false);
    }
  }, [axiosJWT, user]);

  return {
    contacts,
    setContacts,
    contactsLoading,
    handleGetContacts,
    handleSortedContacts
  };
};
