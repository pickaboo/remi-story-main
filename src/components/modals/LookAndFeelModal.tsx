import React, { useState, useEffect } from 'react';
import { Sphere } from '../../types';
import { Button } from '../ui';

interface LookAndFeelModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSphere: Sphere;
  onSaveSphereBackground: (sphereId: string, backgroundUrl: string) => Promise<void>;
  onSaveThemePreference: (theme: string) => void;
  onSaveShowImageMetadataPreference: (show: boolean) => void;
}

const PREDEFINED_BACKGROUND_IMAGES: { name: string; url: string; thumbnailUrl: string }[] = [
  { name: "Bergssjö", url: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=2070&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Skogsstig", url: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=2070&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Strandvy", url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Stad Natt", url: "https://images.unsplash.com/photo-1488330890490-c291ecf62571?q=80&w=2070&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1488330890490-c291ecf62571?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Abstrakt Vågor", url: "https://images.unsplash.com/photo-1536566482680-fca31930a0bd?q=80&w=1974&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1536566482680-fca31930a0bd?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Pastellhimmel", url: "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?q=80&w=1974&auto=format&fit=crop", thumbnailUrl: "https://images.unsplash.com/photo-1505144808419-1957a94ca61e?q=80&w=400&h=250&auto=format&fit=crop&crop=entropy" },
  { name: "Andreas1", url: "/images/Andreas1.jpg", thumbnailUrl: "/images/Andreas1.jpg" },
  { name: "Andreas2", url: "/images/Andreas2.jpg", thumbnailUrl: "/images/Andreas2.jpg" },
  { name: "Andreas3", url: "/images/Andreas3.jpg", thumbnailUrl: "/images/Andreas3.jpg" },
  { name: "Andreas4", url: "/images/Andreas4.jpg", thumbnailUrl: "/images/Andreas4.jpg" },
  { name: "Andreas5", url: "/images/Andreas5.jpg", thumbnailUrl: "/images/Andreas5.jpg" },
  { name: "Andreas6", url: "/images/Andreas6.jpg", thumbnailUrl: "/images/Andreas6.jpg" },
];

export const LookAndFeelModal: React.FC<LookAndFeelModalProps> = ({
  isOpen,
  onClose,
  activeSphere,
  onSaveSphereBackground,
  onSaveThemePreference,
  onSaveShowImageMetadataPreference,
}) => {
  const [selectedBackgroundUrl, setSelectedBackgroundUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedBackgroundUrl(null);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await onSaveSphereBackground(activeSphere.id, selectedBackgroundUrl || '');
      onClose();
    } catch (err: any) {
      setError(err.message || "Kunde inte spara inställningar.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="look-and-feel-modal-title">
      <div className="bg-card-bg dark:bg-dark-bg rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <h2 id="look-and-feel-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">
            Anpassa Bakgrund för Sfär
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!rounded-full !p-2" aria-label="Stäng modal" disabled={isSaving}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <div className="p-4 sm:p-5 space-y-8 flex-grow overflow-y-auto">
          {/* Background Image Section */}
          <section>
            <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300 mb-3">Bakgrundsbild för Sfär</h3>
            <p className="text-sm text-muted-text dark:text-slate-400 mb-4">
              Välj en bakgrundsbild som kommer att visas när denna sfär är aktiv.
              Om ingen specifik bild väljs här, används din personliga standardbakgrund eller appens standard.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {PREDEFINED_BACKGROUND_IMAGES.map((bgInfo, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedBackgroundUrl(bgInfo.url)}
                  className={`
                    rounded-lg overflow-hidden aspect-video transition-all duration-150 ease-in-out 
                    focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 focus-visible:ring-primary dark:focus-visible:ring-blue-400
                    ${selectedBackgroundUrl === bgInfo.url
                      ? 'ring-4 ring-offset-2 ring-primary dark:ring-blue-400 shadow-xl scale-105'
                      : 'ring-2 ring-transparent hover:ring-primary/70 dark:hover:ring-blue-400/70 hover:shadow-lg'
                    }
                  `}
                  aria-pressed={selectedBackgroundUrl === bgInfo.url}
                  disabled={isSaving}
                >
                  <img src={bgInfo.thumbnailUrl} alt={bgInfo.name} className="w-full h-full object-cover" />
                  <span className="sr-only">{bgInfo.name}</span>
                </button>
              ))}
            </div>
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedBackgroundUrl(null)}
                className="mt-4 text-sm text-muted-text dark:text-slate-400 hover:text-danger dark:hover:text-red-400"
                disabled={isSaving || selectedBackgroundUrl === null}
            >
                Återställ till standard (ingen specifik sfärbakgrund)
            </Button>
          </section>
          
          {error && <p className="text-sm text-danger dark:text-red-400 mt-4">{error}</p>}
        </div>

        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isSaving}>Avbryt</Button>
            <Button variant="primary" type="button" onClick={handleSave} isLoading={isSaving}>
              Spara Bakgrund
            </Button>
        </footer>
      </div>
    </div>
  );
};
