import React, { useState } from 'react';
import { Input } from '../../../../components/common/Input';
import { FullscreenImageViewer } from '../../../../components/common/FullscreenImageViewer';
import { MagnifyingGlassPlusIcon } from './PostCardIcons';

interface PostImageProps {
  dataUrl: string;
  name: string;
  tags: string[];
  suggestedGeotags?: string[];
  currentUserId: string;
  uploadedByUserId: string;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

export const PostImage: React.FC<PostImageProps> = ({
  dataUrl,
  name,
  tags,
  suggestedGeotags,
  currentUserId,
  uploadedByUserId,
  onAddTag,
  onRemoveTag,
}) => {
  const [tagInputOnHover, setTagInputOnHover] = useState('');
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  const handleAddTagFromHoverInput = async () => {
    await onAddTag(tagInputOnHover);
    setTagInputOnHover('');
  };

  const handleOpenFullscreenViewer = (url: string) => {
    setFullscreenImageUrl(url);
  };

  const handleCloseFullscreenViewer = () => {
    setFullscreenImageUrl(null);
  };

  const isUploader = currentUserId === uploadedByUserId;
  const availableSuggestedTags = suggestedGeotags?.filter(sg => !tags.includes(sg.toLowerCase())) || [];

  return (
    <>
      <div className="my-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700/50 shadow-md">
        <div className="relative group">
          <img src={dataUrl} alt={name} className="w-full h-auto object-contain block max-h-[70vh]" />
          
          {/* Fullscreen Button */}
          <button
            onClick={() => handleOpenFullscreenViewer(dataUrl)}
            className="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
            title="Visa i helskärm"
            aria-label="Visa bild i helskärm"
          >
            <MagnifyingGlassPlusIcon className="w-5 h-5" />
          </button>

          {/* Tag Management Overlay on Hover - only for uploader */}
          {isUploader && (
            <div 
              className="absolute bottom-0 left-0 right-0 p-3 bg-black/50 backdrop-blur-sm 
                         opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-b-lg"
            >
              <div className="relative mb-2">
                <Input
                  type="text"
                  placeholder="Skriv ny tagg..."
                  value={tagInputOnHover}
                  onChange={(e) => setTagInputOnHover(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTagFromHoverInput(); }}}
                  className="w-full text-sm !py-1.5 !px-2.5 bg-white/20 backdrop-blur-sm text-white placeholder-slate-300 border-white/30 focus:border-white/70 focus:ring-white/70 pr-20"
                />
                <button 
                  type="button"
                  onClick={handleAddTagFromHoverInput}
                  disabled={!tagInputOnHover.trim()}
                  className="absolute top-1/2 right-2 -translate-y-1/2 px-2.5 py-0.5 text-xs whitespace-nowrap 
                             bg-white/10 hover:bg-white/20 text-slate-100 hover:text-white 
                             rounded-md border border-white/20 focus:outline-none focus:ring-1 focus:ring-white/50 
                             transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Lägg till
                </button>
              </div>

              {availableSuggestedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-xs text-slate-200 mr-1">Förslag:</span>
                  {availableSuggestedTags.map(suggTag => (
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
          <div className="flex flex-wrap gap-2 p-3 border-t border-border-color dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50">
            {tags.map(tag => (
              <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-primary dark:text-blue-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
                </svg>
                {tag}
                {isUploader && (
                  <button 
                    onClick={() => onRemoveTag(tag)} 
                    className="ml-1.5 text-primary/70 dark:text-blue-300/70 hover:text-primary dark:hover:text-blue-300 focus:outline-none" 
                    aria-label={`Ta bort tagg ${tag}`}
                    title={`Ta bort tagg ${tag}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </div>

      {fullscreenImageUrl && (
        <FullscreenImageViewer
          imageUrl={fullscreenImageUrl}
          imageName={name}
          isOpen={!!fullscreenImageUrl}
          onClose={handleCloseFullscreenViewer}
        />
      )}
    </>
  );
}; 