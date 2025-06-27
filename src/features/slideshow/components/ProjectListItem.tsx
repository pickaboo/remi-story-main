import React, { useState, useEffect } from 'react';
import { Button } from '../../../common/components/Button';
import { ImageRecord, SlideshowProject } from '../../../types';
import { getImageById } from '../../../common/services/storageService';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../firebase';

interface ProjectListItemProps {
  project: SlideshowProject;
  onPrimaryAction: () => void;
  onDelete: () => void;
  isGeneratingPdfForThisProject: boolean;
  activeSphereId: string; 
}

export const ProjectListItem: React.FC<ProjectListItemProps> = ({ 
  project, 
  onPrimaryAction, 
  onDelete, 
  isGeneratingPdfForThisProject,
  activeSphereId 
}) => {
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const countImages = async () => {
      if (project.imageIds && project.imageIds.length > 0) {
        const imagePromises = project.imageIds.map(id => getImageById(id));
        const resolvedRawImages = (await Promise.all(imagePromises)).filter(img => img !== undefined) as ImageRecord[];
        
        const imagesWithResolvedUrls = await Promise.all(
          resolvedRawImages.map(async (img) => {
            // No need to check if img is null here due to the filter above

            let displayUrl = img.dataUrl;
            if ((!displayUrl || (!displayUrl.startsWith('data:') && !displayUrl.startsWith('http'))) && img.filePath) {
                try {
                    displayUrl = await getDownloadURL(ref(storage, img.filePath));
                } catch (urlError) {
                    console.warn(`ProjectListItem: Failed to get download URL for img ${img.id} (filePath: ${img.filePath}). Error:`, urlError);
                }
            }
            return { ...img, dataUrl: displayUrl };
          })
        );

        const validImages = imagesWithResolvedUrls.filter(
            img => img && img.dataUrl && img.sphereId === activeSphereId
        );
        setImageCount(validImages.length);
      } else {
        setImageCount(0);
      }
    };
    countImages();
  }, [project.imageIds, activeSphereId]);

  const projectTypeDisplay = project.projectType === 'photoAlbum' ? "Fotoalbum" : "Bildspel";
  const primaryActionInProgress = project.projectType === 'photoAlbum' && isGeneratingPdfForThisProject;
  const primaryActionText = project.projectType === 'photoAlbum' 
    ? (isGeneratingPdfForThisProject ? 'Skapar PDF...' : 'Generera PDF') 
    : 'Spela Upp Bildspel';

  const PrimaryActionIcon = () => {
    if (project.projectType === 'photoAlbum') {
      return (
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 inline">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
      );
    }
    return (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 inline">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
      </svg>
    );
  };
  
  return (
    <div className="bg-slate-50 dark:bg-slate-700/80 p-4 sm:p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col md:flex-row justify-between items-start gap-4 border border-border-color dark:border-slate-600/50">
      <button
        onClick={onPrimaryAction}
        disabled={primaryActionInProgress || imageCount === 0}
        className="flex-grow text-left p-2 -m-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-700/80 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent"
        aria-label={`${primaryActionText} för ${project.name}`}
      >
        <h3 className="text-xl font-semibold text-primary dark:text-blue-400 mb-1">{project.name}</h3>
        <p className="text-sm text-muted-text dark:text-slate-400">Typ: {projectTypeDisplay}</p>
        <p className="text-sm text-muted-text dark:text-slate-400">Antal bilder: {imageCount}</p>
        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">Skapad: {new Date(project.createdAt).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        
        <div className="mt-3 inline-flex items-center text-sm font-medium text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300">
            <PrimaryActionIcon />
            {primaryActionText}
        </div>
        {imageCount === 0 && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Projektet saknar bilder.</p>}

      </button>

      <div className="flex-shrink-0 mt-3 md:mt-0 self-start md:self-center">
        <Button onClick={onDelete} variant="danger" size="md" className="bg-opacity-80 hover:bg-opacity-100">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 inline pointer-events-none">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Radera
        </Button>
      </div>
    </div>
  );
}; 