import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc as fbDeleteDoc
} from 'firebase/firestore';
import { SlideshowProject } from '../types';

const PROJECTS_COLLECTION = 'projects';

export const getAllProjects = async (): Promise<SlideshowProject[]> => {
  const projectsCol = collection(db, PROJECTS_COLLECTION);
  const snapshot = await getDocs(projectsCol);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SlideshowProject));
};

export const getProjectById = async (id: string): Promise<SlideshowProject | undefined> => {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as SlideshowProject) : undefined;
};

export const saveProject = async (project: SlideshowProject): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, project.id);
  await setDoc(docRef, project, { merge: true });
};

export const deleteProject = async (id: string): Promise<void> => {
  const docRef = doc(db, PROJECTS_COLLECTION, id);
  await fbDeleteDoc(docRef);
}; 