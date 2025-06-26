import { useState, useEffect, useCallback } from 'react';
import { ImageRecord, SlideshowProject, View } from '../../../../types';
import { getAllImages, getAllProjects, saveProject, generateId, deleteProject } from '../../../../services/storageService';
import { generatePhotoAlbumPdf } from '../../../../services/pdfService';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../../../../firebase';
import { useUser, useSphere } from '../../../../context';

export const useProjectManagement = (onNavigate: (view: View, params?: any) => void) => {
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();

  // State management
  const [projects, setProjects] = useState<SlideshowProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [projectCreationMode, setProjectCreationMode] = useState<'slideshow' | 'photoAlbum' | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
  const [availableImagesForSelection, setAvailableImagesForSelection] = useState<ImageRecord[]>([]);
  const [projectForDeletionConfirmation, setProjectForDeletionConfirmation] = useState<SlideshowProject | null>(null);
  const [isDeletingProject, setIsDeletingProject] = useState(false);
  const [pdfGeneratingProjectId, setPdfGeneratingProjectId] = useState<string | null>(null);

  // Load projects and images
  useEffect(() => {
    const loadData = async () => {
      if (!currentUser || !activeSphere) return;
      
      try {
        setIsLoading(true);
        setGeneralError(null);
        
        const [projectsData, imagesData] = await Promise.all([
          getAllProjects(),
          getAllImages()
        ]);

        // Filter projects for current sphere
        const sphereProjects = projectsData.filter(proj => proj.sphereId === activeSphere.id);
        setProjects(sphereProjects);

        // Filter images for current sphere and prepare for selection
        const sphereImages = imagesData.filter(img => 
          img.sphereId === activeSphere.id && 
          img.userDescriptions && 
          img.userDescriptions.length > 0 && 
          img.userDescriptions[0].description
        );

        // Resolve image URLs for display
        const imagesWithResolvedUrls = await Promise.all(
          sphereImages.map(async (img) => {
            if (img.dataUrl && (img.dataUrl.startsWith('data:') || img.dataUrl.startsWith('http'))) {
              return img;
            }
            if (img.filePath) {
              try {
                const downloadUrl = await getDownloadURL(ref(storage, img.filePath));
                return { ...img, dataUrl: downloadUrl };
              } catch (error) {
                console.warn(`Failed to get download URL for img ${img.id}:`, error);
                return { ...img, dataUrl: undefined };
              }
            }
            return { ...img, dataUrl: undefined };
          })
        );

        const validImages = imagesWithResolvedUrls.filter(img => img.dataUrl);
        setAvailableImagesForSelection(validImages);
      } catch (error: any) {
        console.error('Error loading projects data:', error);
        setGeneralError(error.message || 'Ett fel uppstod vid laddning av projektdata.');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [currentUser, activeSphere]);

  // Project creation handler
  const handleCreateProject = async () => {
    if (!currentUser || !activeSphere || !projectCreationMode || !newProjectName.trim() || selectedImageIds.length === 0) {
      return;
    }

    try {
      const newProject: SlideshowProject = {
        id: generateId(),
        name: newProjectName.trim(),
        projectType: projectCreationMode,
        sphereId: activeSphere.id,
        imageIds: selectedImageIds,
        createdAt: new Date().toISOString(),
      };

      await saveProject(newProject);
      setProjects(prev => [...prev, newProject]);
      
      // Reset form
      setIsCreating(false);
      setProjectCreationMode(null);
      setNewProjectName('');
      setSelectedImageIds([]);
      setGeneralError(null);
    } catch (error: any) {
      console.error('Error creating project:', error);
      setGeneralError(error.message || 'Ett fel uppstod vid skapande av projektet.');
    }
  };

  // Image selection handler
  const handleToggleImageSelection = (imageId: string) => {
    setSelectedImageIds(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  // Project deletion handlers
  const initiateDeleteProject = (project: SlideshowProject) => {
    setProjectForDeletionConfirmation(project);
  };

  const confirmDeleteProject = async () => {
    if (!projectForDeletionConfirmation) return;
    
    try {
      setIsDeletingProject(true);
      await deleteProject(projectForDeletionConfirmation.id);
      setProjects(prev => prev.filter(p => p.id !== projectForDeletionConfirmation.id));
      setProjectForDeletionConfirmation(null);
    } catch (error: any) {
      console.error('Error deleting project:', error);
      setGeneralError(error.message || 'Ett fel uppstod vid radering av projektet.');
    } finally {
      setIsDeletingProject(false);
    }
  };

  const cancelDeleteProject = () => {
    setProjectForDeletionConfirmation(null);
  };

  // PDF generation handler
  const handleGeneratePdfForProject = async (projectId: string) => {
    if (!activeSphere) return;
    
    try {
      setPdfGeneratingProjectId(projectId);
      setGeneralError(null);
      
      const projectToExport = projects.find(p => p.id === projectId);
      if (!projectToExport) {
        throw new Error("Projektet kunde inte hittas.");
      }

      if (!projectToExport.imageIds || projectToExport.imageIds.length === 0) {
        throw new Error("Projektet saknar bilder.");
      }

      // Get all images for the project
      const imagePromises = projectToExport.imageIds.map(id => 
        import('../../../../services/storageService').then(({ getImageById }) => getImageById(id))
      );
      const resolvedRawImages = (await Promise.all(imagePromises)).filter(img => img !== undefined) as ImageRecord[];

      // Resolve image URLs
      const imagesWithResolvedUrls = await Promise.all(
        resolvedRawImages.map(async (img) => {
          if (img.dataUrl && (img.dataUrl.startsWith('data:') || img.dataUrl.startsWith('http'))) {
            return img;
          }
          if (img.filePath) {
            try {
              const downloadUrl = await getDownloadURL(ref(storage, img.filePath));
              return { ...img, dataUrl: downloadUrl };
            } catch (error) {
              console.error(`SlideshowProjectsPage: Failed to get download URL for PDF img ${img.id} (filePath: ${img.filePath}). Error:`, error);
              return { ...img, dataUrl: undefined };
            }
          }
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

  return {
    // State
    projects,
    isLoading,
    generalError,
    isCreating,
    projectCreationMode,
    newProjectName,
    selectedImageIds,
    availableImagesForSelection,
    projectForDeletionConfirmation,
    isDeletingProject,
    pdfGeneratingProjectId,
    
    // Setters
    setIsCreating,
    setProjectCreationMode,
    setNewProjectName,
    setSelectedImageIds,
    setGeneralError,
    
    // Handlers
    handleCreateProject,
    handleToggleImageSelection,
    initiateDeleteProject,
    confirmDeleteProject,
    cancelDeleteProject,
    handleGeneratePdfForProject,
  };
}; 