import React, { useRef } from 'react';
import { Button } from '../../ui';
import { ImageRecord } from '../../../types';
import { ImageBankPickerModal } from '../../modals';

interface ImageUploadSectionProps {
  imageFile: File | null;
  imagePreviewUrl: string | null;
  selectedBankedImageInfo: ImageRecord | null;
  showImageBankModal: boolean;
  isProcessingFile: boolean;
  activeSphereId: string;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onBankedImageSelect: (bankedImage: ImageRecord) => void;
  onClearImageSelection: () => void;
  onShowImageBankModal: (show: boolean) => void;
}

// SVG Icons
const UploadIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0Z" />
  </svg>
);

const ImageBankIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z" /></svg>
);

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  imageFile,
  imagePreviewUrl,
  selectedBankedImageInfo,
  showImageBankModal,
  isProcessingFile,
  activeSphereId,
  onFileChange,
  onBankedImageSelect,
  onClearImageSelection,
  onShowImageBankModal,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleFileButtonClick}
          variant="secondary"
          size="md"
          disabled={isProcessingFile}
          className="flex-1 transition-transform hover:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 active:bg-slate-300 dark:active:bg-slate-800"
        >
          <span className="flex flex-col items-center justify-center gap-1 w-full">
            <UploadIcon className="w-6 h-6 mb-0.5" />
            Ladda upp bild
          </span>
        </Button>
        
        <Button
          onClick={() => onShowImageBankModal(true)}
          variant="secondary"
          size="md"
          disabled={isProcessingFile}
          className="flex-1 transition-transform hover:shadow-lg hover:bg-slate-200 dark:hover:bg-slate-700 hover:scale-105 active:scale-95 active:bg-slate-300 dark:active:bg-slate-800"
        >
          <span className="flex flex-col items-center justify-center gap-1 w-full">
            <ImageBankIcon className="w-6 h-6 mb-0.5" />
            Välj från bildbank
          </span>
        </Button>
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