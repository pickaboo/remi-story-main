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
    <div ref={ref} className="bg-slate-800/90 dark:bg-slate-900/90 rounded-2xl shadow-2xl border border-slate-700/60 max-w-2xl mx-auto mt-8 mb-12 p-6">
      <div className="flex items-center gap-3 mb-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-bold text-lg select-none">
          {currentUser?.name ? currentUser.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'NY'}
        </div>
        {/* Input with mic icon */}
        <div className="relative flex-1">
          <textarea
            id="create-post-textarea"
            className="w-full rounded-lg bg-slate-700/80 text-slate-100 placeholder-slate-400 border border-slate-600 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 p-3 pr-12 resize-none shadow-inner"
            rows={2}
            placeholder={`Vad tänker du på, ${currentUser?.name?.split(' ')[0] || ''}?`}
            value={postText}
            onChange={handleTextChange}
          />
          {/* Mic icon inside input */}
          <button
            type="button"
            onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
            className={`absolute top-1/2 right-3 -translate-y-1/2 p-2 rounded-full border ${audioRecorder.isRecording ? 'bg-red-600 border-red-700 text-white' : 'bg-slate-800 border-slate-600 text-slate-400 hover:bg-slate-700'} transition focus:outline-none focus:ring-2 focus:ring-blue-400/30`}
            aria-label={audioRecorder.isRecording ? 'Stoppa inspelning' : 'Spela in ljud'}
          >
            {audioRecorder.isRecording ? <MdStop size={22} /> : <MdMic size={22} />}
          </button>
        </div>
      </div>
      {/* Button row */}
      <div className="flex flex-row gap-4 mt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={triggerFileInput}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500/10 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition"
        >
          <MdImage size={22} />
          <span className="ml-1">Ladda upp bild</span>
        </button>
        <button
          type="button"
          onClick={() => setShowImageBankModal(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500/10 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition"
        >
          <MdCollections size={22} />
          <span className="ml-1">Bildbank</span>
        </button>
        {(imagePreviewUrl || selectedBankedImageInfo) && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-1">AI-förslag på taggar:</label>
            <PostTags
              tags={aiTags}
              currentUserId={currentUser.id}
              uploadedByUserId={currentUser.id}
              onRemoveTag={handleRemoveTag}
            />
            <input
              type="text"
              className="mt-2 p-2 rounded border border-slate-600 bg-slate-800 text-slate-100"
              placeholder="Lägg till tagg och tryck Enter"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const value = (e.target as HTMLInputElement).value.trim();
                  if (value) {
                    handleAddTag(value);
                    (e.target as HTMLInputElement).value = '';
                  }
                }
              }}
            />
          </div>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!postText.trim() && !imageFile && !selectedBankedImageInfo}
          className="flex items-center gap-2 px-6 py-2 rounded-full border border-blue-500 text-blue-500 bg-transparent hover:bg-blue-500/10 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          Publicera
        </button>
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
});
