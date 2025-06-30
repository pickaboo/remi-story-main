import { useEffect, useRef } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe, Query, QuerySnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { SphereInvitation, User } from '../../types';

interface UseRealTimeListenersProps {
  email?: string;
  userId?: string;
  sphereId?: string;
  onInviteUpdate?: (invites: SphereInvitation[]) => void;
  onUserUpdate?: (user: User) => void;
}

// Global kill switch for Firestore listeners
export const FIRESTORE_LISTENERS_ENABLED = true;

// Debug registry for tracking active listeners (development only)
const activeListeners = new Set<string>();

// Helper function to generate a unique listener key
const getListenerKey = (queryObj: Query | null, componentName: string): string => {
  if (!queryObj) return `${componentName}-null-query`;
  // Create a simple hash based on component name and timestamp for debugging
  return `${componentName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Generic Firestore real-time listener hook
export function useFirestoreListener<T>(
  queryObj: Query | null,
  onUpdate: (data: T[]) => void,
  onError?: (error: Error) => void,
  componentName: string = 'Unknown'
) {
  useEffect(() => {
    if (!FIRESTORE_LISTENERS_ENABLED) {
      console.warn("Firestore listeners are globally disabled (kill switch active). No real-time data will be fetched.");
      return;
    }
    if (!queryObj) return; // Do not set up a listener if query is null
    
    const listenerKey = getListenerKey(queryObj, componentName);
    
    // Check for duplicate listeners
    if (activeListeners.has(listenerKey)) {
      console.warn(`[Firestore Debug] Duplicate listener detected for: ${listenerKey}`);
      console.warn(`[Firestore Debug] Active listeners:`, Array.from(activeListeners));
    } else {
      activeListeners.add(listenerKey);
      console.log(`[Firestore Debug] Setting up listener: ${listenerKey}`);
      console.log(`[Firestore Debug] Total active listeners: ${activeListeners.size}`);
    }
    
    const unsubscribe = onSnapshot(
      queryObj,
      (snapshot: QuerySnapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
        onUpdate(data);
      },
      (error) => {
        if (onError) onError(error);
        else console.error(error);
      }
    );
    
    return () => {
      activeListeners.delete(listenerKey);
      console.log(`[Firestore Debug] Removed listener: ${listenerKey}`);
      console.log(`[Firestore Debug] Total active listeners: ${activeListeners.size}`);
      unsubscribe();
    };
  }, [queryObj, onUpdate, onError, componentName]);
}

// Function to get current active listeners (for debugging)
export const getActiveListeners = (): string[] => {
  return Array.from(activeListeners);
};

// Function to clear all listeners (emergency cleanup)
export const clearAllListeners = (): void => {
  console.log(`[Firestore Debug] Clearing all ${activeListeners.size} active listeners`);
  activeListeners.clear();
};

export const useRealTimeListeners = ({
  email,
  userId,
  sphereId,
  onInviteUpdate,
  onUserUpdate,
}: UseRealTimeListenersProps) => {
  const unsubscribeRefs = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    if (!FIRESTORE_LISTENERS_ENABLED) {
      console.warn("Firestore listeners are globally disabled (kill switch active). No real-time data will be fetched.");
      return;
    }
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