import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { SphereInvitation } from '../../../../types';

export const usePendingInvites = (email: string | undefined) => {
  const [pendingInvites, setPendingInvites] = useState<SphereInvitation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setPendingInvites([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Create a real-time listener for pending invitations
    const q = query(
      collection(db, 'sphereInvitations'),
      where('inviteeEmail', '==', email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invites: SphereInvitation[] = [];
      snapshot.forEach((doc) => {
        invites.push({ id: doc.id, ...doc.data() } as SphereInvitation);
      });
      
      setPendingInvites(invites);
      setLoading(false);
    }, (error) => {
      console.error('Error listening to pending invites:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [email]);

  return {
    pendingInvites,
    loading,
    inviteCount: pendingInvites.length,
  };
}; 