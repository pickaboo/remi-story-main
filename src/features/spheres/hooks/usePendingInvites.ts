import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { SphereInvitation } from '../../../types';
import { FIRESTORE_LISTENERS_ENABLED } from '../../../common/hooks/useRealTimeListeners';

export const usePendingInvites = (email: string | undefined) => {
  console.info('[usePendingInvites] Hook initialized with email:', email, '==============================>');
  const [pendingInvites, setPendingInvites] = useState<SphereInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInvites = useCallback(async () => {
    if (!email) {
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const q = query(
        collection(db, 'sphereInvitations'),
        where('inviteeEmail', '==', email),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const invites: SphereInvitation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SphereInvitation));
      setPendingInvites(invites);
    } catch (error) {
      console.error('Error fetching pending invites:', error);
      setPendingInvites([]);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    console.info('[usePendingInvites] useEffect triggered for email:', email, '==============================>');
    fetchInvites();
  }, [fetchInvites]);

  return {
    pendingInvites,
    loading,
    inviteCount: pendingInvites.length,
    refreshInvites: fetchInvites,
  };
}; 