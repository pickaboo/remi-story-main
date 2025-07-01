
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { TextArea } from '../common/TextArea';
import { ImageRecord, User, UserDescriptionEntry } from '../../types';
import { generateId, saveImage, getImageById } from '../../services/storageService';
import { analyzeImageWithGemini, generateEngagingQuestionFromAnalysis } from '../../services/geminiService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; 
import { AudioPlayerButton } from '../common/AudioPlayerButton';
import { ImageBankPickerModal } from '../common/ImageBankPickerModal';
import ExifReader from 'exifreader'; // Import ExifReader
import { getDownloadURL, ref } from 'firebase/storage'; 
import { storage } from '../../firebase'; 

interface CreatePostProps {
  currentUser: User;
  activeSphereId: string; 
  onPostCreated: (newPost: ImageRecord) => void;
  initialImageIdToLoad?: string | null; 
}

// Local SVG Icons for this component
const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 mr-2" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 mr-2" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
  </svg>
);

const ImageBankIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5 mr-2" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>
);

interface ExtractedFileDetails {
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string; 
}

async function extractImageDetailsFromFile(file: File): Promise<ExtractedFileDetails> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Validate dataUrl format early
  if (!dataUrl.includes(',')) {
    console.error("FileReader produced a dataUrl without a comma:", dataUrl.substring(0, 100), "for file:", file.name);
    throw new Error(`Filen "${file.name}" kunde inte bearbetas korrekt (ogiltigt dataUrl-format från FileReader).`);
  }

  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 }); 
    img.src = dataUrl;
  });

  let parsedExifData: Record<string, { description: string | number }> | undefined = undefined;
  let imageDateTaken: string = new Date().toISOString().split('T')[0]; 
  const newImageId = generateId(); 
  const filePath = `remi_files/images/${newImageId}/${file.name}`; 

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

  return {
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
    dateTaken: imageDateTaken,
    exifData: parsedExifData,
    filePath, 
  };
}

async function getBase64FromUrl(url: string, originalMimeType?: string | null): Promise<{ base64Data: string, mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for analysis: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64dataUrl = reader.result as string;
      const parts = base64dataUrl.split(',');
      if (parts.length < 2 || !parts[1]) {
          reject(new Error("Invalid base64 data from fetched URL."));
          return;
      }
      const actualMimeType = base64dataUrl.substring(base64dataUrl.indexOf(':') + 1, base64dataUrl.indexOf(';'));
      resolve({ base64Data: parts[1], mimeType: actualMimeType || originalMimeType || 'image/jpeg' });
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
}


