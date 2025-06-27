import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
import { SphereInvitation, User } from '../types';

interface UseRealTimeListenersProps {
  email?: string;
  userId?: string;
  sphereId?: string;
  onInviteUpdate?: (invites: SphereInvitation[]) => void;
  onUserUpdate?: (user: User) => void;
}

export const useRealTimeListeners = ({
  email,
  userId,
  sphereId,
  onInviteUpdate,
  onUserUpdate,
}: UseRealTimeListenersProps) => {
  const unsubscribeRefs = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    // Clear any existing listeners
    unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
    unsubscribeRefs.current = [];

    // Set up invite listener if email is provided
    if (email && onInviteUpdate) {
      const inviteQuery = query(
        collection(db, 'sphereInvitations'),
        where('inviteeEmail', '==', email),
        where('status', '==', 'pending')
      );

      const inviteUnsubscribe = onSnapshot(inviteQuery, (snapshot) => {
        const invites: SphereInvitation[] = [];
        snapshot.forEach((doc) => {
          invites.push({ id: doc.id, ...doc.data() } as SphereInvitation);
        });
        onInviteUpdate(invites);
      }, (error) => {
        console.error('Error listening to invites:', error);
      });

      unsubscribeRefs.current.push(inviteUnsubscribe);
    }

    // Set up user listener if userId is provided
    if (userId && onUserUpdate) {
      const userQuery = query(
        collection(db, 'users'),
        where('id', '==', userId)
      );

      const userUnsubscribe = onSnapshot(userQuery, (snapshot) => {
        if (!snapshot.empty) {
          const userData = snapshot.docs[0].data() as User;
          onUserUpdate(userData);
        }
      }, (error) => {
        console.error('Error listening to user updates:', error);
      });

      unsubscribeRefs.current.push(userUnsubscribe);
    }

    // Cleanup function
    return () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    };
  }, [email, userId, sphereId, onInviteUpdate, onUserUpdate]);

  return {
    // Function to manually clear all listeners
    clearListeners: () => {
      unsubscribeRefs.current.forEach(unsubscribe => unsubscribe());
      unsubscribeRefs.current = [];
    }
  };
}; 