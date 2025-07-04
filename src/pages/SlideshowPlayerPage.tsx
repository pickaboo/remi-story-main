
import React, { useState, useEffect, useCallback } from 'react';
import { ImageRecord, SlideshowProject, View, UserDescriptionEntry } from '../types';
import { getProjectById, getImageById } from '../services/storageService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getDownloadURL, ref } from 'firebase/storage'; // Added
import { storage } from '../../firebase'; // Added
// Removed Button import as top controls are now raw buttons

interface SlideshowPlayerPageProps {
  projectId: string;
  onNavigate: (view: View, params?: any) => void;
}

const animationNames = ['kenburns-zoom-in', 'kenburns-pan-tl-br', 'kenburns-pan-br-tl'];

export const SlideshowPlayerPage: React.FC<SlideshowPlayerPageProps> = ({ projectId, onNavigate }) => {
  const [project, setProject] = useState<SlideshowProject | null>(null);
  const [images, setImages] = useState<ImageRecord[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentAnimationClass, setCurrentAnimationClass] = useState<string>('');

  const fetchProjectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProject = await getProjectById(projectId);
      if (fetchedProject) {
        setProject(fetchedProject);
        const imagePromises = fetchedProject.imageIds.map(id => getImageById(id));
        const resolvedRawImages = await Promise.all(imagePromises);
        
        const projectImageRecords = resolvedRawImages.filter(img => img !== undefined) as ImageRecord[];
        
        const imagesWithResolvedUrls = await Promise.all(
          projectImageRecords.map(async (img) => {
            let displayUrl = img.dataUrl;
            // If dataUrl is not a base64 string or an http/s URL, AND filePath exists, try to get downloadURL
            if ((!displayUrl || (!displayUrl.startsWith('data:') && !displayUrl.startsWith('http'))) && img.filePath) {
                try {
                    displayUrl = await getDownloadURL(ref(storage, img.filePath));
                } catch (urlError) {
                    console.warn(`SlideshowPlayerPage: Failed to get download URL for img ${img.id} (filePath: ${img.filePath}). Error:`, urlError);
                    // Keep original (possibly undefined) dataUrl if download fails
                }
            }
            return { ...img, dataUrl: displayUrl };
          })
        );

        const displayableImages = imagesWithResolvedUrls.filter(img => img.dataUrl);
        setImages(displayableImages);

        if (displayableImages.length === 0) {
          if (fetchedProject.imageIds.length > 0) {
              setError("Inga bilder i detta projekt kunde laddas för visning (t.ex. saknar bilddata eller är ogiltiga poster).");
          } else {
              setError("Projektet innehåller inga bilder.");
          }
        } else {
          setCurrentAnimationClass(animationNames[Math.floor(Math.random() * animationNames.length)]);
        }
      } else {
        setError("Bildspelsprojektet kunde inte hittas.");
      }
    } catch (e: any) {
        console.error("Error fetching slideshow data:", e);
        setError("Ett fel uppstod vid hämtning av bildspelsdata: " + e.message);
    } finally {
        setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  const currentImage = images[currentImageIndex];

  // Determine story to display based on priority
  let storyToDisplay: string | null | undefined = null;
  if (currentImage) {
    if (currentImage.compiledStory && currentImage.compiledStory.trim() !== '') {
      storyToDisplay = currentImage.compiledStory;
    } else if (currentImage.userDescriptions && currentImage.uploadedByUserId) {
      const uploaderDescEntry = currentImage.userDescriptions.find(
        (ud: UserDescriptionEntry) => ud.userId === currentImage.uploadedByUserId
      );
      if (uploaderDescEntry && uploaderDescEntry.description && uploaderDescEntry.description.trim() !== '') {
        storyToDisplay = uploaderDescEntry.description;
      }
    }
  }

  useEffect(() => {
    if (images.length > 0) {
      setCurrentAnimationClass(animationNames[Math.floor(Math.random() * animationNames.length)]);
    }
  }, [currentImageIndex, images.length]);


  const goToNextImage = useCallback(() => {
    if (images.length === 0) return;
    setCurrentImageIndex(prev => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevImage = useCallback(() => {
     if (images.length === 0) return;
    setCurrentImageIndex(prev => (prev - 1 + images.length) % images.length);
  }, [images.length]);
  
  const toggleFullScreen = useCallback(() => {
    const element = document.documentElement;
    if (!document.fullscreenElement) {
        if (element.requestFullscreen) {
            element.requestFullscreen().then(() => setIsFullScreen(true)).catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
                setIsFullScreen(false); 
            });
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().then(() => setIsFullScreen(false)).catch(err => {
                console.error(`Error attempting to exit full-screen mode: ${err.message} (${err.name})`);
            });
        }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (images.length === 0 && !isLoading && !error) return; 
      if (event.key === 'ArrowRight') goToNextImage();
      if (event.key === 'ArrowLeft') goToPrevImage();
      if (event.key === 'f' || event.key === 'F') toggleFullScreen(); 
      if (event.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().then(() => setIsFullScreen(false));
        } else {
          onNavigate(View.SlideshowProjects); 
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, error, images.length, goToNextImage, goToPrevImage, toggleFullScreen, onNavigate]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[100]">
        <LoadingSpinner message="Laddar bildspel..." size="lg" />
      </div>
    );
  }

  if (error || !project || images.length === 0) {
    return (
      <div className="fixed inset-0 bg-slate-800 text-white flex flex-col items-center justify-center p-8 z-[100]">
        <h2 className="text-2xl font-semibold mb-3">Hoppsan!</h2>
        <p className="text-xl text-yellow-300 mb-6 text-center">{error || "Inga bilder att visa i detta bildspel."}</p>
        <button 
            onClick={() => onNavigate(View.SlideshowProjects)} 
            className="px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-primary-hover transition-colors duration-150"
        >
            Tillbaka till Projekt
        </button>
      </div>
    );
  }
  
  const imageIsLandscape = currentImage && currentImage.width && currentImage.height && currentImage.width > currentImage.height;

  return (
    <div className="fixed inset-0 bg-slate-900 text-white flex flex-col items-center justify-center p-2 sm:p-4 z-[100] overflow-hidden select-none">
      <div className={`w-full h-full flex ${imageIsLandscape ? 'flex-col' : 'lg:flex-row flex-col'} items-center justify-center gap-2 sm:gap-4 p-2 sm:p-4`}>
        <div className={`
            relative 
            ${imageIsLandscape ? 'w-full h-3/5 lg:h-3/4' : 'h-3/5 lg:h-full w-full lg:w-3/4'} 
            flex items-center justify-center 
            overflow-hidden rounded-lg shadow-2xl 
            group transition-all duration-300`}
        >
           {currentImage && currentImage.dataUrl && (
            <img 
                key={`${currentImage.id}-${currentAnimationClass}`}
                src={currentImage.dataUrl} 
                alt={currentImage.name} 
                className={`w-full h-full object-cover ${currentAnimationClass}`}
            />
           )}
        </div>
        {storyToDisplay && (
          <div 
            className={`
              ${imageIsLandscape ? 'w-full h-2/5 lg:h-1/4 p-3 sm:p-4' : 'h-2/5 lg:h-full w-full lg:w-1/4 p-3 sm:p-4'} 
              overflow-y-auto bg-black bg-opacity-60 backdrop-blur-sm rounded-lg shadow-xl scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800
            `}
          >
            <p className="text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-slate-200">{storyToDisplay}</p>
          </div>
        )}
      </div>

      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex space-x-2 z-10">
        <button 
            onClick={toggleFullScreen} 
            className="text-white rounded-full px-3 py-1.5 text-xs sm:text-sm hover:bg-white/20 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          {isFullScreen ? 'Avsluta Fullskärm' : 'Fullskärm (F)'}
        </button>
        <button 
            onClick={() => onNavigate(View.SlideshowProjects)} 
            className="text-white rounded-full px-3 py-1.5 text-xs sm:text-sm hover:bg-white/20 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/70"
        >
          Stäng (Esc)
        </button>
      </div>

      {images.length > 1 && (
        <>
          <button 
            onClick={goToPrevImage} 
            className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 bg-transparent hover:bg-black/30 text-white p-2 sm:p-3 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Föregående bild (Vänsterpil)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>
          <button 
            onClick={goToNextImage} 
            className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 bg-transparent hover:bg-black/30 text-white p-2 sm:p-3 rounded-full transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Nästa bild (Högerpil)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 sm:w-6 sm:h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </>
      )}
      
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm bg-black bg-opacity-50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
        {currentImageIndex + 1} / {images.length}
      </div>
    </div>
  );
};
