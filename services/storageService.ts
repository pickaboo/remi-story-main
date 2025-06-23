
import { db, storage } from '../firebase'; 
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc as fbDeleteDoc, 
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp, 
  writeBatch,
  arrayUnion,
  arrayRemove,
  FieldValue 
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject as fbDeleteObject, 
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { ImageRecord, SlideshowProject, DiaryEntry, Sphere, SphereInvitation, UserDescriptionEntry } from '../types';

const IMAGES_COLLECTION = 'images';
const PROJECTS_COLLECTION = 'projects';
const DIARY_ENTRIES_COLLECTION = 'diaryEntries';
const SPHERES_COLLECTION = 'spheres';
const SPHERE_INVITATIONS_COLLECTION = 'sphereInvitations';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export const getAllImages = async (): Promise<ImageRecord[]> => {
  const imagesCol = collection(db, IMAGES_COLLECTION);
  const q = query(imagesCol, orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ImageRecord));
};

export const getImageById = async (id: string): Promise<ImageRecord | undefined> => {
  const docRef = doc(db, IMAGES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as ImageRecord;
  }
  return undefined;
};

export const saveImage = async (image: ImageRecord): Promise<ImageRecord> => {
  const { dataUrl, id: imageId, createdAt: originalCreatedAt, updatedAt: originalUpdatedAt, ...restOfImageDetailsInput } = image;

  // Create a mutable copy of restOfImageDetails to modify
  const restOfImageDetails = { ...restOfImageDetailsInput };

  // 1. Sanitize userDescriptions: convert undefined audioRecUrl to null
  if (restOfImageDetails.userDescriptions && Array.isArray(restOfImageDetails.userDescriptions)) {
    restOfImageDetails.userDescriptions = restOfImageDetails.userDescriptions.map(desc => {
      const newDesc = { ...desc }; // Create a new object for the description entry
      if (newDesc.audioRecUrl === undefined) {
        newDesc.audioRecUrl = null;
      }
      return newDesc;
    });
  }
  
  // File upload logic (uses image.filePath from the original image object if dataUrl indicates new upload)
  if (dataUrl && dataUrl.startsWith('data:') && image.filePath) {
    const storageRef = ref(storage, image.filePath);
    const base64DataParts = dataUrl.split(',');
    if (base64DataParts.length < 2 || !base64DataParts[1]) {
        console.error("Invalid base64 dataUrl format despite 'data:' prefix:", dataUrl.substring(0,100));
        throw new Error("Invalid dataUrl format for image upload.");
    }
    const base64Data = base64DataParts[1];
    await uploadString(storageRef, base64Data, 'base64', { contentType: image.type });
  }

  const docRef = doc(db, IMAGES_COLLECTION, imageId);

  // 2. Prepare final data for Firestore: convert all other top-level undefined properties in restOfImageDetails to null
  const firestoreData: { [key: string]: any } = {};
  for (const key in restOfImageDetails) {
    if (Object.prototype.hasOwnProperty.call(restOfImageDetails, key)) {
      const typedKey = key as keyof typeof restOfImageDetails;
      const value = restOfImageDetails[typedKey];

      if (value === undefined) {
        firestoreData[key] = null;
      } else {
        firestoreData[key] = value; // This includes the potentially modified userDescriptions
      }
    }
  }
  
  // Handle timestamps
  if (!originalCreatedAt) { 
    firestoreData.createdAt = serverTimestamp();
  } else {
    firestoreData.createdAt = originalCreatedAt; 
  }
  firestoreData.updatedAt = serverTimestamp();
  
  await setDoc(docRef, firestoreData, { merge: true });
  
  return image; 
};


export const deleteImage = async (image: ImageRecord): Promise<void> => {
  if (image.filePath) {
    const storageRef = ref(storage, image.filePath);
    try {
      await fbDeleteObject(storageRef);
    } catch (error: any) {
      if (error.code !== 'storage/object-not-found') {
        console.error("Error deleting image file from Firebase Storage:", error);
        throw error;
      }
    }
  }
  const docRef = doc(db, IMAGES_COLLECTION, image.id);
  await fbDeleteDoc(docRef);
};

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

