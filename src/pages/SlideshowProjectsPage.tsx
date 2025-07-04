import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ImageRecord, SlideshowProject, View, Sphere, User } from '../types'; 
import { getAllImages, getAllProjects, saveProject, generateId, deleteProject, getProjectById, getImageById } from '../services/storageService'; 
import { generatePhotoAlbumPdf } from '../services/pdfService';
import { getDownloadURL, ref } from 'firebase/storage'; 
import { storage } from '../../firebase'; 
import { useAppContext } from '../context/AppContext';

// Custom Confirmation Modal Component (Local to SlideshowProjectsPage)
interface ConfirmDeleteProjectModalProps {
  project: SlideshowProject;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean; // To show loading state on button
}
const ConfirmDeleteProjectModal: React.FC<ConfirmDeleteProjectModalProps> = ({ project, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-project-modal-title">
    <div className="bg-card-bg dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
      <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700">
        <h2 id="confirm-delete-project-modal-title" className="text-xl font-semibold text-danger dark:text-red-400">Bekräfta Radering av Projekt</h2>
      </header>
      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Är du helt säker på att du vill permanent radera projektet <strong className="break-all">"{project.name}"</strong>?
        </p>
        <p className="text-sm text-red-500 dark:text-red-400 font-medium">Denna åtgärd kan INTE ångras.</p>
      </div>
      <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>Avbryt</Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isDeleting} disabled={isDeleting}>
          Ja, radera projektet
        </Button>
      </footer>
    </div>
  </div>
);

