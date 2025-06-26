import React, { useRef } from 'react';
import { Button } from '../../../../components/common/Button';
import { AudioPlayerButton } from '../../../../components/common/AudioPlayerButton';
import { UploadIcon, ImageBankIcon, MicIcon, StopIcon } from './CreatePostIcons';

interface CreatePostActionsProps {
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageBankSelect: () => void;
  onPostSubmit: (event: React.FormEvent) => void;
  onResetAudio: () => void;
  audioRecorder: any;
  isPosting: boolean;
  hasImage: boolean;
  hasText: boolean;
  hasAudio: boolean;
}

export const CreatePostActions: React.FC<CreatePostActionsProps> = ({
  onFileSelect,
  onImageBankSelect,
  onPostSubmit,
  onResetAudio,
  audioRecorder,
  isPosting,
  hasImage,
  hasText,
  hasAudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const canSubmit = hasImage || hasText || hasAudio;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileSelect}
        className="hidden"
      />
      
      <Button
        variant="secondary"
        onClick={triggerFileInput}
        disabled={isPosting}
      >
        <UploadIcon />
        Ladda upp bild
      </Button>

      <Button
        variant="secondary"
        onClick={onImageBankSelect}
        disabled={isPosting}
      >
        <ImageBankIcon />
        Välj från bildbank
      </Button>

      <div className="flex items-center gap-2">
        {!audioRecorder.isRecording ? (
          <Button
            variant="secondary"
            onClick={audioRecorder.startRecording}
            disabled={isPosting}
          >
            <MicIcon />
            Spela in ljud
          </Button>
        ) : (
          <>
            <Button
              variant="danger"
              onClick={audioRecorder.stopRecording}
              disabled={isPosting}
            >
              <StopIcon />
              Stoppa inspelning
            </Button>
            <span className="text-sm text-red-600 dark:text-red-400">
              Inspelar...
            </span>
          </>
        )}
      </div>

      {audioRecorder.audioUrl && (
        <div className="flex items-center gap-2">
          <AudioPlayerButton audioUrl={audioRecorder.audioUrl} />
          <Button
            variant="secondary"
            size="sm"
            onClick={onResetAudio}
            disabled={isPosting}
          >
            Ta bort ljud
          </Button>
        </div>
      )}

      <div className="ml-auto">
        <Button
          type="submit"
          onClick={onPostSubmit}
          isLoading={isPosting}
          disabled={!canSubmit || isPosting}
        >
          {isPosting ? 'Skapar inlägg...' : 'Skapa inlägg'}
        </Button>
      </div>
    </div>
  );
}; 