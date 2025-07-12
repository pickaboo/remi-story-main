import React from 'react';

interface TrainingInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrainingInfoModal: React.FC<TrainingInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 min-h-screen">
      <div className="bg-white dark:bg-dark-bg rounded-xl shadow-2xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">×</button>
        <h2 className="text-xl font-semibold mb-4">Vad är Träningsdagbok?</h2>
        <p className="text-slate-700 dark:text-slate-200 mb-2">Med träningsdagboken kan du logga dina träningspass direkt i dagboken. Lägg till pass, typ av träning, tid och distans/vikt/reps. Perfekt för att följa din utveckling över tid!</p>
        <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 text-sm mb-4">
          <li>Fritt textfält för dagens träningskänsla</li>
          <li>Tabell för att logga flera pass per dag</li>
          <li>Stöd för olika träningsformer</li>
        </ul>
        <button onClick={onClose} className="mt-4 px-4 py-2 rounded bg-primary text-white">Stäng</button>
      </div>
    </div>
  );
} 