import React from 'react';
import { ImageRecord } from '../../../types';
import { TrashIcon } from './CreatePostIcons';

interface ImagePreviewSectionProps {
  imagePreviewUrl: string | null;
  selectedBankedImageInfo: ImageRecord | null;
  uploadedFileDetails: any | null;
  onClearImageSelection: () => void;
  isProcessingFile: boolean;
}

export const ImagePreviewSection: React.FC<ImagePreviewSectionProps> = ({
  imagePreviewUrl,
  selectedBankedImageInfo,
  uploadedFileDetails,
  onClearImageSelection,
  isProcessingFile,
}) => {
  if (!imagePreviewUrl && !isProcessingFile) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="relative inline-block">
        <img
          src={imagePreviewUrl || ''}
          alt="Preview"
          className="max-w-full h-auto max-h-64 rounded-lg border border-border-color dark:border-slate-600"
        />
        <button
          onClick={onClearImageSelection}
          className="absolute -top-2 -right-2 bg-danger hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors"
          title="Ta bort bild"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
      
      {(selectedBankedImageInfo || uploadedFileDetails) && (
        <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {selectedBankedImageInfo && (
            <p>Vald från bildbank: {selectedBankedImageInfo.name}</p>
          )}
          {uploadedFileDetails && (
            <p>Ny uppladdad bild: {uploadedFileDetails.filePath?.split('/').pop()}</p>
          )}
        </div>
      )}
      
      {isProcessingFile && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
          Bearbetar bild...
        </div>
      )}
    </div>
  );
}; 