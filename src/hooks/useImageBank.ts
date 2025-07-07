import { useState, useCallback, useEffect } from 'react';
import { ImageRecord } from '../types';
import { getAllImages, saveImage, deleteImage, generateId } from '../services/storageService';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../firebase';
import { parseExifData } from '../utils/exifUtils';

interface UploadPreview {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string;
  error?: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string;
}

export const useImageBank = (currentUserId: string, activeSphereId: string) => {
  // States for 'view' bank view
  const [bankedImagesInViewMode, setBankedImagesInViewMode] = useState<ImageRecord[]>([]);
  const [isLoadingBankView, setIsLoadingBankView] = useState(true);
  const [bankViewError, setBankViewError] = useState<string | null>(null);
  const [imageForDeletionConfirmation, setImageForDeletionConfirmation] = useState<ImageRecord | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [expandedMetadataImageId, setExpandedMetadataImageId] = useState<string | null>(null);

  // States for 'upload' view
  const [imagesToUpload, setImagesToUpload] = useState<UploadPreview[]>([]);
  const [isSavingUploads, setIsSavingUploads] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fetchBankedImagesForViewMode = useCallback(async () => {
    setIsLoadingBankView(true);
    setBankViewError(null);
    try {
      const allRawImagesFromStorage = await getAllImages();
      const sphereRawImages = allRawImagesFromStorage.filter(
        (img) => img.sphereId === activeSphereId
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
              return { ...img, dataUrl: img.dataUrl || '' }; 
            }
          }
          // If no filePath and no usable dataUrl, it's not displayable.
          return { ...img, dataUrl: img.dataUrl || '' };
        })
      );
      
      // Filter for images that actually have a dataUrl to display
      const displayableSphereImages = imagesWithDisplayUrls.filter(img => img.dataUrl);
      
      setBankedImagesInViewMode(displayableSphereImages.sort((a,b) => {
        const dateA = a.dateTaken ? new Date(a.dateTaken).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const dateB = b.dateTaken ? new Date(b.dateTaken).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return dateB - dateA; // Sort descending by date
      }));
    } catch (e: any) {
      console.error("[ImageBankPage] Error fetching images for bank view:", e);
      setBankViewError("Kunde inte ladda bilder till bildbanken. " + e.message);
    } finally {
      setIsLoadingBankView(false);
    }
  }, [activeSphereId]);

  const handleFileSelectForUpload = async (files: FileList) => {
    setUploadError(null);
    const newPreviews: UploadPreview[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setUploadError(`Filen "${file.name}" är inte en giltig bildtyp.`);
        continue;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadError(`Bilden "${file.name}" är för stor (max 10MB).`);
        continue;
      }

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const dimensions = await new Promise<{width: number, height: number}>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({width: img.width, height: img.height});
        img.onerror = () => resolve({width:0, height:0}); 
        img.src = dataUrl;
      });

      const previewId = generateId();
      const filePath = `remi_files/images/${previewId}/${file.name}`;

      // Parse EXIF data
      const { exifData, dateTaken } = await parseExifData(file);

      newPreviews.push({
        id: previewId, 
        file,
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        dateTaken, 
        error: undefined,
        exifData,
        filePath,
      });
    }
    setImagesToUpload(prev => [...prev, ...newPreviews]);
  };

  const removeImageFromUploadQueue = (id: string) => {
    setImagesToUpload(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveUploadsToBank = async () => {
    if (imagesToUpload.length === 0) {
      setUploadError("Inga bilder valda för uppladdning.");
      return;
    }
    setIsSavingUploads(true);
    setUploadError(null);
    let localUploadError: string | null = null; 

    let savedCount = 0;
    for (const preview of imagesToUpload) {
      try {
        const newImageRecord: ImageRecord = {
          id: generateId(),
          name: preview.file.name,
          type: preview.file.type,
          dataUrl: preview.dataUrl || '',
          dateTaken: preview.dateTaken, 
          tags: [],
          userDescriptions: [],
          isProcessed: false, 
          width: preview.width,
          height: preview.height,
          uploadedByUserId: currentUserId,
          processedByHistory: [],
          suggestedGeotags: [],
          filePath: preview.filePath, 
          sphereId: activeSphereId,
          isPublishedToFeed: false, 
          createdAt: new Date().toISOString(),
          size: preview.file.size,
          updatedAt: new Date().toISOString(),
          geminiAnalysis: undefined,
          compiledStory: undefined,
          aiGeneratedPlaceholder: undefined,
          exifData: preview.exifData || undefined,
        };
        await saveImage(newImageRecord);
        savedCount++;
      } catch (e: any) {
        console.error("Error saving one of the uploaded images:", e);
        if (e.name === 'QuotaExceededError' || (typeof e.message === 'string' && e.message.includes('quota'))) {
          localUploadError = `Lagringsutrymmet är fullt. ${savedCount > 0 ? `${savedCount} bild${savedCount === 1 ? '' : 'er'} sparades, men` : 'Inga bilder kunde sparas eftersom'} resterande kunde inte sparas. Frigör utrymme (t.ex. radera gamla inlägg/projekt) eller ladda upp färre bilder åt gången.`;
        } else {
          localUploadError = `Ett fel uppstod vid sparande av "${preview.file.name}". ${e.message}`;
        }
        break; 
      }
    }
    
    if (localUploadError) {
      setUploadError(localUploadError);
    } else {
      // Clear upload queue on success
      setImagesToUpload([]);
      // Refresh the bank view to show new images
      await fetchBankedImagesForViewMode();
    }
    setIsSavingUploads(false);
  };

  const initiateDeleteImageFromBank = (image: ImageRecord) => {
    setImageForDeletionConfirmation(image);
  };

  const confirmDeleteImageFromBank = async () => {
    if (!imageForDeletionConfirmation) return;
    
    setIsDeletingImage(true);
    try {
      await deleteImage(imageForDeletionConfirmation);
      setImageForDeletionConfirmation(null);
      // Refresh the bank view
      await fetchBankedImagesForViewMode();
    } catch (e: any) {
      console.error("Error deleting image:", e);
      // You might want to show an error message here
    } finally {
      setIsDeletingImage(false);
    }
  };

  const cancelDeleteImageFromBank = () => {
    setImageForDeletionConfirmation(null);
  };

  const toggleMetadata = (imageId: string) => {
    setExpandedMetadataImageId(expandedMetadataImageId === imageId ? null : imageId);
  };

  return {
    // View mode state
    bankedImagesInViewMode,
    isLoadingBankView,
    bankViewError,
    imageForDeletionConfirmation,
    isDeletingImage,
    expandedMetadataImageId,
    
    // Upload mode state
    imagesToUpload,
    isSavingUploads,
    uploadError,
    
    // Actions
    fetchBankedImagesForViewMode,
    handleFileSelectForUpload,
    removeImageFromUploadQueue,
    handleSaveUploadsToBank,
    initiateDeleteImageFromBank,
    confirmDeleteImageFromBank,
    cancelDeleteImageFromBank,
    toggleMetadata,
  };
}; 