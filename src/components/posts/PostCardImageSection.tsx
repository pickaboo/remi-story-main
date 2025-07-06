import React from 'react';
import { Button, Input } from '../ui';

interface PostCardImageSectionProps {
  dataUrl?: string;
  name: string;
  hasImage: boolean;
  onOpenFullscreen: (url?: string) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  tags: string[];
  currentUserId: string;
  uploadedByUserId: string;
  suggestedGeotags?: string[];
  tagInputOnHover: string;
  setTagInputOnHover: (val: string) => void;
  handleAddTagFromHoverInput: () => void;
}

export const PostCardImageSection: React.FC<PostCardImageSectionProps> = ({
  dataUrl,
  name,
  hasImage,
  onOpenFullscreen,
  onAddTag,
  onRemoveTag,
  tags,
  currentUserId,
  uploadedByUserId,
  suggestedGeotags = [],
  tagInputOnHover,
  setTagInputOnHover,
  handleAddTagFromHoverInput,
}) => {
  if (!hasImage || !dataUrl) return null;
  return (
    <div className="my-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-dark-bg/50 shadow-md">
      <div className="relative group">
        <img src={dataUrl} alt={name} className="w-full h-auto object-contain block max-h-[70vh]" />
        {/* Fullscreen Button */}
        <button
          onClick={() => onOpenFullscreen(dataUrl)}
          className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
          title="Visa i helskärm"
          aria-label="Visa bild i helskärm"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" /></svg>
        </button>
        {/* Tag Management Overlay on Hover - only for uploader */}
        {currentUserId === uploadedByUserId && (
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg">
            <div className="relative mb-2">
              <Input
                type="text"
                placeholder="Skriv ny tagg..."
                value={tagInputOnHover}
                onChange={e => setTagInputOnHover(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagFromHoverInput(); }}}
                className="w-full text-sm !py-1.5 !px-2.5 bg-white/20 backdrop-blur-sm text-white placeholder-slate-300 border-white/30 focus:border-white/70 focus:ring-white/70 pr-20"
              />
              <button
                type="button"
                onClick={handleAddTagFromHoverInput}
                disabled={!tagInputOnHover.trim()}
                className="absolute top-1/2 right-2 -translate-y-1/2 px-2.5 py-0.5 text-xs whitespace-nowrap bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white rounded-md border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lägg till
              </button>
            </div>
            {suggestedGeotags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-slate-200 mr-1">Förslag:</span>
                {suggestedGeotags.map(suggTag => (
                  <button
                    key={suggTag}
                    onClick={() => onAddTag(suggTag)}
                    className="bg-white/20 backdrop-filter backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-xs hover:bg-white/30 transition-colors flex items-center"
                    title={`Lägg till tagg: ${suggTag}`}
                  >
                    <span className="mr-1 opacity-70">+</span>{suggTag}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {/* User-added Tags (always visible if they exist) */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 border-t border-border-color dark:border-dark-bg/50 bg-slate-100 dark:bg-dark-bg/50">
          {tags.map(tag => (
            <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
              <span className="mr-1">#</span>{tag}
              {currentUserId === uploadedByUserId && (
                <button
                  onClick={() => onRemoveTag(tag)}
                  className="ml-1.5 text-primary/70 dark:text-blue-300/70 hover:text-primary dark:hover:text-blue-300 focus:outline-none"
                  aria-label={`Ta bort tagg ${tag}`}
                  title={`Ta bort tagg ${tag}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}; 