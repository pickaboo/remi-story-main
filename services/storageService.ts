
import { db, storage } from '../firebase'; // Importera från den riktiga Firebase-initieraren
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc as fbDeleteDoc, // Undvik namnkonflikt
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp, // För server-tidsstämplar
  writeBatch,
  arrayUnion,
  arrayRemove,
  FieldValue // Import FieldValue for serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject as fbDeleteObject, // Undvik namnkonflikt
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import { ImageRecord, SlideshowProject, DiaryEntry, Sphere, SphereInvitation, UserDescriptionEntry } from '../types';

// Kollektionsnamn
const IMAGES_COLLECTION = 'images';
const PROJECTS_COLLECTION = 'projects';
const DIARY_ENTRIES_COLLECTION = 'diaryEntries';
const SPHERES_COLLECTION = 'spheres';
const SPHERE_INVITATIONS_COLLECTION = 'sphereInvitations';
// USERS_COLLECTION hanteras primärt av authService.ts och userService.ts

// Helper function to recursively remove undefined properties from an object or array.
const cleanObjectForFirestore = (data: any): any => {
  if (Array.isArray(data)) {
    // Process each item in the array. If an item becomes undefined after cleaning, filter it out.
    return data
      .map(item => cleanObjectForFirestore(item))
      .filter(item => item !== undefined);
  } else if (data !== null && typeof data === 'object' &&
             !(data instanceof Date) &&
             !(data instanceof Timestamp) &&
             data.constructor?.name !== 'FieldValue') { // Check for FieldValue constructor name
    const cleanedObject: { [key: string]: any } = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const value = data[key];
        if (value !== undefined) { // Only process if original value is not undefined
          const cleanedValue = cleanObjectForFirestore(value); // Recursively clean the value
          if (cleanedValue !== undefined) { // Only add to new object if cleaned value is not undefined
            cleanedObject[key] = cleanedValue;
          }
        }
      }
    }
    return cleanedObject;
  }
  // Return primitives, Date, Timestamp, FieldValue, and null as is.
  // Undefined values at the top level of the initial 'data' will be handled by the caller's logic
  // or by the fact that properties with undefined values won't be added to cleanedObject.
  return data;
};


