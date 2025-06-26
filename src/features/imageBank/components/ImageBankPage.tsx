import React, { useState, useEffect } from 'react';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Button } from '../../../../components/common/Button';
import { LoadingSpinner } from '../../../../components/common/LoadingSpinner';
import { View } from '../../../../types';
import { useUser } from '../../../../context/UserContext';
import { useSphere } from '../../../../context/SphereContext';
import { useImageBank } from '../hooks/useImageBank';
import { useImageUpload } from '../hooks/useImageUpload';
import { ImageUploadSection } from './ImageUploadSection';
import { ImageGrid } from './ImageGrid';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { UploadIcon } from './ImageBankIcons';

interface ImageBankPageProps {
  onNavigate: (view: View, params?: any) => void;
}

type ImageBankViewMode = 'view' | 'upload';

export const ImageBankPage: React.FC<ImageBankPageProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();
  const [imageBankView, setImageBankView] = useState<ImageBankViewMode>('view');
  
  // Image bank state management
  const {
    bankedImagesInViewMode,
    isLoadingBankView,
    bankViewError,
    imageForDeletionConfirmation,
    isDeletingImage,
    expandedMetadataImageId,
    initiateDeleteImageFromBank,
    confirmDeleteImageFromBank,
    cancelDeleteImageFromBank,
    handleDateChange,
    toggleMetadata,
  } = useImageBank();

  // Image upload state management
  const {
    imagesToUpload,
    isSavingUploads,
    uploadError,
    fileInputRef,
    handleFileSelectForUpload,
    removeImageFromUploadQueue,
    handleSaveUploadsToBank,
    clearUploadState,
  } = useImageUpload();

  // Handle successful upload
  useEffect(() => {
    if (imageBankView === 'upload') {
      clearUploadState();
    }
  }, [imageBankView, clearUploadState]);

  const handleSaveUploadsSuccess = async () => {
    const success = await handleSaveUploadsToBank();
    if (success) {
      setImageBankView('view');
    }
  };

  const handleSwitchToUpload = () => {
    clearUploadState();
    setImageBankView('upload');
  };

  if (!currentUser || !activeSphere) {
    return <div className="flex justify-center py-10"><LoadingSpinner message="Laddar användardata och sfär..." /></div>;
  }

  return (
    <PageContainer>
      {imageBankView === 'view' && (
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
                onClick={handleSwitchToUpload}
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
            <ImageGrid
              images={bankedImagesInViewMode}
              currentUser={currentUser}
              expandedMetadataImageId={expandedMetadataImageId}
              onNavigate={onNavigate}
              onDeleteImage={initiateDeleteImageFromBank}
              onToggleMetadata={toggleMetadata}
              onDateChange={handleDateChange}
            />
          )}
        </div>
      )}

      {imageBankView === 'upload' && (
        <ImageUploadSection
          activeSphereName={activeSphere.name}
          imagesToUpload={imagesToUpload}
          isSavingUploads={isSavingUploads}
          uploadError={uploadError}
          fileInputRef={fileInputRef}
          onBackToView={() => setImageBankView('view')}
          onFileSelect={handleFileSelectForUpload}
          onRemoveImage={removeImageFromUploadQueue}
          onSaveUploads={handleSaveUploadsSuccess}
        />
      )}

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
