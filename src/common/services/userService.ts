import { db, auth } from '../../firebase'; // Importera från den riktiga Firebase-initieraren
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { User, Sphere, AuthUserRecord } from '../../types';
import {
  LOCAL_STORAGE_CURRENT_SPHERE_ID_KEY,
  // LOCAL_STORAGE_CURRENT_USER_ID_KEY, // Hanteras nu av onAuthStateChanged
} from '../../constants';
import { getAllSpheres as storageGetAllSpheres, getSphereById as storageGetSphereById } from './storageService'; // Använd .real versionen

const USERS_COLLECTION_NAME = 'users';

// --- Användarprofil ---
export const getUserById = async (userId: string | undefined | null): Promise<User | null> => {
  if (!userId) return null;
  const userDocRef = doc(db, USERS_COLLECTION_NAME, userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    // För att få en komplett User-objekt kan vi behöva kombinera med Firebase Auth-data
    // om den inte redan finns i Firestore-dokumentet (t.ex. emailVerified)
    const firestoreData = docSnap.data() as Omit<AuthUserRecord, 'id'>;
    const firebaseUser = auth.currentUser; // Kan vara null om användaren inte är inloggad
    
    // Skapa ett User-objekt. Om firebaseUser finns och matchar, använd dess data.
    let finalUser: User = {
      id: docSnap.id,
      name: firestoreData.name || "Okänt Namn",
      initials: firestoreData.initials || "NN",
      avatarColor: firestoreData.avatarColor || 'bg-gray-500',
      sphereIds: firestoreData.sphereIds || [],
      email: firestoreData.email, // Firestore bör vara master för email som visas i appen
      emailVerified: firestoreData.emailVerified, // Firestore bör vara master
      backgroundPreference: firestoreData.backgroundPreference,
      themePreference: firestoreData.themePreference || 'system',
      showImageMetadataInBank: firestoreData.showImageMetadataInBank === undefined ? false : firestoreData.showImageMetadataInBank,
      pendingInvitationCount: firestoreData.pendingInvitationCount,
    };

    if (firebaseUser && firebaseUser.uid === docSnap.id) {
        finalUser.email = firebaseUser.email || firestoreData.email;
        finalUser.emailVerified = firebaseUser.emailVerified; // Auth är master för verifieringsstatus
        finalUser.name = firestoreData.name || firebaseUser.displayName || "Okänt Namn";
    }
    return finalUser;
  }
  return null;
};

// Ersätts av authService.ts getCurrentAuthenticatedUser
// export const getCurrentUser = async (): Promise<User | null> => { ... }

// setCurrentUserId hanteras av att Firebase Auth-tillståndet ändras.
// export const setCurrentUserId = async (userId: string): Promise<void> => { ... }


// --- Sfärhantering (preferenser och datahämtning) ---
export const getCurrentSphereId = async (): Promise<string | null> => {
  return localStorage.getItem(LOCAL_STORAGE_CURRENT_SPHERE_ID_KEY);
};

export const setCurrentSphereId = async (sphereId: string): Promise<void> => {
  localStorage.setItem(LOCAL_STORAGE_CURRENT_SPHERE_ID_KEY, sphereId);
};

export const getActiveSphere = async (user: User | null, allSpheresList?: Sphere[]): Promise<Sphere | null> => {
  const spheresToUse = allSpheresList || await storageGetAllSpheres();
  if (!user || spheresToUse.length === 0 || !user.sphereIds || user.sphereIds.length === 0) return null;

  const activeSphereIdFromStorage = await getCurrentSphereId();
  if (activeSphereIdFromStorage && user.sphereIds.includes(activeSphereIdFromStorage)) {
    const sphere = spheresToUse.find(s => s.id === activeSphereIdFromStorage);
    if (sphere) return sphere;
  }

  // Om ingen giltig aktiv sfär, välj den första användaren är medlem i
  for (const userSphereId of user.sphereIds) {
      const sphere = spheresToUse.find(s => s.id === userSphereId);
      if (sphere) {
          await setCurrentSphereId(sphere.id);
          return sphere;
      }
  }
  // Om användaren har sphereIds men ingen av dem finns i spheresToUse (kan hända om sfärer raderas)
  localStorage.removeItem(LOCAL_STORAGE_CURRENT_SPHERE_ID_KEY);
  return null; 
};

export const getUserSpheres = async (user: User | null, allSpheresList?: Sphere[]): Promise<Sphere[]> => {
  const spheresToUse = allSpheresList || await storageGetAllSpheres();
  if (!user || !user.sphereIds || user.sphereIds.length === 0) return [];

  const userSpheresData: Sphere[] = [];
  for (const sphereId of user.sphereIds) {
    // Försök hitta i den redan laddade listan först
    let sphere = spheresToUse.find(s => s.id === sphereId);
    if (!sphere) { // Om inte i listan, försök hämta direkt (kan vara en nyligen tillagd sfär)
        sphere = await storageGetSphereById(sphereId);
    }
    if (sphere) {
      userSpheresData.push(sphere);
    }
  }
  return userSpheresData;
};

// IIFE för initialisering (tas bort eftersom detta hanteras av App.tsx's auth-flöde)
// ;(async () => { ... })();
