import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../../../firebase';
import { collection, addDoc, updateDoc, doc, setDoc, getDocs } from 'firebase/firestore';
import App from '../../App';

const TEST_USER_EMAIL = 'testuser@example.com';
const TEST_USER_PASSWORD = 'password123';
let testUserId: string | null = null;

beforeAll(async () => {
  // Försök skapa användaren i Auth-emulatorn (om den inte redan finns)
  try {
    const userCred = await createUserWithEmailAndPassword(auth, TEST_USER_EMAIL, TEST_USER_PASSWORD);
    testUserId = userCred.user.uid;
  } catch (e: any) {
    // Om användaren redan finns, hämta UID från Firestore
    const usersCol = collection(db, 'users');
    const userSnap = await getDocs(usersCol);
    const userDoc = userSnap.docs.find(doc => doc.data().email === TEST_USER_EMAIL);
    testUserId = userDoc?.id || null;
  }
  // Skapa användardokumentet i Firestore (om det inte redan finns)
  if (testUserId) {
    await setDoc(doc(db, 'users', testUserId), {
      email: TEST_USER_EMAIL,
      emailVerified: true,
      pendingInvitationCount: 0,
      name: 'Test User',
      initials: 'TU',
      avatarColor: 'bg-blue-500',
      themePreference: 'system',
      sphereIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  await signOut(auth);
});

afterAll(async () => {
  if (auth.currentUser) await signOut(auth);
  // Ingen särskild städning behövs om du återanvänder testanvändaren
});

describe('End-to-end: Invitation notification icon', () => {
  it('shows notification icon in real time when user receives an invitation', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Logga in via UI
    await waitFor(() => {
      expect(screen.queryByText(/logga in på remi story/i)).toBeInTheDocument();
    }, { timeout: 10000 });
    await user.type(screen.getByLabelText(/e-postadress/i), TEST_USER_EMAIL);
    await user.type(screen.getByLabelText(/lösenord/i), TEST_USER_PASSWORD);
    const loginButton = screen.getAllByRole('button', { name: /logga in/i }).find(btn => btn.getAttribute('type') === 'submit');
    await user.click(loginButton!);
    await waitFor(() => {
      expect(screen.queryByLabelText(/e-postadress/i)).not.toBeInTheDocument();
    }, { timeout: 10000 });

    // Simulera inbjudan
    await addDoc(collection(db, 'sphereInvitations'), {
      email: TEST_USER_EMAIL,
      status: 'pending',
      createdAt: new Date().toISOString(),
      // ...lägg till övriga fält som krävs av din modell
    });
    // Uppdatera pendingInvitationCount på användaren
    if (testUserId) {
      await updateDoc(doc(db, 'users', testUserId), { pendingInvitationCount: 1 });
    }
    // Vänta på att ikonen ska synas
    await waitFor(() => {
      expect(screen.getByLabelText(/väntande inbjudningar/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
}); 