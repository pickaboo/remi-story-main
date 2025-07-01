import React, { useState, useRef, useEffect, forwardRef } from 'react';
import { TextArea } from '../../../common/components/TextArea';
import { ImageRecord, User } from '../../../types';
import { saveImage } from '../../../common/services/imageService';
import { useAudioRecorder } from '../../../common/hooks/useAudioRecorder';
import { ImageBankPickerModal } from '../../imageBank/components/ImageBankPickerModal';
import { useImageProcessing } from '../hooks/useImageProcessing';
import { ImagePreviewSection } from './ImagePreviewSection';
import { CreatePostActions } from './CreatePostActions';
import { MdImage, MdCollections, MdMic, MdStop } from 'react-icons/md';
import { PostTags } from './PostTags';

interface CreatePostProps {
  currentUser: User;
  activeSphereId: string; 
  onPostCreated: (newPost: ImageRecord) => void;
  initialImageIdToLoad?: string | null; 
}

export const CreatePost = forwardRef<HTMLDivElement, CreatePostProps>(({ currentUser, activeSphereId, onPostCreated, initialImageIdToLoad }, ref) => {
  const [postText, setPostText] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [selectedBankedImageInfo, setSelectedBankedImageInfo] = useState<ImageRecord | null>(null);
  const [showImageBankModal, setShowImageBankModal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  
  const audioRecorder = useAudioRecorder();
  const { resetAudio } = audioRecorder;
  
  const {
    uploadedFileDetails,
    isProcessingFile,
    loadImageFromId,
    processAndAnalyzeImage,
    setUploadedFileDetails,
  } = useImageProcessing();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const triggerFileInput = () => fileInputRef.current?.click();

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
      setAiTags(imageRecord.tags || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to process image');
      setImageFile(null);
      setImagePreviewUrl(null);
      setAiTags([]);
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

  const handleAddTag = (tag: string) => {
    if (tag && !aiTags.includes(tag)) setAiTags([...aiTags, tag]);
  };

  const handleRemoveTag = (tag: string) => {
    setAiTags(aiTags.filter(t => t !== tag));
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
        finalImageRecord = {
          ...selectedBankedImageInfo,
          sphereId: activeSphereId,
          isPublishedToFeed: true,
          tags: aiTags,
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
        const { imageRecord } = await processAndAnalyzeImage(imageFile, currentUser, activeSphereId);
        finalImageRecord = {
          ...imageRecord,
          sphereId: activeSphereId,
          isPublishedToFeed: true,
          tags: aiTags,
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
      setAiTags([]);
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
    <form onSubmit={handleSubmit} className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-border-color dark:border-slate-700 max-w-xl mx-auto font-sans mt-8">
      {/* Avatar and Input Row */}
      <div className="flex items-start gap-4 mb-4">
        <div className="w-10 h-10 rounded-full bg-slate-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
          {currentUser.initials}
        </div>
        <TextArea
          value={postText}
          onChange={handleTextChange}
          placeholder={`Vad tänker du på, ${currentUser.name.split(' ')[0]}?`}
          className="rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-border-color dark:border-slate-700 px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 transition w-full"
          rows={2}
        />
      </div>
      {/* Image Preview Section */}
      {(imagePreviewUrl || isProcessingFile) && (
        <div className="mb-4">
          <ImagePreviewSection
            imagePreviewUrl={imagePreviewUrl}
            selectedBankedImageInfo={selectedBankedImageInfo}
            uploadedFileDetails={uploadedFileDetails}
            onClearImageSelection={clearImageSelection}
            isProcessingFile={isProcessingFile}
          />
        </div>
      )}
      {/* Tag Pills */}
      {aiTags.length > 0 && (
        <div className="mb-4">
          <PostTags
            tags={aiTags}
            currentUserId={currentUser.id}
            uploadedByUserId={currentUser.id}
            onRemoveTag={handleRemoveTag}
          />
        </div>
      )}
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mt-2">
        <button
          type="button"
          onClick={triggerFileInput}
          className="rounded-lg bg-primary text-white hover:bg-primary-hover transition font-semibold flex items-center gap-2 px-4 py-2"
        >
          <MdImage className="w-5 h-5" /> Ladda upp bild
        </button>
        <button
          type="button"
          onClick={() => setShowImageBankModal(true)}
          className="rounded-lg bg-primary text-white hover:bg-primary-hover transition font-semibold flex items-center gap-2 px-4 py-2"
        >
          <MdCollections className="w-5 h-5" /> Bildbank
        </button>
        <button
          type="submit"
          disabled={isPosting}
          className="rounded-lg bg-primary text-white hover:bg-primary-hover transition font-semibold flex items-center gap-2 px-4 py-2"
        >
          {isPosting ? 'Publicerar...' : 'Publicera'}
        </button>
      </div>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {/* Image Bank Modal */}
      {showImageBankModal && (
        <ImageBankPickerModal
          isOpen={showImageBankModal}
          onClose={() => setShowImageBankModal(false)}
          onImageSelect={handleBankedImageSelect}
          activeSphereId={activeSphereId}
        />
      )}
      {/* Error Message */}
      {error && <div className="text-danger dark:text-red-400 mt-2">{error}</div>}
    </form>
  );
});
