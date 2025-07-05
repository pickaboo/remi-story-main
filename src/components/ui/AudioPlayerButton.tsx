import React, { useState, useRef, useEffect, memo } from 'react';
import { Button } from './Button'; // Assuming your Button component is here

interface AudioPlayerButtonProps {
  audioUrl: string;
  className?: string;
  buttonSize?: 'sm' | 'md';
  buttonVariant?: 'ghost' | 'accent' | 'primary' | 'secondary' | 'danger';
  ariaLabel?: string;
}

const PlayIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
  </svg>
);

const PauseIcon: React.FC<{ sizeClass?: string }> = ({ sizeClass = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={sizeClass}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-6-13.5v13.5" />
  </svg>
);

export const AudioPlayerButton: React.FC<AudioPlayerButtonProps> = memo(({
  audioUrl,
  className = '',
  buttonSize = 'md',
  buttonVariant = 'ghost',
  ariaLabel = 'Spela upp ljud',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create an audio element if it doesn't exist or URL changes
    if (!audioRef.current || audioRef.current.src !== audioUrl) {
      if (audioRef.current) { // Cleanup old one if src changes
        audioRef.current.pause();
        audioRef.current.removeEventListener('play', handlePlayEvent);
        audioRef.current.removeEventListener('pause', handlePauseEvent);
        audioRef.current.removeEventListener('ended', handleEndedEvent);
      }
      audioRef.current = new Audio(audioUrl);
      audioRef.current.addEventListener('play', handlePlayEvent);
      audioRef.current.addEventListener('pause', handlePauseEvent);
      audioRef.current.addEventListener('ended', handleEndedEvent);
    }
    
    // Cleanup on component unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('play', handlePlayEvent);
        audioRef.current.removeEventListener('pause', handlePauseEvent);
        audioRef.current.removeEventListener('ended', handleEndedEvent);
        audioRef.current = null; // Ensure it's GC'd
      }
      setIsPlaying(false);
    };
  }, [audioUrl]);

  const handlePlayEvent = () => setIsPlaying(true);
  const handlePauseEvent = () => setIsPlaying(false);
  const handleEndedEvent = () => setIsPlaying(false);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(error => console.error("Error playing audio:", error));
      }
    }
  };
  
  const iconSizeClass = buttonSize === 'md' ? "w-5 h-5" : "w-4 h-4";

  return (
    <Button
      type="button"
      onClick={togglePlayPause}
      variant={buttonVariant}
      size={buttonSize}
      className={`!rounded-full ${buttonSize === 'sm' ? '!p-1.5' : '!p-2'} ${className}`}
      aria-label={isPlaying ? `Pausa ${ariaLabel}`: `Spela ${ariaLabel}`}
    >
      {isPlaying ? <PauseIcon sizeClass={iconSizeClass} /> : <PlayIcon sizeClass={iconSizeClass} />}
    </Button>
  );
});

AudioPlayerButton.displayName = 'AudioPlayerButton';
