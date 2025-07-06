import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { ImageRecord, User, UserDescriptionEntry } from '../../types';
import { saveImage } from '../../services/storageService';
import { getUserById } from '../../services/userService';
import { TextArea } from '../ui';
import { Button, Input } from '../ui';
import { AudioPlayerButton } from '../ui';
import { FullscreenImageViewer } from '../modals';
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { usePostCard } from '../../hooks/usePostCard';
import { PostCardHeader } from './PostCardHeader';
import { PostCardImageSection } from './PostCardImageSection';
import { PostCardTags } from './PostCardTags';
import { PostCardDescription } from './PostCardDescription';
import { PostCardComments } from './PostCardComments';
import { CommentInput } from '../comments/CommentInput';

interface PostCardProps {
  post: ImageRecord;
  currentUser: User;
  onPostUpdated: (updatedPost: ImageRecord) => void;
  onNavigateToEdit: () => void;
}

// Local SVG Icon for fullscreen button
const MagnifyingGlassPlusIcon: React.FC<{ className?: string }> = memo(({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
    </svg>
));

MagnifyingGlassPlusIcon.displayName = 'MagnifyingGlassPlusIcon';

export const PostCard: React.FC<PostCardProps> = memo(({ post, currentUser, onPostUpdated, onNavigateToEdit }) => {
  const {
    // State from hook
    isExpanded,
    showFullImage,
    isLoadingCreator,
    creator,
    newCommentText,
    isCommenting,
    commentAudioRecorder,
    comments,
    isLoadingComments,
    isCreator,
    canSubmitInput,

    // Handlers from hook
    handleNewCommentTextChange,
    handleResetAudioForInput,
    handleAddComment,
    handleToggleExpanded,
    handleShowFullImage,
    handleHideFullImage,
    handleDeletePost,
    handleUpdatePost,
    handleDeleteComment,
    handleUpdateComment,
  } = usePostCard({
    post,
    currentUser,
    onPostUpdate: onPostUpdated,
  });

  // Local state that's still needed
  const [showAllComments, setShowAllComments] = useState(false);
  const [tagInputOnHover, setTagInputOnHover] = useState('');
  const [commenters, setCommenters] = useState<Map<string, User>>(new Map());
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(true);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (post.uploadedByUserId) {
      getUserById(post.uploadedByUserId).then(user => {
        // This would be handled by the hook in a future iteration
      });
    }
  }, [post.uploadedByUserId]);

  const mainPostDescription = useMemo(() => {
    const userDescriptionsArray = Array.isArray(post.userDescriptions) ? post.userDescriptions : [];
    return userDescriptionsArray.find(ud => ud.userId === post.uploadedByUserId);
  }, [post.userDescriptions, post.uploadedByUserId]);

  useEffect(() => {
    const fetchCommenters = async () => {
      if (Array.isArray(comments) && comments.length > 0) {
        setIsLoadingCommenters(true);
        const uniqueCommenterIds = Array.from(new Set(comments.map(c => c.userId)));
        const newCommentersMap = new Map<string, User>();
        for (const id of uniqueCommenterIds) {
          const user = await getUserById(id);
          if (user) newCommentersMap.set(id, user);
        }
        setCommenters(newCommentersMap);
        setIsLoadingCommenters(false);
      } else {
        setCommenters(new Map());
        setIsLoadingCommenters(false);
      }
    };
    fetchCommenters();
  }, [comments]);

  const displayedComments = useMemo(() => 
    showAllComments ? comments : comments.slice(0, 2),
    [showAllComments, comments]
  );

  const hasImage = useMemo(() => 
    post.dataUrl && post.dataUrl.trim() !== '' && post.width != null && post.height != null && post.width > 0,
    [post.dataUrl, post.width, post.height]
  );

  const showUploaderDescriptionInput = useMemo(() => 
    hasImage &&
    currentUser.id === post.uploadedByUserId &&
    (!mainPostDescription || (!mainPostDescription.description.trim() && !mainPostDescription.audioRecUrl)),
    [hasImage, currentUser.id, post.uploadedByUserId, mainPostDescription]
  );

  const handleSaveUploaderDescription = useCallback(async () => {
    if (!currentUser || (!newCommentText.trim() && !commentAudioRecorder.audioUrl)) return;
    commentAudioRecorder.stopRecording();

    const updatedDescriptions = [...(Array.isArray(post.userDescriptions) ? post.userDescriptions : [])];
    let uploaderEntry = updatedDescriptions.find(ud => ud.userId === currentUser.id);

    if (uploaderEntry) {
      uploaderEntry.description = newCommentText.trim();
      uploaderEntry.audioRecUrl = commentAudioRecorder.audioUrl || uploaderEntry.audioRecUrl;
      if (commentAudioRecorder.audioUrl) uploaderEntry.audioRecUrl = commentAudioRecorder.audioUrl;
      else if (!newCommentText.trim() && !uploaderEntry.audioRecUrl ) uploaderEntry.audioRecUrl = undefined;
      uploaderEntry.createdAt = new Date().toISOString();
    } else {
      updatedDescriptions.push({
        userId: currentUser.id,
        description: newCommentText.trim(),
        audioRecUrl: commentAudioRecorder.audioUrl || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedPost = { ...post, userDescriptions: updatedDescriptions };
    await saveImage(updatedPost);
    onPostUpdated(updatedPost);
    commentAudioRecorder.resetAudio();
  }, [currentUser, newCommentText, commentAudioRecorder, post, onPostUpdated]);

  const handleAddTag = useCallback(async (tag: string) => {
    const newTag = tag.trim().toLowerCase();
    if (newTag && !post.tags.includes(newTag)) {
      const updatedPost = { ...post, tags: [...post.tags, newTag] };
      await saveImage(updatedPost);
      onPostUpdated(updatedPost);
    }
  }, [post, onPostUpdated]);

  const handleAddTagFromHoverInput = useCallback(async () => {
    await handleAddTag(tagInputOnHover);
    setTagInputOnHover('');
  }, [handleAddTag, tagInputOnHover]);
  
  const handleRemoveTag = useCallback(async (tagToRemove: string) => {
    const updatedPost = { ...post, tags: post.tags.filter(tag => tag !== tagToRemove) };
    await saveImage(updatedPost);
    onPostUpdated(updatedPost);
  }, [post, onPostUpdated]);

  const handleOpenFullscreenViewer = useCallback((url: string | undefined) => {
    if (url) {
        setFullscreenImageUrl(url);
    }
  }, []);

  const renderUserAvatar = (user: User | null) => {
    if (!user) {
      return (
        <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 flex items-center justify-center text-sm font-medium text-slate-600 dark:text-slate-300">
          ?
        </div>
      );
    }

    return (
      <div className={`w-8 h-8 rounded-full ${user.avatarColor} flex items-center justify-center text-sm font-medium text-white`}>
        {user.initials}
      </div>
    );
  };

  return (
    <div className="bg-card-bg dark:bg-dark-bg rounded-lg shadow-md overflow-hidden">
      <PostCardHeader
        creator={creator}
        isLoadingCreator={isLoadingCreator}
        dateTaken={post.dateTaken || ''}
        onNavigateToEdit={onNavigateToEdit}
        isUploader={isCreator}
      />

      <PostCardImageSection
        dataUrl={post.dataUrl}
        name={post.name}
        hasImage={!!hasImage}
        onOpenFullscreen={handleOpenFullscreenViewer}
        onAddTag={handleAddTag}
        onRemoveTag={handleRemoveTag}
        tags={post.tags}
        currentUserId={currentUser.id}
        uploadedByUserId={post.uploadedByUserId}
        suggestedGeotags={post.suggestedGeotags?.filter(sg => !post.tags.includes(sg.toLowerCase()))}
        tagInputOnHover={tagInputOnHover}
        setTagInputOnHover={setTagInputOnHover}
        handleAddTagFromHoverInput={handleAddTagFromHoverInput}
      />

      <div className="p-4 space-y-4">
        <PostCardDescription
          description={mainPostDescription?.description || ''}
          audioRecUrl={mainPostDescription?.audioRecUrl || ''}
          name={post.name || ''}
          creator={creator}
        />

        <PostCardComments
          comments={displayedComments}
          commenters={commenters}
          isLoadingCommenters={isLoadingCommenters}
          renderUserAvatar={renderUserAvatar}
          renderTimestamp={(isoDateString?: string) => {
            if (!isoDateString) return null;
            const date = new Date(isoDateString);
            return (
              <span className="text-xs text-gray-400 dark:text-slate-500 ml-2" title={date.toLocaleString('sv-SE')}>
                {date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
              </span>
            );
          }}
        />
        {comments.length > 2 && (
          <Button variant="ghost" size="sm" onClick={() => setShowAllComments(!showAllComments)} className="text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 w-full mt-2">
            {showAllComments ? 'Visa färre kommentarer' : `Visa alla ${comments.length} kommentarer`}
          </Button>
        )}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          {showUploaderDescriptionInput ? (
            // Uploader Description Input
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                {renderUserAvatar(currentUser)}
                <div className="relative flex-grow">
                  <TextArea
                    id={`uploader-description-${post.id}`}
                    placeholder="Berätta vad du vet om bilden...."
                    value={newCommentText}
                    onChange={handleNewCommentTextChange}
                    className="pr-12"
                    disabled={isCommenting}
                  />
                  {commentAudioRecorder.audioUrl ? (
                    <AudioPlayerButton
                      audioUrl={commentAudioRecorder.audioUrl}
                      ariaLabel="Ljudinspelning för beskrivning"
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
                      {commentAudioRecorder.isRecording ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>}
                    </Button>
                  )}
                </div>
              </div>
              {(commentAudioRecorder.error || commentAudioRecorder.permissionGranted === false || commentAudioRecorder.audioUrl) && (
                <div className="ml-10 -mt-1 space-y-0.5">
                  {commentAudioRecorder.permissionGranted === false && !commentAudioRecorder.audioUrl && <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>}
                  {commentAudioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{commentAudioRecorder.error}</p>}
                  {commentAudioRecorder.audioUrl && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
                      <Button type="button" onClick={handleResetAudioForInput} variant="ghost" size="sm" className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10">Ta bort</Button>
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end">
                <Button onClick={handleSaveUploaderDescription} isLoading={isCommenting} disabled={!canSubmitInput} variant="secondary" size="md">
                  Spara beskrivning
                </Button>
              </div>
            </div>
          ) : (
            // Standard Comment Input
            <CommentInput
              value={newCommentText}
              onChange={handleNewCommentTextChange}
              onSubmit={handleAddComment}
              isLoading={isCommenting}
              disabled={isCommenting}
              audioRecorder={commentAudioRecorder}
              handleResetAudio={handleResetAudioForInput}
              canSubmit={canSubmitInput}
              placeholder="Skriv en kommentar..."
              id={post.id ? `comment-input-${post.id}` : undefined}
            />
          )}
        </div>
      </div>

      {fullscreenImageUrl && (
        <FullscreenImageViewer
          imageUrl={fullscreenImageUrl}
          imageName={post.name}
          isOpen={true}
          onClose={() => setFullscreenImageUrl(null)}
        />
      )}
    </div>
  );
});

PostCard.displayName = 'PostCard';
