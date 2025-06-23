import React, { useState, useEffect, useCallback, useRef } from 'react';

interface FullscreenImageViewerProps {
  imageUrl: string | null | undefined;
  imageName: string | undefined;
  isOpen: boolean;
  onClose: () => void;
}

// Icons (can be moved to a common file if used elsewhere)
const CloseIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ArrowsPointingOutIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9m4.5 11.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
    </svg>
);

const ArrowsPointingInIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9V4.5M15 9h4.5M15 9l5.25-5.25M15 15v4.5M15 15h4.5M15 15l5.25 5.25" />
    </svg>
);


export const FullscreenImageViewer: React.FC<FullscreenImageViewerProps> = ({ imageUrl, imageName, isOpen, onClose }) => {
  const [isBrowserFullscreen, setIsBrowserFullscreen] = useState(!!document.fullscreenElement);
  const viewerRef = useRef<HTMLDivElement>(null);

  const handleToggleBrowserFullscreen = useCallback(() => {
    const element = viewerRef.current; // Request fullscreen on the viewer div
    if (!element) return;

    if (!document.fullscreenElement) {
      element.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsBrowserFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isOpen && event.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen().then(() => {
            // If still in viewer (not browser fullscreen), then close viewer
            if (!document.fullscreenElement) onClose();
          });
        } else {
          onClose();
        }
      }
      if (isOpen && (event.key === 'f' || event.key === 'F')) {
        handleToggleBrowserFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleToggleBrowserFullscreen]);

  if (!isOpen || !imageUrl) {
    return null;
  }

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 bg-black/80 dark:bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-[200] p-4 select-none"
      role="dialog"
      aria-modal="true"
      aria-label={`Helskärmsvy av ${imageName || 'bild'}`}
    >
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex space-x-2 z-10">
        <button
            onClick={handleToggleBrowserFullscreen}
            className="text-white rounded-full px-3 py-1.5 text-xs sm:text-sm bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/70"
            title={isBrowserFullscreen ? 'Avsluta webbläsarens helskärmsläge (F)' : 'Starta webbläsarens helskärmsläge (F)'}
        >
            {isBrowserFullscreen ? <ArrowsPointingInIcon /> : <ArrowsPointingOutIcon />}
        </button>
        <button
            onClick={onClose}
            className="text-white rounded-full p-1.5 sm:p-2 bg-black/30 hover:bg-black/50 backdrop-blur-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-white/70"
            title="Stäng helskärmsvy (Esc)"
            aria-label="Stäng helskärmsvy"
        >
            <CloseIcon className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <div className="max-w-full max-h-full flex items-center justify-center">
        <img
          src={imageUrl}
          alt={imageName || 'Helskärmsbild'}
          className="block max-w-[95vw] max-h-[95vh] object-contain rounded-lg shadow-2xl"
        />
      </div>
      {imageName && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-xs sm:text-sm text-white bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-sm">
              {imageName}
          </div>
      )}
    </div>
  );
};
