import React from 'react';

interface CreationOptionCardProps {
  imageUrl: string;
  title: string;
  tagline: string;
  actionText?: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoonText?: string;
}

export const CreationOptionCard: React.FC<CreationOptionCardProps> = ({ 
  imageUrl, title, tagline, actionText, onClick, disabled = false, comingSoonText 
}) => {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`group relative bg-slate-200 dark:bg-slate-700 rounded-2xl shadow-xl 
                 ${disabled 
                    ? 'opacity-60 cursor-default' 
                    : 'hover:shadow-primary/30 dark:hover:shadow-blue-400/30 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-primary dark:focus-visible:ring-blue-400 focus-visible:ring-offset-card-bg dark:focus-visible:ring-offset-slate-900'}
                 overflow-hidden aspect-[4/5] sm:aspect-square md:aspect-[4/5]
                 transition-all duration-300 ease-in-out flex flex-col`}
      role={!disabled ? "button" : undefined}
      tabIndex={!disabled ? 0 : undefined}
      onKeyDown={!disabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-label={!disabled ? `Skapa ${title}` : `${title} (kommer snart)`}
    >
      <img 
        src={imageUrl} 
        alt="" // Decorative, information provided by text
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out 
                   ${!disabled ? 'group-hover:scale-105' : ''} ${disabled ? 'grayscale' : ''}`}
      />
      
      {/* Scrim and Text Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-center z-10 
                      bg-gradient-to-t from-black/80 via-black/50 to-transparent
                      flex flex-col justify-end items-center h-2/3 sm:h-3/5"> {/* Adjust height of text area */}
        <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-200 mt-1.5 mb-2 sm:mb-3">{tagline}</p>
        
        {disabled && comingSoonText && (
          <div className="text-sm font-semibold text-amber-300">
            {comingSoonText}
          </div>
        )}

        {!disabled && actionText && (
          <div 
            className="text-sm font-medium text-blue-300 inline-flex items-center 
                       group-hover:text-blue-200 transition-colors"
          >
            {actionText}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}; 