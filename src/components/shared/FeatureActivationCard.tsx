import React from 'react';

interface FeatureActivationCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  onInfo?: () => void;
  accentColor?: string; // t.ex. 'accent', 'primary', 'green', 'yellow'
}

export const FeatureActivationCard: React.FC<FeatureActivationCardProps> = ({
  icon,
  title,
  description,
  enabled,
  onToggle,
  onInfo,
  accentColor = 'accent',
}) => {
  const getBorderAndBgClasses = () => {
    if (!enabled) return 'border-slate-200 dark:border-slate-700 bg-white dark:bg-dark-bg';
    
    switch (accentColor) {
      case 'primary':
        return 'border-primary bg-primary/10';
      case 'accent':
        return 'border-accent bg-accent/10';
      case 'green':
        return 'border-green-500 bg-green-500/10';
      case 'yellow':
        return 'border-yellow-500 bg-yellow-500/10';
      default:
        return 'border-accent bg-accent/10';
    }
  };

  const getButtonClasses = () => {
    if (!enabled) return 'bg-slate-200 text-slate-700 hover:bg-slate-300';
    
    switch (accentColor) {
      case 'primary':
        return 'bg-primary text-white';
      case 'accent':
        return 'bg-accent text-white';
      case 'green':
        return 'bg-green-500 text-white';
      case 'yellow':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-accent text-white';
    }
  };

  return (
    <div className={`rounded-xl border-2 p-5 flex flex-col items-start shadow-sm transition-all w-64 ${getBorderAndBgClasses()}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`inline-block w-8 h-8 rounded-full flex items-center justify-center text-xl bg-gradient-to-tr from-yellow-300 to-pink-400`}>{icon}</span>
        <span className="text-lg font-semibold text-slate-800 dark:text-slate-100">{title}</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">{description}</p>
      <div className="flex gap-2 mt-auto">
              <button
        className={`px-3 py-1 rounded text-xs font-medium ${getButtonClasses()}`}
        onClick={onToggle}
      >
        {enabled ? 'Aktiverad' : 'Aktivera'}
      </button>
        {onInfo && (
          <button className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 hover:bg-slate-200" onClick={onInfo}>Info</button>
        )}
      </div>
    </div>
  );
}; 