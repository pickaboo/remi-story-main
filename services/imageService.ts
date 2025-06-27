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
  onSnapshot,
  QuerySnapshot
} from 'firebase/firestore';
import {
  ref,
  uploadString,
  getDownloadURL,
  deleteObject as fbDeleteObject
} from 'firebase/storage';
import { ImageRecord } from '../types';

const IMAGES_COLLECTION = 'images';

export const getAllImages = async (): Promise<ImageRecord[]> => {
  const imagesCol = collection(db, IMAGES_COLLECTION);
  const q = query(imagesCol, orderBy('dateTaken', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as ImageRecord));
};

export const getSphereFeedPostsListener = (
  sphereId: string,
  onPostsUpdate: (posts: ImageRecord[]) => void,
  onError: (error: Error, sphereId?: string) => void
): (() => void) => {
  const imagesCol = collection(db, IMAGES_COLLECTION);
  const q = query(
    imagesCol,
    where('sphereId', '==', sphereId),
    where('isPublishedToFeed', '==', true),
    orderBy('dateTaken', 'desc')
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

      const rawDocsData = querySnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      console.log("[getSphereFeedPostsListener] Raw data from Firestore (ordered by dateTaken):", JSON.parse(JSON.stringify(rawDocsData)));

      const postsWithResolvedUrls = await Promise.all(
        querySnapshot.docs.map(async (docSnap) => {
          const rawPostData = docSnap.data();
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
          const dateTakenValue = rawPostData.dateTaken;

          return {
            id: docSnap.id,
            ...(rawPostData as Omit<ImageRecord, 'id' | 'dataUrl' | 'createdAt' | 'updatedAt' | 'dateTaken'>),
            dataUrl: displayUrl,
            userDescriptions: Array.isArray(rawPostData.userDescriptions) ? rawPostData.userDescriptions : [],
            processedByHistory: Array.isArray(rawPostData.processedByHistory) ? rawPostData.processedByHistory : [],
            tags: Array.isArray(rawPostData.tags) ? rawPostData.tags : [],
            suggestedGeotags: Array.isArray(rawPostData.suggestedGeotags) ? rawPostData.suggestedGeotags : [],
            sphereId: rawPostData.sphereId || sphereId,
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
        })
      );
      
      console.log("[getSphereFeedPostsListener] Posts after resolving URLs (and converting Timestamps):", JSON.parse(JSON.stringify(postsWithResolvedUrls)));
      onPostsUpdate(postsWithResolvedUrls);
    },
    (error) => {
      console.error(`Error in getSphereFeedPostsListener snapshot listener for sphereId '${sphereId}': `, error);
      onError(error, sphereId);
    }
  );

  return unsubscribe;
};

export const getImageById = async (id: string): Promise<ImageRecord | undefined> => {
  const docRef = doc(db, IMAGES_COLLECTION, id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const rawData = docSnap.data();
    const createdAtValue = rawData.createdAt;
    const updatedAtValue = rawData.updatedAt;
    const dateTakenValue = rawData.dateTaken;

    return {
        id: docSnap.id,
        ...(rawData as Omit<ImageRecord, 'id' | 'createdAt' | 'updatedAt' | 'dateTaken'>),
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

  if (!originalDateTakenStr) {
    firestoreData.dateTaken = new Date().toISOString().split('T')[0];
  } else {
    try {
      const date = new Date(originalDateTakenStr);
      if (isNaN(date.getTime())) {
        console.warn(`Invalid date string for image.dateTaken: "${originalDateTakenStr}". Defaulting to current date.`);
        firestoreData.dateTaken = new Date().toISOString().split('T')[0];
      } else {
        firestoreData.dateTaken = date.toISOString().split('T')[0];
      }
    } catch (e) {
      console.warn(`Error parsing date string for image.dateTaken: "${originalDateTakenStr}". Defaulting to current date. Error: ${e}`);
      firestoreData.dateTaken = new Date().toISOString().split('T')[0];
    }
  }

  await setDoc(docRef, firestoreData, { merge: true });

  const savedImage = { ...image };
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