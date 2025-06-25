import { auth, db } from '../firebase'; // Importera från den riktiga Firebase-initieraren
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut, // Undvik namnkonflikt
  onAuthStateChanged,
  sendPasswordResetEmail as fbSendPasswordResetEmail,
  updateProfile as updateFirebaseAuthProfile, // För Auth display Name/PhotoURL
  GoogleAuthProvider,
  signInWithPopup,
  OAuthProvider, // För andra OAuth-leverantörer som Microsoft, Apple
  User as FirebaseUser,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, arrayUnion, arrayRemove, Timestamp, collection, getDocs, where, query } from 'firebase/firestore';
import { User, AuthUserRecord, SphereInvitation, Sphere } from '../types'; 
import { MOCK_SPHERES } from '../constants'; // För initial sfärtilldelning
import { 
    createSphereInvitation as storageCreateSphereInvitation, 
    updateSphereInvitationStatus, 
    getSphereById,
    getPendingInvitationsForEmail // Import missing function
} from './storageService'; // Använd .real versionen

const USERS_COLLECTION_NAME = 'users';

// --- Hjälpfunktioner ---
const mapFirebaseUserToAppUser = (firebaseUser: FirebaseUser, firestoreData?: Omit<AuthUserRecord, 'id' | 'email' | 'emailVerified'>): User => {
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || undefined,
    emailVerified: firebaseUser.emailVerified,
    name: firestoreData?.name || firebaseUser.displayName || "Ny Användare",
    initials: firestoreData?.initials || "NY",
    avatarColor: firestoreData?.avatarColor || 'bg-slate-500',
    sphereIds: firestoreData?.sphereIds || [],
    backgroundPreference: firestoreData?.backgroundPreference,
    themePreference: firestoreData?.themePreference || 'system',
    showImageMetadataInBank: firestoreData?.showImageMetadataInBank === undefined ? false : firestoreData.showImageMetadataInBank,
    pendingInvitationCount: firestoreData?.pendingInvitationCount,
  };
};

const getAppUserRecord = async (userId: string): Promise<AuthUserRecord | null> => {
  const userDocRef = doc(db, USERS_COLLECTION_NAME, userId);
  const docSnap = await getDoc(userDocRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as AuthUserRecord;
  }
  return null;
};

// --- Kärnautentiseringsfunktioner ---
export const loginWithEmailPassword = async (email: string, passwordAttempt: string): Promise<User | null> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, passwordAttempt);
  const firebaseUser = userCredential.user;
  if (firebaseUser) {
    if (!firebaseUser.emailVerified) {
        console.warn(`User ${firebaseUser.email} is logging in but email is not verified. App may restrict access or prompt for verification.`);
        // Du kan välja att kasta ett fel här eller hantera det i UI
        // throw new Error("Email not verified");
    }
    const firestoreData = await getAppUserRecord(firebaseUser.uid);
    return mapFirebaseUserToAppUser(firebaseUser, firestoreData || undefined);
  }
  return null;
};

const createFirestoreUserRecord = async (firebaseUser: FirebaseUser, additionalData: Partial<AuthUserRecord> = {}): Promise<AuthUserRecord> => {
  const userDocRef = doc(db, USERS_COLLECTION_NAME, firebaseUser.uid);
  const initialSphereIds = MOCK_SPHERES.length > 0 ? [MOCK_SPHERES[0].id] : []; // Ge tillgång till en startsfär

  const nowISO = Timestamp.now().toDate().toISOString();
  const newUserRecordData: Omit<AuthUserRecord, 'id' | 'passwordHash'> = {
    email: firebaseUser.email || undefined,
    emailVerified: firebaseUser.emailVerified, 
    name: firebaseUser.displayName || "Ny Användare",
    initials: "NY",
    avatarColor: 'bg-slate-500',
    sphereIds: initialSphereIds,
    themePreference: 'system',
    showImageMetadataInBank: false,
    createdAt: nowISO, 
    updatedAt: nowISO,
    ...additionalData,
  };
  
  const newUserRecord: AuthUserRecord = {
    id: firebaseUser.uid,
    ...newUserRecordData,
  };


  await setDoc(userDocRef, newUserRecordData); // Store without id in document data
  return newUserRecord; // Return with id
};

