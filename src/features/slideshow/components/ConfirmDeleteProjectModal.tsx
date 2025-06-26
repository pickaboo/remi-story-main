import React from 'react';
import { Button } from '../../../../components/common/Button';
import { SlideshowProject } from '../../../../types';

interface ConfirmDeleteProjectModalProps {
  project: SlideshowProject;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean; // To show loading state on button
}

export const ConfirmDeleteProjectModal: React.FC<ConfirmDeleteProjectModalProps> = ({ 
  project, 
  onConfirm, 
  onCancel, 
  isDeleting 
}) => (
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