/// <reference path="./src/types.ts" />

import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAuth, Auth } from 'firebase/auth';
import { connectFirestoreEmulator } from 'firebase/firestore';
import { connectAuthEmulator } from 'firebase/auth';
import { connectStorageEmulator } from 'firebase/storage';

// Ensure import.meta.env is available (Vite specific)
if (typeof import.meta.env === 'undefined') {
  const viteErrorMessage = "Vite environment variables (import.meta.env) are not available. Ensure you are running the app with Vite (e.g., 'npx vite') and have a .env file set up as per SetupNotes.md.";
  console.error(viteErrorMessage);
  alert(viteErrorMessage); // Alert user as this is critical for them to see
  throw new Error(viteErrorMessage);
}

// VIKTIGT: Dessa värden MÅSTE sättas i din .env-fil i projektets rot.
// Exempel: VITE_FIREBASE_API_KEY=dinFaktiskaNyckel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID // Valfritt
};

let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

// Kontrollera att alla nödvändiga Firebase-konfigurationsvärden är satta
const requiredKeys: (keyof typeof firebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
  const errorMessage = `Följande Firebase-konfigurationsvärden saknas i .env-filen (eller import.meta.env är inte korrekt populerat av Vite): ${missingKeys.join(', ')}. Applikationen kan inte initiera Firebase. Se SetupNotes.md.`;
  console.error(errorMessage);
  alert(errorMessage); // Alert user as this is critical
  // Kasta ett fel eller hantera på annat sätt för att stoppa applikationen från att fortsätta utan Firebase.
  throw new Error(errorMessage);
}

try {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  console.log("Real Firebase Initialized successfully.");

  // Anslut till emulatorerna i utvecklingsläge
  if (import.meta.env.MODE === "development") {
    connectFirestoreEmulator(db, "127.0.0.1", 8089);
    connectAuthEmulator(auth, "http://127.0.0.1:9099");
    connectStorageEmulator(storage, "127.0.0.1", 9199);
    console.log("Ansluten till Firebase Emulator Suite (Firestore:8089, Auth:9099, Storage:9199)");
  }
} catch (error) {
  console.error("Error initializing real Firebase:", error);
  // I en produktionsapp kanske du vill hantera detta mer graciöst.
  throw new Error("Failed to initialize Firebase. Please check your configuration and ensure SDKs are correctly imported via import map.");
}

export { app, db, storage, auth, firebaseConfig };