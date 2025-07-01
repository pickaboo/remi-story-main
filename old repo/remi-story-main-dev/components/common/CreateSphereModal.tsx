
import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { PREDEFINED_SPHERE_GRADIENTS } from '../../constants';
// SphereDisplay could be used for preview, but for simplicity, we'll just show colors.

interface CreateSphereModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateSphere: (name: string, gradientColors: [string, string]) => Promise<void>;
  // currentUserId prop is not strictly needed here if onCreateSphere handles owner assignment
}

export const CreateSphereModal: React.FC<CreateSphereModalProps> = ({ isOpen, onClose, onCreateSphere }) => {
  const [sphereName, setSphereName] = useState('');
  const [selectedGradient, setSelectedGradient] = useState<[string, string] | null>(PREDEFINED_SPHERE_GRADIENTS[0]?.colors || null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!sphereName.trim()) {
      setError("Sfärnamn måste anges.");
      return;
    }
    if (!selectedGradient) {
      setError("Välj en gradient för sfären.");
      return;
    }
    setIsCreating(true);
    try {
      await onCreateSphere(sphereName.trim(), selectedGradient);
      setSphereName('');
      setSelectedGradient(PREDEFINED_SPHERE_GRADIENTS[0]?.colors || null); // Reset to default
      onClose(); // App.tsx will handle navigation/state update
    } catch (err: any) {
      setError(err.message || "Kunde inte skapa sfären.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4" role="dialog" aria-modal="true" aria-labelledby="create-sphere-modal-title">
      <div className="bg-card-bg dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
        <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700 flex justify-between items-center">
          <h2 id="create-sphere-modal-title" className="text-xl font-semibold text-slate-700 dark:text-slate-200">Skapa Ny Sfär</h2>
          <Button variant="ghost" size="sm" onClick={onClose} className="!rounded-full !p-2" aria-label="Stäng modal" disabled={isCreating}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </header>
        
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-6 flex-grow overflow-y-auto">
          <Input
            id="sphereName"
            label="Namn på Sfären"
            type="text"
            value={sphereName}
            onChange={(e) => setSphereName(e.target.value)}
            required
            autoFocus
            disabled={isCreating}
            maxLength={50}
          />

          <div>
            <label className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-2">Välj Utseende (Gradient)</label>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
              {PREDEFINED_SPHERE_GRADIENTS.map((gradient, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => setSelectedGradient(gradient.colors)}
                  className={`w-12 h-12 rounded-full transition-all duration-150 ease-in-out focus:outline-none
                              ${selectedGradient && selectedGradient[0] === gradient.colors[0] && selectedGradient[1] === gradient.colors[1]
                                ? 'ring-4 ring-offset-2 ring-primary dark:ring-blue-400 dark:ring-offset-slate-800 scale-110 shadow-lg'
                                : 'hover:scale-110 hover:shadow-md'
                              }`}
                  style={{ backgroundImage: `linear-gradient(to right, ${gradient.colors[0]}, ${gradient.colors[1]})` }}
                  aria-label={`Välj gradient ${gradient.name}`}
                  disabled={isCreating}
                  title={gradient.name}
                >
                  {/* Optional: Add a checkmark or initials preview if needed */}
                </button>
              ))}
            </div>
          </div>
          
          {error && <p className="text-sm text-danger dark:text-red-400">{error}</p>}
        </form>

        <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={isCreating}>Avbryt</Button>
            <Button variant="primary" type="submit" onClick={handleSubmit} isLoading={isCreating} disabled={!sphereName.trim() || !selectedGradient}>
              Skapa Sfär
            </Button>
        </footer>
      </div>
    </div>
  );
};