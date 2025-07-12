import React from 'react';

interface BucketListInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BucketListInfoModal: React.FC<BucketListInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-dark-bg rounded-xl p-8 shadow-xl max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" aria-label="Stäng">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
        <h2 className="text-xl font-bold mb-4 text-primary flex items-center gap-2">
          <span className="inline-flex items-center justify-center text-lg">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 block text-accent dark:text-accent" aria-label="bucket-list-target">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </span>
          Bucketlist
        </h2>
        <p className="mb-2 text-slate-700 dark:text-slate-200">En bucketlist är en inspirerande lista över saker du vill uppleva, uppnå eller drömmer om att göra i livet. Lägg till dina mål, bocka av när du klarat dem och låt dig motiveras av dina drömmar!</p>
        <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300 text-sm mb-4">
          <li>Samla stora och små drömmar på ett ställe</li>
          <li>Följ din utveckling och bocka av mål</li>
          <li>Få inspiration till nya äventyr</li>
        </ul>
        <div className="flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded bg-accent text-white hover:bg-accent/90">Stäng</button>
        </div>
      </div>
    </div>
  );
}; 