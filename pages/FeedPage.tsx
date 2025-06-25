import React, { useState, useEffect, useRef } from 'react';
import { CreatePost } from '../src/features/feed/components/CreatePost';
import { PostCard } from '../src/features/feed/components/PostCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ImageRecord, View } from '../types';
import { getSphereFeedPostsListener } from '../services/storageService';
import { useUser, useSphere } from '../context';

interface FeedPageProps {
  onNavigate: (view: View, params?: any) => void;
  onFeedPostsUpdate: (posts: ImageRecord[]) => void;
  onVisiblePostsDateChange: (date: Date | null) => void;
  prefillPostWithImageId?: string | null;
  scrollToPostIdFromParams?: string | null;
}

export const FeedPage: React.FC<FeedPageProps> = ({
    onNavigate,
    onFeedPostsUpdate,
    onVisiblePostsDateChange,
    prefillPostWithImageId,
    scrollToPostIdFromParams
}) => {
  const { currentUser } = useUser();
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
        onFeedPostsUpdate(updatedPosts); // Notify App.tsx for Timeline
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
  }, [activeSphere.id, activeSphere.name, onFeedPostsUpdate]);


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
      const visibleCandidates: { post: ImageRecord; top: number }[] = [];

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

        const dateTakenValue = activePostCandidate.dateTaken || activePostCandidate.createdAt; // Fallback to createdAt for timeline

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
    <div className="py-8 sm:px-6 lg:px-8 w-full flex justify-center">
      <div className="max-w-7xl w-full">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <div ref={createPostRef} className="scroll-mt-8">
              <CreatePost
                currentUser={currentUser}
                activeSphereId={activeSphere.id}
                onPostCreated={handlePostCreatedOrUpdated} // Changed from onPostCreated
                initialImageIdToLoad={prefillPostWithImageId}
              />
            </div>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner message="Laddar inlägg..." /></div>}

            {error && <div className="bg-red-100 border border-red-400 text-danger dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Fel:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>}

            {!isLoading && !error && posts.length === 0 && (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-border-color dark:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Inga inlägg i flödet än</h3>
                <p className="text-muted-text dark:text-slate-400">Skapa det första inlägget i sfären "{activeSphere.name}"!</p>
              </div>
            )}

            {!isLoading && !error && posts.length > 0 && (
              <div className="space-y-8">
                {posts.map((post) => (
                  <div key={post.id} id={`post-item-${post.id}`} className="scroll-mt-8">
                     <PostCard 
                        post={post} 
                        currentUser={currentUser} 
                        onPostUpdated={handlePostCreatedOrUpdated} 
                        onNavigateToEdit={() => onNavigate(View.EditImage, { imageId: post.id })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
