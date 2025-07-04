import { db, storage } from '../../firebase';
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
  FieldValue,
  onSnapshot, // Added for real-time listener
  QuerySnapshot // Added for type
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
  // Default sort for getAllImages might also be dateTaken now, or keep as createdAt if this specific function has other uses.
  // For consistency, let's assume dateTaken is generally preferred. If not, this can be reverted.
  const q = query(imagesCol, orderBy('dateTaken', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ImageRecord));
};

// New function for real-time feed posts
export const getSphereFeedPostsListener = (
  sphereId: string,
  onPostsUpdate: (posts: ImageRecord[]) => void,
  onError: (error: Error, sphereId?: string) => void // Added optional sphereId to onError
): (() => void) => { // Returns an unsubscribe function
  const imagesCol = collection(db, IMAGES_COLLECTION);
  const q = query(
    imagesCol,
    where('sphereId', '==', sphereId),
    where('isPublishedToFeed', '==', true),
    orderBy('dateTaken', 'desc') // Changed from 'createdAt' to 'dateTaken'
  );

  console.log(`[getSphereFeedPostsListener] Setting up listener for sphereId: ${sphereId} (orderBy dateTaken)`);

  const unsubscribe = onSnapshot(q,
    async (querySnapshot: QuerySnapshot) => {
      console.log(`[getSphereFeedPostsListener] Snapshot received for sphereId: ${sphereId}. Number of docs: ${querySnapshot.docs.length}`);
      if (querySnapshot.empty) {
        console.log(`[getSphereFeedPostsListener] No posts found for sphereId: ${sphereId}`);
        onPostsUpdate([]);
        return;
      }

      // Log raw data from Firestore before any processing
      const rawDocsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      console.log("[getSphereFeedPostsListener] Raw data from Firestore (ordered by dateTaken):", JSON.parse(JSON.stringify(rawDocsData)));


      const postsWithResolvedUrls = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const rawPostData = docSnap.data(); // Get raw data first
          let displayUrl = rawPostData.dataUrl;

          if ((!displayUrl || !displayUrl.startsWith('data:')) && rawPostData.filePath) {
            try {
              displayUrl = await getDownloadURL(ref(storage, rawPostData.filePath));
            } catch (urlError: any) {
              console.warn(`FeedListener: Failed to get download URL for post ${docSnap.id} (filePath: ${rawPostData.filePath}). Error: ${urlError.message}`);
            }
          }

          const createdAtValue = rawPostData.createdAt;
          const updatedAtValue = rawPostData.updatedAt;
          // Ensure dateTaken is also handled correctly if it's a Timestamp (though it should be string)
          const dateTakenValue = rawPostData.dateTaken;


          return {
            id: docSnap.id,
            ...(rawPostData as Omit<ImageRecord, 'id' | 'dataUrl' | 'createdAt' | 'updatedAt' | 'dateTaken'>), // Cast other fields
            dataUrl: displayUrl,
            userDescriptions: Array.isArray(rawPostData.userDescriptions) ? rawPostData.userDescriptions : [],
            processedByHistory: Array.isArray(rawPostData.processedByHistory) ? rawPostData.processedByHistory : [],
            tags: Array.isArray(rawPostData.tags) ? rawPostData.tags : [],
            suggestedGeotags: Array.isArray(rawPostData.suggestedGeotags) ? rawPostData.suggestedGeotags : [],
            sphereId: rawPostData.sphereId || sphereId, // Ensure sphereId is present
            createdAt: (createdAtValue instanceof Timestamp)
              ? createdAtValue.toDate().toISOString()
              : (typeof createdAtValue === 'string' ? createdAtValue : undefined),
            updatedAt: (updatedAtValue instanceof Timestamp)
              ? updatedAtValue.toDate().toISOString()
              : (typeof updatedAtValue === 'string' ? updatedAtValue : undefined),
            dateTaken: (dateTakenValue instanceof Timestamp) // Should ideally be string already, but good to check
              ? dateTakenValue.toDate().toISOString().split('T')[0] // Ensure YYYY-MM-DD format for dateTaken
              : (typeof dateTakenValue === 'string' ? dateTakenValue : undefined),
          } as ImageRecord;
        })
      );
      
      console.log("[getSphereFeedPostsListener] Posts after resolving URLs (and converting Timestamps):", JSON.parse(JSON.stringify(postsWithResolvedUrls)));
      onPostsUpdate(postsWithResolvedUrls);
    },
    (error) => {
      console.error(`Error in getSphereFeedPostsListener snapshot listener for sphereId '${sphereId}': `, error);
      onError(error, sphereId); // Pass sphereId along with the error
    }
  );

  return unsubscribe; // Return the unsubscribe function
};


export const getImageById = async (id: string): Promise<ImageRecord | undefined> => {
  const docRef = doc(db, IMAGES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const rawData = docSnap.data(); // Get raw data
    const createdAtValue = rawData.createdAt;
    const updatedAtValue = rawData.updatedAt;
    const dateTakenValue = rawData.dateTaken;

    return {
        id: docSnap.id,
        ...(rawData as Omit<ImageRecord, 'id' | 'createdAt' | 'updatedAt' | 'dateTaken'>), // Cast other fields
        createdAt: (createdAtValue instanceof Timestamp)
          ? createdAtValue.toDate().toISOString()
          : (typeof createdAtValue === 'string' ? createdAtValue : undefined),
        updatedAt: (updatedAtValue instanceof Timestamp)
          ? updatedAtValue.toDate().toISOString()
          : (typeof updatedAtValue === 'string' ? updatedAtValue : undefined),
        dateTaken: (dateTakenValue instanceof Timestamp)
          ? dateTakenValue.toDate().toISOString().split('T')[0]
          : (typeof dateTakenValue === 'string' ? dateTakenValue : undefined),
     } as ImageRecord;
  }
  return undefined;
};

