import { db } from '../../../../firebase';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { DiaryEntry } from '../../../types';

const getDiaryCollectionRef = (userId: string) => collection(db, 'users', userId, 'diary');
const getDiaryDocRef = (userId: string, entryId: string) => doc(db, 'users', userId, 'diary', entryId);

export const fetchDiaryEntries = async (userId: string): Promise<DiaryEntry[]> => {
  const ref = getDiaryCollectionRef(userId);
  const snap = await getDocs(ref);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as DiaryEntry[];
};

export const saveDiaryEntry = async (userId: string, entry: DiaryEntry): Promise<void> => {
  const ref = getDiaryDocRef(userId, entry.id);
  await setDoc(ref, {
    ...entry,
    audioRecUrl: entry.audioRecUrl ?? null,
    transcribedText: entry.transcribedText ?? null,
    updatedAt: serverTimestamp(),
    createdAt: entry.createdAt || serverTimestamp(),
  });
};

export const updateDiaryEntry = async (userId: string, entryId: string, data: Partial<DiaryEntry>): Promise<void> => {
  const ref = getDiaryDocRef(userId, entryId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteDiaryEntry = async (userId: string, entryId: string): Promise<void> => {
  const ref = getDiaryDocRef(userId, entryId);
  await deleteDoc(ref);
}; 