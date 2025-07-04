import React, { useState, useRef, useEffect } from 'react';
import { User, DiaryEntry } from '../../types';
import { saveDiaryEntry, generateId } from '../../services/storageService';
import { TextArea } from './TextArea';
import { Button } from './Button';
import { useAudioRecorder } from '../../hooks/useAudioRecorder'; // Import useAudioRecorder

interface DiaryPopoverProps {
  currentUser: User;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: HTMLElement | null; // To position the popover
}

const MicIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);


export const DiaryPopover: React.FC<DiaryPopoverProps> = ({ currentUser, isOpen, onClose, anchorRef }) => {
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const audioRecorder = useAudioRecorder();

  useEffect(() => {
    if (isOpen) {
      setContent(''); // Reset content when opened
      audioRecorder.resetAudio();
    }
  }, [isOpen, audioRecorder]);
  
  // Auto-fill content with transcribed text if content is empty
  useEffect(() => {
    if (audioRecorder.transcribedText && content.trim() === '' && !audioRecorder.isRecording) {
      setContent(audioRecorder.transcribedText);
    }
  }, [audioRecorder.transcribedText, content, audioRecorder.isRecording]);


  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef &&
        !anchorRef.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const handleSave = async () => {
    if (!content.trim() && !audioRecorder.audioUrl) return; // Must have text or audio
    setIsSaving(true);
    audioRecorder.stopRecording(); // Ensure recording is stopped
    
    const today = new Date();
    const entryDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const newEntry: DiaryEntry = {
      id: generateId(),
      userId: currentUser.id,
      date: entryDate,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      audioRecUrl: audioRecorder.audioUrl || undefined,
      transcribedText: audioRecorder.audioUrl ? (audioRecorder.transcribedText.trim() || content.trim()) : undefined,
    };
    await saveDiaryEntry(newEntry);
    setIsSaving(false);
    onClose(); // Resets content and audio via useEffect on isOpen change
  };
  
  const canSave = !isSaving && (content.trim() !== '' || !!audioRecorder.audioUrl);

  if (!isOpen) return null;

  return (
    <div 
      ref={popoverRef}
      className="absolute top-12 right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-border-color dark:border-slate-700 z-[60] p-4"
      onClick={(e) => e.stopPropagation()} 
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-md font-semibold text-slate-700 dark:text-slate-200">Snabbanteckning ({new Date().toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short'})})</h3>
        <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300" aria-label="Stäng anteckning">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <TextArea
        id="quickDiaryEntry"
        placeholder="Skriv din anteckning eller spela in..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="text-sm min-h-[80px] max-h-40 !rounded-lg" 
        disabled={isSaving || audioRecorder.isRecording}
        rows={3}
      />
      <div className="mt-2 space-y-1">
        {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && (
            <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>
        )}
        {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
        {audioRecorder.audioUrl && (
            <div className="flex items-center gap-2">
            <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
            <Button type="button" onClick={() => audioRecorder.resetAudio()} variant="ghost" size="sm" className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10">Ta bort ljud</Button>
            </div>
        )}
      </div>

      <div className="mt-3 flex justify-between items-center">
        <Button
            type="button"
            onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
            variant={audioRecorder.isRecording ? "danger" : "ghost"}
            size="sm"
            className="!rounded-lg !px-2 !py-1.5"
            aria-label={audioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
            disabled={isSaving || audioRecorder.permissionGranted === false}
        >
            {audioRecorder.isRecording ? <StopIcon /> : <MicIcon />}
            <span className="ml-1.5 text-xs">{audioRecorder.isRecording ? "Stoppa" : "Spela in"}</span>
        </Button>
        <Button 
          onClick={handleSave} 
          isLoading={isSaving} 
          disabled={!canSave}
          variant="primary" 
          size="md" 
          className="!rounded-lg"
        >
          Spara
        </Button>
      </div>
    </div>
  );
};
