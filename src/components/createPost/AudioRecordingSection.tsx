import React from 'react';
import { Button, AudioPlayerButton } from '../ui';

interface AudioRecordingSectionProps {
  isRecording: boolean;
  audioBlob: Blob | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onResetAudio: () => void;
  disabled?: boolean;
}

// SVG Icons
const MicIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 7.5A2.25 2.25 0 017.5 5.25h9a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25h-9a2.25 2.25 0 01-2.25-2.25v-9z" />
  </svg>
);

export const AudioRecordingSection: React.FC<AudioRecordingSectionProps> = ({
  isRecording,
  audioBlob,
  onStartRecording,
  onStopRecording,
  onResetAudio,
  disabled = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {!isRecording ? (
          <Button
            onClick={onStartRecording}
            variant="secondary"
            size="sm"
            disabled={disabled}
            className="flex items-center"
          >
            <MicIcon />
            Spela in ljud
          </Button>
        ) : (
          <Button
            onClick={onStopRecording}
            variant="danger"
            size="sm"
            className="flex items-center"
          >
            <StopIcon />
            Stoppa inspelning
          </Button>
        )}
        
        {audioBlob && (
          <Button
            onClick={onResetAudio}
            variant="ghost"
            size="sm"
            className="text-slate-600 dark:text-slate-400"
          >
            Ta bort ljud
          </Button>
        )}
      </div>
      
      {audioBlob && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <AudioPlayerButton audioUrl={URL.createObjectURL(audioBlob)} />
        </div>
      )}
    </div>
  );
}; 