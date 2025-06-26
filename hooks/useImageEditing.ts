import { useState, useCallback, useEffect } from 'react';
import { ImageRecord, UserDescriptionEntry } from '../types';
import { getImageById, saveImage } from '../services/storageService';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase';
import { useUser } from '../context';
import { useAudioRecorder } from './useAudioRecorder';

interface UseImageEditingState {
  image: ImageRecord | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  currentUserTextDescription: string;
  currentTag: string;
}

interface UseImageEditingActions {
  setCurrentUserTextDescription: (text: string) => void;
  setCurrentTag: (tag: string) => void;
  handleAddTag: (tagToAdd?: string) => void;
  handleRemoveTag: (tagToRemove: string) => void;
  handleSave: () => Promise<void>;
  handleResetAudioForCurrentUser: () => void;
  fetchImage: () => Promise<void>;
}

interface UseImageEditingProps {
  imageId: string;
  onSaveSuccess?: () => void;
  onSaveError?: (error: string) => void;
}

export const useImageEditing = ({
  imageId,
  onSaveSuccess,
  onSaveError
}: UseImageEditingProps): [UseImageEditingState, UseImageEditingActions] => {
  const { currentUser } = useUser();
  const audioRecorder = useAudioRecorder();
  const { resetAudio: resetAudioFromHook } = audioRecorder;

  // State
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserTextDescription, setCurrentUserTextDescription] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  // Get current user's description entry
  const getCurrentUserDescriptionEntry = useCallback((): UserDescriptionEntry | undefined => {
    if (!image || !currentUser) return undefined;
    return image.userDescriptions.find(ud => ud.userId === currentUser.id);
  }, [image, currentUser]);

  // Fetch image data
  const fetchImage = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const fetchedImage = await getImageById(imageId);
      if (fetchedImage) {
        const migratedImage: ImageRecord = {
          ...fetchedImage,
          userDescriptions: Array.isArray(fetchedImage.userDescriptions) ? fetchedImage.userDescriptions : [],
          processedByHistory: Array.isArray(fetchedImage.processedByHistory) ? fetchedImage.processedByHistory : [],
          tags: Array.isArray(fetchedImage.tags) ? fetchedImage.tags : [],
          suggestedGeotags: Array.isArray(fetchedImage.suggestedGeotags) ? fetchedImage.suggestedGeotags : [],
          sphereId: fetchedImage.sphereId || (currentUser?.sphereIds[0] || 'defaultSphereOnError'),
        };
        
        if (currentUser && !currentUser.sphereIds.includes(migratedImage.sphereId)) {
          console.warn(`Current user does not have access to sphere '${migratedImage.sphereId}' for image '${imageId}'. Displaying anyway.`);
        }

        // Resolve image URL if needed
        if (migratedImage.dataUrl && !migratedImage.dataUrl.startsWith('data:') && migratedImage.filePath) {
          try {
            const downloadUrl = await getDownloadURL(ref(storage, migratedImage.filePath));
            migratedImage.dataUrl = downloadUrl;
          } catch (urlError: any) {
            console.error(`EditImagePage: Failed to get download URL for ${migratedImage.filePath}:`, urlError.message);
          }
        } else if (!migratedImage.dataUrl && migratedImage.filePath) {
          try {
            const downloadUrl = await getDownloadURL(ref(storage, migratedImage.filePath));
            migratedImage.dataUrl = downloadUrl;
          } catch (urlError: any) {
            console.error(`EditImagePage: Failed to get download URL (no initial dataUrl) for ${migratedImage.filePath}:`, urlError.message);
          }
        }

        setImage(migratedImage);
        const userDescEntry = migratedImage.userDescriptions.find(ud => ud.userId === currentUser.id);
        setCurrentUserTextDescription(userDescEntry?.description || '');
        resetAudioFromHook();

      } else {
        setError("Inlägget kunde inte hittas. Det kan ha blivit borttaget.");
      }
    } catch (e: any) {
      setError(`Ett fel uppstod vid hämtning av inläggsdata: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [imageId, currentUser, resetAudioFromHook]);

  // Update description when image changes
  useEffect(() => {
    const userDescEntry = getCurrentUserDescriptionEntry();
    if (userDescEntry?.description !== currentUserTextDescription) {
      setCurrentUserTextDescription(userDescEntry?.description || '');
    }
  }, [image, getCurrentUserDescriptionEntry, currentUserTextDescription]);

  // Auto-fill description from transcribed audio
  useEffect(() => {
    if (audioRecorder.transcribedText && currentUserTextDescription.trim() === '' && !audioRecorder.isRecording) {
      setCurrentUserTextDescription(audioRecorder.transcribedText);
    }
  }, [audioRecorder.transcribedText, currentUserTextDescription, audioRecorder.isRecording]);

  // Tag management
  const handleAddTag = useCallback((tagToAdd?: string) => {
    const tag = (tagToAdd || currentTag).trim().toLowerCase();
    if (tag && image && !image.tags.includes(tag)) {
      setImage(prev => prev ? { ...prev, tags: [...prev.tags, tag] } : null);
      if (!tagToAdd) setCurrentTag('');

      if (image.suggestedGeotags?.map(t => t.toLowerCase()).includes(tag)) {
        setImage(prev => prev ? {
          ...prev,
          suggestedGeotags: prev.suggestedGeotags?.filter(gTag => gTag.toLowerCase() !== tag) || []
        } : null);
      }
    } else if (!tagToAdd) {
      setCurrentTag('');
    }
  }, [currentTag, image]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setImage(prev => prev ? { ...prev, tags: prev.tags.filter(tag => tag !== tagToRemove) } : null);
  }, []);

  // Save functionality
  const handleSave = useCallback(async () => {
    if (!image || !currentUser) return;
    
    setIsSaving(true);
    setError(null);
    audioRecorder.stopRecording();

    try {
      const updatedUserDescriptions = [...(image.userDescriptions || [])];
      let userEntryIndex = updatedUserDescriptions.findIndex(ud => ud.userId === currentUser.id);

      if (userEntryIndex > -1) {
        const existingEntry = updatedUserDescriptions[userEntryIndex];
        updatedUserDescriptions[userEntryIndex] = {
          ...existingEntry,
          description: currentUserTextDescription.trim(),
          audioRecUrl: audioRecorder.audioUrl || existingEntry.audioRecUrl || null,
          createdAt: new Date().toISOString(),
        };
      } else {
        if (currentUserTextDescription.trim() || audioRecorder.audioUrl) {
          updatedUserDescriptions.push({
            userId: currentUser.id,
            description: currentUserTextDescription.trim(),
            audioRecUrl: audioRecorder.audioUrl || null,
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      const imageToSave: ImageRecord = {
        ...image,
        userDescriptions: updatedUserDescriptions,
        sphereId: image.sphereId || currentUser?.sphereIds[0] || 'defaultSphereOnError',
        isPublishedToFeed: true,
      };

      await saveImage(imageToSave);
      onSaveSuccess?.();
    } catch (err: any) {
      console.error("Error saving image:", err);
      const errorMessage = err.name === 'QuotaExceededError' || (typeof err.message === 'string' && err.message.includes('quota'))
        ? "Lagringsutrymmet är fullt. Det gick inte att spara ändringarna. Försök att frigöra utrymme."
        : `Kunde inte spara ändringar: ${err.message || 'Okänt fel'}`;
      
      setError(errorMessage);
      onSaveError?.(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [image, currentUser, currentUserTextDescription, audioRecorder, onSaveSuccess, onSaveError]);

  // Reset audio for current user
  const handleResetAudioForCurrentUser = useCallback(() => {
    audioRecorder.resetAudio();
    setImage(prev => {
      if (!prev || !currentUser) return prev;
      const newUserDescriptions = prev.userDescriptions.map(ud => {
        if (ud.userId === currentUser.id) {
          return { ...ud, audioRecUrl: null };
        }
        return ud;
      });
      return { ...prev, userDescriptions: newUserDescriptions };
    });
  }, [audioRecorder, currentUser]);

  // State object
  const state: UseImageEditingState = {
    image,
    isLoading,
    isSaving,
    error,
    currentUserTextDescription,
    currentTag
  };

  // Actions object
  const actions: UseImageEditingActions = {
    setCurrentUserTextDescription,
    setCurrentTag,
    handleAddTag,
    handleRemoveTag,
    handleSave,
    handleResetAudioForCurrentUser,
    fetchImage
  };

  return [state, actions];
}; 