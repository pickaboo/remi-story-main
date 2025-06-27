import { useState, useCallback, useRef, useEffect } from 'react';
import { MAX_AUDIO_DURATION_MS } from '../../constants';

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface AudioRecorderState {
  isRecording: boolean;
  audioUrl: string | null;
  transcribedText: string;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  resetAudio: () => void;
  error: string | null;
  permissionGranted: boolean | null;
}

export const useAudioRecorder = (): AudioRecorderState => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any | null>(null); // SpeechRecognition instance

  const cleanupRecorder = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    mediaRecorderRef.current = null;
    recognitionRef.current = null;
    audioChunksRef.current = [];
  };
  
  useEffect(() => {
    return () => {
      cleanupRecorder();
    };
  }, []);


  const requestMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Close the stream immediately after checking permission to free up the microphone
      stream.getTracks().forEach(track => track.stop());
      setPermissionGranted(true);
      setError(null);
      return true;
    } catch (err) {
      console.error("Microphone permission denied:", err);
      setError("Mikrofonåtkomst krävs för ljudinspelning och transkribering.");
      setPermissionGranted(false);
      return false;
    }
  }, []);

  const startRecording = useCallback(async () => {
    const hasPermission = permissionGranted === true || await requestMicrophonePermission();
    if (!hasPermission) return;

    if (isRecording) return;
    setIsRecording(true);
    setAudioUrl(null);
    setTranscribedText('');
    setError(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop()); // Release microphone
      };
      
      mediaRecorderRef.current.start();

      // Setup Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'sv-SE'; // Or detect user lang

        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setTranscribedText(prev => prev + finalTranscript); // Append final results
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setError(`Taligenkänningsfel: ${event.error}`);
        };
        
        recognitionRef.current.start();
      } else {
        setError("Taligenkänning stöds inte av din webbläsare.");
      }

      // Automatically stop recording after MAX_AUDIO_DURATION_MS
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            stopRecording();
        }
      }, MAX_AUDIO_DURATION_MS);

    } catch (err) {
      console.error("Error starting recording:", err);
      setError("Kunde inte starta inspelningen. Kontrollera mikrofonåtkomst.");
      setIsRecording(false);
    }
  }, [isRecording, requestMicrophonePermission, permissionGranted]);

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    
    mediaRecorderRef.current.stop();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const resetAudio = useCallback(() => {
    setAudioUrl(null);
    setTranscribedText('');
    setIsRecording(false);
    setError(null);
    audioChunksRef.current = [];
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
     if (recognitionRef.current) {
        recognitionRef.current.abort(); // Use abort for immediate stop without processing further
    }
  }, []);

  return { isRecording, audioUrl, transcribedText, startRecording, stopRecording, resetAudio, error, permissionGranted };
};
