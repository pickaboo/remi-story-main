import React, { useState, useEffect } from 'react';
import { Input, Button, LoadingSpinner } from '../ui';
import { useAppContext } from '../../context/AppContext';
import { User } from '../../types';
import { updateUserProfile } from '../../services/authService';
import { isProfileComplete } from '../../utils/profileUtils';

const AVATAR_COLORS = [
  'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 
  'bg-red-500', 'bg-purple-500', 'bg-green-500', 'bg-blue-500',
  'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-fuchsia-500',
];

interface ProfileCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const { currentUser, setCurrentUser } = useAppContext();
  const [name, setName] = useState('');
  const [initials, setInitials] = useState('');
  const [avatarColor, setAvatarColor] = useState<User['avatarColor']>('bg-blue-500');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with current user data
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name === "Ny Användare" ? '' : currentUser.name);
      setInitials(currentUser.initials === "NY" ? '' : currentUser.initials);
      setAvatarColor(currentUser.avatarColor || 'bg-blue-500');
    }
  }, [currentUser]);

  // Auto-generate initials from name
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
  }, [name, initials]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!name.trim()) {
      setError('Fullständigt namn måste fyllas i för att dina poster ska visas korrekt.');
      return;
    }
    if (!initials.trim() || initials.length > 3) {
      setError('Initialer måste vara 1-3 tecken för din avatar.');
      return;
    }
    if (!avatarColor) {
      setError('Välj en avatarfärg för att slutföra din profil.');
      return;
    }
    
    setIsLoading(true);
    try {
      const updatedProfileData = { 
        name: name.trim(), 
        initials: initials.trim().toUpperCase(), 
        avatarColor 
      };
      
      if (!currentUser) {
        throw new Error('Ingen användare hittad');
      }
      
      const updatedUser = await updateUserProfile(currentUser.id, updatedProfileData);
      if (updatedUser) {
        setCurrentUser(updatedUser);
        onClose();
      } else {
        setError('Kunde inte uppdatera profilen. Försök igen.');
      }
    } catch (err: any) {
      console.error('[ProfileCompletionModal] Error updating profile:', err);
      setError(err.message || 'Ett oväntat fel uppstod.');
    }
    setIsLoading(false);
  };

  if (!isOpen || !currentUser) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Slutför din profil
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            Välkommen! Berätta lite mer om dig själv. Ditt namn kommer att visas i dina poster och kommentarer.
          </p>
          
          <Input
            id="profile-name"
            label="Fullständigt Namn *"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
            maxLength={50}
            placeholder="Ditt namn som visas i poster"
          />
          
          <Input
            id="profile-initials"
            label="Initialer (1-3 tecken) *"
            type="text"
            value={initials}
            onChange={(e) => setInitials(e.target.value.toUpperCase())}
            required
            maxLength={3}
            placeholder="Används för din avatar"
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Välj Avatarfärg *
            </label>
            <div className="flex flex-wrap gap-3">
              {AVATAR_COLORS.map(colorClass => (
                <button
                  key={colorClass}
                  type="button"
                  onClick={() => setAvatarColor(colorClass as User['avatarColor'])}
                  className={`w-10 h-10 rounded-full ${colorClass} transition-all duration-150 ease-in-out
                              ${avatarColor === colorClass 
                                ? 'ring-4 ring-offset-2 ring-blue-500 dark:ring-blue-400 dark:ring-offset-slate-800 scale-110' 
                                : 'hover:scale-110 hover:shadow-md'
                              }`}
                  aria-label={`Välj färg ${colorClass.replace('bg-', '').replace('-500', '')}`}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}
          
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Spara och Fortsätt'
              )}
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
            * = Obligatoriska fält. Ditt namn visas i poster och kommentarer.
          </p>
        </form>
      </div>
    </div>
  );
}; 