export const saveImage = async (image: ImageRecord): Promise<ImageRecord> => {
  const { dataUrl, id: imageId, createdAt: originalCreatedAtStr, updatedAt: originalUpdatedAtStr, dateTaken: originalDateTakenStr, ...restOfImageDetailsInput } = image;

  const restOfImageDetails = { ...restOfImageDetailsInput };

  if (restOfImageDetails.userDescriptions && Array.isArray(restOfImageDetails.userDescriptions)) {
    restOfImageDetails.userDescriptions = restOfImageDetails.userDescriptions.map(desc => {
      const newDesc = { ...desc };
      if (newDesc.audioRecUrl === undefined) {
        newDesc.audioRecUrl = null;
      }
      if (desc.createdAt && desc.createdAt.trim() !== "") {
        newDesc.createdAt = desc.createdAt;
      } else {
        newDesc.createdAt = new Date().toISOString();
      }
      return newDesc;
    });
  }

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

  const firestoreData: { [key: string]: any } = {};
  for (const key in restOfImageDetails) {
    if (Object.prototype.hasOwnProperty.call(restOfImageDetails, key)) {
      const typedKey = key as keyof typeof restOfImageDetails;
      const value = restOfImageDetails[typedKey];

      if (value === undefined) {
        firestoreData[key] = null;
      } else {
        firestoreData[key] = value;
      }
    }
  }

  // Handle timestamps: convert string ISO dates from ImageRecord back to Firestore Timestamps if needed or use serverTimestamp
  if (!originalCreatedAtStr) {
    firestoreData.createdAt = serverTimestamp();
  } else {
    try {
      const date = new Date(originalCreatedAtStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string for image.createdAt: "${originalCreatedAtStr}". Using serverTimestamp instead.`);
        firestoreData.createdAt = serverTimestamp();
      } else {
        firestoreData.createdAt = Timestamp.fromDate(date);
      }
    } catch (e) { 
      console.warn(`Error parsing date string for image.createdAt: "${originalCreatedAtStr}". Using serverTimestamp. Error: ${e}`);
      firestoreData.createdAt = serverTimestamp();
    }
  }
  firestoreData.updatedAt = serverTimestamp();

  // Handle dateTaken: Ensure it's a valid YYYY-MM-DD string or default to current date's YYYY-MM-DD
  if (!originalDateTakenStr) {
    firestoreData.dateTaken = new Date().toISOString().split('T')[0];
  } else {
    try {
      const date = new Date(originalDateTakenStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string for image.dateTaken: "${originalDateTakenStr}". Defaulting to current date.`);
        firestoreData.dateTaken = new Date().toISOString().split('T')[0];
      } else {
        // Ensure it's stored as YYYY-MM-DD string
        firestoreData.dateTaken = date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(`Error parsing date string for image.dateTaken: "${originalDateTakenStr}". Defaulting to current date. Error: ${e}`);
      firestoreData.dateTaken = new Date().toISOString().split('T')[0];
    }
  }


  await setDoc(docRef, firestoreData, { merge: true });

  const savedImage = { ...image };
  // Update dateTaken on the returned object to match what was saved if it was defaulted
  if (firestoreData.dateTaken && savedImage.dateTaken !== firestoreData.dateTaken) {
    savedImage.dateTaken = firestoreData.dateTaken;
  }
  
  return savedImage;
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
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data();
    const createdAtValue = data.createdAt;
    const updatedAtValue = data.updatedAt;
    return {
        id: docSnap.id,
        ...data,
        createdAt: (createdAtValue instanceof Timestamp)
          ? createdAtValue.toDate().toISOString()
          : (typeof createdAtValue === 'string' ? createdAtValue : undefined),
        updatedAt: (updatedAtValue instanceof Timestamp)
          ? updatedAtValue.toDate().toISOString()
          : (typeof updatedAtValue === 'string' ? updatedAtValue : undefined),
    } as DiaryEntry
  });
};

export const saveDiaryEntry = async (entry: DiaryEntry): Promise<void> => {
  const docRef = doc(db, DIARY_ENTRIES_COLLECTION, entry.id);
  const { createdAt: originalCreatedAtStr, updatedAt: originalUpdatedAtStr, ...restOfEntryData } = entry;

  const dataForFirestore: { [key: string]: any } = {
    ...restOfEntryData,
  };

  // Handle createdAt
  if (!originalCreatedAtStr) {
    dataForFirestore.createdAt = serverTimestamp();
  } else {
    try {
      const date = new Date(originalCreatedAtStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string for diaryEntry.createdAt: "${originalCreatedAtStr}". Using serverTimestamp.`);
        dataForFirestore.createdAt = serverTimestamp();
      } else {
        dataForFirestore.createdAt = Timestamp.fromDate(date);
      }
    } catch (e) {
      console.warn(`Error parsing date string for diaryEntry.createdAt: "${originalCreatedAtStr}". Using serverTimestamp. Error: ${e}`);
      dataForFirestore.createdAt = serverTimestamp();
    }
  }

  // Handle updatedAt
  dataForFirestore.updatedAt = serverTimestamp();

  // Handle optional fields
  if (dataForFirestore.audioRecUrl === undefined) {
    dataForFirestore.audioRecUrl = null;
  }
  if (dataForFirestore.transcribedText === undefined) {
    dataForFirestore.transcribedText = null;
  }

  await setDoc(docRef, dataForFirestore, { merge: true });
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
    const respondedAtValue = data.respondedAt; // This will be server-set, won't be available immediately client-side
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
