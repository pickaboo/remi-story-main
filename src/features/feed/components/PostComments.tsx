import React from 'react';
import { User, UserDescriptionEntry } from '../../../types';
import { Button } from '../../../common/components/Button';

interface PostCommentsProps {
  comments: UserDescriptionEntry[];
  commenters: Map<string, User>;
  isLoadingCommenters: boolean;
  showAllComments: boolean;
  setShowAllComments: (show: boolean) => void;
}

const renderUserAvatar = (user: User | null) => {
  if (!user) return <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex-shrink-0 animate-pulse"></div>;
  return (
    <div className={`w-8 h-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-sm`} title={user.name}>
      {user.initials}
    </div>
  );
};

const renderTimestamp = (isoDateString?: string) => {
  if (!isoDateString) return null;
  const date = new Date(isoDateString);
  return (
    <span className="text-xs text-gray-400 dark:text-slate-500 ml-2" title={date.toLocaleString('sv-SE')}>
      {date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
    </span>
  );
};

export const PostComments: React.FC<PostCommentsProps> = ({
  comments,
  commenters,
  isLoadingCommenters,
  showAllComments,
  setShowAllComments,
}) => {
  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  if (comments.length === 0) return null;

  return (
    <div className="mt-4 space-y-3 pt-3 border-t border-border-color dark:border-slate-700">
      {displayedComments.map(comment => {
        const commenter = commenters.get(comment.userId);
        return (
          <div key={`${comment.userId}-${comment.createdAt}`} className="flex items-start space-x-2">
            {isLoadingCommenters && !commenter ? renderUserAvatar(null) : renderUserAvatar(commenter || null)}
            <div className="bg-slate-100 dark:bg-slate-700/50 p-2.5 rounded-lg flex-grow shadow-sm">
              <div className="flex items-baseline space-x-1.5">
                <span className="font-semibold text-xs text-slate-700 dark:text-slate-200">
                  {isLoadingCommenters && !commenter ? 'Laddar...' : commenter?.name || 'Okänd Användare'}
                </span>
                {renderTimestamp(comment.createdAt)}
              </div>
              {comment.description && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{comment.description}</p>}
              {comment.audioRecUrl && (
                <div className="mt-1.5">
                  <audio controls src={comment.audioRecUrl} className="w-full h-8" aria-label={`Kommentar från ${commenter?.name || 'Okänd Användare'}`}></audio>
                </div>
              )}
            </div>
          </div>
        );
      })}
      {comments.length > 2 && (
        <Button variant="ghost" size="sm" onClick={() => setShowAllComments(!showAllComments)} className="text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 w-full mt-2">
          {showAllComments ? 'Visa färre kommentarer' : `Visa alla ${comments.length} kommentarer`}
        </Button>
      )}
    </div>
  );
}; 