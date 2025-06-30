import React, { useState, useEffect, useRef } from 'react';
import { CreatePost } from '../features/feed/components/CreatePost';
import { PostCard } from '../features/feed/components/PostCard';
import { LoadingSpinner } from '../common/components/LoadingSpinner';
import { ImageRecord, View } from '../types';
import { getSphereFeedPostsListener } from '../common/services/storageService';
import { useUser, useSphere } from '../context';
import { useAppState } from "../context/AppStateContext";
import { useNavigation } from "../context/NavigationContext";

interface FeedPageProps {
  onNavigate: (view: View, params?: any) => void;
  onVisiblePostsDateChange: (date: Date | null) => void;
  prefillPostWithImageId?: string | null;
  scrollToPostIdFromParams?: string | null;
}

export const FeedPage: React.FC<FeedPageProps> = ({
    onNavigate,
    onVisiblePostsDateChange,
    prefillPostWithImageId,
    scrollToPostIdFromParams
}) => {
  const { currentUser } = useUser();
  const { setFeedPostsForTimeline } = useAppState();
  const { activeSphere } = useSphere();

  if (!currentUser || !activeSphere) {
    return <div className="flex justify-center py-10"><LoadingSpinner message="Laddar användardata och sfär..." /></div>;
  }

  const [posts, setPosts] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createPostRef = useRef<HTMLDivElement>(null);
  const scrolledToIdRef = useRef<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const unsubscribe = getSphereFeedPostsListener(
      activeSphere.id,
      (updatedPosts) => {
        setPosts(updatedPosts);
        setFeedPostsForTimeline(updatedPosts); // Use the setter directly
        setIsLoading(false);
      },
      (err, sphereIdOnError?: string) => {
        const sphereNameForError = sphereIdOnError === activeSphere.id ? activeSphere.name : (sphereIdOnError || 'okänd sfär');
        console.error(`Error fetching posts from listener for sphere ${sphereNameForError}:`, err);
        setError(`Kunde inte ladda inlägg för sfär "${sphereNameForError}". Kontrollera konsolen för mer information och se till att nödvändiga Firestore-index är skapade.`);
        setIsLoading(false);
      }
    );

    return () => unsubscribe(); // Cleanup listener on unmount or when activeSphere changes
  }, [activeSphere.id, activeSphere.name, setFeedPostsForTimeline]);

  useEffect(() => {
    if (prefillPostWithImageId && createPostRef.current) {
      createPostRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [prefillPostWithImageId]);


  // Effect for scrolling to a specific post
  useEffect(() => {
    if (scrollToPostIdFromParams && posts.length > 0) {
      if (scrolledToIdRef.current !== scrollToPostIdFromParams) {
        const element = document.getElementById(`post-item-${scrollToPostIdFromParams}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          scrolledToIdRef.current = scrollToPostIdFromParams;
        } else {
          scrolledToIdRef.current = null;
        }
      }
    } else if (!scrollToPostIdFromParams) {
      scrolledToIdRef.current = null; 
    }
  }, [scrollToPostIdFromParams, posts]);

  const handlePostCreatedOrUpdated = (changedPost: ImageRecord) => {
    // The listener will automatically update the posts state.
    // We might want to scroll to the new/updated post if it's relevant.
    // For now, this function can be simplified or just used for side effects
    // like clearing prefill params.
    if (prefillPostWithImageId && changedPost.id === prefillPostWithImageId) {
        onNavigate(View.Home, {}); // Clear prefill param
    }
    // If a post is updated such that it no longer belongs to the feed (e.g. unpublished),
    // the listener should handle its removal from the `posts` state.
  };

  useEffect(() => {
    const postElements = posts.map(post => document.getElementById(`post-item-${post.id}`)).filter(el => el !== null);

    if (postElements.length === 0) {
        onVisiblePostsDateChange(null);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
      const visibleCandidates: any[] = [];
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          const postId = entry.target.id.replace('post-item-', '');
          const foundPost = posts.find(p => p.id === postId);
          if (foundPost) {
            visibleCandidates.push({ post: foundPost, top: entry.boundingClientRect.top });
          }
        }
      });

      if (visibleCandidates.length > 0) {
        visibleCandidates.sort((a, b) => a.top - b.top);
        const activePostCandidate = visibleCandidates[0].post; 
        const dateTakenValue = activePostCandidate.dateTaken || activePostCandidate.createdAt;
        if (dateTakenValue && typeof dateTakenValue === 'string' && dateTakenValue.length > 0) {
          try {
            const dateObj = new Date(dateTakenValue);
            if (!isNaN(dateObj.getTime())) {
              onVisiblePostsDateChange(dateObj);
            } else {
              onVisiblePostsDateChange(null);
            }
          } catch (e) {
            onVisiblePostsDateChange(null);
          }
        } else {
          onVisiblePostsDateChange(null); 
        }
      } else {
        onVisiblePostsDateChange(null);
      }
    }, {
      root: null,
      rootMargin: "-33% 0px -33% 0px",
      threshold: [0.5], 
    });

    postElements.forEach(element => observer.observe(element!));

    return () => {
      postElements.forEach(element => {
        if (element) observer.unobserve(element);
      });
      observer.disconnect();
    };
  }, [posts, onVisiblePostsDateChange]);

  return (
    <div className="w-full max-w-2xl mx-auto py-10">
      {isLoading ? <LoadingSpinner message="Laddar inlägg..." /> : error ? <div>{error}</div> : (
        <div className="flex flex-col items-center w-full">
          <CreatePost
            ref={createPostRef}
            currentUser={currentUser}
            activeSphereId={activeSphere.id}
            onPostCreated={(newPost) => {
              setPosts(prev => [newPost, ...prev]);
              setFeedPostsForTimeline([newPost, ...posts]);
            }}
            initialImageIdToLoad={prefillPostWithImageId}
          />
          <div className="flex flex-col items-center w-full">
            {posts.filter(post => post && post.id).map(post => (
              <PostCard 
                key={post.id}
                post={post} 
                currentUser={currentUser} 
                onPostUpdated={handlePostCreatedOrUpdated} 
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};