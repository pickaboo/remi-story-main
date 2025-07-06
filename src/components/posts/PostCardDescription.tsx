import React from 'react';
import { AudioPlayerButton } from '../ui';
import { User } from '../../types';

interface PostCardDescriptionProps {
  description?: string;
  audioRecUrl?: string | undefined;
  name: string;
  creator: User | null;
}

export const PostCardDescription: React.FC<PostCardDescriptionProps> = ({ description, audioRecUrl, name, creator }) => {
  return (
    <div className="mb-3 prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
      {description && <p>{description}</p>}
      {audioRecUrl && (
        <div className="mt-2">
          <AudioPlayerButton audioUrl={audioRecUrl} ariaLabel={`Ljudinspelning från ${creator?.name || 'Okänd Användare'}`} />
        </div>
      )}
    </div>
  );
}; 