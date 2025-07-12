import { db } from '../../../../firebase';
import { collection, doc, setDoc, getDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { TrainingEntry } from '../types';

export const saveTrainingEntry = async (entry: TrainingEntry) => {
  const ref = doc(db, 'users', entry.userId, 'trainingEntries', entry.date);
  await setDoc(ref, entry);
};

export const getTrainingEntriesByUserAndDate = async (userId: string, date: string): Promise<TrainingEntry | null> => {
  const ref = doc(db, 'users', userId, 'trainingEntries', date);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as TrainingEntry;
  return null;
};

export const deleteTrainingEntry = async (userId: string, date: string) => {
  const ref = doc(db, 'users', userId, 'trainingEntries', date);
  await deleteDoc(ref);
};

export const getAllTrainingEntriesByUserId = async (userId: string): Promise<TrainingEntry[]> => {
  const ref = collection(db, 'users', userId, 'trainingEntries');
  const snap = await getDocs(ref);
  const entries: TrainingEntry[] = [];
  snap.forEach(doc => entries.push(doc.data() as TrainingEntry));
  // Sortera på datum, nyast först
  return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}; 