export const signupWithEmailPassword = async (email: string, passwordAttempt: string): Promise<{user: User | null, error?: string}> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, passwordAttempt);
    const firebaseUser = userCredential.user;
    if (firebaseUser) {
      const firestoreRecord = await createFirestoreUserRecord(firebaseUser);
      await sendEmailVerification(firebaseUser);
      console.log(`Verification email sent to ${firebaseUser.email}`);
      return { user: mapFirebaseUserToAppUser(firebaseUser, firestoreRecord) };
    }
    return { user: null, error: "Kunde inte skapa Firebase-användare." };
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      return { user: null, error: 'E-postadressen används redan.' };
    }
    if (error.code === 'auth/weak-password') {
      return { user: null, error: 'Lösenordet är för svagt. Försök med ett starkare (minst 6 tecken).' };
    }
    console.error("Signup error:", error);
    return { user: null, error: 'Ett fel uppstod vid registrering.' };
  }
};

export const loginWithOAuth = async (providerName: 'google' | 'microsoft' | 'apple'): Promise<{user: User, isNewUser: boolean}> => {
  let provider;
  switch(providerName) {
    case 'google':
      provider = new GoogleAuthProvider();
      break;
    case 'microsoft':
      provider = new OAuthProvider('microsoft.com'); 
      // Kolla Firebase Docs för specifika scopes om det behövs, t.ex. provider.addScope('email');
      break;
    case 'apple':
      provider = new OAuthProvider('apple.com');
      // Kolla Firebase Docs för specifika scopes
      break;
    default:
      throw new Error("Oauth-leverantör stöds ej");
  }

  const result = await signInWithPopup(auth, provider);
  const firebaseUser = result.user;
  let isNewUser = false;

  let firestoreRecord = await getAppUserRecord(firebaseUser.uid);
  if (!firestoreRecord) {
    isNewUser = true;
    firestoreRecord = await createFirestoreUserRecord(firebaseUser);
  }
  return { user: mapFirebaseUserToAppUser(firebaseUser, firestoreRecord), isNewUser };
};


export const logout = async (): Promise<void> => {
  await fbSignOut(auth);
};

export const getCurrentAuthenticatedUser = (): Promise<User | null> => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      unsubscribe(); 
      if (firebaseUser) {
        // Användare kan vara autentiserad men inte ha verifierat sin e-post
        // if (!firebaseUser.emailVerified) {
        //   console.warn("User is authenticated but email is not verified.");
        //   resolve(null); // Eller hantera detta annorlunda, t.ex. skicka till en verifieringssida
        //   return;
        // }
        const firestoreData = await getAppUserRecord(firebaseUser.uid);
        resolve(mapFirebaseUserToAppUser(firebaseUser, firestoreData || undefined));
      } else {
        resolve(null);
      }
    }, reject);
  });
};

// --- Profil och Användarhantering ---
export const updateUserProfile = async (
  userId: string,
  profileData: Partial<Pick<User, 'name' | 'initials' | 'avatarColor' | 'backgroundPreference' | 'themePreference' | 'showImageMetadataInBank' | 'pendingInvitationCount'>>
): Promise<User | null> => {
  const userDocRef = doc(db, USERS_COLLECTION_NAME, userId);
  
  const updateDataForFirestore: any = { ...profileData };
  if (profileData.name && auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await updateFirebaseAuthProfile(auth.currentUser, { displayName: profileData.name });
    } catch (error) {
      console.warn("Kunde inte uppdatera Firebase Auth displayNamn:", error);
    }
  }
  // Lägg till/uppdatera updatedAt timestamp
  updateDataForFirestore.updatedAt = Timestamp.now().toDate().toISOString();

  await setDoc(userDocRef, updateDataForFirestore, { merge: true });
  const updatedRecord = await getAppUserRecord(userId);

  // Returnera det fullständiga User-objektet, kombinera med aktuell Firebase Auth-användare
  const currentFbUser = auth.currentUser;
  if (updatedRecord && currentFbUser && currentFbUser.uid === userId) {
    return mapFirebaseUserToAppUser(currentFbUser, updatedRecord);
  } else if (updatedRecord) {
    // Skapa ett minimalt FirebaseUser-liknande objekt om currentFbUser inte matchar (t.ex. admin-scenario)
    const minimalFbUser = { uid: updatedRecord.id, email:updatedRecord.email, emailVerified:!!updatedRecord.emailVerified, displayName: updatedRecord.name } as FirebaseUser;
    return mapFirebaseUserToAppUser(minimalFbUser, updatedRecord);
  }
  return null;
};


export const sendPasswordResetEmail = async (email: string): Promise<boolean> => {
  try {
    await fbSendPasswordResetEmail(auth, email);
    return true;
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return false;
  }
};

