import React from 'react';
import { PageContainer } from '../../../../components/layout/PageContainer';
import { Button } from '../../../../components/common/Button';
import { Input } from '../../../../components/common/Input';
import { LoadingSpinner } from '../../../../components/common/LoadingSpinner';
import { View } from '../../../../types';
import { useUser, useSphere } from '../../../../context';
import { useProjectManagement } from '../hooks/useProjectManagement';
import { ConfirmDeleteProjectModal } from './ConfirmDeleteProjectModal';
import { ProjectListItem } from './ProjectListItem';
import { CreationOptionCard } from './CreationOptionCard';

interface SlideshowProjectsPageProps {
  onNavigate: (view: View, params?: any) => void;
}

export const SlideshowProjectsPage: React.FC<SlideshowProjectsPageProps> = ({ onNavigate }) => {
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();
  
  const {
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
  } = useProjectManagement(onNavigate);

  if (isLoading) return <PageContainer><div className="flex justify-center items-center h-64"><LoadingSpinner message={`Laddar projekt för sfären "${activeSphere?.name}"...`} /></div></PageContainer>;

  const creationFormTitle = `Skapa Nytt Projekt (${projectCreationMode === 'slideshow' ? "Bildspel" : "Fotoalbum"})`;
  const creationButtonText = projectCreationMode === 'slideshow' ? "Skapa Bildspel" : "Skapa Fotoalbum";

  return (
    <PageContainer title={`Skapa Projekt i ${activeSphere?.name}`}>
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
                <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">Vad vill du skapa i sfären "{activeSphere?.name}"?</h2>
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
                <h3 className="text-2xl font-semibold text-slate-700 dark:text-slate-200">{creationFormTitle} (för sfär: {activeSphere?.name})</h3>
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
            <p className="text-md font-medium text-muted-text dark:text-slate-400 mb-2">Välj bilder från sfären "{activeSphere?.name}":</p>
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

        <h2 className="text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6 mt-10 border-b border-slate-300 dark:border-slate-600 pb-2">Mina Projekt i "{activeSphere?.name}"</h2>
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
                    onNavigate(View.PlaySlideshow, { projectId: proj.id });
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
                    activeSphereId={activeSphere?.id || ''}
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
