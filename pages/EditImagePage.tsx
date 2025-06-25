import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { TextArea } from '../components/common/TextArea';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ImageRecord, View, UserDescriptionEntry } from '../types';
import { getImageById, saveImage } from '../services/storageService';
import { useAudioRecorder } from '../hooks/useAudioRecorder';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../firebase';
import { useUser } from '../context';

interface EditImagePageProps {
  imageId: string;
  onNavigate: (view: View, params?: any) => void;
}

export const EditImagePage: React.FC<EditImagePageProps> = ({ imageId, onNavigate }) => {
  const { currentUser } = useUser();
  if (!currentUser) {
    return <div className="flex justify-center py-10"><LoadingSpinner message="Laddar användardata..." /></div>;
  }
  const [image, setImage] = useState<ImageRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTag, setCurrentTag] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const audioRecorder = useAudioRecorder();
  const { resetAudio: resetAudioFromHook } = audioRecorder;

  const getCurrentUserDescriptionEntry = useCallback((): UserDescriptionEntry | undefined => {
    if (!image || !currentUser) return undefined;
    return image.userDescriptions.find(ud => ud.userId === currentUser.id);
  }, [image, currentUser]);
  
  const [currentUserTextDescription, setCurrentUserTextDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);


  const fetchImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedImage = await getImageById(imageId);
      if (fetchedImage) {
        const migratedImage: ImageRecord = {
          ...fetchedImage,
          userDescriptions: Array.isArray(fetchedImage.userDescriptions) ? fetchedImage.userDescriptions : [],
          processedByHistory: Array.isArray(fetchedImage.processedByHistory) ? fetchedImage.processedByHistory : [],
          tags: Array.isArray(fetchedImage.tags) ? fetchedImage.tags : [],
          suggestedGeotags: Array.isArray(fetchedImage.suggestedGeotags) ? fetchedImage.suggestedGeotags : [],
          sphereId: fetchedImage.sphereId || (currentUser?.sphereIds[0] || 'defaultSphereOnError'),
        };
        
        if (currentUser && !currentUser.sphereIds.includes(migratedImage.sphereId)) {
          console.warn(`Current user does not have access to sphere '${migratedImage.sphereId}' for image '${imageId}'. Displaying anyway.`);
        }

        // No warning needed for isPublishedToFeed as editing implies it will be published.

        if (migratedImage.dataUrl && !migratedImage.dataUrl.startsWith('data:') && migratedImage.filePath) {
            try {
                const downloadUrl = await getDownloadURL(ref(storage, migratedImage.filePath));
                migratedImage.dataUrl = downloadUrl;
            } catch (urlError: any) {
                console.error(`EditImagePage: Failed to get download URL for ${migratedImage.filePath}:`, urlError.message);
            }
        } else if (!migratedImage.dataUrl && migratedImage.filePath) {
             try {
                const downloadUrl = await getDownloadURL(ref(storage, migratedImage.filePath));
                migratedImage.dataUrl = downloadUrl;
            } catch (urlError: any) {
                console.error(`EditImagePage: Failed to get download URL (no initial dataUrl) for ${migratedImage.filePath}:`, urlError.message);
            }
        }

        setImage(migratedImage);
        const userDescEntry = migratedImage.userDescriptions.find(ud => ud.userId === currentUser.id);
        setCurrentUserTextDescription(userDescEntry?.description || '');
        resetAudioFromHook(); 

      } else {
        setError("Inlägget kunde inte hittas. Det kan ha blivit borttaget.");
      }
    } catch (e: any) {
      setError(`Ett fel uppstod vid hämtning av inläggsdata: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [imageId, currentUser, resetAudioFromHook]); 

  useEffect(() => {
    fetchImage();
  }, [fetchImage]);
  
  useEffect(() => {
    const userDescEntry = getCurrentUserDescriptionEntry();
    if (userDescEntry?.description !== currentUserTextDescription) {
        setCurrentUserTextDescription(userDescEntry?.description || '');
    }
  }, [image, getCurrentUserDescriptionEntry]);

  useEffect(() => {
    if (audioRecorder.transcribedText && currentUserTextDescription.trim() === '' && !audioRecorder.isRecording) {
      setCurrentUserTextDescription(audioRecorder.transcribedText);
    }
  }, [audioRecorder.transcribedText, currentUserTextDescription, audioRecorder.isRecording]);


  const handleInputChange = (field: keyof ImageRecord, value: any) => {
    setImage(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleCurrentUserTextDescriptionChange = (text: string) => {
    setCurrentUserTextDescription(text);
  };

  const handleAddTag = (tagToAdd?: string) => {
    const tag = (tagToAdd || currentTag).trim().toLowerCase();
    if (tag && image && !image.tags.includes(tag)) {
      handleInputChange('tags', [...image.tags, tag]);
      if (!tagToAdd) setCurrentTag(''); 

      if (image.suggestedGeotags?.map(t => t.toLowerCase()).includes(tag)) {
        handleInputChange('suggestedGeotags', image.suggestedGeotags.filter(gTag => gTag.toLowerCase() !== tag));
      }
    } else if (!tagToAdd) {
       setCurrentTag(''); 
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (image) {
      handleInputChange('tags', image.tags.filter(tag => tag !== tagToRemove));
    }
  };
  
  const handleSave = async () => {
    if (!image || !currentUser) return;
    setIsSaving(true);
    setError(null); 
    audioRecorder.stopRecording(); 

    try {
      const updatedUserDescriptions = [...(image.userDescriptions || [])];
      let userEntryIndex = updatedUserDescriptions.findIndex(ud => ud.userId === currentUser.id);

      if (userEntryIndex > -1) {
        const existingEntry = updatedUserDescriptions[userEntryIndex];
        updatedUserDescriptions[userEntryIndex] = {
          ...existingEntry,
          description: currentUserTextDescription.trim(),
          audioRecUrl: audioRecorder.audioUrl || existingEntry.audioRecUrl || null,
          createdAt: new Date().toISOString(),
        };
      } else {
        if (currentUserTextDescription.trim() || audioRecorder.audioUrl) {
          updatedUserDescriptions.push({
            userId: currentUser.id,
            description: currentUserTextDescription.trim(),
            audioRecUrl: audioRecorder.audioUrl || null, 
            createdAt: new Date().toISOString(),
          });
        }
      }
      
      const imageToSave: ImageRecord = {
        ...image,
        userDescriptions: updatedUserDescriptions,
        sphereId: image.sphereId || currentUser?.sphereIds[0] || 'defaultSphereOnError',
        isPublishedToFeed: true,
        // Rely on storageService to handle undefined for other optional fields
      };

      await saveImage(imageToSave); 
      onNavigate(View.Home); 
    } catch (err: any) {
      console.error("Error saving image:", err);
      if (err.name === 'QuotaExceededError' || (typeof err.message === 'string' && err.message.includes('quota'))) {
        setError("Lagringsutrymmet är fullt. Det gick inte att spara ändringarna. Försök att frigöra utrymme.");
      } else {
        setError(`Kunde inte spara ändringar: ${err.message || 'Okänt fel'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAudioForCurrentUser = () => {
    audioRecorder.resetAudio(); 
    setImage(prev => {
        if (!prev || !currentUser) return prev;
        const newUserDescriptions = prev.userDescriptions.map(ud => {
            if (ud.userId === currentUser.id) {
                return { ...ud, audioRecUrl: null }; // Set to null
            }
            return ud;
        });
        return { ...prev, userDescriptions: newUserDescriptions };
    });
  };

  if (isLoading) return <PageContainer><div className="flex justify-center items-center h-64"><LoadingSpinner message="Laddar inläggsdata..." /></div></PageContainer>;
  if (error && !image && !isLoading) return <PageContainer><p className="text-danger dark:text-red-400 bg-red-100 dark:bg-red-500/20 p-4 rounded-lg">{error}</p></PageContainer>;
  if (!image || !currentUser) return <PageContainer><p className="p-4 text-muted-text dark:text-slate-400">Kunde inte ladda inläggsdata eller användarinformation.</p></PageContainer>;

  const existingUserAudioUrl = getCurrentUserDescriptionEntry()?.audioRecUrl;
  const audioUrlToPlay = audioRecorder.audioUrl || existingUserAudioUrl;

  const pageTitle = `Redigera Inlägg: ${image.name}`;

  return (
    <PageContainer title={pageTitle}>
      <div className="p-0 md:p-4">
        {error && <div className="bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500 text-danger dark:text-red-400 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Ett fel uppstod:</strong>
            <span className="block sm:inline whitespace-pre-line"> {error}</span>
        </div>}
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/2 flex flex-col items-center">
            {image.dataUrl && (image.dataUrl.startsWith('data:') || image.dataUrl.startsWith('http')) ? (
              <img src={image.dataUrl} alt={image.name} className="w-full rounded-xl shadow-xl max-h-[80vh] object-contain sticky top-24" />
            ) : (
              <div className="w-full rounded-xl shadow-xl min-h-[200px] bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-muted-text dark:text-slate-400 p-8 sticky top-24 text-center">
                Detta inlägg har ingen bild. Du kan redigera text, ljud och taggar.
              </div>
            )}
          </div>

          <div className="lg:w-1/2 space-y-6">
            <Input
              label="Datum för inlägget"
              type="date"
              id="imageDate"
              value={image.dateTaken || ''} // Empty string if dateTaken is undefined/null
              onChange={(e) => handleInputChange('dateTaken', e.target.value || undefined)} // Pass undefined if cleared
              disabled={isSaving}
              className="dark:[color-scheme:dark]"
            />

            <div>
              <label htmlFor="tagInput" className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-1">Taggar</label>
              <div className="flex items-center gap-2 mb-3">
                <Input
                  type="text"
                  id="tagInput"
                  placeholder="Skriv en tagg och tryck Enter"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); }}}
                  disabled={isSaving}
                />
                <Button onClick={() => handleAddTag()} size="md" variant="ghost" className="whitespace-nowrap" disabled={isSaving || !currentTag.trim()}>Lägg till</Button>
              </div>
              {image.dataUrl && image.suggestedGeotags && image.suggestedGeotags.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-text dark:text-slate-400 mb-1.5">Föreslagna geotaggar (klicka för att lägga till):</p>
                  <div className="flex flex-wrap gap-2">
                    {image.suggestedGeotags.map(geoTag => (
                      <button 
                        key={geoTag} 
                        onClick={() => handleAddTag(geoTag)}
                        className="bg-accent/10 dark:bg-emerald-400/20 text-accent dark:text-emerald-300 px-3 py-1 rounded-full text-xs hover:bg-accent/20 dark:hover:bg-emerald-400/30 transition-colors disabled:opacity-50"
                        disabled={isSaving}
                        title={`Lägg till geotagg: ${geoTag}`}
                      >
                        + {geoTag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {image.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {image.tags.map(tag => (
                    <span key={tag} className="bg-primary/10 dark:bg-blue-400/20 text-primary dark:text-blue-300 px-3 py-1.5 rounded-full text-sm font-medium inline-flex items-center">
                      {tag}
                      <button 
                        onClick={() => handleRemoveTag(tag)} 
                        className="ml-2 text-primary/70 dark:text-blue-300/70 hover:text-primary dark:hover:text-blue-200 focus:outline-none disabled:opacity-50"
                        disabled={isSaving}
                        aria-label={`Ta bort tagg ${tag}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
                <label htmlFor="userDescription" className="block text-sm font-medium text-muted-text dark:text-slate-400">
                    Din berättelse/beskrivning
                </label>
                <TextArea
                    id="userDescription"
                    placeholder={image.aiGeneratedPlaceholder || "Vad hände här? Vad kände du?"}
                    value={currentUserTextDescription}
                    onChange={(e) => handleCurrentUserTextDescriptionChange(e.target.value)}
                    disabled={isSaving || audioRecorder.isRecording}
                    rows={4}
                    className="min-h-[100px] max-h-60"
                />
                 {(audioRecorder.error || audioRecorder.permissionGranted === false || audioUrlToPlay) && (
                  <div className="space-y-0.5">
                      {audioRecorder.permissionGranted === false && !audioUrlToPlay && <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>}
                      {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
                      {audioUrlToPlay && (
                          <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
                          <Button type="button" onClick={handleResetAudioForCurrentUser} variant="ghost" size="sm" className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10">Ta bort ljud</Button>
                          </div>
                      )}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-1">
                     {audioUrlToPlay && (
                        <audio controls src={audioUrlToPlay} className="w-full h-10"></audio>
                     )}
                    <Button 
                        type="button"
                        onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
                        variant={audioRecorder.isRecording ? "danger" : "accent"}
                        size="md"
                        className="flex-shrink-0"
                        disabled={isSaving || audioRecorder.permissionGranted === false}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-1.5"><path strokeLinecap="round" strokeLinejoin="round" d={audioRecorder.isRecording ? "M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" : "M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z"} /></svg>
                        {audioRecorder.isRecording ? 'Stoppa' : 'Spela In'}
                    </Button>
                </div>
            </div>
            
            <div className="pt-6 border-t border-border-color dark:border-slate-600 flex justify-end gap-3">
              <Button onClick={() => onNavigate(View.Home)} variant="secondary" disabled={isSaving}>Avbryt</Button>
              <Button onClick={handleSave} isLoading={isSaving} variant="primary" size="lg">Spara Inlägg</Button>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
