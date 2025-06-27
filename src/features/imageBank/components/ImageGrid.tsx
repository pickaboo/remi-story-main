import React from 'react';
import { Button } from '../../../common/components/Button';
import { ImageRecord, View } from '../../../types';
import { TrashIcon, InformationCircleIcon, EmptyBankIcon } from './ImageBankIcons';
import { ImageMetadataUserDetails } from './ImageMetadataUserDetails';
import { EXIF_DISPLAY_MAP, formatDataUrlSize } from '../utils/imageBankUtils';

interface ImageGridProps {
  images: ImageRecord[];
  currentUser: any;
  expandedMetadataImageId: string | null;
  onNavigate: (view: View, params?: any) => void;
  onDeleteImage: (image: ImageRecord) => void;
  onToggleMetadata: (imageId: string) => void;
  onDateChange: (imageId: string, newDateString: string) => void;
}

export const ImageGrid: React.FC<ImageGridProps> = ({
  images,
  currentUser,
  expandedMetadataImageId,
  onNavigate,
  onDeleteImage,
  onToggleMetadata,
  onDateChange,
}) => {
  if (images.length === 0) {
    return (
      <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-border-color dark:border-slate-600">
        <EmptyBankIcon className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6" />
        <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Bildbanken är tom för denna sfär</h3>
        <p className="text-muted-text dark:text-slate-400">Importera nya bilder för att se dem här.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map(image => {
        const isMetadataExpanded = expandedMetadataImageId === image.id;

        return (
          <div key={image.id} className="group relative border border-border-color dark:border-slate-700 p-2.5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-150 ease-in-out bg-white dark:bg-slate-700/50 flex flex-col">
            <div className="aspect-square bg-slate-100 dark:bg-slate-600 rounded-lg overflow-hidden mb-2 shadow-inner relative">
              {image.dataUrl ? (
                <img src={image.dataUrl} alt={image.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-text dark:text-slate-400 text-xs p-2">Ingen förhandsgranskning</div>
              )}
              {currentUser.showImageMetadataInBank && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onToggleMetadata(image.id)}
                  className={`absolute bottom-1 right-1 !p-1 !rounded-full text-white bg-black/30 hover:bg-black/50 transition-all
                    ${isMetadataExpanded ? 'ring-2 ring-white/70' : ''}`}
                  title={isMetadataExpanded ? "Dölj metadata" : "Visa metadata"}
                  aria-expanded={isMetadataExpanded}
                  aria-controls={`metadata-${image.id}`}
                >
                  <InformationCircleIcon className="w-4 h-4" />
                </Button>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteImage(image)}
              className="absolute top-1 right-1 !p-1.5 !rounded-full text-danger border-danger hover:bg-danger/20 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/20 opacity-70 hover:opacity-100 transition-opacity z-10"
              title={`Radera "${image.name}" från bildbanken`}
              aria-label={`Radera bild ${image.name}`}
            >
              <TrashIcon className="w-4 h-4" />
            </Button>
            
            {isMetadataExpanded && (
              <div id={`metadata-${image.id}`} className="mt-1 mb-2 p-2.5 bg-slate-50 dark:bg-slate-700 rounded-md border border-border-color dark:border-slate-600 text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
                <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Fil:</strong> <span className="text-slate-700 dark:text-slate-300" title={image.name}>{image.name}</span></p>
                <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Typ:</strong> <span className="text-slate-700 dark:text-slate-300">{image.type}</span></p>
                {image.width && image.height && <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Mått:</strong> <span className="text-slate-700 dark:text-slate-300">{image.width} x {image.height} px</span></p>}
                <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Storlek (ca):</strong> <span className="text-slate-700 dark:text-slate-300">{formatDataUrlSize(image.dataUrl)}</span></p>
                {image.filePath && <p className="truncate text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">Sökväg:</strong> <span className="text-slate-700 dark:text-slate-300" title={image.filePath}>{image.filePath}</span></p>}
                
                <ImageMetadataUserDetails userId={image.uploadedByUserId} sphereId={image.sphereId} />
                
                <p className="text-xs"><strong className="font-normal text-slate-500 dark:text-slate-400">AI-analys:</strong> <span className="text-slate-700 dark:text-slate-300">{image.isProcessed ? "Ja" : "Nej"}</span></p>
                
                {image.exifData && Object.keys(image.exifData).length > 0 && (
                  <>
                    <p className="font-medium mt-1.5 pt-1.5 border-t border-slate-200 dark:border-slate-600/50 text-slate-500 dark:text-slate-400">EXIF Data:</p>
                    {Object.entries(image.exifData)
                      .map(([key, exifTagContainer]) => {
                        if (!exifTagContainer || typeof exifTagContainer.description === 'undefined') return null;
                        const displayInfo = EXIF_DISPLAY_MAP[key];
                        const valueToDisplay = displayInfo?.formatter ? displayInfo.formatter(exifTagContainer) : String(exifTagContainer.description);
                        const labelToDisplay = displayInfo?.label || key.replace(/([A-Z](?=[a-z]))/g, ' $1').trim();
                        if (!valueToDisplay || (typeof valueToDisplay !== 'string' && typeof valueToDisplay !== 'number')) return null;
                        return { key, label: labelToDisplay, value: valueToDisplay };
                      })
                      .filter(item => item !== null)
                      .slice(0, 7) 
                      .map(item => (
                        item && <p key={item.key} className="truncate text-xs" title={`${item.label}: ${item.value}`}>
                          <strong className="capitalize font-normal text-slate-500 dark:text-slate-400">{item.label}:</strong>{' '}
                          <span className="text-slate-700 dark:text-slate-300">{item.value}</span>
                        </p>
                      ))}
                    {Object.keys(image.exifData).filter(k => image.exifData![k]?.description !== undefined).length > 7 && <p className="text-xs text-slate-400 dark:text-slate-500">...och mer.</p>}
                  </>
                )}
              </div>
            )}
            
            <div className="mt-auto"> {/* Pushes controls to bottom if metadata not expanded */}
              <div className="mb-1.5">
                <label htmlFor={`date-input-${image.id}`} className="sr-only">
                  Datum för {image.name}
                </label>
                <input
                  type="date"
                  id={`date-input-${image.id}`}
                  value={image.dateTaken ? new Date(image.dateTaken).toISOString().split('T')[0] : ''}
                  onChange={(e) => onDateChange(image.id, e.target.value)}
                  className="block w-full text-xs p-1.5 border border-border-color dark:border-slate-600 rounded-md bg-input-bg dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 dark:[color-scheme:dark]"
                  aria-label={`Datum för ${image.name}`}
                />
              </div>

              {image.isPublishedToFeed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(View.Home, { scrollToPostId: image.id });
                  }}
                  className="text-xs text-accent dark:text-emerald-400 hover:underline mb-2 font-medium focus:outline-none focus:ring-1 focus:ring-accent/50 dark:focus:ring-emerald-400/50 rounded"
                  title="Gå till publicerat inlägg i flödet"
                >
                  ✓ Publicerad i flödet
                </button>
              )}
              <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 mt-1.5">
                {!image.isPublishedToFeed && (
                  <Button
                    size="sm"
                    variant="accent"
                    className="w-full text-xs !font-medium"
                    onClick={() => onNavigate(View.Home, { prefillPostWithImageId: image.id })}
                    title={`Skapa inlägg med "${image.name}"`}
                  >
                    Använd i Inlägg
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}; 