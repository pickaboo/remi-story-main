

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { ImageRecord, User, View, Sphere } from '../types';
import { getAllImages, saveImage, generateId, deleteImage, getSphereById } from '../services/storageService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getUserById } from '../services/userService'; // Import for getting user details
import ExifReader from 'exifreader';
import { getDownloadURL, ref } from 'firebase/storage'; // Added
import { storage } from '../firebase'; // Added
// Removed: import { generateImageBankExportPdf } from '../services/pdfService'; 

interface ImageBankPageProps {
  currentUser: User;
  activeSphere: Sphere;
  onNavigate: (view: View, params?: any) => void;
}

interface UploadPreview {
  id: string; // Temp ID for list key
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string; // Added to store parsed date from EXIF or fallback
  error?: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string; // Added filePath
}

const UploadIcon: React.FC<{className?: string}> = ({className}) => (
    <svg className={`w-12 h-12 text-gray-400 dark:text-gray-500 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v12" />
    </svg>
);

const TrashIconInternal: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} pointer-events-none`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InformationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
    </svg>
);


type ImageBankViewMode = 'view' | 'upload'; // Simplified: 'main' view is removed

// Custom Confirmation Modal Component (Local to ImageBankPage)
interface ConfirmDeleteModalProps {
  image: ImageRecord;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ image, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-modal-title">
    <div className="bg-card-bg dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
      <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700">
        <h2 id="confirm-delete-modal-title" className="text-xl font-semibold text-danger dark:text-red-400">Bekräfta Radering</h2>
      </header>
      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Är du helt säker på att du vill permanent radera bilden <strong className="break-all">"{image.name}"</strong> från bildbanken?
        </p>
        <p className="text-sm text-red-500 dark:text-red-400 font-medium">Denna åtgärd kan INTE ångras.</p>
        {image.dataUrl && (
          <div className="my-2 max-h-40 overflow-hidden rounded-md border border-border-color dark:border-slate-600">
            <img src={image.dataUrl} alt={`Förhandsgranskning av ${image.name}`} className="w-full h-full object-contain" />
          </div>
        )}
      </div>
      <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>Avbryt</Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isDeleting} disabled={isDeleting}>
          Ja, radera permanent
        </Button>
      </footer>
    </div>
  </div>
);

// Helper map for EXIF data display
const formatOrientation = (orientationValue: number): string => {
  switch (orientationValue) {
    case 1: return "Normal (0°)";
    case 2: return "Spegelvänd horisontellt";
    case 3: return "Roterad 180°";
    case 4: return "Spegelvänd vertikalt";
    case 5: return "Roterad 90° MOTSOLS och spegelvänd vertikalt";
    case 6: return "Roterad 90° MEDSOLS";
    case 7: return "Roterad 90° MEDSOLS och spegelvänd vertikalt";
    case 8: return "Roterad 90° MOTSOLS";
    default: return String(orientationValue);
  }
};

const EXIF_DISPLAY_MAP: Record<string, { label: string; formatter?: (value: {description: string | number}) => string }> = {
  DateTimeOriginal: { label: 'Tagen (EXIF)', formatter: (val) => {
    if (!val.description) return 'Okänt';
    // EXIF DateTimeOriginal is often YYYY:MM:DD HH:MM:SS. Safari needs YYYY-MM-DD for Date() constructor.
    const dateStr = String(val.description).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(val.description); // Return original if parsing failed
    return date.toLocaleString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }},
  Model: { label: 'Kameramodell' },
  Make: { label: 'Tillverkare' },
  Software: { label: 'Programvara' },
  ExposureTime: { label: 'Exponeringstid', formatter: (val) => val.description ? `${val.description} s` : '' },
  FNumber: { label: 'Bländartal', formatter: (val) => val.description ? `f/${val.description}`: '' },
  ISOSpeedRatings: { label: 'ISO' },
  FocalLength: { label: 'Brännvidd', formatter: (val) => val.description ? `${val.description} mm` : '' },
  GPSLatitude: { label: 'Latitud (GPS)' },
  GPSLongitude: { label: 'Longitud (GPS)' },
  Orientation: { label: 'Orientering', formatter: (val) => val.description ? formatOrientation(Number(val.description)) : '' },
  ImageWidth: { label: 'Bredd (EXIF)' }, // EXIF ImageWidth
  ImageLength: { label: 'Höjd (EXIF)' }, // EXIF ImageLength (often used instead of ImageHeight)
  PixelXDimension: { label: 'Pixel Bredd (EXIF)' },
  PixelYDimension: { label: 'Pixel Höjd (EXIF)' },
};

