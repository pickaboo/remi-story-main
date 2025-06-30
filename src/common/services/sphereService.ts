import { db } from '../../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { Sphere } from '../../types';

const SPHERES_COLLECTION = 'spheres';

export const getAllSpheres = async (): Promise<Sphere[]> => {
  const spheresCol = collection(db, SPHERES_COLLECTION);
  const snapshot = await getDocs(spheresCol);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Sphere));
};

export const getSphereById = async (id: string): Promise<Sphere | undefined> => {
  const docRef = doc(db, SPHERES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as Sphere) : undefined;
};

export const saveNewSphere = async (sphere: Sphere): Promise<void> => {
  const docRef = doc(db, SPHERES_COLLECTION, sphere.id);
  // Remove undefined fields
  const cleanedSphere = Object.fromEntries(
    Object.entries(sphere).filter(([_, v]) => v !== undefined)
  );
  await setDoc(docRef, cleanedSphere);
}; 