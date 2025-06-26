import React, { useState, useRef, useEffect } from 'react';
import { TextArea } from '../../../../components/common/TextArea';
import { ImageRecord, User } from '../../../../types';
import { saveImage } from '../../../../services/storageService';
import { useAudioRecorder } from '../../../../hooks/useAudioRecorder';
import { ImageBankPickerModal } from '../../imageBank/components/ImageBankPickerModal';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { ImagePreviewSection } from './ImagePreviewSection';
import { CreatePostActions } from './CreatePostActions';

interface CreatePostProps {
  currentUser: User;
  activeSphereId: string; 
  onPostCreated: (newPost: ImageRecord) => void;
  initialImageIdToLoad?: string | null; 
}

export const CreatePost: React.FC<CreatePostProps> = ({ currentUser, activeSphereId, onPostCreated, initialImageIdToLoad }) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedBankedImageInfo, setSelectedBankedImageInfo] = useState<ImageRecord | null>(null);
  const [showImageBankModal, setShowImageBankModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRecorder = useAudioRecorder();
  const { resetAudio } = audioRecorder;
  
  const {
    uploadedFileDetails,
    isProcessingFile,
    loadImageFromId,
    processAndAnalyzeImage,
    setUploadedFileDetails,
  } = useImageProcessing();

  useEffect(() => {
    const loadImage = async () => {
      if (initialImageIdToLoad) {
        setImageFile(null);
        setUploadedFileDetails(null);
        setSelectedBankedImageInfo(null);
        setImagePreviewUrl(null);
        setPostText('');
        setError(null);
        resetAudio();

        try {
          const { image, prefillText } = await loadImageFromId(initialImageIdToLoad, activeSphereId, currentUser);
          setSelectedBankedImageInfo(image);
          setImagePreviewUrl(image.dataUrl || null);
          setPostText(prefillText);
        } catch (error) {
          setError(error instanceof Error ? error.message : 'Failed to load image');
        }
      }
    };

    loadImage();
  }, [initialImageIdToLoad, activeSphereId, currentUser, loadImageFromId, setUploadedFileDetails, resetAudio]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPostText(e.target.value);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    setSelectedBankedImageInfo(null);
    setError(null);

    try {
      const { imageRecord } = await processAndAnalyzeImage(file, currentUser, activeSphereId);
      
      setImagePreviewUrl(imageRecord.dataUrl || null);
      setPostText(imageRecord.aiGeneratedPlaceholder || '');
      
      // Save the image to storage
      await saveImage(imageRecord);
      
      // Update the image record with the saved data
      setSelectedBankedImageInfo(imageRecord);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image');
      setImageFile(null);
      setImagePreviewUrl(null);
    }
  };

  const handleBankedImageSelect = async (bankedImage: ImageRecord) => {
    setSelectedBankedImageInfo(bankedImage);
    setImagePreviewUrl(bankedImage.dataUrl || null);
    setImageFile(null);
    setUploadedFileDetails(null);
    setError(null);

    let prefillText = bankedImage.aiGeneratedPlaceholder || '';
    if (!prefillText) {
      const currentUserDescForBankedImage = bankedImage.userDescriptions.find(ud => ud.userId === currentUser.id);
      if (currentUserDescForBankedImage) {
        prefillText = currentUserDescForBankedImage.description;
      }
    }
    setPostText(prefillText);
    setShowImageBankModal(false);
  };

  const clearImageSelection = () => {
    setImageFile(null);
    setSelectedBankedImageInfo(null);
    setImagePreviewUrl(null);
    setUploadedFileDetails(null);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!selectedBankedImageInfo && !imageFile) {
      setError('Du måste välja en bild för att skapa ett inlägg.');
      return;
    }

    setIsPosting(true);
    setError(null);

    try {
      let finalImageRecord: ImageRecord;

      if (selectedBankedImageInfo) {
        // Use existing banked image
        finalImageRecord = {
          ...selectedBankedImageInfo,
          userDescriptions: [
            ...selectedBankedImageInfo.userDescriptions,
            {
              userId: currentUser.id,
              description: postText,
              audioRecUrl: audioRecorder.audioUrl || null,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      } else if (imageFile && uploadedFileDetails) {
        // Create new image record from uploaded file
        const { imageRecord } = await processAndAnalyzeImage(imageFile, currentUser, activeSphereId);
        
        finalImageRecord = {
          ...imageRecord,
          userDescriptions: [
            {
              userId: currentUser.id,
              description: postText,
              audioRecUrl: audioRecorder.audioUrl || null,
              createdAt: new Date().toISOString(),
            },
          ],
        };
      } else {
        throw new Error('No image selected or processed');
      }

      // Save the updated image record
      await saveImage(finalImageRecord);
      
      // Call the callback
      onPostCreated(finalImageRecord);
      
      // Reset form
      setPostText('');
      setImageFile(null);
      setSelectedBankedImageInfo(null);
      setImagePreviewUrl(null);
      setUploadedFileDetails(null);
      resetAudio();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create post');
    } finally {
      setIsPosting(false);
    }
  };

  const handleResetAudio = () => {
    resetAudio();
  };

  const hasImage = !!imagePreviewUrl || !!selectedBankedImageInfo;
  const hasText = postText.trim().length > 0;
  const hasAudio = !!audioRecorder.audioUrl;

  return (
    <div className="bg-card-bg dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
        Skapa nytt inlägg
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="postText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Beskrivning
          </label>
          <TextArea
            id="postText"
            value={postText}
            onChange={handleTextChange}
            placeholder="Beskriv vad du ser i bilden eller berätta en historia..."
            rows={4}
            className="w-full"
          />
        </div>

        <ImagePreviewSection
          imagePreviewUrl={imagePreviewUrl}
          selectedBankedImageInfo={selectedBankedImageInfo}
          uploadedFileDetails={uploadedFileDetails}
          onClearImageSelection={clearImageSelection}
          isProcessingFile={isProcessingFile}
        />

        {error && (
          <div className="text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            {error}
          </div>
        )}

        <CreatePostActions
          onFileSelect={handleFileChange}
          onImageBankSelect={() => setShowImageBankModal(true)}
          onPostSubmit={handleSubmit}
          onResetAudio={handleResetAudio}
          audioRecorder={audioRecorder}
          isPosting={isPosting}
          hasImage={hasImage}
          hasText={hasText}
          hasAudio={hasAudio}
        />
      </form>

      {showImageBankModal && (
        <ImageBankPickerModal
          isOpen={showImageBankModal}
          onImageSelect={handleBankedImageSelect}
          onClose={() => setShowImageBankModal(false)}
          activeSphereId={activeSphereId}
        />
      )}
    </div>
  );
};