const ImageMetadataUserDetails: React.FC<{ userId?: string; sphereId?: string }> = ({ userId, sphereId }) => {
  const [uploaderName, setUploaderName] = useState<string | null>(null);
  const [sphereName, setSphereName] = useState<string | null>(null);
  const [isLoadingUploader, setIsLoadingUploader] = useState(false);
  const [isLoadingSphere, setIsLoadingSphere] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsLoadingUploader(true);
      getUserById(userId)
        .then(user => setUploaderName(user?.name || 'Okänd'))
        .finally(() => setIsLoadingUploader(false));
    } else {
      setUploaderName(null);
    }
  }, [userId]);

  useEffect(() => {
    if (sphereId) {
      setIsLoadingSphere(true);
      getSphereById(sphereId)
        .then(sphere => setSphereName(sphere?.name || 'Okänd'))
        .finally(() => setIsLoadingSphere(false));
    } else {
      setSphereName(null);
    }
  }, [sphereId]);

  return (
    <>
      {userId && (
        <p className="truncate text-xs">
          <strong className="font-normal text-slate-500 dark:text-slate-400">Av:</strong>{' '}
          <span className="text-slate-700 dark:text-slate-300">
            {isLoadingUploader ? 'Laddar...' : uploaderName || 'Okänd'}
          </span>
        </p>
      )}
      {sphereId && (
        <p className="truncate text-xs">
          <strong className="font-normal text-slate-500 dark:text-slate-400">Sfär:</strong>{' '}
          <span className="text-slate-700 dark:text-slate-300">
            {isLoadingSphere ? 'Laddar...' : sphereName || 'Okänd'}
          </span>
        </p>
      )}
    </>
  );
};


