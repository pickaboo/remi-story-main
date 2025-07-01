import React from 'react';
import { User } from '../../../types';
import { TextArea } from '../../../common/components/TextArea';
import { Button } from '../../../common/components/Button';
import { AudioPlayerButton } from '../../../common/components/AudioPlayerButton';
import { useAudioRecorder } from '../../../common/hooks/useAudioRecorder';
import { MicIcon, StopIcon } from './PostCardIcons';

interface CommentInputProps {
  postId: string;
  currentUser: User;
  isLoadingCreator: boolean;
  placeholder?: string;
  isUploaderDescription?: boolean;
  onSubmit: (text: string, audioUrl?: string) => Promise<void>;
  className?: string;
}

const renderUserAvatar = (user: User | null) => {
  if (!user) return <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-slate-600 flex-shrink-0 animate-pulse"></div>;
  return (
    <div className={`w-8 h-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center font-semibold text-xs flex-shrink-0 shadow-sm`} title={user.name}>
      {user.initials}
    </div>
  );
};

export const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  currentUser,
  isLoadingCreator,
  placeholder = "Berätta vad du vet om bilden....",
  isUploaderDescription = false,
  onSubmit,
  className = "",
}) => {
  const [newCommentText, setNewCommentText] = React.useState('');
  const [isCommenting, setIsCommenting] = React.useState(false);
  const commentAudioRecorder = useAudioRecorder();

  React.useEffect(() => {
    if (commentAudioRecorder.transcribedText && (!commentAudioRecorder.audioUrl || newCommentText.trim() === '')) {
      setNewCommentText(commentAudioRecorder.transcribedText);
    }
  }, [commentAudioRecorder.transcribedText, commentAudioRecorder.audioUrl, newCommentText]);

  const handleNewCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewCommentText(e.target.value);
  };

  const handleSubmit = async () => {
    if (!currentUser || (!newCommentText.trim() && !commentAudioRecorder.audioUrl)) return;
    setIsCommenting(true);
    commentAudioRecorder.stopRecording();

    await onSubmit(newCommentText.trim(), commentAudioRecorder.audioUrl || undefined);
    
    setNewCommentText('');
    commentAudioRecorder.resetAudio();
    setIsCommenting(false);
  };

  const handleResetAudioForInput = () => {
    commentAudioRecorder.resetAudio();
    setNewCommentText('');
  };

  const canSubmitInput = !isCommenting && (newCommentText.trim() !== '' || !!commentAudioRecorder.audioUrl);
  const inputId = isUploaderDescription ? `uploaderDesc-${postId}` : `comment-${postId}`;
  const buttonText = isUploaderDescription ? 'Publicera beskrivning' : 'Publicera kommentar';
  const buttonVariant = isUploaderDescription ? 'primary' : 'secondary';

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-start space-x-2">
        {isLoadingCreator ? renderUserAvatar(null) : renderUserAvatar(currentUser)}
        <div className="relative flex-grow">
          <TextArea
            id={inputId}
            placeholder={placeholder}
            value={newCommentText}
            onChange={handleNewCommentTextChange}
            className={`pr-12 ${isUploaderDescription ? 'bg-input-bg dark:bg-slate-700' : ''}`}
            disabled={isCommenting}
          />
          {commentAudioRecorder.audioUrl ? (
            <AudioPlayerButton
              audioUrl={commentAudioRecorder.audioUrl}
              ariaLabel={`Ljudinspelning för ${isUploaderDescription ? 'beskrivning' : 'kommentar'}`}
              buttonSize="sm"
              className="!rounded-full !p-2 flex-shrink-0 absolute top-1/2 right-2 -translate-y-1/2"
            />
          ) : (
            <Button
              type="button"
              onClick={commentAudioRecorder.isRecording ? commentAudioRecorder.stopRecording : commentAudioRecorder.startRecording}
              variant={commentAudioRecorder.isRecording ? "danger" : "ghost"}
              size="sm"
              className="!rounded-full !px-2 !py-1.5 flex-shrink-0 absolute top-1/2 right-2 -translate-y-1/2"
              aria-label={commentAudioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
              disabled={isCommenting || commentAudioRecorder.permissionGranted === false}
            >
              {commentAudioRecorder.isRecording ? <StopIcon /> : <MicIcon />}
            </Button>
          )}
        </div>
      </div>
      {(commentAudioRecorder.error || commentAudioRecorder.permissionGranted === false || commentAudioRecorder.audioUrl) && (
        <div className="ml-10 -mt-1 space-y-0.5">
          {commentAudioRecorder.permissionGranted === false && !commentAudioRecorder.audioUrl && (
            <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>
          )}
          {commentAudioRecorder.error && (
            <p className="text-xs text-danger dark:text-red-400">{commentAudioRecorder.error}</p>
          )}
          {commentAudioRecorder.audioUrl && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
              <Button 
                type="button" 
                onClick={handleResetAudioForInput} 
                variant="ghost" 
                size="sm" 
                className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10"
              >
                Ta bort
              </Button>
            </div>
          )}
        </div>
      )}
      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          isLoading={isCommenting} 
          disabled={!canSubmitInput} 
          variant={buttonVariant} 
          size="md"
          className="rounded-lg bg-primary text-white hover:bg-primary-hover transition"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
}; 