import React from 'react';
import { PageContainer } from '../../../layout/PageContainer';
import { Button } from '../../../common/components/Button';
import { Input } from '../../../common/components/Input';
import { TextArea } from '../../../common/components/TextArea';
import { LoadingSpinner } from '../../../common/components/LoadingSpinner';
import { View } from '../../../types';
import { useImageEditing } from '../../../common/hooks/useImageEditing';
import { useAudioRecorder } from '../../../common/hooks/useAudioRecorder';
import { useUser } from '../../../context';

interface EditImagePageProps {
  imageId: string;
  onNavigate: (view: View, params?: any) => void;
}

export const EditImagePage: React.FC<EditImagePageProps> = ({ imageId, onNavigate }) => {
  const { currentUser } = useUser();
  const audioRecorder = useAudioRecorder();
  
  if (!currentUser) {
    return <div className="flex justify-center py-10"><LoadingSpinner message="Laddar användardata..." /></div>;
  }

  // Use the useImageEditing hook for all image editing logic
  const [imageState, imageActions] = useImageEditing({
    imageId,
    onSaveSuccess: () => onNavigate(View.Home),
    onSaveError: (error) => console.error('Save error:', error)
  });

  const {
    image,
    isLoading,
    isSaving,
    error,
    currentUserTextDescription,
    currentTag
  } = imageState;

  const {
    setCurrentUserTextDescription,
    setCurrentTag,
    handleAddTag,
    handleRemoveTag,
    handleSave,
    handleResetAudioForCurrentUser,
    fetchImage
  } = imageActions;

  // Fetch image on mount
  React.useEffect(() => {
    fetchImage();
  }, [fetchImage]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className="flex justify-center py-10">
          <LoadingSpinner message="Laddar bild..." />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <div className="flex flex-col items-center justify-center py-10">
          <div className="text-red-500 text-center mb-4">{error}</div>
          <Button onClick={fetchImage} variant="secondary">
            Försök igen
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!image) {
    return (
      <PageContainer>
        <div className="flex justify-center py-10">
          <div className="text-center">
            <p className="text-gray-500 mb-4">Bild kunde inte hittas</p>
            <Button onClick={() => onNavigate(View.Home)} variant="secondary">
              Tillbaka till startsidan
            </Button>
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Redigera bild
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Lägg till beskrivning, taggar och ljudinspelning
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Preview */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
              {image.dataUrl && (
                <img
                  src={image.dataUrl}
                  alt="Bild att redigera"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            
            {/* Audio Recording Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Ljudinspelning
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
                    variant={audioRecorder.isRecording ? "danger" : "primary"}
                    disabled={isSaving}
                  >
                    {audioRecorder.isRecording ? "Stoppa inspelning" : "Starta inspelning"}
                  </Button>
                  {audioRecorder.audioUrl && (
                    <Button
                      onClick={handleResetAudioForCurrentUser}
                      variant="secondary"
                      disabled={isSaving}
                    >
                      Ta bort ljud
                    </Button>
                  )}
                </div>
                
                {audioRecorder.audioUrl && (
                  <audio controls className="w-full">
                    <source src={audioRecorder.audioUrl} type="audio/wav" />
                    Din webbläsare stöder inte ljuduppspelning.
                  </audio>
                )}
                
                {audioRecorder.transcribedText && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Transkriberad text:</strong> {audioRecorder.transcribedText}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Editing Form */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Beskrivning
              </label>
              <TextArea
                value={currentUserTextDescription}
                onChange={(e) => setCurrentUserTextDescription(e.target.value)}
                placeholder="Beskriv vad du ser i bilden..."
                rows={4}
                disabled={isSaving}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Taggar
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <Input
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    placeholder="Lägg till tagg..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    disabled={isSaving}
                  />
                  <Button
                    onClick={() => handleAddTag()}
                    variant="secondary"
                    disabled={!currentTag.trim() || isSaving}
                  >
                    Lägg till
                  </Button>
                </div>
                
                {image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {image.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                          disabled={isSaving}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Suggested Geotags */}
            {image.suggestedGeotags && image.suggestedGeotags.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Föreslagna platser
                </label>
                <div className="flex flex-wrap gap-2">
                  {image.suggestedGeotags.map((geotag) => (
                    <button
                      key={geotag}
                      onClick={() => handleAddTag(geotag)}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800"
                      disabled={isSaving}
                    >
                      {geotag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? "Sparar..." : "Spara ändringar"}
              </Button>
              <Button
                onClick={() => onNavigate(View.Home)}
                variant="secondary"
                disabled={isSaving}
              >
                Avbryt
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
