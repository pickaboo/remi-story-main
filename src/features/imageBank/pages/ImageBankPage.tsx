import React, { useState, useRef, useEffect } from 'react';
import { PageContainer } from '../../../components/layout/PageContainer';
import { Button, LoadingSpinner } from '../../../components/ui';
import { ImageRecord } from '../../../types';
import { Views } from '../../../constants/viewEnum';
import type { View } from '../../../constants/viewEnum';
import { useAppContext } from '../../../context/AppContext';
import { useImageBank } from '../../../hooks/useImageBank';
import { ConfirmDeleteModal, ImageMetadataUserDetails, ImageUploadPreview } from '..';
import { EXIF_DISPLAY_MAP } from '../../../utils/exifUtils';

// SVG Icons
const UploadIcon: React.FC<{className?: string}> = ({className}) => (
  <svg className={`w-12 h-12 text-gray-400 dark:text-gray-500 ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v12" />
  </svg>
);

const TrashIconInternal: React.FC<{className?: string}> = ({className = "w-4 h-4"}) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`${className} pointer-events-none`}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const InformationCircleIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
  </svg>
);

type ImageBankViewMode = 'view' | 'upload';

export const ImageBankPage: React.FC = () => {
  const { currentUser, activeSphere, handleNavigate } = useAppContext();
  const [imageBankView, setImageBankView] = useState<ImageBankViewMode>('view');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use custom hook for ImageBank logic
  const {
    bankedImagesInViewMode,
    isLoadingBankView,
    bankViewError,
    imageForDeletionConfirmation,
    isDeletingImage,
    expandedMetadataImageId,
    imagesToUpload,
    isSavingUploads,
    uploadError,
    fetchBankedImagesForViewMode,
    handleFileSelectForUpload,
    removeImageFromUploadQueue,
    handleSaveUploadsToBank,
    initiateDeleteImageFromBank,
    confirmDeleteImageFromBank,
    cancelDeleteImageFromBank,
    toggleMetadata,
  } = useImageBank(currentUser?.id || '', activeSphere?.id || '');

  // Early return check
  if (!currentUser || !activeSphere) {
    return <LoadingSpinner message="Laddar användare och sfär..." />;
  }

  useEffect(() => {
    if (imageBankView === 'view') {
      fetchBankedImagesForViewMode();
    }
    if (imageBankView === 'upload') {
      // Reset upload state when switching to upload view
    }
  }, [imageBankView, fetchBankedImagesForViewMode]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    await handleFileSelectForUpload(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDateChange = async (imageId: string, newDateString: string) => {
    // This would need to be implemented in the hook or service
    console.log('Date change not implemented yet:', imageId, newDateString);
  };

  const formatDataUrlSize = (dataUrl?: string): string => {
    if (!dataUrl) return 'Okänt';
    // Rough estimation: base64 is about 33% larger than binary
    const base64Length = dataUrl.length;
    const estimatedBytes = Math.floor(base64Length * 0.75);
    const mb = estimatedBytes / (1024 * 1024);
    return mb > 1 ? `${mb.toFixed(1)} MB` : `${Math.round(estimatedBytes / 1024)} KB`;
  };

  const renderUploadView = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-1">Importera Bilder till Bildbanken</h2>
          <p className="text-muted-text dark:text-slate-400">
            Välj bilder att ladda upp till bildbanken för "{activeSphere.name}". Bilder kommer att sparas med EXIF-data och kan sedan användas för att skapa inlägg.
          </p>
        </div>
        <Button
          onClick={() => setImageBankView('view')}
          variant="secondary"
          size="md"
        >
          Tillbaka till Bildbanken
        </Button>
      </div>

      <div className="space-y-6">
        <div className="border-2 border-dashed border-border-color dark:border-slate-600 rounded-xl p-8 text-center hover:border-primary dark:hover:border-blue-400 transition-colors">
          <UploadIcon className="mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-2">Dra och släpp bilder här</h3>
          <p className="text-muted-text dark:text-slate-400 mb-4">eller klicka för att välja filer</p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            id="image-upload-input"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="primary"
            size="lg"
          >
            Välj Bilder
          </Button>
        </div>

        {uploadError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400">{uploadError}</p>
          </div>
        )}

        {imagesToUpload.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              Valda Bilder ({imagesToUpload.length})
            </h3>
            <div className="space-y-3">
              {imagesToUpload.map(preview => (
                <ImageUploadPreview
                  key={preview.id}
                  preview={preview}
                  onRemove={removeImageFromUploadQueue}
                />
              ))}
            </div>
            <Button 
              onClick={handleSaveUploadsToBank} 
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
    </div>
  );

  const renderViewBankView = () => (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-1">Bilder i Bildbanken för "{activeSphere.name}"</h2>
          <p className="text-muted-text dark:text-slate-400">
            Här samlas bilder som är opublicerade eller redan publicerade i flödet. Du kan välja bilder härifrån för att skapa nya inlägg eller projekt.
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-3">
          <Button
            onClick={() => setImageBankView('upload')}
            variant="accent"
            size="md" 
          >
            <UploadIcon className="w-4 h-4 mr-2 text-current" /> 
            Importera Nya Bilder
          </Button>
        </div>
      </div>

      {isLoadingBankView && <div className="flex justify-center items-center h-64"><LoadingSpinner message="Laddar bildbank..." /></div>}
      {bankViewError && <p className="text-danger dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-4 rounded-lg">{bankViewError}</p>}
      {!isLoadingBankView && !bankViewError && (
        <>
          {bankedImagesInViewMode.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-border-color dark:border-dark-bg/50">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5m-16.5-13.5h16.5a2.25 2.25 0 00-2.25-2.25h-12a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 003.75 20.25h12A2.25 2.25 0 0018 18V9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Bildbanken är tom för denna sfär</h3>
              <p className="text-muted-text dark:text-slate-400">Importera nya bilder för att se dem här.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {bankedImagesInViewMode.map(image => {
                const isMetadataExpanded = expandedMetadataImageId === image.id;

                return (
                  <div key={image.id} className="group relative border border-border-color dark:border-dark-bg/50 p-2.5 rounded-xl shadow-sm hover:shadow-lg transition-all duration-150 ease-in-out bg-white dark:bg-dark-bg/50 flex flex-col">
                    <div className="aspect-square bg-slate-100 dark:bg-dark-bg rounded-lg overflow-hidden mb-2 shadow-inner relative">
                      {image.dataUrl ? (
                        <img src={image.dataUrl} alt={image.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-text dark:text-slate-400 text-xs p-2">Ingen förhandsgranskning</div>
                      )}
                      {currentUser.showImageMetadataInBank && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMetadata(image.id)}
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
                      onClick={() => initiateDeleteImageFromBank(image)}
                      className="absolute top-1 right-1 !p-1.5 !rounded-full text-danger border-danger hover:bg-danger/20 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/20 opacity-70 hover:opacity-100 transition-opacity z-10"
                      title={`Radera "${image.name}" från bildbanken`}
                      aria-label={`Radera bild ${image.name}`}
                    >
                      <TrashIconInternal className="w-4 h-4" />
                    </Button>
                    
                    {isMetadataExpanded && (
                      <div id={`metadata-${image.id}`} className="mt-1 mb-2 p-2.5 bg-slate-50 dark:bg-dark-bg rounded-md border border-border-color dark:border-dark-bg/30 text-xs space-y-0.5 text-slate-600 dark:text-slate-300">
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
                    
                    <div className="mt-auto">
                      <div className="mb-1.5">
                        <label htmlFor={`date-input-${image.id}`} className="sr-only">
                          Datum för {image.name}
                        </label>
                        <input
                          type="date"
                          id={`date-input-${image.id}`}
                          value={image.dateTaken ? new Date(image.dateTaken).toISOString().split('T')[0] : ''}
                          onChange={(e) => handleDateChange(image.id, e.target.value)}
                          className="block w-full text-xs p-1.5 border border-border-color dark:border-dark-bg/30 rounded-md bg-input-bg dark:bg-dark-bg dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 dark:[color-scheme:dark]"
                          aria-label={`Datum för ${image.name}`}
                        />
                      </div>

                      {image.isPublishedToFeed && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleNavigate(Views.Home, { scrollToPostId: image.id });
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
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNavigate(Views.Home, { prefillPostWithImageId: image.id });
                            }}
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
          )}
        </>
      )}
    </div>
  );

  return (
    <PageContainer>
      {imageBankView === 'view' && renderViewBankView()}
      {imageBankView === 'upload' && renderUploadView()}
      {imageForDeletionConfirmation && (
        <ConfirmDeleteModal
          image={imageForDeletionConfirmation}
          onConfirm={confirmDeleteImageFromBank}
          onCancel={cancelDeleteImageFromBank}
          isDeleting={isDeletingImage}
        />
      )}
    </PageContainer>
  );
};
