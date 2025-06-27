import { db } from '../../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  Timestamp,
  serverTimestamp,
  FieldValue
} from 'firebase/firestore';
import { SphereInvitation } from '../../types';

const SPHERE_INVITATIONS_COLLECTION = 'sphereInvitations';

export const createSphereInvitation = async (invitationData: Omit<SphereInvitation, 'id' | 'createdAt' | 'status'>): Promise<SphereInvitation> => {
  const newId = doc(collection(db, SPHERE_INVITATIONS_COLLECTION)).id;
  const newInvitation: SphereInvitation = {
    ...invitationData,
    id: newId,
    status: 'pending',
    createdAt: Timestamp.now().toDate().toISOString(),
  };
  const invitationDocRef = doc(db, SPHERE_INVITATIONS_COLLECTION, newId);
  // Remove undefined fields (especially message)
  Object.keys(newInvitation).forEach(
    (key) => (newInvitation as any)[key] === undefined && delete (newInvitation as any)[key]
  );
  await setDoc(invitationDocRef, newInvitation);
  return newInvitation;
};

export const getPendingInvitationsForEmail = async (email: string): Promise<SphereInvitation[]> => {
  const invitationsCol = collection(db, SPHERE_INVITATIONS_COLLECTION);
  const q = query(invitationsCol, where('inviteeEmail', '==', email.toLowerCase()), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const createdAtValue = data.createdAt;
      const respondedAtValue = data.respondedAt;
      return {
        id: docSnap.id,
        ...data,
        createdAt: (createdAtValue instanceof Timestamp)
          ? createdAtValue.toDate().toISOString()
          : (typeof createdAtValue === 'string' ? createdAtValue : undefined),
        respondedAt: (respondedAtValue instanceof Timestamp)
          ? respondedAtValue.toDate().toISOString()
          : (typeof respondedAtValue === 'string' ? respondedAtValue : undefined),
      } as SphereInvitation
  });
};

export const updateSphereInvitationStatus = async (invitationId: string, status: 'accepted' | 'declined', inviteeUserId?: string): Promise<SphereInvitation | null> => {
  const invitationDocRef = doc(db, SPHERE_INVITATIONS_COLLECTION, invitationId);
  const updateData: Partial<Omit<SphereInvitation, 'createdAt'|'respondedAt'> & {createdAt?: FieldValue|Timestamp, respondedAt?: FieldValue|Timestamp}> = {
    status,
    respondedAt: serverTimestamp(),
  };
  if (status === 'accepted' && inviteeUserId) {
    updateData.inviteeUserId = inviteeUserId;
  }
  await setDoc(invitationDocRef, updateData, { merge: true });
  const updatedDocSnap = await getDoc(invitationDocRef);
  if(updatedDocSnap.exists()){
    const data = updatedDocSnap.data();
    const createdAtValue = data.createdAt;
    const respondedAtValue = data.respondedAt;
    return {
        id: updatedDocSnap.id,
        ...data,
        createdAt: (createdAtValue instanceof Timestamp)
          ? createdAtValue.toDate().toISOString()
          : (typeof createdAtValue === 'string' ? createdAtValue : undefined),
        respondedAt: (respondedAtValue instanceof Timestamp)
          ? respondedAtValue.toDate().toISOString()
          : (typeof respondedAtValue === 'string' ? respondedAtValue : undefined),
    } as SphereInvitation;
  }
  return null;
}; 