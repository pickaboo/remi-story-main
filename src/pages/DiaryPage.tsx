import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../components/layout/PageContainer';
import { Button } from '../components/common/Button';
import { TextArea } from '../components/common/TextArea';
import { DiaryEntry, User } from '../types';
import { getDiaryEntriesByUserId, saveDiaryEntry, deleteDiaryEntry, generateId } from '../services/storageService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useAudioRecorder } from '../hooks/useAudioRecorder'; 

interface DiaryPageProps {
  currentUser: User;
}

const MicIconLarge: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIconLarge: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

// Custom Confirmation Modal Component (Local to DiaryPage)
interface ConfirmDeleteDiaryEntryModalProps {
  entry: DiaryEntry;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}
const ConfirmDeleteDiaryEntryModal: React.FC<ConfirmDeleteDiaryEntryModalProps> = ({ entry, onConfirm, onCancel, isDeleting }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[110] p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-delete-diary-modal-title">
    <div className="bg-card-bg dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
      <header className="p-4 sm:p-5 border-b border-border-color dark:border-slate-700">
        <h2 id="confirm-delete-diary-modal-title" className="text-xl font-semibold text-danger dark:text-red-400">Bekräfta Radering av Anteckning</h2>
      </header>
      <div className="p-4 sm:p-5 space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Är du helt säker på att du vill permanent radera dagboksanteckningen för <strong className="break-all">{new Date(entry.date).toLocaleDateString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>?
        </p>
        {entry.content && (
            <p className="text-xs text-muted-text dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-2 italic max-h-20 overflow-y-auto">
                "{entry.content.substring(0, 100)}{entry.content.length > 100 ? '...' : ''}"
            </p>
        )}
        <p className="text-sm text-red-500 dark:text-red-400 font-medium">Denna åtgärd kan INTE ångras.</p>
      </div>
      <footer className="p-4 sm:p-5 border-t border-border-color dark:border-slate-700 flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel} disabled={isDeleting}>Avbryt</Button>
        <Button variant="danger" onClick={onConfirm} isLoading={isDeleting} disabled={isDeleting}>
          Ja, radera permanent
        </Button>
      </footer>
    </div>
  </div>
);


