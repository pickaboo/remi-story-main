import React from 'react';
import { Button } from '../ui';
import { User } from '../../types';

interface PostCardHeaderProps {
  creator: User | null;
  isLoadingCreator: boolean;
  dateTaken: string;
  onNavigateToEdit?: () => void;
  isUploader: boolean;
}

export const PostCardHeader: React.FC<PostCardHeaderProps> = ({
  creator,
  isLoadingCreator,
  dateTaken,
  onNavigateToEdit,
  isUploader,
}) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center space-x-2">
      {isLoadingCreator ? (
        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-dark-bg flex-shrink-0 animate-pulse"></div>
      ) : (
        <div
          className={`w-8 h-8 rounded-full ${creator?.avatarColor || 'bg-slate-400'} text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-sm`}
          title={creator?.name}
        >
          {creator?.initials}
        </div>
      )}
      <div>
        <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
          {isLoadingCreator ? 'Laddar...' : creator?.name || 'Okänd Användare'}
        </span>
        <span className="ml-2 text-xs text-slate-400 dark:text-slate-400">{dateTaken || ''}</span>
      </div>
    </div>
    {isUploader && onNavigateToEdit && (
      <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="!rounded-full !p-2">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
      </Button>
    )}
  </div>
); 