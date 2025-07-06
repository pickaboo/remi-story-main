import React, { memo } from 'react';
import { Button, TextArea } from '../ui';
import { User } from '../../types';
import { useCreatePost } from '../../hooks/useCreatePost';
import { ImageUploadSection } from '../createPost';

interface CreatePostProps {
  currentUser: User;
  activeSphereId: string; 
  onPostCreated: (newPost: any) => void;
  initialImageIdToLoad?: string | null; 
}

export const CreatePost: React.FC<CreatePostProps> = memo(({ 
  currentUser, 
  activeSphereId, 
  onPostCreated, 
  initialImageIdToLoad 
}) => {
  const {
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
  } = useCreatePost({
    currentUser,
    activeSphereId,
    onPostCreated,
    initialImageIdToLoad,
  });

  return (
    <div className="bg-card-bg dark:bg-dark-bg rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <TextArea
            id="postText"
            label="Vad vill du berätta?"
            value={postText}
            onChange={handleTextChange}
            placeholder="Skriv din text här..."
            rows={4}
            disabled={isPosting}
            maxLength={1000}
          />
        </div>

        <ImageUploadSection
          imageFile={imageFile}
          imagePreviewUrl={imagePreviewUrl}
          selectedBankedImageInfo={selectedBankedImageInfo}
          showImageBankModal={showImageBankModal}
          isProcessingFile={isProcessingFile}
          activeSphereId={activeSphereId}
          isRecording={audioRecorder.isRecording}
          audioUrl={audioRecorder.audioUrl}
          onFileChange={handleFileChange}
          onBankedImageSelect={handleBankedImageSelect}
          onClearImageSelection={clearImageSelection}
          onShowImageBankModal={setShowImageBankModal}
          onTriggerFileInput={triggerFileInput}
          onStartRecording={audioRecorder.startRecording}
          onStopRecording={audioRecorder.stopRecording}
          onResetAudio={handleResetAudio}
        />

        {error && (
          <div className="text-sm text-danger dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isPosting}
            disabled={!postText.trim() && !imageFile && !selectedBankedImageInfo && !audioRecorder.audioUrl}
          >
            Skapa inlägg
          </Button>
        </div>
      </form>
    </div>
  );
});
