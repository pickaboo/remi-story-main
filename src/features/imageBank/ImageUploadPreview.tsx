import React from 'react';
import { Button } from '../../components/ui';

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

interface ImageUploadPreviewProps {
  preview: UploadPreview;
  onRemove: (id: string) => void;
  onDateChange?: (id: string, newDate: string) => void;
}

const TrashIcon: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} pointer-events-none`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const ImageUploadPreview: React.FC<ImageUploadPreviewProps> = ({ 
  preview, 
  onRemove, 
  onDateChange 
}) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onDateChange) {
      onDateChange(preview.id, e.target.value);
    }
  };

  return (
    <div className="relative bg-white dark:bg-slate-800 rounded-lg p-4 border border-border-color dark:border-slate-600">
      {preview.error && (
        <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          {preview.error}
        </div>
      )}
      
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <img 
            src={preview.dataUrl} 
            alt={`Förhandsgranskning av ${preview.file.name}`}
            className="w-20 h-20 object-cover rounded-md border border-border-color dark:border-slate-600"
          />
        </div>
        
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-grow min-w-0">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {preview.file.name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {preview.width} × {preview.height} px • {(preview.file.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRemove(preview.id)}
              className="flex-shrink-0 ml-2 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400"
              aria-label={`Ta bort ${preview.file.name}`}
            >
              <TrashIcon />
            </Button>
          </div>
          
          {onDateChange && (
            <div className="mt-3">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Datum tagen:
              </label>
              <input
                type="date"
                value={preview.dateTaken}
                onChange={handleDateChange}
                className="block w-full px-3 py-1 text-sm border border-border-color dark:border-slate-600 rounded-md bg-input-bg dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 