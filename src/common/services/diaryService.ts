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
  serverTimestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  UploadTaskSnapshot
} from 'firebase/storage';
import { DiaryEntry } from '../../types';

const DIARY_ENTRIES_COLLECTION = 'diaryEntries';

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

  dataForFirestore.updatedAt = serverTimestamp();

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