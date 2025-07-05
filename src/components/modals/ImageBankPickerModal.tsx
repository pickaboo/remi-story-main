import React, { useState, useEffect } from 'react';
import { ImageRecord } from '../../types';
import { getAllImages } from '../../services/storageService';
import { LoadingSpinner } from '../ui';
import { Button } from '../ui';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../firebase';

interface ImageBankPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelect: (image: ImageRecord) => void;
  activeSphereId: string; 
}

export const ImageBankPickerModal: React.FC<ImageBankPickerModalProps> = ({ isOpen, onClose, onImageSelect, activeSphereId }) => {
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchModalImages = async () => {
      if (isOpen) {
        setIsLoading(true);
        setSearchTerm(''); 
        try {
          const rawImagesFromDb = (await getAllImages()).filter(img => img.sphereId === activeSphereId);

          const imagesWithDisplayUrls = await Promise.all(
            rawImagesFromDb.map(async (img) => {
              if (img.filePath) {
                try {
                  const downloadUrl = await getDownloadURL(ref(storage, img.filePath));
                  return { ...img, dataUrl: downloadUrl }; 
                } catch (error) {
                  console.error(`Misslyckades att hämta download URL för ${img.filePath}:`, error);
                  // Behåll bilden men utan dataUrl om länken misslyckas, den filtreras bort senare
                  return { ...img, dataUrl: '' }; 
                }
              }
              // Om ingen filePath, behåll bilden utan dataUrl, den filtreras bort senare
              return { ...img, dataUrl: '' }; // Behåll befintlig dataUrl om den finns (t.ex. nyligen uppladdad men ej sparad än)
            })
          );
          
          // Filtrera för bilder som faktiskt har en giltig URL att visa
          const displayableImages = imagesWithDisplayUrls.filter(img => img.dataUrl);

          setImages(displayableImages.sort((a,b) => new Date(b.dateTaken || b.createdAt || 0).getTime() - new Date(a.dateTaken || a.createdAt || 0).getTime()));
        } catch (error) {
          console.error("Error fetching images for picker:", error);
          setImages([]); 
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchModalImages();
  }, [isOpen, activeSphereId]);

  const filteredImages = images.filter(image =>
    image.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (image.tags && image.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="image-bank-modal-title">
      <div className="bg-card-bg dark:bg-dark-bg rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <h2 id="image-bank-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">Välj Bild från Aktiv Sfär</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!rounded-full !p-2" aria-label="Stäng modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <div className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700">
          <input
            type="text"
            placeholder="Sök på namn eller tagg..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full px-4 py-2 border border-border-color dark:border-dark-bg/30 rounded-full shadow-sm bg-input-bg dark:bg-dark-bg dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 sm:text-sm"
            aria-label="Sök i bildbanken"
          />
        </div>

        <div className="p-4 sm:p-5 flex-grow overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <LoadingSpinner message="Laddar bilder..." />
            </div>
          ) : filteredImages.length === 0 ? (
            <p className="text-muted-text dark:text-slate-400 text-center py-10">
              {images.length === 0 ? `Bildbanken för den aktiva sfären är tom eller inga bilder kunde laddas.` : "Inga bilder matchar din sökning."}
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  className="relative group bg-slate-100 dark:bg-dark-bg rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden aspect-square cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-blue-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-800"
                  onClick={() => onImageSelect(image)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onImageSelect(image);}}
                  tabIndex={0}
                  role="button"
                  aria-label={`Välj bild: ${image.name}`}
                >
                  {image.dataUrl ? ( 
                    <img src={image.dataUrl} alt={image.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-dark-bg text-slate-400 dark:text-slate-500 text-xs p-1 text-center">Bild saknas</div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent p-2">
                    <p className="text-xs text-white truncate font-medium" title={image.name}>{image.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Avbryt</Button>
        </footer>
      </div>
    </div>
  );
};
