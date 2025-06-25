import React from 'react';
import { User } from '../../../../types';
import { Button } from '../../../../components/common/Button';
import { EditIcon } from './PostCardIcons';

interface PostHeaderProps {
  creator: User | null;
  isLoadingCreator: boolean;
  dateTaken?: string;
  currentUserId: string;
  uploadedByUserId: string;
  onNavigateToEdit: () => void;
}

const renderTimestamp = (isoDateString?: string) => {
  if (!isoDateString) return null;
  const date = new Date(isoDateString);
  return (
    <span className="text-xs text-gray-400 dark:text-slate-500 ml-2" title={date.toLocaleString('sv-SE')}>
      {date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
    </span>
  );
};

const renderUserAvatar = (user: User | null) => {
  if (!user) return <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex-shrink-0 animate-pulse"></div>;
  return (
    <div className={`w-8 h-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-sm`} title={user.name}>
      {user.initials}
    </div>
  );
};

export const PostHeader: React.FC<PostHeaderProps> = ({
  creator,
  isLoadingCreator,
  dateTaken,
  currentUserId,
  uploadedByUserId,
  onNavigateToEdit,
}) => {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center space-x-2">
        {isLoadingCreator ? renderUserAvatar(null) : renderUserAvatar(creator)}
        <div>
          <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
            {isLoadingCreator ? 'Laddar...' : creator?.name || 'Okänd Användare'}
          </span>
          {renderTimestamp(dateTaken)}
        </div>
      </div>
      {currentUserId === uploadedByUserId && (
        <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="!rounded-full !p-2">
          <EditIcon />
        </Button>
      )}
    </div>
  );
}; 