// --- Sfärhantering för användare ---
export const addUserToSphere = async (userId: string, sphereId: string): Promise<User | null> => {
  const userDocRef = doc(db, USERS_COLLECTION_NAME, userId);
  await setDoc(userDocRef, { sphereIds: arrayUnion(sphereId) }, { merge: true });
  
  const updatedRecord = await getAppUserRecord(userId);
  const currentFbUser = auth.currentUser;
  if (updatedRecord && currentFbUser && currentFbUser.uid === userId) {
    return mapFirebaseUserToAppUser(currentFbUser, updatedRecord);
  } else if (updatedRecord) {
    const minimalFbUser = { uid: updatedRecord.id, email:updatedRecord.email, emailVerified:!!updatedRecord.emailVerified, displayName: updatedRecord.name } as FirebaseUser;
    return mapFirebaseUserToAppUser(minimalFbUser, updatedRecord);
  }
  return null;
};

export const removeUserFromSphere = async (userIdToRemove: string, sphereId: string): Promise<User | null> => {
  const userDocRef = doc(db, USERS_COLLECTION_NAME, userIdToRemove);
  await setDoc(userDocRef, { sphereIds: arrayRemove(sphereId) }, { merge: true });

  const updatedRecord = await getAppUserRecord(userIdToRemove);
  const currentFbUser = auth.currentUser;
   if (updatedRecord && currentFbUser && currentFbUser.uid === userIdToRemove) {
    return mapFirebaseUserToAppUser(currentFbUser, updatedRecord);
  } else if (updatedRecord) {
    const minimalFbUser = { uid: updatedRecord.id, email:updatedRecord.email, emailVerified:!!updatedRecord.emailVerified, displayName: updatedRecord.name } as FirebaseUser;
    return mapFirebaseUserToAppUser(minimalFbUser, updatedRecord);
  }
  return null;
};

export const mock_inviteUserToSphereByEmail = async ( // Behåll namnet "mock_" om det fortfarande finns simuleringsaspekter, annars döp om
    inviterUserId: string,
    sphereId: string,
    inviteeEmail: string,
    message?: string
): Promise<{ success: boolean, message: string, invitation?: SphereInvitation }> => {
  const inviter = await getAppUserRecord(inviterUserId);
  if (!inviter) return { success: false, message: "Inbjudaren kunde inte hittas." };

  const sphere = await getSphereById(sphereId);
  if (!sphere || !inviter.sphereIds.includes(sphereId)) {
    return { success: false, message: "Du har inte behörighet att bjuda in till denna sfär." };
  }

  const usersCol = collection(db, USERS_COLLECTION_NAME);
  const q = query(usersCol, where('email', '==', inviteeEmail.toLowerCase()));
  const inviteeQuerySnap = await getDocs(q);
  let inviteeRecord: User | null = null;
  if (!inviteeQuerySnap.empty) {
    const fbUser = { uid: inviteeQuerySnap.docs[0].id, ...inviteeQuerySnap.docs[0].data() } as FirebaseUser
    inviteeRecord = mapFirebaseUserToAppUser(fbUser, inviteeQuerySnap.docs[0].data() as AuthUserRecord)
  }

  if (inviteeRecord && inviteeRecord.sphereIds.includes(sphereId)) {
    return { success: false, message: `${inviteeRecord.name || inviteeEmail} är redan medlem i sfären "${sphere.name}".` };
  }

  try {
    const invitationObj: any = {
        inviterUserId,
        inviteeEmail: inviteeEmail.toLowerCase(),
        sphereId,
        inviteeUserId: inviteeRecord?.id,
    };
    if (message && message.trim() !== "") {
        invitationObj.message = message.trim();
    }
    const newInvitation = await storageCreateSphereInvitation(invitationObj);
    // Här kan man implementera att skicka ett riktigt e-postmeddelande via en backend-funktion
    console.log(`[AuthService] Inbjudan skapad (ID: ${newInvitation.id}) till ${inviteeEmail} för sfär "${sphere.name}". Meddelande: "${message}"`);
    return { success: true, message: `Inbjudan skapad för ${inviteeEmail} till sfären "${sphere.name}"!`, invitation: newInvitation };
  } catch (e: any) {
    return { success: false, message: `Kunde inte skapa inbjudan: ${e.message}` };
  }
};