interface ProjectListItemProps {
  project: SlideshowProject;
  onPrimaryAction: () => void;
  onDelete: () => void;
  isGeneratingPdfForThisProject: boolean;
  activeSphereId: string; 
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ 
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

interface CreationOptionCardProps {
  imageUrl: string;
  title: string;
  tagline: string;
  actionText?: string;
  onClick: () => void;
  disabled?: boolean;
  comingSoonText?: string;
}

const CreationOptionCard: React.FC<CreationOptionCardProps> = ({ 
  imageUrl, title, tagline, actionText, onClick, disabled = false, comingSoonText 
}) => {
  return (
    <div 
      onClick={!disabled ? onClick : undefined}
      className={`group relative bg-slate-200 dark:bg-slate-700 rounded-2xl shadow-xl 
                 ${disabled 
                    ? 'opacity-60 cursor-default' 
                    : 'hover:shadow-primary/30 dark:hover:shadow-blue-400/30 cursor-pointer focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-primary dark:focus-visible:ring-blue-400 focus-visible:ring-offset-card-bg dark:focus-visible:ring-offset-slate-900'}
                 overflow-hidden aspect-[4/5] sm:aspect-square md:aspect-[4/5]
                 transition-all duration-300 ease-in-out flex flex-col`}
      role={!disabled ? "button" : undefined}
      tabIndex={!disabled ? 0 : undefined}
      onKeyDown={!disabled ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-label={!disabled ? `Skapa ${title}` : `${title} (kommer snart)`}
    >
      <img 
        src={imageUrl} 
        alt="" // Decorative, information provided by text
        className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ease-in-out 
                   ${!disabled ? 'group-hover:scale-105' : ''} ${disabled ? 'grayscale' : ''}`}
      />
      
      {/* Scrim and Text Content Area */}
      <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-center z-10 
                      bg-gradient-to-t from-black/80 via-black/50 to-transparent
                      flex flex-col justify-end items-center h-2/3 sm:h-3/5"> {/* Adjust height of text area */}
        <h3 className="text-xl sm:text-2xl font-semibold leading-tight text-white">{title}</h3>
        <p className="text-xs sm:text-sm text-slate-200 mt-1.5 mb-2 sm:mb-3">{tagline}</p>
        
        {disabled && comingSoonText && (
          <div className="text-sm font-semibold text-amber-300">
            {comingSoonText}
          </div>
        )}

        {!disabled && actionText && (
          <div 
            className="text-sm font-medium text-blue-300 inline-flex items-center 
                       group-hover:text-blue-200 transition-colors"
          >
            {actionText}
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 ml-1.5 transform transition-transform duration-200 group-hover:translate-x-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export const SlideshowProjectsPage: React.FC = () => {
  const { currentUser, activeSphere, handleNavigate } = useAppContext();
  if (!currentUser || !activeSphere) {
    return <LoadingSpinner message="Laddar användare och sfär..." />;
  }
  const [projects, setProjects] = useState<SlideshowProject[]>([]);
  const [availableImagesForSelection, setAvailableImagesForSelection] = useState<ImageRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [projectCreationMode, setProjectCreationMode] = useState<'slideshow' | 'photoAlbum' | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pdfGeneratingProjectId, setPdfGeneratingProjectId] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const [projectForDeletionConfirmation, setProjectForDeletionConfirmation] = useState<SlideshowProject | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setGeneralError(null);
    try {
        const allSphereProjects = (await getAllProjects())
            .filter(p => p.sphereId === activeSphere.id)
            .map(p => ({ ...p, projectType: p.projectType || 'slideshow' }))
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProjects(allSphereProjects);

        const allImagesFromDb = await getAllImages();
        const imagesWithResolvedUrls = await Promise.all(
            allImagesFromDb.map(async (img) => {
                let displayUrl = img.dataUrl;
                if ((!displayUrl || (!displayUrl.startsWith('data:') && !displayUrl.startsWith('http'))) && img.filePath) { 
                    try {
                        displayUrl = await getDownloadURL(ref(storage, img.filePath));
                    } catch (urlError) {
                        console.warn(`SlideshowProjectsPage: Failed to get download URL for img ${img.id} (filePath: ${img.filePath}). Error:`, urlError);
                    }
                }
                return { ...img, dataUrl: displayUrl };
            })
        );
        
        setAvailableImagesForSelection(
            imagesWithResolvedUrls.filter(img => {
                const hasTextContent = (img.userDescriptions && img.userDescriptions.length > 0 && img.userDescriptions.some(ud => ud.description.trim() !== '')) ||
                                       img.compiledStory ||
                                       img.geminiAnalysis;
                return img.dataUrl && // Must have a displayable URL
                       img.width && // Must have dimensions (implies it's an image)
                       img.height &&
                       img.sphereId === activeSphere.id &&
                       hasTextContent; // Ensure it has some form of narrative content
            })
        );

    } catch (e) {
        console.error("Error fetching project data:", e);
        setGeneralError("Kunde inte ladda projektdata.");
    } finally {
        setIsLoading(false);
    }
  }, [activeSphere.id]);

  useEffect(() => {
    fetchData();
    setIsCreating(false); 
    setProjectCreationMode(null);
    setSelectedImageIds([]);
    setNewProjectName('');
  }, [fetchData]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      setGeneralError("Projektnamn måste anges.");
      return;
    }
    if (selectedImageIds.length === 0) {
      setGeneralError("Minst ett bildinlägg måste väljas för projektet.");
      return;
    }
    if (!projectCreationMode) {
        setGeneralError("Projekttyp måste väljas (Bildspel eller Fotoalbum).");
        return;
    }
    const newProject: SlideshowProject = {
      id: generateId(),
      name: newProjectName.trim(),
      imageIds: selectedImageIds,
      createdAt: new Date().toISOString(),
      sphereId: activeSphere.id,
      projectType: projectCreationMode,
    };
    await saveProject(newProject);
    fetchData(); 
    setNewProjectName('');
    setSelectedImageIds([]);
    setIsCreating(false);
    setProjectCreationMode(null);
    setGeneralError(null);
  };

  const handleToggleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev =>
      prev.includes(imageId) ? prev.filter(id => id !== imageId) : [...prev, imageId]
    );
  };

  const initiateDeleteProject = (project: SlideshowProject) => {
    setProjectForDeletionConfirmation(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectForDeletionConfirmation) return;
    setIsDeletingProject(true);
    try {
      await deleteProject(projectForDeletionConfirmation.id);
      fetchData(); // Refresh projects list
    } catch (e: any) {
      console.error("Error deleting project:", e);
      setGeneralError("Kunde inte radera projektet. " + e.message);
    } finally {
      setIsDeletingProject(false);
      setProjectForDeletionConfirmation(null);
    }
  };

  const cancelDeleteProject = () => {
    setProjectForDeletionConfirmation(null);
  };

  const handleGeneratePdfForProject = async (projectId: string) => {
    setPdfGeneratingProjectId(projectId);
    setGeneralError(null);
    try {
      const projectToExport = await getProjectById(projectId);
      if (!projectToExport || projectToExport.sphereId !== activeSphere.id) { 
        throw new Error("Projektet kunde inte hittas eller tillhör en annan sfär.");
      }
      
      // Fetch raw image records first
      const imagePromises = projectToExport.imageIds.map(id => getImageById(id));
      const resolvedRawImages = (await Promise.all(imagePromises)).filter(img => img !== undefined) as ImageRecord[];

      // Now, resolve dataUrls for these images
      const imagesWithResolvedUrls = await Promise.all(
        resolvedRawImages.map(async (img) => {
          // If dataUrl is already a valid displayable URL (base64 or http/s), use it.
          if (img.dataUrl && (img.dataUrl.startsWith('data:') || img.dataUrl.startsWith('http'))) {
            return img;
          }
          // If no usable dataUrl but filePath exists, fetch downloadURL.
          if (img.filePath) {
            try {
              const downloadUrl = await getDownloadURL(ref(storage, img.filePath));
              return { ...img, dataUrl: downloadUrl };
            } catch (error) {
              console.error(`SlideshowProjectsPage: Failed to get download URL for PDF img ${img.id} (filePath: ${img.filePath}). Error:`, error);
              return { ...img, dataUrl: undefined }; // Mark as unusable
            }
          }
          // If no filePath and no usable dataUrl, it's not displayable.
          return { ...img, dataUrl: undefined };
        })
      );
      
      // Filter for images that actually have a dataUrl to display AND belong to the active sphere
      const imagesForProject = imagesWithResolvedUrls.filter(
        img => img && img.dataUrl && img.sphereId === activeSphere.id
      ) as ImageRecord[];

      if (imagesForProject.length === 0) {
        throw new Error("Inga bilder med bilddata finns i detta projekt (inom aktuell sfär) för att skapa ett PDF-album.");
      }

      await generatePhotoAlbumPdf(projectToExport, imagesForProject);
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      setGeneralError(error.message || "Ett okänt fel uppstod vid PDF-generering.");
    } finally {
      setPdfGeneratingProjectId(null);
    }
  };

  if (isLoading) return <PageContainer><div className="flex justify-center items-center h-64"><LoadingSpinner message={`Laddar projekt för sfären "${activeSphere.name}"...`} /></div></PageContainer>;

  const creationFormTitle = `Skapa Nytt Projekt (${projectCreationMode === 'slideshow' ? "Bildspel" : "Fotoalbum"})`;
  const creationButtonText = projectCreationMode === 'slideshow' ? "Skapa Bildspel" : "Skapa Fotoalbum";

  return (
    <PageContainer title={`Skapa Projekt i ${activeSphere.name}`}>
      <div className="p-4 md:p-0">
        
        {generalError && (
          <div className="bg-red-100 dark:bg-red-500/20 border border-red-400 dark:border-red-500 text-danger dark:text-red-400 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <strong className="font-bold">Ett fel uppstod:</strong>
            <span className="block sm:inline whitespace-pre-line"> {generalError}</span>
            <button onClick={() => setGeneralError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3" aria-label="Stäng felmeddelande">
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {!isCreating && (
           <div className="mb-10">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
                <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Vad vill du skapa i sfären "{activeSphere.name}"?</h2>
                <p className="text-muted-text dark:text-slate-400 sm:text-right">Välj en mall nedan för att starta ett nytt projekt.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
              <CreationOptionCard 
                imageUrl="https://images.unsplash.com/photo-1535016120720-40c646be5580?q=80&w=800&auto=format&fit=crop" 
                title="Bildspel"
                tagline="Skapa dynamiska presentationer med dina bilder och berättelser."
                actionText="Starta bildspelsprojekt"
                onClick={() => { setIsCreating(true); setProjectCreationMode('slideshow'); setNewProjectName(''); setSelectedImageIds([]); setGeneralError(null); }}
              />
              <CreationOptionCard 
                imageUrl="https://cdn.pixabay.com/photo/2013/12/30/07/58/photo-album-235603_1280.jpg"
                title="Fotoalbum (PDF)"
                tagline="Sammanställ vackra album, perfekta för utskrift och delning."
                actionText="Starta albumprojekt"
                onClick={() => { setIsCreating(true); setProjectCreationMode('photoAlbum'); setNewProjectName(''); setSelectedImageIds([]); setGeneralError(null);}}
              />
              <CreationOptionCard 
                imageUrl="https://cdn.pixabay.com/photo/2020/04/19/02/18/handwriting-5061596_1280.jpg"
                title="Års-dagbok (PDF)"
                tagline="Samla dina dagboksanteckningar från ett helt år i en vacker bok."
                onClick={() => alert("Funktionen 'Års-dagbok' är under utveckling och kommer snart!")}
                disabled={true}
                comingSoonText="Kommer snart"
              />
            </div>
          </div>
        )}


        {isCreating && projectCreationMode && (
          <div className="bg-slate-50 dark:bg-slate-700/80 p-6 sm:p-8 rounded-xl shadow-lg mb-10 border border-border-color dark:border-slate-600">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">{creationFormTitle} (för sfär: {activeSphere.name})</h3>
                <Button onClick={() => {setIsCreating(false); setProjectCreationMode(null); setNewProjectName(''); setSelectedImageIds([]); setGeneralError(null);}} variant="ghost" size="sm" className="!p-2 !rounded-full" aria-label="Stäng skapa projekt formulär">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-slate-600 dark:text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                </Button>
            </div>
            
            <Input
              label="Namnge ditt projekt"
              placeholder={projectCreationMode === 'slideshow' ? "T.ex. Sommarsemester 2024 (Bildspel)" : "T.ex. Året som gick (Fotoalbum)"}
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="mb-6"
            />
            <p className="text-md font-medium text-muted-text dark:text-slate-400 mb-2">Välj bilder från sfären "{activeSphere.name}":</p>
            {availableImagesForSelection.length === 0 ? (
                <div className="bg-yellow-50 dark:bg-yellow-500/20 border border-yellow-300 dark:border-yellow-500 text-yellow-700 dark:text-yellow-300 px-4 py-3 rounded-lg my-4">
                    <p className="font-semibold">Inga inlägg tillgängliga i denna sfär!</p>
                    <p>Se till att dina bilder har beskrivningar, berättelser eller AI-analys för att kunna användas i projekt.</p>
                </div>
            ) : (
                <div className="max-h-80 overflow-y-auto border border-border-color dark:border-slate-600 rounded-lg p-3 mb-6 space-y-2 bg-white dark:bg-slate-700/50 shadow-sm">
                {availableImagesForSelection.map(img => (
                    <label
                        key={img.id}
                        className={`flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-600/50 transition-colors cursor-pointer ${selectedImageIds.includes(img.id) ? 'bg-primary/10 dark:bg-blue-400/10 ring-2 ring-primary dark:ring-blue-400' : 'bg-white dark:bg-slate-700/30'}`}
                        htmlFor={`select-img-${img.id}`}
                    >
                    <input
                        id={`select-img-${img.id}`}
                        type="checkbox"
                        className="form-checkbox h-5 w-5 text-primary dark:text-blue-400 rounded-md border-gray-300 dark:border-slate-500 focus:ring-primary dark:focus:ring-offset-0 bg-transparent dark:bg-slate-600"
                        checked={selectedImageIds.includes(img.id)}
                        onChange={() => handleToggleImageSelection(img.id)}
                        aria-labelledby={`img-name-${img.id}`}
                    />
                    {img.dataUrl ? 
                        <img src={img.dataUrl} alt={img.name} className="w-12 h-12 object-cover rounded-md shadow-sm"/>
                        : <div className="w-12 h-12 bg-slate-200 dark:bg-slate-500 rounded-md shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-300 text-xs">Ingen bild</div>
                    }
                    <div className="flex-grow">
                        <span id={`img-name-${img.id}`} className={`text-sm font-medium ${selectedImageIds.includes(img.id) ? 'text-primary dark:text-blue-300' : 'text-slate-700 dark:text-slate-200'}`}>{img.name}</span>
                        {img.dateTaken && <p className="text-xs text-muted-text dark:text-slate-400">{new Date(img.dateTaken).toLocaleDateString('sv-SE')}</p>}
                        {(img.userDescriptions && img.userDescriptions.length > 0 && img.userDescriptions[0].description) &&
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-xs sm:max-w-sm md:max-w-md">
                                {img.userDescriptions[0].description}
                            </p>
                        }
                    </div>
                    </label>
                ))}
                </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <Button onClick={handleCreateProject} disabled={availableImagesForSelection.length === 0 || !newProjectName.trim() || selectedImageIds.length === 0} variant={projectCreationMode === 'slideshow' ? "primary" : "accent"} size="lg">
                {creationButtonText}
              </Button>
            </div>
          </div>
        )}

        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6 mt-10 border-b border-slate-300 dark:border-slate-600 pb-2">Mina Projekt i "{activeSphere.name}"</h2>
        {projects.length === 0 && !isCreating && (
          <div className="text-center py-16 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-dashed border-border-color dark:border-slate-600">
             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 mx-auto text-slate-400 dark:text-slate-500 mb-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m4.125-3.75v3.75m2.625-3.75v3.75M12 21.75H4.875A2.625 2.625 0 012.25 19.125V7.875A2.625 2.625 0 014.875 5.25h14.25A2.625 2.625 0 0121.75 7.875v8.625M12 5.25v3.75m0 0H8.25m3.75 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
             </svg>
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">Inga projekt ännu i denna sfär</h3>
            <p className="text-muted-text dark:text-slate-400">Välj en mall ovan för att börja.</p>
          </div>
        )}
        <div className="space-y-6">
          {projects.map(proj => {
            const handlePrimaryAction = () => {
                if (proj.projectType === 'slideshow') {
                    handleNavigate(View.PlaySlideshow, { projectId: proj.id });
                } else if (proj.projectType === 'photoAlbum') {
                    handleGeneratePdfForProject(proj.id);
                }
            };

            return (
                <ProjectListItem
                    key={proj.id}
                    project={proj}
                    onPrimaryAction={handlePrimaryAction}
                    onDelete={() => initiateDeleteProject(proj)} 
                    isGeneratingPdfForThisProject={pdfGeneratingProjectId === proj.id && proj.projectType === 'photoAlbum'}
                    activeSphereId={activeSphere.id}
                />
            );
          })}
        </div>
      </div>
      {projectForDeletionConfirmation && (
        <ConfirmDeleteProjectModal
            project={projectForDeletionConfirmation}
            onConfirm={confirmDeleteProject}
            onCancel={cancelDeleteProject}
            isDeleting={isDeletingProject}
        />
      )}
    </PageContainer>
  );
};
