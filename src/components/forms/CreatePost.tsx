import React, { memo } from 'react';
import { Button, TextArea, AudioPlayerButton } from '../ui';
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
        <div className="relative">
          <TextArea
            id="postText"
            label="Vad vill du berätta?"
            value={postText}
            onChange={handleTextChange}
            placeholder="Skapa ett minne..."
            rows={3}
            disabled={isPosting}
            maxLength={1000}
          />
          
          <div className="absolute top-2 right-2">
            {!audioRecorder.isRecording ? (
              <Button
                onClick={audioRecorder.startRecording}
                variant="ghost"
                size="sm"
                className="!rounded-full !px-2 !py-1.5"
                aria-label="Spela in ljud"
                disabled={isPosting || audioRecorder.permissionGranted === false}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </Button>
            ) : (
              <Button
                onClick={audioRecorder.stopRecording}
                variant="danger"
                size="sm"
                className="!rounded-full !px-2 !py-1.5"
                aria-label="Stoppa inspelning"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
                </svg>
              </Button>
            )}
          </div>
        </div>

        {audioRecorder.audioUrl && (
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600 dark:text-slate-400">Ljud inspelat</span>
              <div className="flex items-center gap-2">
                <AudioPlayerButton audioUrl={audioRecorder.audioUrl} />
                <Button
                  onClick={handleResetAudio}
                  variant="ghost"
                  size="sm"
                  className="text-slate-600 dark:text-slate-400"
                >
                  Ta bort ljud
                </Button>
              </div>
            </div>
          </div>
        )}

        <ImageUploadSection
          imageFile={imageFile}
          imagePreviewUrl={imagePreviewUrl}
          selectedBankedImageInfo={selectedBankedImageInfo}
          showImageBankModal={showImageBankModal}
          isProcessingFile={isProcessingFile}
          activeSphereId={activeSphereId}
          onFileChange={handleFileChange}
          onBankedImageSelect={handleBankedImageSelect}
          onClearImageSelection={clearImageSelection}
          onShowImageBankModal={setShowImageBankModal}
          onTriggerFileInput={triggerFileInput}
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
