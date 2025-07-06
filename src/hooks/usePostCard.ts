import { useState, useCallback, useMemo } from 'react';
import { useCommentManagement } from './useCommentManagement';
import { useAudioRecorder } from './useAudioRecorder';
import { ImageRecord, User, UserDescriptionEntry } from '../types';
import { saveImage } from '../services/storageService';

interface UsePostCardProps {
  post: ImageRecord;
  currentUser: User;
  onPostUpdate?: (updatedPost: ImageRecord) => void;
  onPostDelete?: (postId: string) => void;
}

export const usePostCard = ({ post, currentUser, onPostUpdate, onPostDelete }: UsePostCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [isLoadingCreator, setIsLoadingCreator] = useState(false);
  const [creator, setCreator] = useState<User | null>(null);

  const commentAudioRecorder = useAudioRecorder();

  const {
    comments,
    isLoadingCommenters,
    commenters,
    newCommentText,
    setNewCommentText,
    isCommenting,
    setIsCommenting,
    showAllComments,
    setShowAllComments,
    commentAudioRecorder: commentRecorder,
    displayedComments,
    handleNewCommentTextChange,
  } = useCommentManagement({
    userDescriptions: post.userDescriptions,
    uploadedByUserId: post.uploadedByUserId,
    currentUser,
  });

  const isCreator = useMemo(() => {
    return currentUser.id === post.uploadedByUserId;
  }, [currentUser.id, post.uploadedByUserId]);

  const canSubmitInput = useMemo(() => {
    return Boolean(newCommentText.trim().length > 0 || commentAudioRecorder.audioUrl);
  }, [newCommentText, commentAudioRecorder.audioUrl]);

  const handleResetAudioForInput = useCallback(() => {
    commentAudioRecorder.resetAudio();
  }, [commentAudioRecorder]);

  const handleAddComment = useCallback(async () => {
    if (!canSubmitInput || isCommenting) return;

    setIsCommenting(true);
    try {
      const newCommentEntry: UserDescriptionEntry = {
        userId: currentUser.id,
        description: newCommentText.trim(),
        audioRecUrl: commentAudioRecorder.audioUrl || undefined,
        createdAt: new Date().toISOString(),
      };

      const userDescriptionsArray = Array.isArray(post.userDescriptions) ? post.userDescriptions : [];
      const updatedPost = { ...post, userDescriptions: [...userDescriptionsArray, newCommentEntry] };
      
      await saveImage(updatedPost);
      
      if (onPostUpdate) {
        onPostUpdate(updatedPost);
      }
      
      setNewCommentText('');
      commentAudioRecorder.resetAudio();
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsCommenting(false);
    }
  }, [canSubmitInput, isCommenting, newCommentText, commentAudioRecorder, currentUser.id, post, onPostUpdate, setNewCommentText]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleShowFullImage = useCallback(() => {
    setShowFullImage(true);
  }, []);

  const handleHideFullImage = useCallback(() => {
    setShowFullImage(false);
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (!isCreator || !onPostDelete) return;
    
    try {
      await onPostDelete(post.id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  }, [isCreator, onPostDelete, post.id]);

  const handleUpdatePost = useCallback(async (updates: Partial<ImageRecord>) => {
    if (!isCreator || !onPostUpdate) return;
    
    try {
      const updatedPost = { ...post, ...updates };
      await onPostUpdate(updatedPost);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  }, [isCreator, onPostUpdate, post]);

  const handleDeleteComment = useCallback(async (commentId: string) => {
    try {
      // Implementation would go here - this is a placeholder
      console.log('Delete comment:', commentId);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  }, []);

  const handleUpdateComment = useCallback(async (commentId: string, updates: Partial<UserDescriptionEntry>) => {
    try {
      // Implementation would go here - this is a placeholder
      console.log('Update comment:', commentId, updates);
    } catch (error) {
      console.error('Failed to update comment:', error);
    }
  }, []);

  return {
    // State
    isExpanded,
    showFullImage,
    isLoadingCreator,
    creator,
    newCommentText,
    isCommenting,
    commentAudioRecorder,
    comments,
    isLoadingComments: isLoadingCommenters,
    isCreator,
    canSubmitInput,

    // Handlers
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
    loadComments: () => {}, // Placeholder
  };
}; 