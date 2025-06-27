import { useState, useRef } from 'react';
import { ImageRecord } from '../../../types';
import { saveImage, generateId } from '../../../common/services/storageService';
import { useUser } from '../../../context/UserContext';
import { useSphere } from '../../../context/SphereContext';
import ExifReader from 'exifreader';

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

export const useImageUpload = () => {
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for 'upload' view
  const [imagesToUpload, setImagesToUpload] = useState<UploadPreview[]>([]);
  const [isSavingUploads, setIsSavingUploads] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelectForUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentUser || !activeSphere) return;
    
    setUploadError(null);
    const files = event.target.files;
    if (!files) return;

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

      let parsedExifData: Record<string, { description: string | number }> | undefined = undefined;
      let imageDateTaken: string = new Date().toISOString().split('T')[0]; // Default to today
      const previewId = generateId(); // Used for key and can be part of filePath
      const filePath = `remi_files/images/${previewId}/${file.name}`; // Generate filePath

      try {
        const arrayBuffer = await file.arrayBuffer();
        const rawExifTags = ExifReader.load(arrayBuffer);
        
        const exifDataToStore: Record<string, { description: string | number }> = {};
        if (rawExifTags) {
            for (const tagName in rawExifTags) {
                const tagValue = rawExifTags[tagName];
                if (tagValue && typeof tagValue.description !== 'undefined') {
                    const excludedTagsByName = ['MakerNote', 'UserComment', 'ThumbnailOffset', 'ThumbnailLength', 'JPEGTables', 'Padding', 'ThumbnailData', 'ApplicationNotes', 'ComponentsConfiguration', 'ExifToolVersion', 'InteropOffset', 'GPSProcessingMethod', 'FileSource', 'SceneType'];
                    if (excludedTagsByName.includes(tagName) || tagName.startsWith('Thumbnail')) {
                        continue;
                    }
                    // Fixed: Check if tagValue.value is an object before instanceof ArrayBuffer
                    if (typeof tagValue.value === 'object' && tagValue.value !== null && ArrayBuffer.isView(tagValue.value)) {
                        continue;
                    }
                    if (typeof tagValue.description === 'string' || typeof tagValue.description === 'number') {
                        exifDataToStore[tagName] = { description: tagValue.description };
                    }
                }
            }
        }
        parsedExifData = Object.keys(exifDataToStore).length > 0 ? exifDataToStore : undefined;

        if (parsedExifData?.DateTimeOriginal?.description) {
            const dtOriginalStr = String(parsedExifData.DateTimeOriginal.description);
            const parsableDateStr = dtOriginalStr.substring(0, 10).replace(/:/g, '-') + dtOriginalStr.substring(10);
            const exifDate = new Date(parsableDateStr);
            if (!isNaN(exifDate.getTime())) {
              imageDateTaken = exifDate.toISOString().split('T')[0]; 
            } else {
                console.warn(`Could not parse EXIF DateTimeOriginal: ${dtOriginalStr}`);
            }
        }
      } catch (exifError) {
        console.warn(`Could not parse EXIF data for ${file.name}:`, exifError);
      }

      newPreviews.push({
        id: previewId, 
        file,
        dataUrl,
        width: dimensions.width,
        height: dimensions.height,
        dateTaken: imageDateTaken, 
        error: undefined,
        exifData: parsedExifData,
        filePath, // Store filePath
      });
    }
    setImagesToUpload(prev => [...prev, ...newPreviews]);
     if (fileInputRef.current) { 
      fileInputRef.current.value = "";
    }
  };

  const removeImageFromUploadQueue = (id: string) => {
    setImagesToUpload(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveUploadsToBank = async () => {
    if (!currentUser || !activeSphere) return;
    
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
          id: generateId(), // Generate a new final ID for the stored record
          name: preview.file.name,
          type: preview.file.type,
          dataUrl: preview.dataUrl,
          dateTaken: preview.dateTaken, 
          tags: [],
          userDescriptions: [],
          isProcessed: false, 
          width: preview.width,
          height: preview.height,
          uploadedByUserId: currentUser.id,
          processedByHistory: [],
          suggestedGeotags: [],
          filePath: preview.filePath, 
          sphereId: activeSphere.id,
          isPublishedToFeed: false, 
          createdAt: new Date().toISOString(),
          // Explicitly set optional fields that might otherwise be undefined to null
          geminiAnalysis: null, 
          compiledStory: null, 
          aiGeneratedPlaceholder: null, 
          exifData: preview.exifData || null, // if preview.exifData is undefined, use null
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
    
    setIsSavingUploads(false);
    
    if (localUploadError) {
      setUploadError(localUploadError);
      if (savedCount > 0) {
        const successfullySavedIds = imagesToUpload.slice(0, savedCount).map(p => p.id);
        setImagesToUpload(prev => prev.filter(p => !successfullySavedIds.includes(p.id)));
      }
    } else if (savedCount > 0) { 
      setImagesToUpload([]); 
      return true; // Success - trigger view change
    } else if (savedCount === 0 && !localUploadError) { 
      setUploadError("Inga bilder kunde sparas (okänt fel eller tom kö).");
    }
    return false;
  };

  const clearUploadState = () => {
    setImagesToUpload([]);
    setUploadError(null);
  };

  return {
    imagesToUpload,
    isSavingUploads,
    uploadError,
    fileInputRef,
    handleFileSelectForUpload,
    removeImageFromUploadQueue,
    handleSaveUploadsToBank,
    clearUploadState,
  };
}; 