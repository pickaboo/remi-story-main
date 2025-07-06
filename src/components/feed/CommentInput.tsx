import React from 'react';
import { Button, TextArea, AudioPlayerButton } from '../ui';

interface CommentInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  disabled: boolean;
  audioRecorder: any;
  handleResetAudio: () => void;
  canSubmit: boolean;
  placeholder?: string;
  id?: string;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  disabled,
  audioRecorder,
  handleResetAudio,
  canSubmit,
  placeholder = '',
  id,
}) => (
  <div className="space-y-2">
    <div className="flex items-start space-x-2">
      <div className="relative flex-grow">
        <TextArea
          id={id || 'comment-input'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className="pr-12"
          disabled={disabled}
        />
        {audioRecorder.audioUrl ? (
          <AudioPlayerButton
            audioUrl={audioRecorder.audioUrl}
            ariaLabel="Ljudinspelning för kommentar"
            buttonSize="sm"
            className="!rounded-full !p-2 flex-shrink-0 absolute top-1/2 right-2 -translate-y-1/2"
          />
        ) : (
          <Button
            type="button"
            onClick={audioRecorder.isRecording ? audioRecorder.stopRecording : audioRecorder.startRecording}
            variant={audioRecorder.isRecording ? "danger" : "ghost"}
            size="sm"
            className="!rounded-full !px-2 !py-1.5 flex-shrink-0 absolute top-1/2 right-2 -translate-y-1/2"
            aria-label={audioRecorder.isRecording ? "Stoppa inspelning" : "Spela in ljud"}
            disabled={disabled || audioRecorder.permissionGranted === false}
          >
            {audioRecorder.isRecording ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" /></svg> : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>}
          </Button>
        )}
      </div>
    </div>
    {(audioRecorder.error || audioRecorder.permissionGranted === false || audioRecorder.audioUrl) && (
      <div className="ml-10 -mt-1 space-y-0.5">
        {audioRecorder.permissionGranted === false && !audioRecorder.audioUrl && <p className="text-xs text-danger dark:text-red-400">Mikrofonåtkomst nekad.</p>}
        {audioRecorder.error && <p className="text-xs text-danger dark:text-red-400">{audioRecorder.error}</p>}
        {audioRecorder.audioUrl && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-text dark:text-slate-400">Ljud inspelat.</span>
            <Button type="button" onClick={handleResetAudio} variant="ghost" size="sm" className="text-xs !py-0.5 !px-1.5 text-danger border-danger hover:bg-danger/10 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-400/10">Ta bort</Button>
          </div>
        )}
      </div>
    )}
    <div className="flex justify-end">
      <Button onClick={onSubmit} isLoading={isLoading} disabled={!canSubmit} variant="secondary" size="md">
        Publicera kommentar
      </Button>
    </div>
  </div>
); 