import React from 'react';
import { Button } from '../ui';
import { User, UserDescriptionEntry } from '../../types';

interface PostCardCommentsProps {
  comments: UserDescriptionEntry[];
  commenters: Map<string, User>;
  isLoadingCommenters: boolean;
  renderUserAvatar: (user: User | null) => React.ReactNode;
  renderTimestamp: (date: string) => React.ReactNode;
}

export const PostCardComments: React.FC<PostCardCommentsProps> = ({ comments, commenters, isLoadingCommenters, renderUserAvatar, renderTimestamp }) => {
  if (!comments.length) return null;
  return (
    <div className="mt-4 space-y-3 pt-3 border-t border-border-color dark:border-dark-bg/50">
      {comments.map(comment => {
        const commenter = commenters.get(comment.userId);
        return (
          <div key={`${comment.userId}-${comment.createdAt}`} className="flex items-start space-x-2">
            {isLoadingCommenters && !commenter ? renderUserAvatar(null) : renderUserAvatar(commenter || null)}
            <div className="bg-slate-100 dark:bg-dark-bg/50 p-2.5 rounded-lg flex-grow shadow-sm">
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
    </div>
  );
}; 