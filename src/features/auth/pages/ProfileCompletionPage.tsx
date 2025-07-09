import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input, Button, LoadingSpinner } from '../../../components/ui';
import { Views } from '../../../constants/viewEnum';
import type { View } from '../../../constants/viewEnum';
import { User } from '../../../types';
import { useAppContext } from '../../../context/AppContext';
import { AuthContainer } from '../components/AuthContainer';
import { updateUserProfile } from '../services/authService';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../../firebase';

const AVATAR_COLORS = [
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 
  'bg-red-500', 'bg-purple-500', 'bg-green-500', 'bg-blue-500',
  'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500',
];

export const ProfileCompletionPage: React.FC = () => {
  const { currentUser, handleProfileComplete, handleNavigate, setCurrentUser, handleCreateSphere, setActiveSphere } = useAppContext();

  if (!currentUser) {
    return <LoadingSpinner message="Laddar användare..." />;
  }

  const [name, setName] = useState(currentUser.name === "Ny Användare" ? '' : currentUser.name);
  const [initials, setInitials] = useState(currentUser.initials === "NY" ? '' : currentUser.initials);
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || AVATAR_COLORS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (name && !initials) {
      const nameParts = name.trim().split(' ');
      let generatedInitials = '';
      if (nameParts.length > 1) {
        generatedInitials = nameParts[0][0] + nameParts[nameParts.length - 1][0];
      } else if (nameParts.length === 1 && nameParts[0].length > 0) {
        generatedInitials = nameParts[0].substring(0, 2);
      }
      setInitials(generatedInitials.toUpperCase());
    }
  }, [name, initials]); // Only run if `name` changes and `initials` is still empty

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[ProfileCompletionPage] handleSubmit called, isLoading:', isLoading);
    if (isLoading) return; // Prevent double submit
    setError(null);
    if (!name.trim()) {
      setError('Fullständigt namn måste fyllas i.');
      return;
    }
    if (!initials.trim() || initials.length > 3) {
      setError('Initialer måste vara 1-3 tecken.');
      return;
    }
    if (!avatarColor) {
      setError('Välj en avatarfärg.');
      return;
    }
    setIsLoading(true);
    try {
      console.log('[ProfileCompletionPage] Submitting profile data...');
      const updatedProfileData = { name: name.trim(), initials: initials.trim().toUpperCase(), avatarColor };
      await updateUserProfile(currentUser.id, updatedProfileData);
      // Lyssna på användarens dokument tills det är uppdaterat
      const userDocRef = doc(db, 'users', currentUser.id);
      const unsubscribe = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
          const updatedUser = { id: docSnap.id, ...docSnap.data() } as User;
          setCurrentUser(updatedUser);
          console.log('[ProfileCompletionPage] Firestore user updated, sphereIds:', updatedUser.sphereIds);
          // Sfär-skapande är nu flyttat till backend/signup, så vi behöver bara gå vidare
          await handleProfileComplete(updatedUser);
          handleNavigate(Views.Home);
          setIsLoading(false);
          unsubscribe();
        }
      });
    } catch (err: any) {
      console.error('[ProfileCompletionPage] Error updating profile:', err);
      setError(err.message || 'Ett oväntat fel uppstod.');
      setIsLoading(false);
    }
  };

  return (
    <>
      {console.log('[ProfileCompletionPage] Render')}
      <AuthContainer title="Slutför din profil">
        <form onSubmit={handleSubmit} className="space-y-6">
          <p className="text-sm text-muted-text dark:text-slate-400 text-center">
            Välkommen! Berätta lite mer om dig själv. Ditt namn ({currentUser.email || 'din e-post'}) är kopplat.
          </p>
          <Input
            id="profile-name"
            label="Fullständigt Namn"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={50}
          />
          <Input
            id="profile-initials"
            label="Initialer (1-3 tecken)"
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            required
            maxLength={3}
          />
          <div>
            <label className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-2">Välj Avatarfärg</label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLORS.map(colorClass => (
                <button
                  key={colorClass}
                  type="button"
                  onClick={() => setAvatarColor(colorClass as User['avatarColor'])}
                  className={`w-10 h-10 rounded-full ${colorClass} transition-all duration-150 ease-in-out
                              ${avatarColor === colorClass 
                                ? 'ring-4 ring-offset-2 ring-primary dark:ring-blue-400 dark:ring-offset-slate-800 scale-110' 
                                : 'hover:scale-110 hover:shadow-md'
                              }`}
                  aria-label={`Välj färg ${colorClass.replace('bg-', '').replace('-500', '')}`}
                />
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-danger dark:text-red-400 text-center">{error}</p>}
          
          <Button type="submit" variant="primary" size="lg" className="w-full" isLoading={isLoading} disabled={isLoading}>
            Spara och Fortsätt
          </Button>
        </form>
         <p className="mt-6 text-center text-xs text-muted-text dark:text-slate-400">
          Vill du ändra detta senare? Profilinställningar kommer snart.
        </p>
      </AuthContainer>
    </>
  );
};
