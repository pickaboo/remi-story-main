import { useState, useRef, useEffect, useCallback } from 'react';
import { ImageRecord, User } from '../types';
import { saveImage, getImageById, generateId } from '../services/storageService';
import { analyzeImageWithGemini, generateEngagingQuestionFromAnalysis } from '../services/geminiService';
import { useAudioRecorder } from './useAudioRecorder';
import { extractImageDetailsFromFile, getBase64FromUrl, ExtractedFileDetails } from '../utils/imageUtils';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../firebase';

interface UseCreatePostProps {
  currentUser: User;
  activeSphereId: string;
  onPostCreated: (newPost: ImageRecord) => void;
  initialImageIdToLoad?: string | null;
}

export const useCreatePost = ({
  currentUser,
  activeSphereId,
  onPostCreated,
  initialImageIdToLoad,
}: UseCreatePostProps) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedBankedImageInfo, setSelectedBankedImageInfo] = useState<ImageRecord | null>(null);
  const [showImageBankModal, setShowImageBankModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileDetails, setUploadedFileDetails] = useState<ExtractedFileDetails | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRecorder = useAudioRecorder();
  const { resetAudio } = audioRecorder;

  // Load initial image if provided
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
            let dataUrlForPreview = imageFromDb.dataUrl || '';

            if ((!dataUrlForPreview || !dataUrlForPreview.startsWith('data:')) && imageFromDb.filePath) {
              try {
                dataUrlForPreview = await getDownloadURL(ref(storage, imageFromDb.filePath));
              } catch (urlError) {
                console.error(`Failed to get download URL for ${imageFromDb.filePath}:`, urlError);
                setError(`Kunde inte ladda förhandsgranskning för vald bild (ID: ${initialImageIdToLoad}). Fel vid hämtning av URL.`);
                dataUrlForPreview = imageFromDb.dataUrl || '';
              }
            }

            const finalImageToLoad: ImageRecord = {
              ...imageFromDb,
              dataUrl: dataUrlForPreview || '',
              size: imageFromDb.size,
            };

            setSelectedBankedImageInfo(finalImageToLoad);
            setImagePreviewUrl(finalImageToLoad.dataUrl || null);

            let prefillText = finalImageToLoad.aiGeneratedPlaceholder || '';
            if (!prefillText) {
              try {
                const { base64Data, mimeType } = await getBase64FromUrl(dataUrlForPreview, imageFromDb.type);
                const analysis = await analyzeImageWithGemini(base64Data, mimeType);
                prefillText = analysis.description || '';
              } catch (analysisError) {
                console.warn('Could not analyze image for placeholder text:', analysisError);
                prefillText = '';
              }
            }
            setPostText(prefillText);
          } else {
            setError(`Bilden (ID: ${initialImageIdToLoad}) hittades inte eller tillhör inte den aktiva sfären.`);
          }
        } catch (loadError) {
          console.error('Error loading image:', loadError);
          setError(`Kunde inte ladda bild (ID: ${initialImageIdToLoad}).`);
        }
      }
    };

    loadImage();
  }, [initialImageIdToLoad, activeSphereId, resetAudio]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  }, []);

  const handleFileChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessingFile(true);
    setImageFile(null);
    setUploadedFileDetails(null);
    setSelectedBankedImageInfo(null);
    setImagePreviewUrl(null);
    setPostText('');

    try {
      const fileDetails = await extractImageDetailsFromFile(file);
      setUploadedFileDetails(fileDetails);
      setImageFile(file);
      setImagePreviewUrl(fileDetails.dataUrl);

      // Analyze image for placeholder text
      try {
        const { base64Data, mimeType } = await getBase64FromUrl(fileDetails.dataUrl, file.type);
        const analysis = await analyzeImageWithGemini(base64Data, mimeType);
        setPostText(analysis.description || '');
      } catch (analysisError) {
        console.warn('Could not analyze image for placeholder text:', analysisError);
      }
    } catch (error: any) {
      setError(error.message || 'Kunde inte bearbeta filen.');
    } finally {
      setIsProcessingFile(false);
    }
  }, []);

  const handleBankedImageSelect = useCallback(async (bankedImage: ImageRecord) => {
    setError(null);
    setImageFile(null);
    setUploadedFileDetails(null);
    setSelectedBankedImageInfo(null);
    setImagePreviewUrl(null);
    setPostText('');

    try {
      let dataUrlForPreview = bankedImage.dataUrl || '';

      if ((!dataUrlForPreview || !dataUrlForPreview.startsWith('data:')) && bankedImage.filePath) {
        try {
          dataUrlForPreview = await getDownloadURL(ref(storage, bankedImage.filePath));
        } catch (urlError) {
          console.error(`Failed to get download URL for ${bankedImage.filePath}:`, urlError);
          setError(`Kunde inte ladda förhandsgranskning för vald bild. Fel vid hämtning av URL.`);
          return;
        }
      }

      const finalImageToLoad: ImageRecord = {
        ...bankedImage,
        dataUrl: dataUrlForPreview || '',
      };

      setSelectedBankedImageInfo(finalImageToLoad);
      setImagePreviewUrl(finalImageToLoad.dataUrl || null);

      let prefillText = finalImageToLoad.aiGeneratedPlaceholder || '';
      if (!prefillText) {
        try {
          const { base64Data, mimeType } = await getBase64FromUrl(dataUrlForPreview, bankedImage.type);
          const analysis = await analyzeImageWithGemini(base64Data, mimeType);
          prefillText = analysis.description || '';
        } catch (analysisError) {
          console.warn('Could not analyze image for placeholder text:', analysisError);
          prefillText = '';
        }
      }
      setPostText(prefillText);
      setShowImageBankModal(false);
    } catch (error: any) {
      setError(error.message || 'Kunde inte ladda vald bild.');
    }
  }, []);

  const clearImageSelection = useCallback(() => {
    setImageFile(null);
    setUploadedFileDetails(null);
    setSelectedBankedImageInfo(null);
    setImagePreviewUrl(null);
    setPostText('');
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleSubmit = useCallback(async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!postText.trim() && !imageFile && !selectedBankedImageInfo && !audioRecorder.audioUrl) {
      setError('Du måste lägga till text, bild eller ljud för att skapa ett inlägg.');
      return;
    }

    setIsPosting(true);

    try {
      let finalImageRecord: ImageRecord | null = null;

      if (imageFile && uploadedFileDetails) {
        // Create new ImageRecord for uploaded image
        const newImageId = generateId();
        finalImageRecord = {
          id: newImageId,
          name: imageFile.name,
          type: imageFile.type,
          size: uploadedFileDetails.size,
          dataUrl: uploadedFileDetails.dataUrl,
          dateTaken: uploadedFileDetails.dateTaken,
          exifData: uploadedFileDetails.exifData,
          filePath: uploadedFileDetails.filePath,
          tags: [],
          geminiAnalysis: undefined,
          suggestedGeotags: [],
          userDescriptions: [{
            userId: currentUser.id,
            description: postText.trim(),
            audioRecUrl: audioRecorder.audioUrl || undefined,
            createdAt: new Date().toISOString(),
          }],
          compiledStory: undefined,
          isProcessed: false,
          width: uploadedFileDetails.width,
          height: uploadedFileDetails.height,
          uploadedByUserId: currentUser.id,
          processedByHistory: [],
          aiGeneratedPlaceholder: postText.trim() || undefined,
          sphereId: activeSphereId,
          isPublishedToFeed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else if (selectedBankedImageInfo) {
        // Update existing banked image
        const existingDescriptions = selectedBankedImageInfo.userDescriptions || [];
        const currentUserExistingDescIndex = existingDescriptions.findIndex(ud => ud.userId === currentUser.id);
        
        let finalUserDescriptions = existingDescriptions;
        const currentUserDescEntry = {
          userId: currentUser.id,
          description: postText.trim(),
          audioRecUrl: audioRecorder.audioUrl || undefined,
          createdAt: new Date().toISOString(),
        };

        if (currentUserExistingDescIndex > -1) {
          finalUserDescriptions = existingDescriptions.map((desc, index) => 
            index === currentUserExistingDescIndex 
              ? { ...desc, description: currentUserDescEntry.description, audioRecUrl: currentUserDescEntry.audioRecUrl, createdAt: new Date().toISOString() } 
              : desc
          );
        } else if (currentUserDescEntry.description || currentUserDescEntry.audioRecUrl) {
          finalUserDescriptions = [...existingDescriptions, currentUserDescEntry];
        }

        finalImageRecord = {
          ...selectedBankedImageInfo,
          userDescriptions: finalUserDescriptions,
          aiGeneratedPlaceholder: postText.trim() || selectedBankedImageInfo.aiGeneratedPlaceholder,
          updatedAt: new Date().toISOString(),
        };
      }

      if (finalImageRecord) {
        const savedRecord = await saveImage(finalImageRecord);
        onPostCreated(savedRecord);
        
        // Reset form
        setPostText('');
        setImageFile(null);
        setUploadedFileDetails(null);
        setSelectedBankedImageInfo(null);
        setImagePreviewUrl(null);
        setError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        resetAudio();
      }
    } catch (error: any) {
      setError(error.message || 'Kunde inte skapa inlägget.');
    } finally {
      setIsPosting(false);
    }
  }, [
    postText,
    imageFile,
    uploadedFileDetails,
    selectedBankedImageInfo,
    audioRecorder.audioUrl,
    activeSphereId,
    currentUser,
    onPostCreated,
    resetAudio,
  ]);

  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleResetAudio = useCallback(() => {
    resetAudio();
  }, [resetAudio]);

  return {
    // State
    postText,
    imageFile,
    imagePreviewUrl,
    selectedBankedImageInfo,
    showImageBankModal,
    isPosting,
    error,
    uploadedFileDetails,
    isProcessingFile,
    audioRecorder,
    fileInputRef,

    // Handlers
    handleTextChange,
    handleFileChange,
    handleBankedImageSelect,
    clearImageSelection,
    handleSubmit,
    triggerFileInput,
    handleResetAudio,
    setShowImageBankModal,
  };
}; 