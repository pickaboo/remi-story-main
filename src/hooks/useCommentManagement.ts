import { useState, useEffect, useMemo } from 'react';
import { UserDescriptionEntry, User } from '../types';
import { getUserById } from '../services/userService';
import { useAudioRecorder } from './useAudioRecorder';

interface UseCommentManagementProps {
  userDescriptions: UserDescriptionEntry[];
  uploadedByUserId: string;
  currentUser: User;
}

interface UseCommentManagementReturn {
  mainPostDescription: UserDescriptionEntry | undefined;
  comments: UserDescriptionEntry[];
  commenters: Map<string, User>;
  isLoadingCommenters: boolean;
  newCommentText: string;
  setNewCommentText: (text: string) => void;
  isCommenting: boolean;
  setIsCommenting: (value: boolean) => void;
  showAllComments: boolean;
  setShowAllComments: (value: boolean) => void;
  commentAudioRecorder: ReturnType<typeof useAudioRecorder>;
  displayedComments: UserDescriptionEntry[];
  handleNewCommentTextChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * Custom hook for managing comments, commenters, and comment-related state
 */
export function useCommentManagement({
  userDescriptions,
  uploadedByUserId,
  currentUser
}: UseCommentManagementProps): UseCommentManagementReturn {
  const [newCommentText, setNewCommentText] = useState('');
  const [isCommenting, setIsCommenting] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);
  const [commenters, setCommenters] = useState<Map<string, User>>(new Map());
  const [isLoadingCommenters, setIsLoadingCommenters] = useState(true);
  
  const commentAudioRecorder = useAudioRecorder();

  // Extract main post description and comments
  const mainPostDescription = useMemo(() => {
    const userDescriptionsArray = Array.isArray(userDescriptions) ? userDescriptions : [];
    return userDescriptionsArray.find(ud => ud.userId === uploadedByUserId);
  }, [userDescriptions, uploadedByUserId]);

  const comments = useMemo(() => {
    const userDescriptionsArray = Array.isArray(userDescriptions) ? userDescriptions : [];
    return userDescriptionsArray
      .filter(ud => ud !== mainPostDescription)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [userDescriptions, mainPostDescription]);

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

  // Auto-fill comment text from audio transcription
  useEffect(() => {
    if (commentAudioRecorder.transcribedText && 
        (!commentAudioRecorder.audioUrl || newCommentText.trim() === '')) {
      setNewCommentText(commentAudioRecorder.transcribedText);
    }
  }, [commentAudioRecorder.transcribedText, commentAudioRecorder.audioUrl, newCommentText]);

  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  const handleNewCommentTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewCommentText(e.target.value);
  };

  return {
    mainPostDescription,
    comments,
    commenters,
    isLoadingCommenters,
    newCommentText,
    setNewCommentText,
    isCommenting,
    setIsCommenting,
    showAllComments,
    setShowAllComments,
    commentAudioRecorder,
    displayedComments,
    handleNewCommentTextChange
  };
} 