export const DiaryPage: React.FC<DiaryPageProps> = ({ currentUser }) => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const audioRecorder = useAudioRecorder();

  const [entryForDeletionConfirmation, setEntryForDeletionConfirmation] = useState<DiaryEntry | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const userEntries = await getDiaryEntriesByUserId(currentUser.id);
    setEntries(userEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setIsLoading(false);
  }, [currentUser.id]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  useEffect(() => {
    if (editingEntry) {
      setNewEntryContent(editingEntry.content);
      setEntryDate(editingEntry.date);
      if (editingEntry.audioRecUrl) {
        // Here you might want to load the existing audio URL into the recorder if it supports it,
        // or just display it. For simplicity, we'll reset if a new recording starts.
      } else {
        audioRecorder.resetAudio();
      }
    } else {
      setNewEntryContent('');
      setEntryDate(new Date().toISOString().split('T')[0]);
      audioRecorder.resetAudio();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingEntry]); // audioRecorder.resetAudio is stable

  useEffect(() => {
    if (audioRecorder.transcribedText && newEntryContent.trim() === '' && !audioRecorder.isRecording) {
      setNewEntryContent(audioRecorder.transcribedText);
    }
  }, [audioRecorder.transcribedText, newEntryContent, audioRecorder.isRecording]);

  const handleSaveEntry = async () => {
    if (!newEntryContent.trim() && !audioRecorder.audioUrl) return;
    setIsSaving(true);
    audioRecorder.stopRecording();

    const entryToSave: DiaryEntry = {
      id: editingEntry ? editingEntry.id : generateId(),
      userId: currentUser.id,
      date: entryDate,
      content: newEntryContent.trim(),
      createdAt: editingEntry ? editingEntry.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioRecUrl: audioRecorder.audioUrl || editingEntry?.audioRecUrl || undefined,
      transcribedText: audioRecorder.audioUrl ? (audioRecorder.transcribedText.trim() || newEntryContent.trim()) : (editingEntry?.transcribedText || undefined),
    };
    await saveDiaryEntry(entryToSave);
    setEditingEntry(null);
    setNewEntryContent('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    audioRecorder.resetAudio();
    fetchEntries();
    setIsSaving(false);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
    setNewEntryContent('');
    setEntryDate(new Date().toISOString().split('T')[0]);
    audioRecorder.resetAudio();
  };

  const handleDeleteConfirmation = (entry: DiaryEntry) => {
    setEntryForDeletionConfirmation(entry);
  };

  const confirmDelete = async () => {
    if (!entryForDeletionConfirmation) return;
    setIsDeletingEntry(true);
    await deleteDiaryEntry(entryForDeletionConfirmation.id, currentUser.id);
    setEntryForDeletionConfirmation(null);
    fetchEntries();
    setIsDeletingEntry(false);
  };

  const canSaveEntry = !isSaving && (newEntryContent.trim() !== '' || !!audioRecorder.audioUrl);

  return (
    <PageContainer title={`Min Dagbok - ${currentUser.name}`}>
      <div className="space-y-8">
        {/* Entry Form */}
        <section className="bg-slate-50 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl shadow-lg border border-border-color dark:border-slate-600">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-1">
            {editingEntry ? 'Redigera Anteckning' : 'Ny Anteckning'}
          </h2>
          <p className="text-sm text-muted-text dark:text-slate-400 mb-4">
            {editingEntry ? `Redigerar anteckning för ${new Date(entryDate).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : `Skriver för ${new Date(entryDate).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
          </p>
          
          <div className="mb-4">
            <label htmlFor="entryDate" className="block text-sm font-medium text-muted-text dark:text-slate-400 mb-1">Datum</label>
            <input
              type="date"
              id="entryDate"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              className="block w-full sm:w-auto px-3 py-2 border border-border-color dark:border-slate-600 rounded-md shadow-sm bg-input-bg dark:bg-slate-700 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 text-sm dark:[color-scheme:dark]"
              disabled={isSaving}
            />
          </div>

          <TextArea
            id="newDiaryEntry"
            placeholder="Skriv dina tankar här, eller spela in en ljudanteckning..."
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            className="min-h-[120px] max-h-80"
            rows={5}
            disabled={isSaving || audioRecorder.isRecording}
          />

          <div className="mt-2 space-y-1">
            {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && !editingEntry?.audioRecUrl && (
                <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>
            )}
            {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
            
            {(audioRecorder.audioUrl || editingEntry?.audioRecUrl) && (
              <div className="flex items-center gap-2 py-1">
                <audio 
                    key={audioRecorder.audioUrl || editingEntry?.audioRecUrl} // Re-render audio element if src changes
                    controls 
                    src={audioRecorder.audioUrl || editingEntry?.audioRecUrl} 
                    className="w-full h-10"
                ></audio>
                <Button 
                    type="button" 
                    onClick={() => {
                        audioRecorder.resetAudio();
                        if (editingEntry) {
                            setEditingEntry(prev => prev ? {...prev, audioRecUrl: undefined, transcribedText: undefined} : null);
                        }
                    }} 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10 flex-shrink-0"
                    title="Ta bort ljudinspelning"
                >
                    Ta bort ljud
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button
              type="button"
              onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
              variant={audioRecorder.isRecording ? "danger" : "accent"}
              size="md"
              className="w-full sm:w-auto"
              disabled={isSaving || audioRecorder.permissionGranted === false}
            >
              {audioRecorder.isRecording ? <StopIconLarge /> : <MicIconLarge />}
              <span className="ml-2">{audioRecorder.isRecording ? 'Stoppa Inspelning' : 'Starta Inspelning'}</span>
            </Button>
            <div className="flex gap-3">
              {editingEntry && (
                <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                  Avbryt Redigering
                </Button>
              )}
              <Button onClick={handleSaveEntry} isLoading={isSaving} disabled={!canSaveEntry} variant="primary" size="lg">
                {editingEntry ? 'Spara Ändringar' : 'Spara Anteckning'}
              </Button>
            </div>
          </div>
        </section>

        {/* Entries List */}
        <section>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Mina Anteckningar</h2>
          {isLoading ? (
            <LoadingSpinner message="Laddar anteckningar..." />
          ) : entries.length === 0 ? (
            <p className="text-muted-text dark:text-slate-400 text-center py-8">Du har inga dagboksanteckningar än.</p>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div key={entry.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-md border border-border-color dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-primary dark:text-blue-400">
                      {new Date(entry.date).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)} className="!p-1.5 !rounded-full" title="Redigera">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteConfirmation(entry)} className="!p-1.5 !rounded-full" title="Radera">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </Button>
                    </div>
                  </div>
                  {entry.content && <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-2">{entry.content}</p>}
                  {entry.audioRecUrl && (
                    <div className="mt-2">
                      <audio controls src={entry.audioRecUrl} className="w-full h-10" />
                    </div>
                  )}
                  {entry.transcribedText && entry.audioRecUrl && entry.transcribedText !== entry.content && (
                    <p className="mt-2 text-xs text-muted-text dark:text-slate-400 italic border-l-2 border-slate-300 dark:border-slate-600 pl-2">
                        Transkriberad text: "{entry.transcribedText}"
                    </p>
                  )}
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2">
                    Skapad: {new Date(entry.createdAt).toLocaleString('sv-SE')}
                    {entry.updatedAt && entry.updatedAt !== entry.createdAt && ` (Senast ändrad: ${new Date(entry.updatedAt).toLocaleString('sv-SE')})`}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {entryForDeletionConfirmation && (
        <ConfirmDeleteDiaryEntryModal
          entry={entryForDeletionConfirmation}
          onConfirm={confirmDelete}
          onCancel={() => setEntryForDeletionConfirmation(null)}
          isDeleting={isDeletingEntry}
        />
      )}
    </PageContainer>
  );
};
