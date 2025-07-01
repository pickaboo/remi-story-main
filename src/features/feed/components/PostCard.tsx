import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ImageRecord, User, UserDescriptionEntry } from '../../../types';
import { saveImage } from '../../../common/services/imageService';
import { getUserById } from '../../../common/services/userService';
import { PostHeader } from './PostHeader';
import { PostImage } from './PostImage';
import { PostTags } from './PostTags';
import { CommentInput } from './CommentInput';
import { PostComments } from './PostComments';

interface PostCardProps {
  post: ImageRecord;
  currentUser: User;
  onPostUpdated: (updatedPost: ImageRecord) => void;
}

export function PostCard({ post, currentUser, onPostUpdated }: PostCardProps) {
  const navigate = useNavigate();
  const [creator, setCreator] = useState<User | null>(null);
  const [isLoadingCreator, setIsLoadingCreator] = useState(true);
  const [commenters, setCommenters] = useState<Map<string, User>>(new Map());
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(true);
  const [showAllComments, setShowAllComments] = useState(false);

  // Fetch creator data
  useEffect(() => {
    if (post.uploadedByUserId) {
      setIsLoadingCreator(true);
      getUserById(post.uploadedByUserId).then(user => {
        setCreator(user);
        setIsLoadingCreator(false);
      });
    } else {
      setIsLoadingCreator(false);
      setCreator(null);
    }
  }, [post.uploadedByUserId]);

  // Compute main post description and comments
  const mainPostDescription = useMemo(() => {
    const userDescriptionsArray = Array.isArray(post.userDescriptions) ? post.userDescriptions : [];
    return userDescriptionsArray.find(ud => ud.userId === post.uploadedByUserId);
  }, [post.userDescriptions, post.uploadedByUserId]);

  const comments = useMemo(() => {
    const userDescriptionsArray = Array.isArray(post.userDescriptions) ? post.userDescriptions : [];
    return userDescriptionsArray
      .filter(ud => ud !== mainPostDescription)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [post.userDescriptions, mainPostDescription]);

  // Fetch commenters data
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

  // Tag management handlers
  const handleAddTag = async (tag: string) => {
    const newTag = tag.trim().toLowerCase();
    if (newTag && !post.tags.includes(newTag)) {
      const updatedPost = { ...post, tags: [...post.tags, newTag] };
      await saveImage(updatedPost);
      onPostUpdated(updatedPost);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updatedPost = { ...post, tags: post.tags.filter(tag => tag !== tagToRemove) };
    await saveImage(updatedPost);
    onPostUpdated(updatedPost);
  };

  // Comment/description handlers
  const handleSaveUploaderDescription = async (text: string, audioUrl?: string) => {
    const updatedDescriptions = [...(Array.isArray(post.userDescriptions) ? post.userDescriptions : [])];
    let uploaderEntry = updatedDescriptions.find(ud => ud.userId === currentUser.id);

    if (uploaderEntry) {
      uploaderEntry.description = text;
      uploaderEntry.audioRecUrl = audioUrl || uploaderEntry.audioRecUrl;
      if (audioUrl) uploaderEntry.audioRecUrl = audioUrl;
      else if (!text && !uploaderEntry.audioRecUrl) uploaderEntry.audioRecUrl = undefined;
      uploaderEntry.createdAt = new Date().toISOString();
    } else {
      updatedDescriptions.push({
        userId: currentUser.id,
        description: text,
        audioRecUrl: audioUrl || undefined,
        createdAt: new Date().toISOString(),
      });
    }

    const updatedPost = { ...post, userDescriptions: updatedDescriptions };
    await saveImage(updatedPost);
    onPostUpdated(updatedPost);
  };

  const handleAddComment = async (text: string, audioUrl?: string) => {
    const newCommentEntry: UserDescriptionEntry = {
      userId: currentUser.id,
      description: text,
      audioRecUrl: audioUrl || undefined,
      createdAt: new Date().toISOString(),
    };
    const userDescriptionsArray = Array.isArray(post.userDescriptions) ? post.userDescriptions : [];
    const updatedPost = { ...post, userDescriptions: [...userDescriptionsArray, newCommentEntry] };
    await saveImage(updatedPost);
    onPostUpdated(updatedPost);
  };

  // Handle navigation to edit
  const handleNavigateToEdit = () => {
    navigate(`/edit/${post.id}`);
  };

  // Computed values
  const hasImage = post.dataUrl && post.width != null && post.height != null && post.width > 0;
  const showUploaderDescriptionInput = hasImage &&
    currentUser.id === post.uploadedByUserId &&
    (!mainPostDescription || (!mainPostDescription.description.trim() && !mainPostDescription.audioRecUrl));

  return (
    <div className="bg-card-bg/80 dark:bg-slate-800/80 backdrop-blur-md p-4 sm:p-5 rounded-xl shadow-xl border border-border-color dark:border-slate-700 max-w-2xl mx-auto my-8">
      {/* Post Header */}
      <PostHeader
        creator={creator}
        isLoadingCreator={isLoadingCreator}
        dateTaken={post.dateTaken}
        currentUserId={currentUser.id}
        uploadedByUserId={post.uploadedByUserId || ''}
        onNavigateToEdit={handleNavigateToEdit}
      />

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

      {/* Image with Tag Management */}
      {hasImage && post.dataUrl && (
        <PostImage
          dataUrl={post.dataUrl}
          name={post.name || ''}
          tags={post.tags}
          suggestedGeotags={post.suggestedGeotags}
          currentUserId={currentUser.id}
          uploadedByUserId={post.uploadedByUserId || ''}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
          tagClassName="bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium"
        />
      )}

      {/* Tags for non-image posts */}
      {!hasImage && (
        <PostTags
          tags={post.tags}
          currentUserId={currentUser.id}
          uploadedByUserId={post.uploadedByUserId || ''}
          onRemoveTag={handleRemoveTag}
          className="mb-4 bg-primary/10 text-primary dark:bg-blue-400/20 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium"
        />
      )}
      
      {/* Comment Input */}
      <div className="mt-4 pt-3 border-t border-border-color dark:border-slate-700">
        <CommentInput
          postId={post.id}
          currentUser={currentUser}
          isLoadingCreator={isLoadingCreator}
          placeholder={showUploaderDescriptionInput ? (post.aiGeneratedPlaceholder || "Säg något om bilden...") : "Berätta vad du vet om bilden...."}
          isUploaderDescription={!!showUploaderDescriptionInput}
          onSubmit={showUploaderDescriptionInput ? handleSaveUploaderDescription : handleAddComment}
          buttonClassName="rounded-lg bg-primary text-white hover:bg-primary-hover transition"
        />
      </div>

      {/* Comments List */}
      <PostComments
        comments={comments}
        commenters={commenters}
        isLoadingCommenters={isLoadingCommenters}
        showAllComments={showAllComments}
        setShowAllComments={setShowAllComments}
      />
    </div>
  );
}
