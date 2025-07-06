import React from 'react';

interface PostCardTagsProps {
  tags: string[];
  currentUserId: string;
  uploadedByUserId: string;
  onRemoveTag: (tag: string) => void;
}

export const PostCardTags: React.FC<PostCardTagsProps> = ({ tags, currentUserId, uploadedByUserId, onRemoveTag }) => {
  const safeUploadedByUserId = uploadedByUserId || '';
  if (!tags.length) return null;
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {tags.map(tag => (
        <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
          <span className="mr-1">#</span>{tag}
          {currentUserId === safeUploadedByUserId && (
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
  );
}; 