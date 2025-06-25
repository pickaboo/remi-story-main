import React from 'react';
import { TagIcon, RemoveIcon } from './PostCardIcons';

interface PostTagsProps {
  tags: string[];
  currentUserId: string;
  uploadedByUserId: string;
  onRemoveTag: (tag: string) => void;
  className?: string;
}

export const PostTags: React.FC<PostTagsProps> = ({
  tags,
  currentUserId,
  uploadedByUserId,
  onRemoveTag,
  className = "",
}) => {
  if (tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tags.map(tag => (
        <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
          <TagIcon />
          {tag}
          {currentUserId === uploadedByUserId && (
            <button 
              onClick={() => onRemoveTag(tag)} 
              className="ml-1.5 text-primary/70 dark:text-blue-300/70 hover:text-primary dark:hover:text-blue-300 focus:outline-none" 
              aria-label={`Ta bort tagg ${tag}`}
              title={`Ta bort tagg ${tag}`}
            >
              <RemoveIcon />
            </button>
          )}
        </span>
      ))}
    </div>
  );
}; 