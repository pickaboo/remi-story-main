import React from 'react';

interface TrainingFeatureCardProps {
  enabled: boolean;
  onToggle: () => void;
  onInfo: () => void;
}

export const TrainingFeatureCard: React.FC<TrainingFeatureCardProps> = ({ enabled, onToggle, onInfo }) => (
  <div className={`relative rounded-xl border p-4 shadow-sm flex flex-col items-center justify-between w-40 h-36 transition-all ${enabled ? 'border-primary ring-2 ring-primary/40 bg-primary/5' : 'border-slate-200 bg-white dark:bg-dark-bg'}`}>
    <div className="flex items-center w-full justify-between mb-2">
      <span className="text-lg font-semibold text-slate-700 dark:text-slate-200">Träning</span>
      <button onClick={onInfo} className="ml-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700" title="Vad är detta?">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" /></svg>
      </button>
    </div>
    <div className="flex-1 flex flex-col items-center justify-center">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-primary mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a2 2 0 012-2h2a2 2 0 012 2v2m-6 0h6m-6 0a2 2 0 01-2-2v-2a2 2 0 012-2h6a2 2 0 012 2v2a2 2 0 01-2 2m-6 0v2a2 2 0 002 2h4a2 2 0 002-2v-2" /></svg>
      <span className="text-xs text-slate-500 dark:text-slate-400 text-center">Logga träningspass i dagboken</span>
    </div>
    <button
      onClick={onToggle}
      className={`mt-2 px-3 py-1 rounded-full text-xs font-medium transition-colors ${enabled ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-primary/10'}`}
    >
      {enabled ? 'Aktiverad' : 'Aktivera'}
    </button>
  </div>
); 