export const CreatePost: React.FC<CreatePostProps> = ({ currentUser, activeSphereId, onPostCreated, initialImageIdToLoad }) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedBankedImageInfo, setSelectedBankedImageInfo] = useState<ImageRecord | null>(null);
  const [showImageBankModal, setShowImageBankModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorder = useAudioRecorder();
  const { resetAudio } = audioRecorder; 

  const [uploadedFileDetails, setUploadedFileDetails] = useState<ExtractedFileDetails | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false); 

  useEffect(() => {
    const loadImage = async () => {
        if (initialImageIdToLoad) {
          setImageFile(null);
          setUploadedFileDetails(null);
          setSelectedBankedImageInfo(null);
          setImagePreviewUrl(null);
          setPostText('');
          setError(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          resetAudio();

          try {
            const imageFromDb = await getImageById(initialImageIdToLoad);
            if (imageFromDb && imageFromDb.sphereId === activeSphereId) {
              let dataUrlForPreview = imageFromDb.dataUrl; 

              if ((!dataUrlForPreview || !dataUrlForPreview.startsWith('data:')) && imageFromDb.filePath) {
                try {
                  dataUrlForPreview = await getDownloadURL(ref(storage, imageFromDb.filePath));
                } catch (urlError) {
                  console.error(`Failed to get download URL for ${imageFromDb.filePath}:`, urlError);
                  setError(`Kunde inte ladda förhandsgranskning för vald bild (ID: ${initialImageIdToLoad}). Fel vid hämtning av URL.`);
                  dataUrlForPreview = imageFromDb.dataUrl || undefined; 
                }
              }
              
              const finalImageToLoad: ImageRecord = {
                ...imageFromDb,
                dataUrl: dataUrlForPreview || undefined, 
              };

              setSelectedBankedImageInfo(finalImageToLoad);
              setImagePreviewUrl(finalImageToLoad.dataUrl || null);

              let prefillText = finalImageToLoad.aiGeneratedPlaceholder || '';
              if (!prefillText) {
                  const currentUserDescForBankedImage = finalImageToLoad.userDescriptions.find(ud => ud.userId === currentUser.id);
                  if (currentUserDescForBankedImage && currentUserDescForBankedImage.description) {
                      prefillText = currentUserDescForBankedImage.description;
                  }
              }
              setPostText(prefillText);

            } else if (imageFromDb && imageFromDb.sphereId !== activeSphereId) {
              setError(`Bilden du valde (ID: ${initialImageIdToLoad}) tillhör en annan sfär och kan inte användas här.`);
            } else {
              setError(`Kunde inte ladda den valda bilden (ID: ${initialImageIdToLoad}) från bildbanken.`);
            }
          } catch (fetchError: any) {
            console.error(`Error fetching image ${initialImageIdToLoad}:`, fetchError);
            setError(`Ett fel uppstod vid hämtning av bild (ID: ${initialImageIdToLoad}). ${fetchError.message}`);
          }
        }
    };
    loadImage();
  }, [initialImageIdToLoad, activeSphereId, currentUser.id, resetAudio]);


  useEffect(() => {
    if (audioRecorder.transcribedText && postText.trim() === '' && !audioRecorder.isRecording) {
      setPostText(audioRecorder.transcribedText);
    }
  }, [audioRecorder.transcribedText, postText, audioRecorder.isRecording]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (!file.type.startsWith('image/')) {
        setError('Ogiltig filtyp. Välj en bild.');
        setImageFile(null);
        setImagePreviewUrl(null);
        setSelectedBankedImageInfo(null);
        setUploadedFileDetails(null);
        return;
      }
      setError(null);
      setImageFile(file);
      setSelectedBankedImageInfo(null); 
      
      setIsProcessingFile(true); 
      try {
        const details = await extractImageDetailsFromFile(file);
        setUploadedFileDetails(details);
        setImagePreviewUrl(details.dataUrl);
      } catch (e: any) { 
        console.error("Error extracting file details:", e);
        setError(e.message || "Kunde inte bearbeta bildfilen.");
        setImageFile(null);
        setImagePreviewUrl(null);
        setUploadedFileDetails(null);
      } finally {
        setIsProcessingFile(false);
      }
    }
  };

  const handleBankedImageSelect = async (bankedImage: ImageRecord) => {
    if (!bankedImage.dataUrl) { 
        console.error("Image selected from bank is missing dataUrl (should be downloadURL):", bankedImage);
        setError("Vald bild från banken saknar nödvändig bilddata för förhandsgranskning.");
        setShowImageBankModal(false);
        return;
    }
    if (bankedImage.sphereId !== activeSphereId) {
        setError(`Den valda bilden tillhör en annan sfär (${bankedImage.sphereId}) och kan inte användas i den aktuella sfären (${activeSphereId}).`);
        setShowImageBankModal(false);
        return;
    }

    setImageFile(null); 
    setUploadedFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
    
    setImagePreviewUrl(bankedImage.dataUrl); 
    setSelectedBankedImageInfo(bankedImage); 

    let prefillText = bankedImage.aiGeneratedPlaceholder || '';
    if (!prefillText) {
        const currentUserDescForBankedImage = bankedImage.userDescriptions.find(ud => ud.userId === currentUser.id);
        if (currentUserDescForBankedImage && currentUserDescForBankedImage.description) {
            prefillText = currentUserDescForBankedImage.description;
        }
    }
    setPostText(prefillText);
    
    setShowImageBankModal(false);
    setError(null);
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setSelectedBankedImageInfo(null);
    setUploadedFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedBankedImageInfo && !imageFile && !postText.trim() && !audioRecorder.audioUrl) {
      setError('Ett inlägg måste innehålla en bild, text eller en ljudinspelning.');
      return;
    }
    if (!currentUser) {
      setError('Ingen användare inloggad.');
      return;
    }
     if (!activeSphereId) { 
      setError('Aktiv sfär är inte definierad. Kan inte skapa inlägg.');
      return;
    }

    setIsPosting(true);
    setError(null);
    audioRecorder.stopRecording(); 

    try {
      let analysisResultFromGemini: { description?: string; geotags: string[] } = { description: undefined, geotags: [] };
      let aiPlaceholderFromGemini: string | undefined | null = undefined; 
      let finalImageRecord: ImageRecord;

      const currentUserDescEntry: UserDescriptionEntry = {
        userId: currentUser.id,
        description: postText.trim(),
        audioRecUrl: audioRecorder.audioUrl || null,
        createdAt: new Date().toISOString(),
      };

      if (selectedBankedImageInfo) {
        const banked = selectedBankedImageInfo;
        
        if (banked.dataUrl) { 
            let base64ForAnalysis: string | null = null;
            let mimeTypeForAnalysis: string | null = banked.type || 'image/jpeg';

            if (banked.dataUrl.startsWith('data:')) {
                base64ForAnalysis = banked.dataUrl.split(',')[1];
            } else if (banked.dataUrl.startsWith('http')) {
                try {
                    const { base64Data, mimeType } = await getBase64FromUrl(banked.dataUrl, banked.type);
                    base64ForAnalysis = base64Data;
                    mimeTypeForAnalysis = mimeType;
                } catch (fetchErr: any) {
                    console.warn("Failed to fetch and convert banked image URL to base64 for analysis:", fetchErr.message);
                }
            }

            if (base64ForAnalysis) {
                try {
                    analysisResultFromGemini = await analyzeImageWithGemini(base64ForAnalysis, mimeTypeForAnalysis);
                    if (analysisResultFromGemini.description && !currentUserDescEntry.description.trim() && !currentUserDescEntry.audioRecUrl) {
                        aiPlaceholderFromGemini = await generateEngagingQuestionFromAnalysis(analysisResultFromGemini.description);
                    }
                } catch (geminiError) {
                    console.warn("Gemini analysis failed for banked image in new post:", geminiError);
                }
            }
        }
        
        let finalUserDescriptions: UserDescriptionEntry[];
        const existingDescriptions = banked.userDescriptions ? [...banked.userDescriptions] : [];
        const currentUserExistingDescIndex = existingDescriptions.findIndex(ud => ud.userId === currentUser.id);

        if (currentUserExistingDescIndex > -1) {
            finalUserDescriptions = existingDescriptions.map((desc, index) => 
                index === currentUserExistingDescIndex 
                ? { ...desc, description: currentUserDescEntry.description, audioRecUrl: currentUserDescEntry.audioRecUrl || desc.audioRecUrl, createdAt: new Date().toISOString() } 
                : desc
            );
        } else {
            if (currentUserDescEntry.description || currentUserDescEntry.audioRecUrl) {
                finalUserDescriptions = [...existingDescriptions, currentUserDescEntry];
            } else {
                finalUserDescriptions = existingDescriptions;
            }
        }

        finalImageRecord = {
            ...banked,
            id: banked.id, 
            userDescriptions: finalUserDescriptions,
            geminiAnalysis: analysisResultFromGemini.description ?? banked.geminiAnalysis ?? null,
            suggestedGeotags: analysisResultFromGemini.geotags.length > 0 ? analysisResultFromGemini.geotags : (banked.suggestedGeotags ?? []),
            aiGeneratedPlaceholder: aiPlaceholderFromGemini ?? banked.aiGeneratedPlaceholder ?? null,
            isPublishedToFeed: true, 
            isProcessed: !!(analysisResultFromGemini.description || banked.isProcessed),
            processedByHistory: analysisResultFromGemini.description 
                                ? Array.from(new Set([...(banked.processedByHistory || []), currentUser.id])) 
                                : (banked.processedByHistory || []),
            dataUrl: banked.dataUrl, 
            createdAt: banked.createdAt, 
            updatedAt: undefined, 
        };
        // Ensure these fields are correctly retained or set to null/default
        finalImageRecord.filePath = banked.filePath ?? null;
        finalImageRecord.width = banked.width ?? null;
        finalImageRecord.height = banked.height ?? null;
        finalImageRecord.dateTaken = banked.dateTaken ?? new Date().toISOString().split('T')[0];
        finalImageRecord.exifData = banked.exifData ?? null;
        finalImageRecord.tags = banked.tags ?? []; 
        finalImageRecord.compiledStory = banked.compiledStory ?? null;


      } else if (imageFile && imagePreviewUrl && uploadedFileDetails) { 
        const newImageId = generateId();
        const base64Data = imagePreviewUrl.split(',')[1]; 
        try {
            analysisResultFromGemini = await analyzeImageWithGemini(base64Data, imageFile.type);
            if (analysisResultFromGemini.description && !currentUserDescEntry.description.trim() && !currentUserDescEntry.audioRecUrl) {
                aiPlaceholderFromGemini = await generateEngagingQuestionFromAnalysis(analysisResultFromGemini.description);
            }
        } catch (geminiError) {
            console.error("Gemini analysis failed for new image upload:", geminiError);
        }
        
        finalImageRecord = {
            id: newImageId,
            name: imageFile.name,
            type: imageFile.type,
            dataUrl: imagePreviewUrl, 
            dateTaken: uploadedFileDetails.dateTaken, 
            exifData: uploadedFileDetails.exifData ?? null, 
            filePath: uploadedFileDetails.filePath, 
            tags: [],
            geminiAnalysis: analysisResultFromGemini.description ?? null,
            suggestedGeotags: analysisResultFromGemini.geotags ?? [],
            userDescriptions: [currentUserDescEntry],
            compiledStory: null,
            isProcessed: !!analysisResultFromGemini.description,
            width: uploadedFileDetails.width, 
            height: uploadedFileDetails.height, 
            uploadedByUserId: currentUser.id,
            processedByHistory: analysisResultFromGemini.description ? [currentUser.id] : [],
            aiGeneratedPlaceholder: aiPlaceholderFromGemini ?? null,
            sphereId: activeSphereId,
            isPublishedToFeed: true, 
            createdAt: undefined, 
            updatedAt: undefined, 
        };
      } else { 
        const newPostId = generateId();
        let postNameText: string;
        if (postText.trim() && audioRecorder.audioUrl) postNameText = "Textinlägg med ljud";
        else if (postText.trim()) postNameText = "Textinlägg";
        else if (audioRecorder.audioUrl) postNameText = "Ljudinspelning";
        else { 
            setError('Oväntat fel: Inget innehåll att publicera.');
            setIsPosting(false);
            return;
        }
        
        finalImageRecord = {
            id: newPostId,
            name: postNameText,
            type: audioRecorder.audioUrl && !postText.trim() ? "audio/generic" : "text/plain",
            dataUrl: undefined, 
            dateTaken: new Date().toISOString().split('T')[0], 
            tags: [],
            geminiAnalysis: null,
            suggestedGeotags: [],
            userDescriptions: [currentUserDescEntry],
            compiledStory: null,
            isProcessed: true, 
            width: null, 
            height: null, 
            uploadedByUserId: currentUser.id,
            processedByHistory: [],
            aiGeneratedPlaceholder: null, 
            filePath: null, 
            exifData: null, 
            sphereId: activeSphereId,
            isPublishedToFeed: true, 
            createdAt: undefined, 
            updatedAt: undefined,
        };
      }

      const finalRecordForFirestore: Partial<ImageRecord> = { ...finalImageRecord };
      for (const key in finalRecordForFirestore) {
        if (finalRecordForFirestore[key as keyof ImageRecord] === undefined && key !== 'createdAt' && key !== 'updatedAt' && key !== 'dataUrl') {
          (finalRecordForFirestore as any)[key] = null; 
        }
      }
      
      // The dataUrl passed to saveImage needs to be the base64 string for new uploads for storage upload.
      // For banked images, finalImageRecord.dataUrl will be the downloadURL, saveImage handles this.
      let recordToSaveInDb = {...finalRecordForFirestore} as ImageRecord;
      if (imageFile && imagePreviewUrl && uploadedFileDetails && recordToSaveInDb.id !== selectedBankedImageInfo?.id) { // This is a new file upload
         recordToSaveInDb.dataUrl = imagePreviewUrl; // Pass base64 to saveImage for new uploads
      } else if (selectedBankedImageInfo) { // This is from bank
         recordToSaveInDb.dataUrl = selectedBankedImageInfo.dataUrl; // Pass downloadUrl or original base64
      }


      await saveImage(recordToSaveInDb); 
      onPostCreated(finalImageRecord); // Pass the version with potentially displayable dataUrl to UI

      setPostText('');
      clearImageSelection();
      audioRecorder.resetAudio();

    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(`Kunde inte skapa inlägget: ${err.message || 'Okänt fel'}. Kontrollera API-nyckel och försök igen.`);
    } finally {
      setIsPosting(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
  const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>;

  const handleResetAudio = () => {
    audioRecorder.resetAudio();
  };
  
  const canSubmit = !isPosting && !isProcessingFile && (!!selectedBankedImageInfo || !!imageFile || postText.trim() !== '' || !!audioRecorder.audioUrl);
  

  return (
    <>
      <form onSubmit={handleSubmit} className="bg-card-bg dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg border border-border-color dark:border-slate-700 space-y-4">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-sm`}>
            {currentUser.initials}
          </div>
          <div className="relative flex-grow">
            <TextArea
              id="postText"
              placeholder={`Vad tänker du på, ${currentUser.name.split(' ')[0]}?`}
              value={postText}
              onChange={handleTextChange}
              className="pr-12" 
              aria-label="Skriv ditt inlägg"
              disabled={isPosting || isProcessingFile}
            />
            {audioRecorder.audioUrl ? (
              <AudioPlayerButton
                audioUrl={audioRecorder.audioUrl}
                ariaLabel="Ljudinspelning för inlägg"
                buttonSize="sm" 
                className="!rounded-full !p-2 flex-shrink-0 absolute top-1/2 right-3 -translate-y-1/2"
              />
            ) : (
              <Button
                type="button"
                onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
                variant={audioRecorder.isRecording ? "danger" : "ghost"}
                size="sm"
                className="!rounded-full !px-2 !py-1.5 flex-shrink-0 absolute top-1/2 right-3 -translate-y-1/2"
                aria-label={audioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
                disabled={isPosting || isProcessingFile || audioRecorder.permissionGranted === false}
              >
                {audioRecorder.isRecording ? <StopIcon /> : <MicIcon />}
              </Button>
            )}
          </div>
        </div>
        
        <div className="ml-14 -mt-2 space-y-1"> 
          {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad. Tillåt i webbläsaren.</p>}
          {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
          {audioRecorder.audioUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
              <Button 
                type="button" 
                onClick={handleResetAudio} 
                variant="ghost" 
                size="sm" 
                className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10"
              >
                Ta bort ljud
              </Button>
            </div>
          )}
        </div>

        {imagePreviewUrl && (
          <div className="relative group max-h-96 overflow-hidden rounded-lg ml-14"> 
            <img src={imagePreviewUrl} alt="Förhandsgranskning" className="w-full h-auto object-contain rounded-lg" />
            <Button 
                  variant="danger" 
                  size="sm"
                  onClick={clearImageSelection}
                  className="absolute top-2 right-2 opacity-50 group-hover:opacity-100 !rounded-full p-1.5 leading-none"
                  aria-label="Ta bort bild"
                  disabled={isPosting || isProcessingFile}
              >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
          </div>
        )}

        {error && !audioRecorder.error && <p className="text-sm text-danger dark:text-red-400 mt-2 ml-14">{error}</p>} 
        {isProcessingFile && <p className="text-sm text-muted-text dark:text-slate-400 mt-2 ml-14">Bearbetar bild...</p>}


        <div className="flex justify-between items-center pt-3 border-t border-border-color dark:border-slate-700">
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              className="hidden"
              id="postImageUpload"
              disabled={isPosting || isProcessingFile}
            />
            {imagePreviewUrl ? (
              <Button 
                type="button"
                variant="danger" 
                onClick={clearImageSelection}
                disabled={isPosting || isProcessingFile}
                aria-label="Ta bort vald bild"
                title="Ta bort vald bild"
              >
                <TrashIcon />
                Ta bort vald bild
              </Button>
            ) : (
              <Button 
                type="button" 
                variant="ghost" 
                onClick={triggerFileInput} 
                disabled={isPosting || isProcessingFile}
                aria-label="Ladda upp bild"
                title="Ladda upp bild från dator"
              >
                <UploadIcon />
                Ladda upp bild
              </Button>
            )}
            
            {!imagePreviewUrl && ( 
                <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setShowImageBankModal(true)} 
                    disabled={isPosting || isProcessingFile}
                    aria-label="Välj från Bildbank"
                    title="Välj bild från Bildbanken"
                >
                  <ImageBankIcon />
                  Bildbank
                </Button>
            )}
          </div>
          <Button 
              type="submit" 
              variant="primary" 
              isLoading={isPosting || isProcessingFile} 
              disabled={!canSubmit}
              size="md"
          >
            {isProcessingFile ? 'Bearbetar...' : (isPosting ? 'Publicerar...' : 'Publicera')}
          </Button>
        </div>
      </form>

      {showImageBankModal && (
        <ImageBankPickerModal
          isOpen={showImageBankModal}
          onClose={() => setShowImageBankModal(false)}
          onImageSelect={handleBankedImageSelect}
          activeSphereId={activeSphereId} 
        />
      )}
    </>
  );
};
