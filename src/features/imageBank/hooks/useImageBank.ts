import { useState, useCallback, useEffect } from 'react';
import { ImageRecord } from '../../../types';
import { getAllImages, saveImage, deleteImage } from '../../../common/services/storageService';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../firebase';
import { useSphere } from '../../../context/SphereContext';

export const useImageBank = () => {
  const { activeSphere } = useSphere();
  
  // States for 'view' bank view
  const [bankedImagesInViewMode, setBankedImagesInViewMode] = useState<ImageRecord[]>([]);
  const [isLoadingBankView, setIsLoadingBankView] = useState(true);
  const [bankViewError, setBankViewError] = useState<string | null>(null);
  const [imageForDeletionConfirmation, setImageForDeletionConfirmation] = useState<ImageRecord | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [expandedMetadataImageId, setExpandedMetadataImageId] = useState<string | null>(null);

  const fetchBankedImagesForViewMode = useCallback(async () => {
    if (!activeSphere) return;
    
    setIsLoadingBankView(true);
    setBankViewError(null);
    try {
      const allRawImagesFromStorage = await getAllImages();
      const sphereRawImages = allRawImagesFromStorage.filter(
        (img) => img.sphereId === activeSphere.id
      );

      const imagesWithDisplayUrls = await Promise.all(
        sphereRawImages.map(async (img) => {
          // If dataUrl is already a valid displayable URL (base64 or http/s), use it.
          if (img.dataUrl && (img.dataUrl.startsWith('data:') || img.dataUrl.startsWith('http'))) {
            return img;
          }
          // If no usable dataUrl but filePath exists, fetch downloadURL.
          if (img.filePath) {
            try {
              const downloadUrl = await getDownloadURL(ref(storage, img.filePath));
              return { ...img, dataUrl: downloadUrl };
            } catch (error) {
              console.error(`Failed to get download URL for ${img.filePath} in ImageBankPage:`, error);
              // Return image without dataUrl if fetch fails, will be filtered out.
              return { ...img, dataUrl: undefined }; 
            }
          }
          // If no filePath and no usable dataUrl, it's not displayable.
          return { ...img, dataUrl: undefined };
        })
      );
      
      // Filter for images that actually have a dataUrl to display
      const displayableSphereImages = imagesWithDisplayUrls.filter((img: ImageRecord) => img.dataUrl);
      
      const sortedImages = displayableSphereImages.sort((a: ImageRecord, b: ImageRecord) => {
        const dateA = new Date(a.dateTaken || a.createdAt || 0);
        const dateB = new Date(b.dateTaken || b.createdAt || 0);
        return dateB.getTime() - dateA.getTime();
      });
      
      setBankedImagesInViewMode(sortedImages);
    } catch (e: any) {
      console.error("[ImageBankPage] Error fetching images for bank view:", e);
      setBankViewError("Kunde inte ladda bilder till bildbanken. " + e.message);
    } finally {
      setIsLoadingBankView(false);
    }
  }, [activeSphere]);

  const initiateDeleteImageFromBank = (image: ImageRecord) => {
    setImageForDeletionConfirmation(image);
  };

  const confirmDeleteImageFromBank = async () => {
    if (!imageForDeletionConfirmation) return;
    setIsDeletingImage(true);
    try {
        await deleteImage(imageForDeletionConfirmation); 
        setBankedImagesInViewMode(prevImages => prevImages.filter(img => img.id !== imageForDeletionConfirmation!.id));
        if (expandedMetadataImageId === imageForDeletionConfirmation!.id) {
            setExpandedMetadataImageId(null); 
        }
    } catch (e: any) {
        console.error("[ImageBankPage] Error during deletion process:", e);
        setBankViewError(`Kunde inte radera bilden (ID: ${imageForDeletionConfirmation!.id}). Fel: ${e.message}`);
        fetchBankedImagesForViewMode(); 
    } finally {
        setIsDeletingImage(false);
        setImageForDeletionConfirmation(null);
    }
  };

  const cancelDeleteImageFromBank = () => {
    if (!imageForDeletionConfirmation) return;
    setImageForDeletionConfirmation(null);
  };
  
  const handleDateChange = async (imageId: string, newDateString: string) => {
    const imageToUpdate = bankedImagesInViewMode.find(img => img.id === imageId);
    if (imageToUpdate) {
        const updatedDateTaken = newDateString ? new Date(newDateString).toISOString().split('T')[0] : undefined;
        const updatedImage = { ...imageToUpdate, dateTaken: updatedDateTaken };
        
        await saveImage(updatedImage);
        setBankedImagesInViewMode(prevImages =>
            prevImages.map(img => (img.id === imageId ? updatedImage : img))
        );
    }
  };

  const toggleMetadata = (imageId: string) => {
    setExpandedMetadataImageId(prevId => prevId === imageId ? null : imageId);
  };

  useEffect(() => {
    fetchBankedImagesForViewMode();
  }, [fetchBankedImagesForViewMode]);

  return {
    bankedImagesInViewMode,
    isLoadingBankView,
    bankViewError,
    imageForDeletionConfirmation,
    isDeletingImage,
    expandedMetadataImageId,
    fetchBankedImagesForViewMode,
    initiateDeleteImageFromBank,
    confirmDeleteImageFromBank,
    cancelDeleteImageFromBank,
    handleDateChange,
    toggleMetadata,
  };
}; 