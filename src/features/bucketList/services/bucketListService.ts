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
import { BucketItem } from '../types';

const getBucketListRef = (userId: string) => collection(db, 'users', userId, 'bucketList');
const getBucketDocRef = (userId: string, bucketId: string) => doc(db, 'users', userId, 'bucketList', bucketId);

export const fetchBuckets = async (userId: string): Promise<BucketItem[]> => {
  const ref = getBucketListRef(userId);
  const snap = await getDocs(ref);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BucketItem[];
};

export const saveBucket = async (userId: string, bucket: BucketItem): Promise<void> => {
  const ref = getBucketDocRef(userId, bucket.id);
  await setDoc(ref, {
    ...bucket,
    updatedAt: serverTimestamp(),
    createdAt: bucket.createdAt || serverTimestamp(),
  });
};

export const updateBucket = async (userId: string, bucketId: string, data: Partial<BucketItem>): Promise<void> => {
  const ref = getBucketDocRef(userId, bucketId);
  await updateDoc(ref, {
    ...data,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBucket = async (userId: string, bucketId: string): Promise<void> => {
  const ref = getBucketDocRef(userId, bucketId);
  await deleteDoc(ref);
};

export const getBucket = async (userId: string, bucketId: string): Promise<BucketItem | null> => {
  const ref = getBucketDocRef(userId, bucketId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as BucketItem;
}; 