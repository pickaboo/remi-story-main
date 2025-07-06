import React, { useRef } from 'react';
import { Button, AudioPlayerButton } from '../ui';
import { ImageRecord } from '../../types';
import { ImageBankPickerModal } from '../modals';

interface ImageUploadSectionProps {
  imageFile: File | null;
  imagePreviewUrl: string | null;
  selectedBankedImageInfo: ImageRecord | null;
  showImageBankModal: boolean;
  isProcessingFile: boolean;
  activeSphereId: string;
  isRecording: boolean;
  audioUrl: string | null;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBankedImageSelect: (bankedImage: ImageRecord) => void;
  onClearImageSelection: () => void;
  onShowImageBankModal: (show: boolean) => void;
  onTriggerFileInput: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResetAudio: () => void;
}

// SVG Icons
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

const MicIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imageFile,
  imagePreviewUrl,
  selectedBankedImageInfo,
  showImageBankModal,
  isProcessingFile,
  activeSphereId,
  isRecording,
  audioUrl,
  onFileChange,
  onBankedImageSelect,
  onClearImageSelection,
  onShowImageBankModal,
  onTriggerFileInput,
  onStartRecording,
  onStopRecording,
  onResetAudio,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onTriggerFileInput}
          variant="secondary"
          size="md"
          disabled={isProcessingFile}
          className="flex-1"
        >
          <UploadIcon />
          Ladda upp bild
        </Button>
        
        <Button
          onClick={() => onShowImageBankModal(true)}
          variant="secondary"
          size="md"
          disabled={isProcessingFile}
          className="flex-1"
        >
          <ImageBankIcon />
          Välj från bildbank
        </Button>

        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            variant="secondary"
            size="md"
            disabled={isProcessingFile}
            className="flex-1"
          >
            <MicIcon />
            Spela in ljud
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="danger"
            size="md"
            className="flex-1"
          >
            <StopIcon />
            Stoppa inspelning
          </Button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={onFileChange}
        className="hidden"
        id="create-post-image-input"
      />

      {(imagePreviewUrl || selectedBankedImageInfo) && (
        <div className="relative">
          <div className="aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden border border-border-color dark:border-slate-600">
            <img
              src={imagePreviewUrl || selectedBankedImageInfo?.dataUrl || ''}
              alt="Förhandsgranskning"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="absolute top-2 right-2">
            <Button
              onClick={onClearImageSelection}
              variant="danger"
              size="sm"
              className="!p-2 !rounded-full"
              title="Ta bort bild"
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
          
          {(imageFile || selectedBankedImageInfo) && (
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {imageFile ? (
                <p>Vald fil: {imageFile.name}</p>
              ) : selectedBankedImageInfo ? (
                <p>Vald från bildbank: {selectedBankedImageInfo.name}</p>
              ) : null}
            </div>
          )}
        </div>
      )}

      {audioUrl && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-600 dark:text-slate-400">Ljud inspelat</span>
            <div className="flex items-center gap-2">
              <AudioPlayerButton audioUrl={audioUrl} />
              <Button
                onClick={onResetAudio}
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

      {showImageBankModal && (
        <ImageBankPickerModal
          isOpen={showImageBankModal}
          onClose={() => onShowImageBankModal(false)}
          onImageSelect={onBankedImageSelect}
          activeSphereId={activeSphereId}
        />
      )}
    </div>
  );
}; 