export const ImageBankPage: React.FC<ImageBankPageProps> = ({ currentUser, activeSphere, onNavigate }) => {
  const [imageBankView, setImageBankView] = useState<ImageBankViewMode>('view'); // Default to 'view'
  
  // States for 'upload' view
  const [imagesToUpload, setImagesToUpload] = useState<UploadPreview[]>([]);
  const [isSavingUploads, setIsSavingUploads] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for 'view' bank view
  const [bankedImagesInViewMode, setBankedImagesInViewMode] = useState<ImageRecord[]>([]);
  const [isLoadingBankView, setIsLoadingBankView] = useState(true);
  const [bankViewError, setBankViewError] = useState<string | null>(null);
  const [imageForDeletionConfirmation, setImageForDeletionConfirmation] = useState<ImageRecord | null>(null);
  const [isDeletingImage, setIsDeletingImage] = useState(false);
  const [expandedMetadataImageId, setExpandedMetadataImageId] = useState<string | null>(null);
  // Removed: const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);


  const fetchBankedImagesForViewMode = useCallback(async () => {
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
  }, [activeSphere.id]);

  useEffect(() => {
    if (imageBankView === 'view') {
      fetchBankedImagesForViewMode();
    }
    if (imageBankView === 'upload') {
        setImagesToUpload([]); 
        setUploadError(null);
        // uploadSuccessMessage is removed as feedback is navigating back to view
    }
  }, [imageBankView, fetchBankedImagesForViewMode]);

  const handleFileSelectForUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      setImageBankView('view'); 
    } else if (savedCount === 0 && !localUploadError) { 
      setUploadError("Inga bilder kunde sparas (okänt fel eller tom kö).");
    }
  };

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

  const formatDataUrlSize = (dataUrl?: string): string => {
    if (!dataUrl) return 'Okänd';
    const sizeInBytes = (dataUrl.length * (3/4));
    if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Removed: handleExportImageBankToPdf

  const renderUploadView = () => (
    <div>
        <Button onClick={() => setImageBankView('view')} variant="ghost" size="sm" className="mb-6">
            &larr; Tillbaka till Bildbanken
        </Button>
        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Importera Bilder till Bildbanken</h2>
        <p className="text-muted-text dark:text-slate-400 mb-6">
            Ladda upp bilder som ska sparas i bildbanken för sfären <span className="font-semibold">"{activeSphere.name}"</span>.
            Dessa bilder publiceras inte automatiskt i flödet.
        </p>
        
        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-blue-400 transition-colors rounded-xl p-6 sm:p-10 text-center bg-slate-50 dark:bg-slate-700/30 hover:bg-primary/5 dark:hover:bg-blue-400/5 cursor-pointer mb-6">
            <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelectForUpload}
                ref={fileInputRef}
                className="hidden"
                id="imageBankUploadInput"
            />
            <label htmlFor="imageBankUploadInput" className="cursor-pointer">
                <UploadIcon className="mx-auto mb-3 text-primary dark:text-blue-400" />
                <p className="text-lg font-semibold text-primary dark:text-blue-400 mb-1">Dra & släpp filer här eller klicka</p>
                <p className="text-muted-text dark:text-slate-400 text-sm">(Max 10MB per bild, flera bilder kan väljas)</p>
            </label>
        </div>

        {uploadError && <p className="text-danger dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-3 rounded-lg mb-4 whitespace-pre-line">{uploadError}</p>}

        {imagesToUpload.length > 0 && (
            <div className="mb-6">
                <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Valda bilder för uppladdning ({imagesToUpload.length}):</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 border border-border-color dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50">
                    {imagesToUpload.map(preview => (
                        <div key={preview.id} className="relative group border border-border-color dark:border-slate-600 p-1.5 rounded-lg shadow-sm aspect-square">
                            <img src={preview.dataUrl} alt={preview.file.name} className="w-full h-full object-cover rounded" />
                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center">
                                <p className="text-xs text-white truncate" title={preview.file.name}>{preview.file.name}</p>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => removeImageFromUploadQueue(preview.id)}
                                className="absolute top-1 right-1 !p-1 !rounded-full opacity-60 group-hover:opacity-100"
                                title="Ta bort från kö"
                            >
                                <TrashIconInternal className="w-3 h-3" />
                            </Button>
                        </div>
                    ))}
                </div>
                <Button 
                    onClick={handleSaveUploadsToBank} 
                    isLoading={isSavingUploads} 
                    disabled={imagesToUpload.length === 0 || isSavingUploads}
                    variant="primary" 
                    size="lg"
                    className="mt-6 w-full sm:w-auto"
                >
                    Spara {imagesToUpload.length} bild{imagesToUpload.length > 1 ? 'er' : ''} till banken
                </Button>
            </div>
        )}
    </div>
  );

  const renderViewBankView = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
            <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-1">Bilder i Bildbanken för "{activeSphere.name}"</h2>
            <p className="text-muted-text dark:text-slate-400">
                Här samlas bilder som är opublicerade eller redan publicerade i flödet. Du kan välja bilder härifrån för att skapa nya inlägg eller projekt.
            </p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
            {/* PDF Export Button Removed */}
            <Button
                onClick={() => {
                    setImagesToUpload([]); 
                    setUploadError(null);
                    setImageBankView('upload');
                }}
                variant="accent"
                size="md" 
            >
                <UploadIcon className="w-4 h-4 mr-2 text-current" /> 
                Importera Nya Bilder
            </Button>
        </div>
      </div>

      {isLoadingBankView && <div className="flex justify-center items-center h-64"><LoadingSpinner message="Laddar bildbank..." /></div>}
      {bankViewError && <p className="text-danger dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-4 rounded-lg">{bankViewError}</p>}
      {!isLoadingBankView && !bankViewError && (
        <>
          {bankedImagesInViewMode.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-border-color dark:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-13.5h16.5a2.25 2.25 0 00-2.25-2.25h-12a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 20.25h12A2.25 2.25 0 0018 18V9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Bildbanken är tom för denna sfär</h3>
                <p className="text-muted-text dark:text-slate-400">Importera nya bilder för att se dem här.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bankedImagesInViewMode.map(image => {
                const isMetadataExpanded = expandedMetadataImageId === image.id;

                return (
                    <div key={image.id} className="group relative border border-border-color dark:border-slate-700 p-2.5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-150 ease-in-out bg-white dark:bg-slate-700/50 flex flex-col">
                        <div className="aspect-square bg-slate-100 dark:bg-slate-600 rounded-lg overflow-hidden mb-2 shadow-inner relative">
                        {image.dataUrl ? (
                            <img src={image.dataUrl} alt={image.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-text dark:text-slate-400 text-xs p-2">Ingen förhandsgranskning</div>
                        )}
                        {currentUser.showImageMetadataInBank && (
                             <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleMetadata(image.id)}
                                className={`absolute bottom-1 right-1 !p-1 !rounded-full text-white bg-black/30 hover:bg-black/50 transition-all
                                            ${isMetadataExpanded ? 'ring-2 ring-white/70' : ''}`}
                                title={isMetadataExpanded ? "Dölj metadata" : "Visa metadata"}
                                aria-expanded={isMetadataExpanded}
                                aria-controls={`metadata-${image.id}`}
                            >
                                <InformationCircleIcon className="w-4 h-4" />
                            </Button>
                        )}
                        </div>
                         <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => initiateDeleteImageFromBank(image)}
                                className="absolute top-1 right-1 !p-1.5 !rounded-full text-danger border-danger hover:bg-danger/20 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/20 opacity-70 hover:opacity-100 transition-opacity z-10"
                                title={`Radera "${image.name}" från bildbanken`}
                                aria-label={`Radera bild ${image.name}`}
                            >
                                <TrashIconInternal className="w-4 h-4" />
                        </Button>
                        
                        {isMetadataExpanded && (
                            <div id={`metadata-${image.id}`} className="mt-1 mb-2 p-2.5 bg-slate-50 dark:bg-slate-700 rounded-md border border-border-color dark:border-slate-600 text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                                <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Fil:</strong> <span className="text-slate-700 dark:text-slate-300" title={image.name}>{image.name}</span></p>
                                <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Typ:</strong> <span className="text-slate-700 dark:text-slate-300">{image.type}</span></p>
                                {image.width && image.height && <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Mått:</strong> <span className="text-slate-700 dark:text-slate-300">{image.width} x {image.height} px</span></p>}
                                <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Storlek (ca):</strong> <span className="text-slate-700 dark:text-slate-300">{formatDataUrlSize(image.dataUrl)}</span></p>
                                {image.filePath && <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Sökväg:</strong> <span className="text-slate-700 dark:text-slate-300" title={image.filePath}>{image.filePath}</span></p>}
                                
                                <ImageMetadataUserDetails userId={image.uploadedByUserId} sphereId={image.sphereId} />
                                
                                <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">AI-analys:</strong> <span className="text-slate-700 dark:text-slate-300">{image.isProcessed ? "Ja" : "Nej"}</span></p>
                                
                                {image.exifData && Object.keys(image.exifData).length > 0 && (
                                  <>
                                    <p className="font-medium mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-600/50 text-slate-500 dark:text-slate-400">EXIF Data:</p>
                                    {Object.entries(image.exifData)
                                      .map(([key, exifTagContainer]) => {
                                        if (!exifTagContainer || typeof exifTagContainer.description === 'undefined') return null;
                                        const displayInfo = EXIF_DISPLAY_MAP[key];
                                        const valueToDisplay = displayInfo?.formatter ? displayInfo.formatter(exifTagContainer) : String(exifTagContainer.description);
                                        const labelToDisplay = displayInfo?.label || key.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
                                        if (!valueToDisplay || (typeof valueToDisplay !== 'string' && typeof valueToDisplay !== 'number')) return null;
                                        return { key, label: labelToDisplay, value: valueToDisplay };
                                      })
                                      .filter(item => item !== null)
                                      .slice(0, 7) 
                                      .map(item => (
                                      item && <p key={item.key} className="truncate text-xs" title={`${item.label}: ${item.value}`}>
                                        <strong className="capitalize font-normal text-slate-500 dark:text-slate-400">{item.label}:</strong>{' '}
                                        <span className="text-slate-700 dark:text-slate-300">{item.value}</span>
                                      </p>
                                    ))}
                                    {Object.keys(image.exifData).filter(k => image.exifData![k]?.description !== undefined).length > 7 && <p className="text-xs text-slate-400 dark:text-slate-500">...och mer.</p>}
                                  </>
                                )}
                            </div>
                        )}
                        
                        <div className="mt-auto"> {/* Pushes controls to bottom if metadata not expanded */}
                            <div className="mb-1.5">
                                <label htmlFor={`date-input-${image.id}`} className="sr-only">
                                    Datum för {image.name}
                                </label>
                                <input
                                    type="date"
                                    id={`date-input-${image.id}`}
                                    value={image.dateTaken ? new Date(image.dateTaken).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleDateChange(image.id, e.target.value)}
                                    className="block w-full text-xs p-1.5 border border-border-color dark:border-slate-600 rounded-md bg-input-bg dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 dark:[color-scheme:dark]"
                                    aria-label={`Datum för ${image.name}`}
                                />
                            </div>

                            {image.isPublishedToFeed && (
                                <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onNavigate(View.Home, { scrollToPostId: image.id });
                                }}
                                className="text-xs text-accent dark:text-emerald-400 hover:underline mb-2 font-medium focus:outline-none focus:ring-1 focus:ring-accent/50 dark:focus:ring-emerald-400/50 rounded"
                                title="Gå till publicerat inlägg i flödet"
                                >
                                ✓ Publicerad i flödet
                                </button>
                            )}
                            <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-1.5">
                                {!image.isPublishedToFeed && (
                                    <Button
                                        size="sm"
                                        variant="accent"
                                        className="w-full text-xs !font-medium"
                                        onClick={() => onNavigate(View.Home, { prefillPostWithImageId: image.id })}
                                        title={`Skapa inlägg med "${image.name}"`}
                                    >
                                        Använd i Inlägg
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <PageContainer>
      {imageBankView === 'view' && renderViewBankView()}
      {imageBankView === 'upload' && renderUploadView()}
      {imageForDeletionConfirmation && (
        <ConfirmDeleteModal
            image={imageForDeletionConfirmation}
            onConfirm={confirmDeleteImageFromBank}
            onCancel={cancelDeleteImageFromBank}
            isDeleting={isDeletingImage}
        />
      )}
    </PageContainer>
  );
};
