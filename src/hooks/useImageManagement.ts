import { useState, useEffect, useCallback } from 'react';
import { ImageRecord, User } from '../types';
import { getUserById } from '../services/userService';

interface UseImageManagementProps {
  imageId?: string;
  currentUser: User;
}

interface UseImageManagementReturn {
  image: ImageRecord | null;
  creator: User | null;
  isLoading: boolean;
  error: string | null;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  refreshImage: () => void;
}

/**
 * Custom hook for managing image data, creator information, and fullscreen state
 */
export function useImageManagement({ 
  imageId, 
  currentUser 
}: UseImageManagementProps): UseImageManagementReturn {
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [creator, setCreator] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const fetchImageData = useCallback(async () => {
    if (!imageId) {
      setImage(null);
      setCreator(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch image data (this would need to be implemented in your services)
      // const imageData = await getImageById(imageId);
      // setImage(imageData);

      // Fetch creator data
      if (image?.uploadedByUserId) {
        const creatorData = await getUserById(image.uploadedByUserId);
        setCreator(creatorData);
      } else {
        setCreator(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod vid laddning av bilden');
      setImage(null);
      setCreator(null);
    } finally {
      setIsLoading(false);
    }
  }, [imageId, image?.uploadedByUserId]);

  const refreshImage = useCallback(() => {
    fetchImageData();
  }, [fetchImageData]);

  useEffect(() => {
    fetchImageData();
  }, [fetchImageData]);

  return {
    image,
    creator,
    isLoading,
    error,
    isFullscreen,
    setIsFullscreen,
    refreshImage
  };
} 