// --- Helper för ID-generering (kan fortfarande vara användbart) ---
export const generateId = (): string => {
  // Använd Firestore's egen ID-generering om möjligt, eller en robust UUID-generator
  // För enkelhetens skull behåller vi den gamla, men överväg Firestore's auto-ID.
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// --- Images CRUD ---
export const getAllImages = async (): Promise<ImageRecord[]> => {
  const imagesCol = collection(db, IMAGES_COLLECTION);
  // Överväg att lägga till query/filter, t.ex. per sfär eller användare, och sortering
  const q = query(imagesCol, orderBy('createdAt', 'desc')); // Exempel sortering by createdAt
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
  const { dataUrl, ...imageDataFromImageParam } = image; 
  let finalStorageUrl: string | undefined = image.storageUrl; // Keep existing storageUrl if present

  if (dataUrl && image.filePath) { // dataUrl implies new client-side file or modification needing re-upload
    const storageRef = ref(storage, image.filePath);
    
    const parts = dataUrl.split(',');
    if (parts.length !== 2) throw new Error("Invalid dataUrl format for image upload.");
    
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: image.type || mimeString });

    const uploadTask = uploadBytesResumable(storageRef, blob, { contentType: image.type || mimeString });

    await new Promise<void>((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Observe state change events such as progress, pause, and resume
        },
        (error) => {
          console.error("Firebase Storage upload error in saveImage:", error);
          switch (error.code) {
            case 'storage/unauthorized':
              reject(new Error('User does not have permission to access the object. Check Storage Rules.'));
              break;
            case 'storage/canceled':
              reject(new Error('User canceled the upload.'));
              break;
            case 'storage/unknown':
              reject(new Error('Unknown error occurred, inspect error.serverResponse.'));
              break;
            default:
              reject(error);
          }
        },
        async () => { // Changed to async to await getDownloadURL
          try {
            finalStorageUrl = await getDownloadURL(uploadTask.snapshot.ref);
            resolve();
          } catch (downloadUrlError) {
            console.error("Error getting download URL:", downloadUrlError);
            reject(downloadUrlError);
          }
        }
      );
    });
  }

  const docRef = doc(db, IMAGES_COLLECTION, image.id);
  
  // Prepare the object for Firestore, removing client-side dataUrl and handling timestamps
  let dataForFirestore: Omit<ImageRecord, 'dataUrl' | 'createdAt' | 'updatedAt'> & { storageUrl?: string; createdAt?: FieldValue | string, updatedAt?: FieldValue | string } = { 
    ...imageDataFromImageParam, // Contains all fields from image EXCEPT dataUrl
    storageUrl: finalStorageUrl, // Add the Firebase Storage URL
  };
  
  // Remove dataUrl explicitly if it was part of imageDataFromImageParam (it shouldn't be due to destructuring above, but belt and braces)
  delete (dataForFirestore as any).dataUrl; 
  
  if (!dataForFirestore.createdAt) { 
    dataForFirestore.createdAt = serverTimestamp();
  }
  dataForFirestore.updatedAt = serverTimestamp(); 

  const cleanedDataForFirestore = cleanObjectForFirestore(dataForFirestore);

  await setDoc(docRef, cleanedDataForFirestore, { merge: true });
  
  // Return the record as it would be in Firestore (with storageUrl, without dataUrl)
  const savedImageRecord: ImageRecord = {
    ...imageDataFromImageParam, // already excludes original dataUrl
    id: image.id, // ensure id is part of the returned object
    storageUrl: finalStorageUrl,
    createdAt: typeof dataForFirestore.createdAt === 'string' 
                 ? dataForFirestore.createdAt 
                 : new Date().toISOString(), // If serverTimestamp was used, approximate with current client time
    updatedAt: new Date().toISOString(), // Approximate client-side for updatedAt
  };
  delete (savedImageRecord as any).dataUrl; // Ensure dataUrl is not in the returned object
  return savedImageRecord;
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

// --- Projects CRUD ---
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

// --- Diary Entries CRUD ---
export const getAllDiaryEntries = async (): Promise<DiaryEntry[]> => {
  console.warn("getAllDiaryEntries called without user filter. This is insecure without proper rules.");
  return [];
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
  await setDoc(docRef, cleanObjectForFirestore(entryToSave), { merge: true });
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

// --- Spheres CRUD ---
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
  await setDoc(docRef, cleanObjectForFirestore(sphere)); 
};


// --- Sphere Invitations CRUD ---
export const createSphereInvitation = async (invitationData: Omit<SphereInvitation, 'id' | 'createdAt' | 'status'>): Promise<SphereInvitation> => {
  const newId = doc(collection(db, SPHERE_INVITATIONS_COLLECTION)).id; 
  const newInvitation: SphereInvitation = {
    ...invitationData,
    id: newId,
    status: 'pending',
    createdAt: Timestamp.now().toDate().toISOString(), 
  };
  const invitationDocRef = doc(db, SPHERE_INVITATIONS_COLLECTION, newId);
  await setDoc(invitationDocRef, cleanObjectForFirestore(newInvitation));
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
  await setDoc(invitationDocRef, cleanObjectForFirestore(updateData), { merge: true });
  const updatedDocSnap = await getDoc(invitationDocRef);
  return updatedDocSnap.exists() ? ({ id: updatedDocSnap.id, ...updatedDocSnap.data() } as SphereInvitation) : null;
};

// --- Audio File Upload (Exempel) ---
export const uploadAudioFile = async (audioDataUrl: string, userId: string, entryId: string): Promise<string> => {
  const audioBlob = await (await fetch(audioDataUrl)).blob();
  const filePath = `users/${userId}/diary_audio/${entryId}.webm`;
  const storageRef = ref(storage, filePath);

  const uploadTask = uploadBytesResumable(storageRef, audioBlob, { contentType: 'audio/webm' });

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
      },
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
