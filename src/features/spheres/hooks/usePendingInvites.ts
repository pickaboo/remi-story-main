import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase';
import { SphereInvitation } from '../../../types';
import { FIRESTORE_LISTENERS_ENABLED } from '../../../common/hooks/useRealTimeListeners';

export const usePendingInvites = (email: string | undefined) => {
  console.info('[usePendingInvites] Hook initialized with email:', email, '==============================>');
  const [pendingInvites, setPendingInvites] = useState<SphereInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.info('[usePendingInvites] useEffect triggered for email:', email, '==============================>');
    if (!email) {
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    // One-time fetch for pending invitations (replaces real-time listener)
    const fetchInvites = async () => {
      const q = query(
        collection(db, 'sphereInvitations'),
        where('inviteeEmail', '==', email),
        where('status', '==', 'pending')
      );
      const snapshot = await getDocs(q);
      const invites: SphereInvitation[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SphereInvitation));
      setPendingInvites(invites);
      setLoading(false);
    };
    fetchInvites();
  }, [email]);

  return {
    pendingInvites,
    loading,
    inviteCount: pendingInvites.length,
  };
}; 