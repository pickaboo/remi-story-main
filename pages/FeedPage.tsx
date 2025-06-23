
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreatePost } from '../components/feed/CreatePost';
import { PostCard } from '../components/feed/PostCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ImageRecord, View, User, Sphere } from '../types';
import { getAllImages } from '../services/storageService';
import { getDownloadURL, ref } from 'firebase/storage'; // Added
import { storage } from '../firebase'; // Added


interface FeedPageProps {
  onNavigate: (view: View, params?: any) => void;
  currentUser: User;
  activeSphere: Sphere;
  onFeedPostsUpdate: (posts: ImageRecord[]) => void;
  onVisiblePostsDateChange: (date: Date | null) => void;
  prefillPostWithImageId?: string | null;
  scrollToPostIdFromParams?: string | null; // New prop for scrolling
}


export const FeedPage: React.FC<FeedPageProps> = ({
    onNavigate,
    currentUser,
    activeSphere,
    onFeedPostsUpdate,
    onVisiblePostsDateChange,
    prefillPostWithImageId,
    scrollToPostIdFromParams
}) => {
  const [posts, setPosts] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createPostRef = useRef<HTMLDivElement>(null);
  const scrolledToIdRef = useRef<string | null>(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const imagesFromStorage = await getAllImages();

      const sphereRawPosts = imagesFromStorage.filter(post =>
        post.sphereId === activeSphere.id &&
        (post.isPublishedToFeed === true || post.isPublishedToFeed === undefined)
      );

      const postsWithResolvedUrls = await Promise.all(
        sphereRawPosts.map(async (post) => {
          let displayUrl = post.dataUrl;
          if ((!displayUrl || !displayUrl.startsWith('data:')) && post.filePath) {
            try {
              displayUrl = await getDownloadURL(ref(storage, post.filePath));
            } catch (urlError: any) {
              console.warn(`FeedPage: Failed to get download URL for post ${post.id} (filePath: ${post.filePath}). Error: ${urlError.message}`);
              // If downloadURL fails, keep original dataUrl (could be undefined)
              // PostCard will handle missing image.
            }
          }
          return {
            ...post,
            dataUrl: displayUrl, // This will be the downloadURL or original dataUrl
            userDescriptions: Array.isArray(post.userDescriptions) ? post.userDescriptions : [],
            processedByHistory: Array.isArray(post.processedByHistory) ? post.processedByHistory : [],
            tags: Array.isArray(post.tags) ? post.tags : [],
            suggestedGeotags: Array.isArray(post.suggestedGeotags) ? post.suggestedGeotags : [],
            sphereId: post.sphereId || activeSphere.id,
          };
        })
      );

      const allPostsData = postsWithResolvedUrls.sort((a, b) => {
        const dateA = a.dateTaken ? new Date(a.dateTaken).getTime() : 0;
        const dateB = b.dateTaken ? new Date(b.dateTaken).getTime() : 0;
        if (dateB !== dateA) return dateB - dateA;
        const idTimeA = a.id ? parseInt(a.id.substring(0, 8), 36) : 0;
        const idTimeB = b.id ? parseInt(b.id.substring(0, 8), 36) : 0;
        return idTimeB - idTimeA;
      });
      setPosts(allPostsData);
    } catch (e) {
      console.error("Error fetching posts:", e);
      setError("Kunde inte ladda inlägg.");
    } finally {
      setIsLoading(false);
    }
  }, [activeSphere.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  useEffect(() => {
    if (prefillPostWithImageId && createPostRef.current) {
      // Scroll to CreatePost component smoothly
      createPostRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // Potentially clear the prefill param from URL after use, if desired,
      // but App.tsx handles URL state. Here we just react to the prop.
    }
  }, [prefillPostWithImageId]);


  useEffect(() => {
    if (posts && posts.length >= 0) {
      onFeedPostsUpdate(posts);
    }
  }, [posts, onFeedPostsUpdate]);

  // Effect for scrolling to a specific post
  useEffect(() => {
    if (scrollToPostIdFromParams && posts.length > 0) {
      if (scrolledToIdRef.current !== scrollToPostIdFromParams) {
        const element = document.getElementById(`post-item-${scrollToPostIdFromParams}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          scrolledToIdRef.current = scrollToPostIdFromParams;
        } else {
          // Post not found in DOM yet, reset ref to try again if posts update
          scrolledToIdRef.current = null;
        }
      }
    } else if (!scrollToPostIdFromParams) {
      scrolledToIdRef.current = null; // Reset if no target
    }
  }, [scrollToPostIdFromParams, posts]);

  const handlePostCreated = (newPost: ImageRecord) => {
    if (newPost.sphereId === activeSphere.id && (newPost.isPublishedToFeed === true || newPost.isPublishedToFeed === undefined)) {
      setPosts(prevPosts => {
        const existingPostIndex = prevPosts.findIndex(p => p.id === newPost.id);
        let updatedPostsIntermediate;

        if (existingPostIndex > -1) {
          // Update existing post
          updatedPostsIntermediate = prevPosts.map((p, index) =>
            index === existingPostIndex ? newPost : p
          );
        } else {
          // Add new post
          updatedPostsIntermediate = [newPost, ...prevPosts];
        }

        // Sort all posts (including new/updated)
        return updatedPostsIntermediate.sort((a, b) => {
          const dateA = a.dateTaken ? new Date(a.dateTaken).getTime() : (a.id ? parseInt(a.id.substring(0,8), 36) : 0);
          const dateB = b.dateTaken ? new Date(b.dateTaken).getTime() : (b.id ? parseInt(b.id.substring(0,8), 36) : 0);
          return dateB - dateA;
        });
      });
    } else {
        console.warn("Post created/updated but not added to current feed display (mismatched sphere or not published):", {
            postId: newPost.id,
            postSphere: newPost.sphereId,
            postPublished: newPost.isPublishedToFeed,
            activeSphere: activeSphere.id
        });
    }
    // If the page was prefilled, navigate to clear the prefill parameter from App state.
    if (prefillPostWithImageId) {
        onNavigate(View.Home, {});
    }
  };

  const handlePostUpdated = (updatedPost: ImageRecord) => {
    // If updated post is no longer for this sphere or no longer published, remove it from feed
    if (updatedPost.sphereId !== activeSphere.id || updatedPost.isPublishedToFeed === false) {
        setPosts(prevPosts => prevPosts.filter(p => p.id !== updatedPost.id));
    } else { // Otherwise, update it in the feed list
        setPosts(prevPosts => {
        const updatedPosts = prevPosts.map(p => p.id === updatedPost.id ? updatedPost : p);
        return updatedPosts;
        });
    }
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

        console.log(`[FeedPage Observer] Active post candidate: ID=${activePostCandidate.id}, DateTaken=${activePostCandidate.dateTaken}`);

        const dateTakenValue = activePostCandidate.dateTaken;

        if (dateTakenValue && typeof dateTakenValue === 'string' && dateTakenValue.length > 0) {
          try {
            const dateObj = new Date(dateTakenValue);
            if (!isNaN(dateObj.getTime())) {
              console.log(`[FeedPage Observer] Sending date to timeline: ${dateObj.toISOString()}`);
              onVisiblePostsDateChange(dateObj);
            } else {
              console.warn(`[FeedPage Observer] Invalid date string for post ID ${activePostCandidate.id}: "${dateTakenValue}". Sending null to timeline.`);
              onVisiblePostsDateChange(null);
            }
          } catch (e) {
            console.error(`[FeedPage Observer] Error parsing date string for post ID ${activePostCandidate.id} ("${dateTakenValue}"):`, e);
            onVisiblePostsDateChange(null);
          }
        } else {
          console.log(`[FeedPage Observer] No valid dateTaken for post ID ${activePostCandidate.id}. Sending null to timeline.`);
          onVisiblePostsDateChange(null); 
        }
      } else {
        console.log("[FeedPage Observer] No post sufficiently visible. Sending null to timeline.");
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
            <div ref={createPostRef} className="scroll-mt-8"> {/* Wrapper for CreatePost and scroll target */}
              <CreatePost
                currentUser={currentUser}
                activeSphereId={activeSphere.id}
                onPostCreated={handlePostCreated}
                initialImageIdToLoad={prefillPostWithImageId} // Pass the prop
              />
            </div>

            {isLoading && <div className="flex justify-center py-10"><LoadingSpinner message="Laddar inlägg..." /></div>}

            {error && <div className="bg-red-100 border border-red-400 text-danger px-4 py-3 rounded-lg" role="alert">
                <strong className="font-bold">Fel:</strong>
                <span className="block sm:inline"> {error}</span>
            </div>}

            {!isLoading && !error && posts.length === 0 && (
              <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-dashed border-border-color dark:border-slate-600">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Flödet är tomt för sfären "{activeSphere.name}"</h3>
                <p className="text-muted-text dark:text-slate-400">Skapa det första inlägget i denna sfär!</p>
              </div>
            )}

            <div className="space-y-6">
              {posts.map(post => (
                <div id={`post-item-${post.id}`} key={post.id} className="scroll-mt-8">
                  <PostCard
                    post={post}
                    currentUser={currentUser}
                    onPostUpdated={handlePostUpdated}
                    onNavigateToEdit={() => onNavigate(View.EditImage, { imageId: post.id })}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