export const acceptSphereInvitation = async (invitationId: string, currentUser: User): Promise<User | null> => {
  const updatedInvitation = await updateSphereInvitationStatus(invitationId, 'accepted', currentUser.id);
  if (updatedInvitation) {
    // Se till att användarobjektet som returneras är komplett
    const userWithNewSphere = await addUserToSphere(currentUser.id, updatedInvitation.sphereId);
    if(userWithNewSphere) {
        // Refresh pending invitation count
        const pendingInvites = await getPendingInvitationsForEmail(currentUser.email || ''); // Uses imported function
        return await updateUserProfile(userWithNewSphere.id, { pendingInvitationCount: pendingInvites.length });
    }
  }
  return null;
};

export const declineSphereInvitation = async (invitationId: string, currentUserEmail?: string): Promise<SphereInvitation | null> => {
  const declinedInvitation = await updateSphereInvitationStatus(invitationId, 'declined');
  if (declinedInvitation && currentUserEmail) {
     // Refresh pending invitation count for the current user
    const userRecord = await getAppUserRecord(auth.currentUser!.uid); // Assume user is logged in
    if (userRecord) {
        const pendingInvites = await getPendingInvitationsForEmail(currentUserEmail); // Uses imported function
        await updateUserProfile(userRecord.id, { pendingInvitationCount: pendingInvites.length });
    }
  }
  return declinedInvitation;
};

// --- Andra användarfunktioner ---
export const getAllUsers = async (): Promise<User[]> => {
  const usersCol = collection(db, USERS_COLLECTION_NAME);
  const snapshot = await getDocs(usersCol);
  // Detta är en förenkling; i en riktig app vill du kanske inte exponera all användardata.
  // Firebase Auth har ingen direkt "getAllUsers" för klientsidan utan admin-rättigheter.
  // Detta hämtar från din Firestore "users"-kollektion.
  return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      // Skapa ett minimalt FirebaseUser-liknande objekt för mapFirebaseUserToAppUser
      const minimalFbUser = { uid: docSnap.id, email: data.email, emailVerified: data.emailVerified, displayName: data.name } as FirebaseUser;
      return mapFirebaseUserToAppUser(minimalFbUser, data as Omit<AuthUserRecord, 'id'>);
  });
};

// Denna funktion behövs om du vill simulera e-postverifiering utan att använda Firebase Auth's inbyggda flöde.
// För en riktig app, använd Firebase Auth's sendEmailVerification och hantera länken.
export const simulateVerifyEmail = async (email: string): Promise<User | null> => {
  // I en riktig app skulle detta flöde vara annorlunda (användaren klickar på en länk).
  // Här simulerar vi att en användare hittas och markeras som verifierad.
  // Denna funktion är svår att implementera korrekt utan Firebase Admin SDK för att direkt sätta emailVerified,
  // eller om användaren är inloggad och kan återautentiseras.
  // För en klient-sidig app är det bäst att förlita sig på Firebase Auth:s inbyggda flöde.
  // Om detta är för en test-setup, kan du överväga att bara logga in användaren om lösenord finns.
  console.warn("simulateVerifyEmail är en mock-funktion och bör inte användas i produktion utan Firebase Auth's standardflöde.");
  
  const usersCol = collection(db, USERS_COLLECTION_NAME);
  const q = query(usersCol, where('email', '==', email.toLowerCase()));
  const userQuerySnap = await getDocs(q);

  if (!userQuerySnap.empty) {
    const userDocSnap = userQuerySnap.docs[0];
    const userRecord = { id: userDocSnap.id, ...userDocSnap.data() } as AuthUserRecord;
    
    if (!userRecord.emailVerified) {
      // Kan inte direkt sätta emailVerified från klienten på detta sätt.
      // Firebase Auth hanterar detta via bekräftelselänken.
      // Detta är en förenklad simulering.
      await setDoc(doc(db, USERS_COLLECTION_NAME, userDocSnap.id), { emailVerified: true, updatedAt: Timestamp.now().toDate().toISOString() }, { merge: true });
      userRecord.emailVerified = true;
      console.log(`Simulerad e-postverifiering för ${email}. Användaren bör logga in.`);
    }
    // Returnera användaren så att App.tsx kan navigera till ProfileCompletion eller Home
    // Kräver att vi skapar ett FirebaseUser-liknande objekt.
    const minimalFbUser = { uid: userRecord.id, email: userRecord.email, emailVerified: userRecord.emailVerified, displayName: userRecord.name } as FirebaseUser;
    return mapFirebaseUserToAppUser(minimalFbUser, userRecord);
  }
  return null;
};