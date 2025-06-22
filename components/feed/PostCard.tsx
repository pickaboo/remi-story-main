
import React, { useState, useEffect, useMemo, JSX } from 'react';
import { ImageRecord, User, UserDescriptionEntry } from '../../types';
import { saveImage } from '../../services/storageService';
import { getUserById } from '../../services/userService';
import { TextArea } from '../common/TextArea';
import { Button } from '../common/Button';
import { Input } from '../common/Input'; // Keep for hover input
import { useAudioRecorder } from '../../hooks/useAudioRecorder';
import { AudioPlayerButton } from '../common/AudioPlayerButton';

interface PostCardProps {
  post: ImageRecord;
  currentUser: User;
  onPostUpdated: (updatedPost: ImageRecord) => void;
  onNavigateToEdit: () => void;
}

export function PostCard({ post, currentUser, onPostUpdated, onNavigateToEdit }: PostCardProps): JSX.Element {
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [tagInputOnHover, setTagInputOnHover] = useState('');
  const commentAudioRecorder = useAudioRecorder();

  const [creator, setCreator] = useState<User | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [commenters, setCommenters] = useState<Map<string, User>>(new Map());
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(true);


  useEffect(() => {
    if (post.uploadedByUserId) {
      setIsLoadingCreator(true);
      getUserById(post.uploadedByUserId)
        .then(user => {
          setCreator(user);
        })
        .catch(err => {
          console.error(`Error fetching creator (ID: ${post.uploadedByUserId}) for post ${post.id}:`, err);
          setCreator(null); 
        })
        .finally(() => {
          setIsLoadingCreator(false);
        });
    } else {
      setIsLoadingCreator(false);
      setCreator(null);
    }
  }, [post.id, post.uploadedByUserId]);


  const comments = useMemo(() => {
    const mainDesc = post.userDescriptions.find(ud => ud.userId === post.uploadedByUserId);
    return post.userDescriptions
      .filter(ud => ud !== mainDesc)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [post.userDescriptions, post.uploadedByUserId]);

  const commenterUserIdsString = useMemo(() => {
    const mainDescUserId = post.uploadedByUserId;
    const ids = Array.from(new Set(
        post.userDescriptions
            .filter(ud => ud.userId !== mainDescUserId)
            .map(ud => ud.userId)
    )).sort();
    return JSON.stringify(ids);
  }, [post.userDescriptions, post.uploadedByUserId]);


  useEffect(() => {
    const fetchCommenters = async () => {
      const currentCommenterIds: string[] = JSON.parse(commenterUserIdsString);
      if (currentCommenterIds.length > 0) {
        setIsLoadingCommenters(true);
        try {
          const newCommentersMap = new Map<string, User>();
          for (const id of currentCommenterIds) {
            // Avoid refetching if already present and not stale, or implement smarter caching if needed
            if (!commenters.has(id)) { 
              const user = await getUserById(id);
              if (user) newCommentersMap.set(id, user);
            } else {
              newCommentersMap.set(id, commenters.get(id)!);
            }
          }
          // Only update if the map content has actually changed to avoid potential loops if map reference itself causes issues.
          // This check is somewhat superficial; deep equality would be more robust but expensive.
          if (newCommentersMap.size !== commenters.size || !Array.from(newCommentersMap.keys()).every(key => commenters.has(key))) {
            setCommenters(newCommentersMap);
          }
        } catch (err) {
          console.error(`Error fetching commenters for post ${post.id}:`, err);
          setCommenters(new Map()); 
        } finally {
          setIsLoadingCommenters(false);
        }
      } else {
        if (commenters.size > 0) { // Only clear if not already empty
            setCommenters(new Map());
        }
        setIsLoadingCommenters(false);
      }
    };
    fetchCommenters();
  }, [commenterUserIdsString, post.id]); // Dependencies are correct


  useEffect(() => {
    if (commentAudioRecorder.transcribedText && (!commentAudioRecorder.audioUrl || newCommentText.trim() === '')) {
      setNewCommentText(commentAudioRecorder.transcribedText);
    }
  }, [commentAudioRecorder.transcribedText, commentAudioRecorder.audioUrl, newCommentText]);

  const displayedComments = showAllComments ? comments : comments.slice(0, 2);
  const displayUrl = post.storageUrl || post.dataUrl;
  const hasImage = displayUrl && post.width != null && post.height != null && post.width > 0;

  const mainPostDescription = useMemo(() => {
    return post.userDescriptions.find(ud => ud.userId === post.uploadedByUserId);
  }, [post.userDescriptions, post.uploadedByUserId]);

  const showUploaderDescriptionInput = hasImage &&
    currentUser.id === post.uploadedByUserId &&
    (!mainPostDescription || (!mainPostDescription.description.trim() && !mainPostDescription.audioRecUrl));

  const handleNewCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewCommentText(e.target.value);
  };

  const handleSaveUploaderDescription = async () => {
    if (!currentUser || (!newCommentText.trim() && !commentAudioRecorder.audioUrl)) return;
    setIsCommenting(true);
    commentAudioRecorder.stopRecording();

    const updatedDescriptions = [...post.userDescriptions];
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
    const savedPost = await saveImage({ ...updatedPost, dataUrl: post.dataUrl }); 
    onPostUpdated(savedPost);
    setNewCommentText('');
    commentAudioRecorder.resetAudio();
    setIsCommenting(false);
  };

  const handleAddComment = async () => {
    if (!currentUser || (!newCommentText.trim() && !commentAudioRecorder.audioUrl)) return;
    setIsCommenting(true);
    commentAudioRecorder.stopRecording();

    const newCommentEntry: UserDescriptionEntry = {
      userId: currentUser.id,
      description: newCommentText.trim(),
      audioRecUrl: commentAudioRecorder.audioUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    const updatedPost = { ...post, userDescriptions: [...post.userDescriptions, newCommentEntry] };
    const savedPost = await saveImage({ ...updatedPost, dataUrl: post.dataUrl });
    onPostUpdated(savedPost);
    setNewCommentText('');
    commentAudioRecorder.resetAudio();
    setIsCommenting(false);
  };

  const handleResetAudioForInput = () => {
    commentAudioRecorder.resetAudio();
    setNewCommentText('');
  };
  
  const handleAddTag = async (tag: string) => {
    const newTag = tag.trim().toLowerCase();
    if (newTag && !post.tags.includes(newTag)) {
      const updatedPost = { ...post, tags: [...post.tags, newTag] };
      const savedPost = await saveImage({ ...updatedPost, dataUrl: post.dataUrl });
      onPostUpdated(savedPost);
    }
  };

  const handleAddTagFromHoverInput = async () => {
    await handleAddTag(tagInputOnHover);
    setTagInputOnHover('');
  };
  
  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedPost = { ...post, tags: post.tags.filter(tag => tag !== tagToRemove) };
    const savedPost = await saveImage({ ...updatedPost, dataUrl: post.dataUrl });
    onPostUpdated(savedPost);
  };


  const MicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>;
  const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg>;
  const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-1 text-primary dark:text-blue-300"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>;


  const canSubmitInput = !isCommenting && (newCommentText.trim() !== '' || !!commentAudioRecorder.audioUrl);

  const renderTimestamp = (isoDateString?: string) => {
    if (!isoDateString) return null;
    const date = new Date(isoDateString);
    if (isNaN(date.getTime())) { // Check for invalid date
        return <span className="text-xs text-red-500 dark:text-red-400 ml-2" title={`Ogiltigt datum: ${isoDateString}`}>Ogiltigt datum</span>;
    }
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

  return (
    <div className="bg-card-bg/80 dark:bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-border-color dark:border-slate-700">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isLoadingCreator ? renderUserAvatar(null) : renderUserAvatar(creator)}
          <div>
            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200">
              {isLoadingCreator ? 'Laddar...' : creator?.name || 'Okänd Användare'}
            </span>
            {renderTimestamp(post.dateTaken)}
          </div>
        </div>
        {currentUser.id === post.uploadedByUserId && (
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="!rounded-full !p-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
          </Button>
        )}
      </div>

      {/* Main Post Content */}
      {mainPostDescription && (mainPostDescription.description.trim() || mainPostDescription.audioRecUrl) && (
        <div className="mb-3 prose prose-sm prose-slate dark:prose-invert max-w-none whitespace-pre-wrap">
          <p>{mainPostDescription.description}</p>
          {mainPostDescription.audioRecUrl && (
            <div className="mt-2">
              <audio controls src={mainPostDescription.audioRecUrl} className="w-full h-10" aria-label={`Ljudinspelning från ${creator?.name || 'Okänd Användare'}`}></audio>
            </div>
          )}
        </div>
      )}

      {/* Image, Hover Tag Management, and User-added Tags */}
      {hasImage && displayUrl && (
        <div className="my-4 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-700/50 shadow-md">
          <div className="relative group"> {/* Added group for hover */}
            <img src={displayUrl} alt={post.name} className="w-full h-auto object-contain block max-h-[70vh]" />
            
            {/* Tag Management Overlay on Hover - only for uploader */}
            {currentUser.id === post.uploadedByUserId && (
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
                    className="w-full text-sm !py-1.5 !px-2.5 bg-white/20 backdrop-blur-sm text-white placeholder-slate-300 border-white/30 focus:border-white/70 focus:ring-white/70 pr-20" // Added pr-20 and w-full
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

                {post.suggestedGeotags && post.suggestedGeotags.filter(sg => !post.tags.includes(sg.toLowerCase())).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    <span className="text-xs text-slate-200 mr-1">Förslag:</span>
                    {post.suggestedGeotags.filter(sg => !post.tags.includes(sg.toLowerCase())).map(suggTag => (
                      <button
                        key={suggTag}
                        onClick={() => handleAddTag(suggTag)}
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
          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 border-t border-border-color dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50">
              {post.tags.map(tag => (
                <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
                  <TagIcon />
                  {tag}
                  {currentUser.id === post.uploadedByUserId && (
                     <button 
                        onClick={() => handleRemoveTag(tag)} 
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
          )}
        </div>
      )}

      {/* Tags for non-image posts */}
      {!hasImage && post.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map(tag => (
            <span key={tag} className="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium flex items-center">
              <TagIcon />
              {tag}
               {currentUser.id === post.uploadedByUserId && (
                    <button 
                      onClick={() => handleRemoveTag(tag)} 
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
      )}
      
      {/* Uploader's Description Input or Standard Comment Input */}
      <div className="mt-4 pt-3 border-t border-border-color dark:border-slate-700">
        {showUploaderDescriptionInput ? (
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
                {isLoadingCreator ? renderUserAvatar(null) : renderUserAvatar(currentUser)}
                <div className="relative flex-grow">
                    <TextArea
                        id={`uploaderDesc-${post.id}`}
                        placeholder={post.aiGeneratedPlaceholder || "Säg något om bilden..."}
                        value={newCommentText}
                        onChange={handleNewCommentTextChange}
                        className="pr-12 bg-input-bg dark:bg-slate-700" 
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
                            {commentAudioRecorder.isRecording ? <StopIcon /> : <MicIcon />}
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
                <Button onClick={handleSaveUploaderDescription} isLoading={isCommenting} disabled={!canSubmitInput} variant="primary" size="md">
                    Publicera beskrivning
                </Button>
            </div>
          </div>
        ) : (
          // Standard Comment Input
          <div className="space-y-2">
            <div className="flex items-start space-x-2">
                {isLoadingCreator ? renderUserAvatar(null) : renderUserAvatar(currentUser)}
                <div className="relative flex-grow">
                    <TextArea
                        id={`comment-${post.id}`}
                        placeholder="Berätta vad du vet om bilden...."
                        value={newCommentText}
                        onChange={handleNewCommentTextChange}
                        className="pr-12"
                        disabled={isCommenting}
                    />
                    {commentAudioRecorder.audioUrl ? (
                         <AudioPlayerButton
                            audioUrl={commentAudioRecorder.audioUrl}
                            ariaLabel="Ljudinspelning för kommentar"
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
                <Button onClick={handleAddComment} isLoading={isCommenting} disabled={!canSubmitInput} variant="secondary" size="md">
                    Publicera kommentar
                </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comments List */}
      {comments.length > 0 && (
        <div className="mt-4 space-y-3 pt-3 border-t border-border-color dark:border-slate-700">
          {displayedComments.map(comment => {
            const commenter = commenters.get(comment.userId);
            return (
              <div key={`${comment.userId}-${comment.createdAt}`} className="flex items-start space-x-2">
                {isLoadingCommenters && !commenter ? renderUserAvatar(null) : renderUserAvatar(commenter || null) }
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
      )}
    </div>
  );
}