export const getDiaryEntriesByUserId = async (userId: string): Promise<DiaryEntry[]> => {
  const diaryCol = collection(db, DIARY_ENTRIES_COLLECTION);
  const q = query(diaryCol, where('userId', '==', userId), orderBy('date', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as DiaryEntry));
};

export const saveDiaryEntry = async (entry: DiaryEntry): Promise<void> => {
  const docRef = doc(db, DIARY_ENTRIES_COLLECTION, entry.id);
  const entryToSave: Omit<DiaryEntry, 'createdAt'|'updatedAt'> & {createdAt?: FieldValue | string, updatedAt?: FieldValue | string} = {
    ...entry,
    updatedAt: serverTimestamp(),
  };
  if (!entry.createdAt) {
    entryToSave.createdAt = serverTimestamp(); 
  } else {
    entryToSave.createdAt = entry.createdAt; 
  }
  // Ensure audioRecUrl and transcribedText are null if undefined
  if (entryToSave.audioRecUrl === undefined) entryToSave.audioRecUrl = null;
  if (entryToSave.transcribedText === undefined) entryToSave.transcribedText = null;

  await setDoc(docRef, entryToSave, { merge: true });
};

export const deleteDiaryEntry = async (id: string, userId: string): Promise<boolean> => {
  const docRef = doc(db, DIARY_ENTRIES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().userId === userId) {
    await fbDeleteDoc(docRef);
    return true;
  }
  return false; 
};

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
  await setDoc(docRef, sphere); 
};

export const createSphereInvitation = async (invitationData: Omit<SphereInvitation, 'id' | 'createdAt' | 'status'>): Promise<SphereInvitation> => {
  const newId = doc(collection(db, SPHERE_INVITATIONS_COLLECTION)).id; 
  const newInvitation: SphereInvitation = {
    ...invitationData,
    id: newId,
    status: 'pending',
    createdAt: Timestamp.now().toDate().toISOString(), 
  };
  const invitationDocRef = doc(db, SPHERE_INVITATIONS_COLLECTION, newId);
  await setDoc(invitationDocRef, newInvitation);
  return newInvitation;
};

export const getPendingInvitationsForEmail = async (email: string): Promise<SphereInvitation[]> => {
  const invitationsCol = collection(db, SPHERE_INVITATIONS_COLLECTION);
  const q = query(invitationsCol, where('inviteeEmail', '==', email.toLowerCase()), where('status', '==', 'pending'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as SphereInvitation));
};

export const updateSphereInvitationStatus = async (invitationId: string, status: 'accepted' | 'declined', inviteeUserId?: string): Promise<SphereInvitation | null> => {
  const invitationDocRef = doc(db, SPHERE_INVITATIONS_COLLECTION, invitationId);
  const updateData: Partial<SphereInvitation> = {
    status,
    respondedAt: Timestamp.now().toDate().toISOString(),
  };
  if (status === 'accepted' && inviteeUserId) {
    updateData.inviteeUserId = inviteeUserId;
  }
  await setDoc(invitationDocRef, updateData, { merge: true });
  const updatedDocSnap = await getDoc(invitationDocRef);
  return updatedDocSnap.exists() ? ({ id: updatedDocSnap.id, ...updatedDocSnap.data() } as SphereInvitation) : null;
};

export const uploadAudioFile = async (audioDataUrl: string, userId: string, entryId: string): Promise<string> => {
  const audioBlob = await (await fetch(audioDataUrl)).blob();
  const filePath = `users/${userId}/diary_audio/${entryId}.webm`;
  const storageRef = ref(storage, filePath);

  const uploadTask = uploadBytesResumable(storageRef, audioBlob, { contentType: 'audio/webm' });

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {},
      (error) => {
        console.error("Error uploading audio file:", error);
        reject(error);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};
