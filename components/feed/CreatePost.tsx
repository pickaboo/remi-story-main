import React, { useState, useRef, useEffect } from 'react';
import { Button } from '../common/Button';
import { TextArea } from '../common/TextArea';
import { ImageRecord, User, UserDescriptionEntry } from '../../types';
import { generateId, saveImage, getImageById } from '../../services/storageService';
import { analyzeImageWithGemini, generateEngagingQuestionFromAnalysis, GeminiAnalysisResult } from '../../services/geminiService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; 
import { AudioPlayerButton } from '../common/AudioPlayerButton';
import { ImageBankPickerModal } from '../common/ImageBankPickerModal';
import ExifReader from 'exifreader'; // Import ExifReader

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

const MicIconCreatePost: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
);
  
const StopIconCreatePost: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
    </svg>
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

  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 }); // Fallback
    img.src = dataUrl;
  });

  let parsedExifData: Record<string, { description: string | number }> | undefined = undefined;
  let imageDateTaken: string = new Date().toISOString().split('T')[0]; // Default to today
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

async function getBase64FromUrl(url: string): Promise<{ base64: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
  }
  const blob = await response.blob();
  const mimeType = blob.type;
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({ base64: base64String, mimeType });
    };
    reader.onerror = reject;
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
  const [aiPlaceholder, setAiPlaceholder] = useState<string>("Vad vill du berätta eller fråga om?");


  useEffect(() => {
    const loadImage = async () => {
        if (initialImageIdToLoad) {
          setIsPosting(true); // Show loading indicator
          const imageToLoad = await getImageById(initialImageIdToLoad);
          if (imageToLoad && imageToLoad.sphereId === activeSphereId) {
            setImageFile(null);
            setUploadedFileDetails(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            resetAudio(); 
            
            setSelectedBankedImageInfo(imageToLoad);
            setImagePreviewUrl(imageToLoad.storageUrl || imageToLoad.dataUrl || null);
            
            let prefillText = imageToLoad.aiGeneratedPlaceholder || '';
            if (!prefillText) {
                const currentUserDescForBankedImage = imageToLoad.userDescriptions.find(ud => ud.userId === currentUser.id);
                if (currentUserDescForBankedImage && currentUserDescForBankedImage.description) {
                    prefillText = currentUserDescForBankedImage.description;
                }
            }
            setPostText(prefillText);
            setAiPlaceholder(imageToLoad.aiGeneratedPlaceholder || "Vad får den här bilden dig att tänka på?");
            setError(null);
          } else if (imageToLoad && imageToLoad.sphereId !== activeSphereId) {
            setError(`Bilden du valde (ID: ${initialImageIdToLoad}) tillhör en annan sfär och kan inte användas här.`);
            setSelectedBankedImageInfo(null);
            setImagePreviewUrl(null);
            setUploadedFileDetails(null);
            setPostText('');
            setAiPlaceholder("Vad vill du berätta eller fråga om?");
          } else {
            setError(`Kunde inte ladda den valda bilden (ID: ${initialImageIdToLoad}) från bildbanken.`);
            setSelectedBankedImageInfo(null);
            setImagePreviewUrl(null);
            setUploadedFileDetails(null);
            setPostText('');
            setAiPlaceholder("Vad vill du berätta eller fråga om?");
          }
          setIsPosting(false);
        } else {
            // Reset if initialImageIdToLoad is cleared
            clearImageSelection(true); // Pass true to also clear text and placeholder
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
        setAiPlaceholder("Vad vill du berätta eller fråga om?");
        return;
      }
      setError(null);
      setImageFile(file);
      setSelectedBankedImageInfo(null); 
      setAiPlaceholder("AI genererar en fråga snart...");
      
      try {
        setIsPosting(true); 
        const details = await extractImageDetailsFromFile(file);
        setUploadedFileDetails(details);
        setImagePreviewUrl(details.dataUrl); 
        
        // Generate question for new upload
        if (details.dataUrl) {
            const base64Data = details.dataUrl.split(',')[1];
            const analysis = await analyzeImageWithGemini(base64Data, file.type);
            if (analysis.description) {
                const question = await generateEngagingQuestionFromAnalysis(analysis.description);
                setAiPlaceholder(question);
            } else {
                setAiPlaceholder("Vad får den här bilden dig att tänka på?");
            }
        }

      } catch (e) {
        console.error("Error extracting file details or generating question:", e);
        setError("Kunde inte bearbeta bildfilen eller generera AI-fråga.");
        setImageFile(null);
        setImagePreviewUrl(null);
        setUploadedFileDetails(null);
        setAiPlaceholder("Vad vill du berätta eller fråga om?");
      } finally {
        setIsPosting(false);
      }
    }
  };

  const handleBankedImageSelect = async (bankedImage: ImageRecord) => {
    if (bankedImage.sphereId !== activeSphereId) {
        setError(`Den valda bilden tillhör en annan sfär (${bankedImage.sphereId}) och kan inte användas i den aktuella sfären (${activeSphereId}).`);
        setShowImageBankModal(false);
        return;
    }

    setImageFile(null); 
    setUploadedFileDetails(null);
    if (fileInputRef.current) fileInputRef.current.value = ''; 
    
    const fullBankedImage = await getImageById(bankedImage.id); 
    if (fullBankedImage) { 
        setImagePreviewUrl(fullBankedImage.storageUrl || fullBankedImage.dataUrl || null);
        setSelectedBankedImageInfo(fullBankedImage); 
        let prefillText = fullBankedImage.aiGeneratedPlaceholder || '';
        if (!prefillText) {
            const currentUserDescForBankedImage = fullBankedImage.userDescriptions.find(ud => ud.userId === currentUser.id);
            if (currentUserDescForBankedImage && currentUserDescForBankedImage.description) {
                prefillText = currentUserDescForBankedImage.description;
            }
        }
        setPostText(prefillText);
        setAiPlaceholder(fullBankedImage.aiGeneratedPlaceholder || "Vad får den här bilden dig att tänka på?");
        if (!fullBankedImage.storageUrl && !fullBankedImage.dataUrl) {
             console.warn("Selected banked image is missing storageUrl and dataUrl:", bankedImage.name);
             setError("Vald bild från banken saknar bilddata.");
        }
    } else { 
        setImagePreviewUrl(bankedImage.storageUrl || bankedImage.dataUrl || null);
        setSelectedBankedImageInfo(bankedImage);
        if (!bankedImage.storageUrl && !bankedImage.dataUrl) {
            console.warn("Selected banked image is missing storageUrl and dataUrl:", bankedImage.name);
            setError("Vald bild från banken saknar bilddata.");
        }
        setPostText(bankedImage.aiGeneratedPlaceholder || '');
        setAiPlaceholder(bankedImage.aiGeneratedPlaceholder || "Vad får den här bilden dig att tänka på?");
    }
    setShowImageBankModal(false);
    setError(null);
  };

  const clearImageSelection = (clearAllFields?: boolean) => {
    setImageFile(null);
    setImagePreviewUrl(null);
    setSelectedBankedImageInfo(null);
    setUploadedFileDetails(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (clearAllFields) {
        setPostText('');
        setAiPlaceholder("Vad vill du berätta eller fråga om?");
        resetAudio();
    } else {
        // Keep text and audio if only image is cleared
        setAiPlaceholder("Vad vill du berätta eller fråga om?");
    }
  };

  const handleSubmit = async () => {
    if (!postText.trim() && !imageFile && !selectedBankedImageInfo && !audioRecorder.audioUrl) {
      setError('Inlägget kan inte vara tomt. Lägg till text, en bild eller en ljudinspelning.');
      return;
    }
    setIsPosting(true);
    setError(null);
    audioRecorder.stopRecording();

    let imageDetailsToSave: Partial<ImageRecord> = {};
    let finalDataUrl: string | undefined = undefined;
    let finalStorageUrl: string | undefined = undefined;
    let finalFilePath: string | undefined = undefined;
    let finalAiPlaceholder = aiPlaceholder; // Use current AI placeholder

    if (imageFile && uploadedFileDetails) { // New image uploaded
        finalDataUrl = uploadedFileDetails.dataUrl;
        finalFilePath = uploadedFileDetails.filePath;
        imageDetailsToSave = {
            name: imageFile.name,
            type: imageFile.type,
            width: uploadedFileDetails.width,
            height: uploadedFileDetails.height,
            dateTaken: uploadedFileDetails.dateTaken,
            exifData: uploadedFileDetails.exifData,
        };
        // Gemini analysis for new uploads
        if (finalDataUrl && imageDetailsToSave.type) {
            try {
                const base64Data = finalDataUrl.split(',')[1];
                const geminiResult = await analyzeImageWithGemini(base64Data, imageDetailsToSave.type);
                imageDetailsToSave.geminiAnalysis = geminiResult.description;
                imageDetailsToSave.suggestedGeotags = geminiResult.geotags;
                imageDetailsToSave.isProcessed = true;
                if (geminiResult.description && !postText.trim()) { // Only override placeholder if postText is empty
                    finalAiPlaceholder = await generateEngagingQuestionFromAnalysis(geminiResult.description);
                }
            } catch (geminiError) {
                console.error("Error during Gemini analysis for new post:", geminiError);
            }
        }
    } else if (selectedBankedImageInfo) { // Using an image from the bank
        imageDetailsToSave = { // Copy relevant details for the new post
            name: selectedBankedImageInfo.name,
            type: selectedBankedImageInfo.type,
            width: selectedBankedImageInfo.width,
            height: selectedBankedImageInfo.height,
            dateTaken: selectedBankedImageInfo.dateTaken || new Date().toISOString().split('T')[0],
            exifData: selectedBankedImageInfo.exifData,
            geminiAnalysis: selectedBankedImageInfo.geminiAnalysis,
            suggestedGeotags: selectedBankedImageInfo.suggestedGeotags,
            isProcessed: selectedBankedImageInfo.isProcessed,
        };
        finalStorageUrl = selectedBankedImageInfo.storageUrl;
        finalFilePath = selectedBankedImageInfo.filePath;
        finalDataUrl = undefined; // No dataUrl for banked image, use storageUrl
        finalAiPlaceholder = selectedBankedImageInfo.aiGeneratedPlaceholder || "Vad får den här bilden dig att tänka på?";
    } else { // Text/Audio only post
       imageDetailsToSave = {
        name: `Inlägg ${new Date().toLocaleDateString('sv-SE')}`,
        type: audioRecorder.audioUrl ? "audio/webm" : "text/plain",
        width: undefined,
        height: undefined,
        dateTaken: new Date().toISOString().split('T')[0],
      };
      finalAiPlaceholder = "Vad handlar den här anteckningen om?";
    }

    const userDescriptionEntry: UserDescriptionEntry = {
      userId: currentUser.id,
      description: postText.trim(),
      audioRecUrl: audioRecorder.audioUrl || undefined,
      createdAt: new Date().toISOString(),
    };

    const newPost: ImageRecord = {
      id: generateId(),
      name: imageDetailsToSave.name || "Inlägg",
      type: imageDetailsToSave.type || "text/plain",
      width: imageDetailsToSave.width,
      height: imageDetailsToSave.height,
      dateTaken: imageDetailsToSave.dateTaken || new Date().toISOString().split('T')[0],
      exifData: imageDetailsToSave.exifData,
      storageUrl: finalStorageUrl,
      dataUrl: finalDataUrl,
      filePath: finalFilePath,
      tags: [],
      geminiAnalysis: imageDetailsToSave.geminiAnalysis,
      suggestedGeotags: imageDetailsToSave.suggestedGeotags || [],
      userDescriptions: [userDescriptionEntry],
      compiledStory: undefined,
      isProcessed: imageDetailsToSave.isProcessed || false,
      uploadedByUserId: currentUser.id,
      processedByHistory: [],
      aiGeneratedPlaceholder: finalAiPlaceholder,
      sphereId: activeSphereId,
      isPublishedToFeed: true,
      createdAt: new Date().toISOString(),
    };

    try {
      const savedPost = await saveImage(newPost);
      onPostCreated(savedPost);
      setPostText('');
      setImageFile(null);
      setImagePreviewUrl(null);
      setSelectedBankedImageInfo(null);
      setUploadedFileDetails(null);
      resetAudio();
      setAiPlaceholder("Vad vill du berätta eller fråga om?");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (saveError: any) {
      console.error("Error saving post:", saveError);
      if (saveError.name === 'QuotaExceededError' || (typeof saveError.message === 'string' && saveError.message.includes('quota'))) {
        setError("Lagringsutrymmet är fullt. Inlägget kunde inte sparas. Försök frigöra utrymme.");
      } else {
        setError("Kunde inte spara inlägget. " + (saveError.message || 'Okänt fel.'));
      }
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="bg-card-bg dark:bg-slate-800 p-4 sm:p-5 rounded-xl shadow-xl border border-border-color dark:border-slate-700">
      <TextArea
        id="createPostText"
        placeholder={aiPlaceholder}
        value={postText}
        onChange={handleTextChange}
        className="mb-3 min-h-[80px] max-h-60"
        rows={3}
        disabled={isPosting || audioRecorder.isRecording}
      />
      
      {imagePreviewUrl && (
        <div className="mb-3 relative group">
          <img src={imagePreviewUrl} alt="Förhandsgranskning" className="rounded-lg max-h-72 w-auto mx-auto shadow-md" />
          <Button 
            variant="danger" 
            size="sm" 
            onClick={() => clearImageSelection()} 
            className="!rounded-full !p-1.5 absolute top-2 right-2 opacity-70 group-hover:opacity-100 transition-opacity"
            title="Ta bort bild"
            disabled={isPosting}
          >
            <TrashIcon className="!mr-0 w-4 h-4" />
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-danger dark:text-red-400 mb-3">{error}</p>}
      {(audioRecorder.error || audioRecorder.permissionGranted === false || audioRecorder.audioUrl) && (
          <div className="mb-2 text-xs space-y-0.5">
              {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && <p className="text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>}
              {audioRecorder.error && <p className="text-danger dark:text-red-400">{audioRecorder.error}</p>}
              {audioRecorder.audioUrl && (
                  <div className="flex items-center gap-2">
                  <span className="text-muted-text dark:text-slate-400">Ljud inspelat för inlägget.</span>
                  <Button type="button" onClick={() => audioRecorder.resetAudio()} variant="ghost" size="sm" className="!py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10">Ta bort ljud</Button>
                  </div>
              )}
          </div>
        )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            className="hidden"
            id="postImageUpload"
            disabled={isPosting}
          />
          <Button 
            variant="ghost" 
            size="md" 
            onClick={() => fileInputRef.current?.click()} 
            disabled={isPosting || !!imagePreviewUrl}
            title={imagePreviewUrl ? "Bild redan vald (ta bort för att ladda upp ny)" : "Ladda upp bild"}
          >
            <UploadIcon /> <span className="hidden sm:inline">{imageFile ? "Byt Bild" : "Ladda Upp"}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="md" 
            onClick={() => setShowImageBankModal(true)} 
            disabled={isPosting || !!imagePreviewUrl} 
            title={imagePreviewUrl ? "Bild redan vald (ta bort för att välja från bank)" : "Välj från bildbank"}
          >
            <ImageBankIcon /> <span className="hidden sm:inline">Välj från Bank</span>
          </Button>
           <Button
            type="button"
            onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
            variant={audioRecorder.isRecording ? "danger" : "ghost"}
            size="md"
            aria-label={audioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
            disabled={isPosting || audioRecorder.permissionGranted === false}
          >
            {audioRecorder.isRecording ? <StopIconCreatePost /> : <MicIconCreatePost />}
             <span className="ml-1.5 hidden sm:inline">{audioRecorder.isRecording ? "Stoppa" : "Spela In"}</span>
          </Button>
        </div>
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSubmit} 
          isLoading={isPosting}
          disabled={!postText.trim() && !imagePreviewUrl && !audioRecorder.audioUrl && !isPosting}
        >
          Publicera Inlägg
        </Button>
      </div>
      
      <ImageBankPickerModal
        isOpen={showImageBankModal}
        onClose={() => setShowImageBankModal(false)}
        onImageSelect={handleBankedImageSelect}
        activeSphereId={activeSphereId}
      />
    </div>
  );
};
