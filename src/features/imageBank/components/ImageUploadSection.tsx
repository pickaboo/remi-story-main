import React from 'react';
import { Button } from '../../../common/components/Button';
import { UploadIcon, TrashIcon } from './ImageBankIcons';

interface UploadPreview {
  id: string;
  file: File;
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string;
  error?: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string;
}

interface ImageUploadSectionProps {
  activeSphereName: string;
  imagesToUpload: UploadPreview[];
  isSavingUploads: boolean;
  uploadError: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onBackToView: () => void;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (id: string) => void;
  onSaveUploads: () => void;
}

export const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  activeSphereName,
  imagesToUpload,
  isSavingUploads,
  uploadError,
  fileInputRef,
  onBackToView,
  onFileSelect,
  onRemoveImage,
  onSaveUploads,
}) => {
  return (
    <div>
      <Button onClick={onBackToView} variant="ghost" size="sm" className="mb-6">
        &larr; Tillbaka till Bildbanken
      </Button>
      <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Importera Bilder till Bildbanken</h2>
      <p className="text-muted-text dark:text-slate-400 mb-6">
        Ladda upp bilder som ska sparas i bildbanken för sfären <span className="font-semibold">"{activeSphereName}"</span>.
        Dessa bilder publiceras inte automatiskt i flödet.
      </p>
      
      <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-primary dark:hover:border-blue-400 transition-colors rounded-xl p-6 sm:p-10 text-center bg-slate-50 dark:bg-slate-700/30 hover:bg-primary/5 dark:hover:bg-blue-400/5 cursor-pointer mb-6">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={onFileSelect}
          ref={fileInputRef}
          className="hidden"
          id="imageBankUploadInput"
        />
        <label htmlFor="imageBankUploadInput" className="cursor-pointer">
          <UploadIcon className="mx-auto mb-3 text-primary dark:text-blue-400" />
          <p className="text-lg font-semibold text-primary dark:text-blue-400 mb-1">Dra & släpp filer här eller klicka</p>
          <p className="text-muted-text dark:text-slate-400 text-sm">(Max 10MB per bild, flera bilder kan väljas)</p>
        </label>
      </div>

      {uploadError && <p className="text-danger dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-3 rounded-lg mb-4 whitespace-pre-line">{uploadError}</p>}

      {imagesToUpload.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Valda bilder för uppladdning ({imagesToUpload.length}):</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-96 overflow-y-auto p-2 border border-border-color dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700/50">
            {imagesToUpload.map(preview => (
              <div key={preview.id} className="relative group border border-border-color dark:border-slate-600 p-1.5 rounded-lg shadow-sm aspect-square">
                <img src={preview.dataUrl} alt={preview.file.name} className="w-full h-full object-cover rounded" />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-1 text-center">
                  <p className="text-xs text-white truncate" title={preview.file.name}>{preview.file.name}</p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onRemoveImage(preview.id)}
                  className="absolute top-1 right-1 !p-1 !rounded-full opacity-60 group-hover:opacity-100"
                  title="Ta bort från kö"
                >
                  <TrashIcon className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button 
            onClick={onSaveUploads} 
            isLoading={isSavingUploads} 
            disabled={imagesToUpload.length === 0 || isSavingUploads}
            variant="primary" 
            size="lg"
            className="mt-6 w-full sm:w-auto"
          >
            Spara {imagesToUpload.length} bild{imagesToUpload.length > 1 ? 'er' : ''} till banken
          </Button>
        </div>
      )}
    </div>
  );
}; 