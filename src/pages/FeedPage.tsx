import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreatePost } from '../components/forms';
import { PostCard } from '../components/feed/PostCard';
import { Timeline } from '../components/feed/Timeline';
import { LoadingSpinner } from '../components/ui';
import { ImageRecord } from '../types';
import { Views } from '../constants/viewEnum';
import type { View } from '../constants/viewEnum';
import { getSphereFeedPostsListener } from '../services/storageService';
import { useAppContext } from '../context/AppContext';

export const FeedPage: React.FC = () => {
  const {
    currentUser,
    activeSphere,
    handleNavigate,
    viewParams,
    setViewParams,
  } = useAppContext();

  const [posts, setPosts] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFeedDateFromScroll, setActiveFeedDateFromScroll] = useState<Date | null>(null);
  const [letFeedDriveTimelineSync, setLetFeedDriveTimelineSync] = useState(true);
  const createPostRef = useRef<HTMLDivElement>(null);

  console.log("[FeedPage] Render - currentUser:", currentUser?.id, "activeSphere:", activeSphere?.id, "activeSphere.name:", activeSphere?.name, "viewParams:", viewParams);
  console.log("[FeedPage] Posts:", posts);

  useEffect(() => {
    console.log("[FeedPage] useEffect - activeSphere changed:", activeSphere?.id, activeSphere?.name);
    if (!activeSphere) {
      console.log("[FeedPage] No activeSphere, returning");
      return;
    }
    setIsLoading(true);
    setError(null);

    console.log("[FeedPage] Setting up listener for sphere:", activeSphere.id);
    const unsubscribe = getSphereFeedPostsListener(
      activeSphere.id,
      (updatedPosts) => {
        console.log("[FeedPage] Posts updated:", updatedPosts.length, "posts");
        setPosts(updatedPosts);
        setIsLoading(false);
      },
      (err, sphereIdOnError) => {
        const sphereNameForError = sphereIdOnError === activeSphere.id ? activeSphere.name : (sphereIdOnError || 'okänd sfär');
        console.error(`Error fetching posts from listener for sphere ${sphereNameForError}:`, err);
        setError(`Kunde inte ladda inlägg för sfär "${sphereNameForError}". Kontrollera konsolen för mer information och se till att nödvändiga Firestore-index är skapade.`);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [activeSphere]);

  useEffect(() => {
    if (createPostRef.current && createPostRef.current instanceof HTMLElement && typeof createPostRef.current.scrollIntoView === 'function') {
      createPostRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleScrollToPost = useCallback((postId: string) => {
    const postElement = document.getElementById(`post-item-${postId}`);
    if (postElement) {
      postElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleTimelineUserInteraction = useCallback(() => {
    setLetFeedDriveTimelineSync(false);
    // Re-enable feed-driven sync after a delay
    setTimeout(() => setLetFeedDriveTimelineSync(true), 2000);
  }, []);

  // Monitor which post is most visible to update timeline
  useEffect(() => {
    if (!posts.length || !letFeedDriveTimelineSync) return;

    console.log("[FeedPage] Setting up intersection observer for posts");

    const observer = new IntersectionObserver(
      (entries) => {
        console.log("[FeedPage] Intersection observer triggered, entries:", entries.length);
        
        // Find the post with the highest intersection ratio (most visible)
        let mostVisiblePost: ImageRecord | null = null;
        let highestRatio = 0;

        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > highestRatio) {
            const postId = entry.target.id.replace('post-item-', '');
            const post = posts.find((p) => p.id === postId);
            if (post && post.dateTaken) {
              highestRatio = entry.intersectionRatio;
              mostVisiblePost = post;
            }
          }
        }

        if (mostVisiblePost?.dateTaken) {
          const postDate = new Date(mostVisiblePost.dateTaken);
          console.log("[FeedPage] Setting activeFeedDateFromScroll to:", postDate, "for post:", mostVisiblePost.id);
          setActiveFeedDateFromScroll(postDate);
        }
      },
             {
         threshold: [0.5], // Only trigger when 50% of the post is visible
         rootMargin: '-30% 0px -30% 0px' // Only consider posts in the center 40% of the viewport
       }
    );

    // Observe all post elements
    posts.forEach((post) => {
      const element = document.getElementById(`post-item-${post.id}`);
      if (element) {
        observer.observe(element);
        console.log("[FeedPage] Observing post element:", post.id);
      }
    });

    return () => {
      console.log("[FeedPage] Cleaning up intersection observer");
      observer.disconnect();
    };
  }, [posts, letFeedDriveTimelineSync]);

  if (!currentUser || !activeSphere) {
    console.log("[FeedPage] Missing data - currentUser:", !!currentUser, "activeSphere:", !!activeSphere);
    return <LoadingSpinner message="Laddar användare och sfär..." />;
  }

  return (
    <div className="py-8 sm:px-6 lg:px-8 w-full flex justify-center relative">
      <div className="max-w-7xl w-full">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <div ref={createPostRef} className="scroll-mt-8">
              <CreatePost
                currentUser={currentUser}
                activeSphereId={activeSphere.id}
                onPostCreated={() => {
                  // Clear prefill param after post is created
                  if (viewParams?.prefillPostWithImageId) {
                    setViewParams({});
                  }
                }}
                initialImageIdToLoad={viewParams?.prefillPostWithImageId}
              />
            </div>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner message="Laddar inlägg..." /></div>}

            {error && <div className="bg-red-100 border border-red-400 text-danger dark:text-red-400 px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Fel:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>}

            {!isLoading && !error && posts.length === 0 && (
              <div className="text-center py-16 bg-slate-50 dark:bg-dark-bg/30 rounded-xl border border-dashed border-border-color dark:border-dark-bg/50">
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
                        onPostUpdated={() => {}} 
                        onNavigateToEdit={() => handleNavigate(Views.EditImage, { imageId: post.id })}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Timeline Sidebar - Centered between posts and right edge */}
        <div className="hidden lg:block fixed right-20 top-24 w-64">
          <Timeline
            posts={posts}
            onScrollToPost={handleScrollToPost}
            activeFeedDateFromScroll={activeFeedDateFromScroll}
            letFeedDriveTimelineSync={letFeedDriveTimelineSync}
            onTimelineUserInteraction={handleTimelineUserInteraction}
          />
        </div>
      </div>
    </div>
  );
};
