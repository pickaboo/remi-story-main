import React, { useState, useEffect, useCallback } from 'react';
import { PageContainer } from '../../components/layout/PageContainer';
import { Button, TextArea, LoadingSpinner } from '../../components/ui';
import { DiaryEntry } from '../../types';
import { fetchDiaryEntries, saveDiaryEntry as saveDiaryEntryFS, deleteDiaryEntry as deleteDiaryEntryFS } from './services/diaryService';
import { generateId } from '../../services/storageService';
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; 
import { useAppContext } from '../../context/AppContext';
import { TrainingDiarySection } from '../trainingDiary/components/TrainingDiarySection';
import { AudioPlayerButton } from '../../components/ui/AudioPlayerButton';
import { getAllTrainingEntriesByUserId } from '../trainingDiary/services/trainingDiaryService';
import { TrainingEntry } from '../trainingDiary/types';

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
    <div className="bg-card-bg dark:bg-dark-bg rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
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

export const DiaryPage: React.FC = () => {
  const { currentUser } = useAppContext();

  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [newEntryContent, setNewEntryContent] = useState('');
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const audioRecorder = useAudioRecorder();
  const trainingEnabled = !!currentUser?.enabledFeatures?.trainingDiary;
  const [trainingEntries, setTrainingEntries] = useState<TrainingEntry[]>([]);
  const [editingTrainingEntry, setEditingTrainingEntry] = useState<TrainingEntry | null>(null);

  const [entryForDeletionConfirmation, setEntryForDeletionConfirmation] = useState<DiaryEntry | null>(null);
  const [isDeletingEntry, setIsDeletingEntry] = useState(false);
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Om currentUser saknas, visa loading
  if (!currentUser) {
    return <LoadingSpinner message="Laddar användare..." />;
  }

  const fetchEntries = useCallback(async () => {
    setIsLoading(true);
    const userEntries = await fetchDiaryEntries(currentUser.id);
    const userTrainingEntries = await getAllTrainingEntriesByUserId(currentUser.id);
    setEntries(userEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    setTrainingEntries(userTrainingEntries);
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
    await saveDiaryEntryFS(currentUser.id, entryToSave);
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
    await deleteDiaryEntryFS(currentUser.id, entryForDeletionConfirmation.id);
    setEntryForDeletionConfirmation(null);
    fetchEntries();
    setIsDeletingEntry(false);
  };

  const canSaveEntry = !isSaving && (newEntryContent.trim() !== '' || !!audioRecorder.audioUrl);

  // Slå ihop dagboks- och träningsanteckningar till en gemensam lista
  const allEntries = [
    ...entries.map(e => ({ ...e, _entryType: 'diary' as const })),
    ...trainingEntries.map(e => ({ ...e, _entryType: 'training' as const })),
  ];
  console.log('Datum för allEntries:', allEntries.map(e => ({ date: e.date, type: e._entryType })));
  const getSortTime = (entry: { updatedAt?: string; createdAt: string }) =>
    new Date(entry.updatedAt || entry.createdAt).getTime();
  const sortedEntries = allEntries.sort((a, b) => getSortTime(b) - getSortTime(a));

  return (
    <PageContainer title={`Min Dagbok - ${currentUser.name}`}>
      <div className="space-y-8">
        {/* Entry Form */}
        <section className="bg-slate-50 dark:bg-dark-bg/30 p-4 sm:p-6 rounded-xl shadow-lg border border-border-color dark:border-dark-bg/50">
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
              className="block w-full sm:w-auto px-3 py-2 border border-border-color dark:border-dark-bg/50 rounded-md shadow-sm bg-input-bg dark:bg-dark-bg dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 focus:border-primary dark:focus:border-blue-400 text-sm dark:[color-scheme:dark]"
              disabled={isSaving}
            />
          </div>

          <TextArea
            id="newDiaryEntry"
            placeholder="Skriv dina tankar här, eller spela in en ljudanteckning..."
            value={newEntryContent}
            onChange={(e) => setNewEntryContent(e.target.value)}
            className="min-h-[120px] max-h-80 pr-12 relative mb-6"
            rows={5}
            disabled={isSaving || audioRecorder.isRecording}
          />
          {/* Ljudinspelningsknapp och uppspelning inuti textarea-container */}
          <div className="relative -mt-12 mb-8 flex justify-end items-center pointer-events-none">
            {audioRecorder.audioUrl || editingEntry?.audioRecUrl ? (
              <div className="pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2">
                <AudioPlayerButton
                  audioUrl={audioRecorder.audioUrl || editingEntry?.audioRecUrl || ''}
                  ariaLabel="Ljudinspelning för dagboksanteckning"
                  buttonSize="sm"
                  className="!rounded-full !p-2"
                />
                <Button
                  type="button"
                  onClick={() => {
                    audioRecorder.resetAudio();
                    if (editingEntry) {
                      setEditingEntry(prev => prev ? { ...prev, audioRecUrl: undefined, transcribedText: undefined } : null);
                    }
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10 ml-2"
                  title="Ta bort ljudinspelning"
                >
                  Ta bort ljud
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
                variant={audioRecorder.isRecording ? "danger" : "ghost"}
                size="sm"
                className="!rounded-full !px-2 !py-1.5 pointer-events-auto absolute right-3 top-1/2 -translate-y-1/2"
                aria-label={audioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
                disabled={isSaving || audioRecorder.permissionGranted === false}
              >
                {audioRecorder.isRecording ? <StopIconLarge /> : <MicIconLarge />}
              </Button>
            )}
          </div>
          {/* Felmeddelanden */}
          <div className="mt-2 space-y-1">
            {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && !editingEntry?.audioRecUrl && (
              <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>
            )}
            {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
          </div>
          {/* Spara-knapp för dagboksanteckning */}
          <div className="mt-4 flex gap-3">
            {editingEntry && (
              <Button variant="secondary" onClick={handleCancelEdit} disabled={isSaving}>
                Avbryt Redigering
              </Button>
            )}
            <Button onClick={handleSaveEntry} isLoading={isSaving} disabled={!canSaveEntry} variant="primary" size="lg">
              {editingEntry ? 'Spara Ändringar' : 'Spara Anteckning'}
            </Button>
          </div>
          {/* Träningsdagbok-feature */}
          {trainingEnabled && <TrainingDiarySection
            editingEntry={editingTrainingEntry}
            onCancelEdit={() => setEditingTrainingEntry(null)}
            onSaveEdit={() => setEditingTrainingEntry(null)}
            onEntrySaved={(newEntry) => {
              setEditingTrainingEntry(null);
              setTrainingEntries(prev => {
                // Ersätt entry för datumet om det finns, annars lägg till
                const idx = prev.findIndex(e => e.date === newEntry.date);
                if (idx !== -1) {
                  const updated = [...prev];
                  updated[idx] = newEntry;
                  return updated;
                }
                return [newEntry, ...prev];
              });
            }}
          />}
        </section>

        {/* Entries List */}
        <section>
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-4">Mina Anteckningar</h2>
          {isLoading ? (
            <LoadingSpinner message="Laddar anteckningar..." />
          ) : sortedEntries.length === 0 ? (
            <p className="text-muted-text dark:text-slate-400 text-center py-8">Du har inga anteckningar än.</p>
          ) : (
            <div className="space-y-6">
              {sortedEntries.map((entry) => (
                <div key={entry.id} className="bg-white dark:bg-dark-bg p-4 rounded-lg shadow-md border border-border-color dark:border-dark-bg/50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-primary dark:text-blue-400">
                      {new Date(entry.date).toLocaleDateString('sv-SE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ml-2">
                      {entry._entryType === 'diary' ? 'Dagbok' : 'Träning'}
                    </span>
                    <div className="flex gap-2">
                      {entry._entryType === 'diary' && (
                        <Button variant="ghost" size="sm" onClick={() => handleEditEntry(entry)} className="!p-1.5 !rounded-full" title="Redigera">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </Button>
                      )}
                      {entry._entryType === 'training' && (
                        <Button variant="ghost" size="sm" onClick={() => setEditingTrainingEntry(entry)} className="!p-1.5 !rounded-full" title="Redigera">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" /></svg>
                        </Button>
                      )}
                      {entry._entryType === 'diary' && (
                        <Button variant="danger" size="sm" onClick={() => handleDeleteConfirmation(entry)} className="!p-1.5 !rounded-full" title="Radera">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.243.032 3.223.094M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </Button>
                      )}
                    </div>
                  </div>
                  {/* Rendera innehåll beroende på typ */}
                  {entry._entryType === 'diary' && 'content' in entry && entry.content && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap mb-2">{entry.content}</p>
                  )}
                  {entry._entryType === 'training' && 'rows' in entry && entry.rows && (
                    <ul className="mb-2 space-y-1">
                      {[...entry.rows].reverse().map((row, idx) => (
                        <li key={idx} className="flex gap-4 items-center">
                          <span className="font-medium w-28">{row.type}</span>
                          <span className="w-20">{row.duration} min</span>
                          <span className="w-24">{row.value}</span>
                        </li>
                      ))}
                      {'note' in entry && entry.note && <li className="text-xs text-muted-text dark:text-slate-400 italic">"{entry.note}"</li>}
                    </ul>
                  )}
                  {/* Ljuduppspelning */}
                  {entry._entryType === 'diary' && 'audioRecUrl' in entry && entry.audioRecUrl && (
                    <div className="mt-2">
                      <audio controls src={entry.audioRecUrl} className="w-full h-10" />
                    </div>
                  )}
                  {entry._entryType === 'diary' && 'transcribedText' in entry && 'audioRecUrl' in entry && entry.transcribedText && entry.audioRecUrl && entry.transcribedText !== entry.content && (
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
