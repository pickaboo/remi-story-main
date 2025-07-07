import { User } from '../types';

/**
 * Checks if a user profile is complete
 * A profile is considered complete if:
 * - name is not empty and not "Ny Användare" (required for posts and identification)
 * - initials are not empty and not "NY" (required for avatar display)
 * - avatarColor is set (required for visual identification)
 */
export const isProfileComplete = (user: User): boolean => {
  if (!user) return false;
  
  const hasValidName = Boolean(user.name) && 
    user.name.trim() !== '' && 
    user.name !== "Ny Användare";
    
  const hasValidInitials = Boolean(user.initials) && 
    user.initials.trim() !== '' && 
    user.initials !== "NY";
    
  const hasAvatarColor = Boolean(user.avatarColor);
    
  return hasValidName && hasValidInitials && hasAvatarColor;
};

/**
 * Gets the missing profile fields for a user
 */
export const getMissingProfileFields = (user: User): string[] => {
  if (!user) return ['name', 'initials', 'avatarColor'];
  
  const missingFields: string[] = [];
  
  if (!user.name || user.name.trim() === '' || user.name === "Ny Användare") {
    missingFields.push('name');
  }
  
  if (!user.initials || user.initials.trim() === '' || user.initials === "NY") {
    missingFields.push('initials');
  }
  
  if (!user.avatarColor) {
    missingFields.push('avatarColor');
  }
  
  return missingFields;
}; 