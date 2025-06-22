
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
  const { dataUrl, ...imageDataToStore } = image; // dataUrl lagras inte i Firestore

  // Only attempt to upload if dataUrl is a base64 string AND filePath is provided
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
  // If dataUrl is present but not a base64 string (e.g., it's a downloadURL from ImageBankPicker),
  // and filePath is present, we assume the file is already in storage and do nothing with dataUrl here.
  // The dataUrl field is already excluded from imageDataToStore.


  const docRef = doc(db, IMAGES_COLLECTION, image.id);
  // Explicitly type saveData to allow for FieldValue for timestamp fields
  const saveData: Omit<ImageRecord, 'dataUrl' | 'createdAt' | 'updatedAt'> & { createdAt?: FieldValue | string, updatedAt?: FieldValue | string } = { 
    ...imageDataToStore 
  };
  
  if (!imageDataToStore.createdAt) { 
    saveData.createdAt = serverTimestamp();
  }
  saveData.updatedAt = serverTimestamp(); 

  await setDoc(docRef, saveData, { merge: true });
  // Returnera originalbilden med dataUrl för omedelbar UI-uppdatering.
  // Men observera att createdAt/updatedAt nu är FieldValues i saveData, inte strängar direkt.
  // För UI kan det vara bättre att returnera en version med uppskattade tider eller hämta posten på nytt.
  
  // Return the image but ensure the dataUrl (if it was a downloadURL) is kept for immediate UI use.
  // The version in Firestore (saveData) correctly omits it.
  return { ...image, dataUrl: dataUrl }; 
};

export const deleteImage = async (image: ImageRecord): Promise<void> => {
  if (image.filePath) {
    const storageRef = ref(storage, image.filePath);
    try {
      await fbDeleteObject(storageRef);
    } catch (error: any) {
      // Hantera 'storage/object-not-found' om det är okej att filen inte finns
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
// Notera: Security rules blir viktiga här för att säkerställa att användare bara kan komma åt sina egna entries.
export const getAllDiaryEntries = async (): Promise<DiaryEntry[]> => {
  // Detta bör filtreras per användare i en riktig app, antingen här eller via security rules.
  // const diaryCol = collection(db, DIARY_ENTRIES_COLLECTION);
  // const snapshot = await getDocs(diaryCol);
  // return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as DiaryEntry));
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
    entryToSave.createdAt = serverTimestamp(); // Använd serverTimestamp om nytt
  } else {
    entryToSave.createdAt = entry.createdAt; // Keep existing string if present
  }
  await setDoc(docRef, entryToSave, { merge: true });
};

export const deleteDiaryEntry = async (id: string, userId: string): Promise<boolean> => {
  const docRef = doc(db, DIARY_ENTRIES_COLLECTION, id);
  // Verifiera ägandeskap innan radering (kan också hanteras av security rules)
  const docSnap = await getDoc(docRef);
  if (docSnap.exists() && docSnap.data().userId === userId) {
    await fbDeleteDoc(docRef);
    return true;
  }
  return false; // Antingen fanns inte dokumentet eller så var användaren inte ägare
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
  await setDoc(docRef, sphere); // Inte merge här, antar att det är en ny sfär
};


// --- Sphere Invitations CRUD ---
export const createSphereInvitation = async (invitationData: Omit<SphereInvitation, 'id' | 'createdAt' | 'status'>): Promise<SphereInvitation> => {
  const newId = doc(collection(db, SPHERE_INVITATIONS_COLLECTION)).id; // Firestore auto-genererat ID
  const newInvitation: SphereInvitation = {
    ...invitationData,
    id: newId,
    status: 'pending',
    createdAt: Timestamp.now().toDate().toISOString(), // Använd Firestore Timestamp för att få ISO string
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

// --- Audio File Upload (Exempel) ---
// dataUrl är base64-kodad webm-ljud.
export const uploadAudioFile = async (audioDataUrl: string, userId: string, entryId: string): Promise<string> => {
  const audioBlob = await (await fetch(audioDataUrl)).blob();
  const filePath = `users/${userId}/diary_audio/${entryId}.webm`;
  const storageRef = ref(storage, filePath);

  // uploadBytesResumable är att föredra för större filer och för att hantera progress
  const uploadTask = uploadBytesResumable(storageRef, audioBlob, { contentType: 'audio/webm' });

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot: UploadTaskSnapshot) => {
        // Hantera progress om det behövs
        // const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // console.log('Upload is ' + progress + '% done');
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
