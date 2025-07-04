import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CreatePost } from '../components/feed/CreatePost';
import { PostCard } from '../components/feed/PostCard';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ImageRecord } from '../types';
import { getSphereFeedPostsListener } from '../services/storageService';
import { useAppContext } from '../context/AppContext';

export const FeedPage: React.FC = () => {
  const {
    currentUser,
    activeSphere,
    handleNavigate,
  } = useAppContext();

  const [posts, setPosts] = useState<ImageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const createPostRef = useRef<HTMLDivElement>(null);

  console.log("[FeedPage] Render - currentUser:", currentUser?.id, "activeSphere:", activeSphere?.id, "activeSphere.name:", activeSphere?.name);

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
    if (createPostRef.current) {
      createPostRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  if (!currentUser || !activeSphere) {
    return <LoadingSpinner message="Laddar användare och sfär..." />;
  }

  return (
    <div className="py-8 sm:px-6 lg:px-8 w-full flex justify-center">
      <div className="max-w-7xl w-full">
        <div className="max-w-2xl mx-auto">
          <div className="space-y-8">
            <div ref={createPostRef} className="scroll-mt-8">
              <CreatePost
                currentUser={currentUser}
                activeSphereId={activeSphere.id}
                onPostCreated={() => {}}
                initialImageIdToLoad={undefined}
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
                        onPostUpdated={() => {}} 
                        onNavigateToEdit={() => handleNavigate('EDIT_IMAGE', { imageId: post.id })}
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
