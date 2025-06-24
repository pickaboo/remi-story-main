// Augment ImportMeta for Vite environment variables
declare global {
  interface ImportMetaEnv {
    [key: string]: string | boolean | undefined;
    VITE_FIREBASE_API_KEY: string;
    VITE_FIREBASE_AUTH_DOMAIN: string;
    VITE_FIREBASE_PROJECT_ID: string;
    VITE_FIREBASE_STORAGE_BUCKET: string;
    VITE_FIREBASE_MESSAGING_SENDER_ID: string;
    VITE_FIREBASE_APP_ID: string;
    VITE_FIREBASE_MEASUREMENT_ID?: string;
    VITE_API_KEY: string; // For Gemini
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}


export interface BackgroundPreference {
  type: 'url' | 'color';
  value: string; // URL string or hex color string
}

export interface User {
  id: string;
  name: string;
  initials: string;
  avatarColor: string; // e.g., 'bg-blue-500'
  sphereIds: string[]; // IDs of Spheres the user is a member of
  email?: string; // Optional: User's email address
  emailVerified?: boolean; // Optional: If the email has been verified
  backgroundPreference?: BackgroundPreference; // Optional: User's background preference
  themePreference?: 'light' | 'dark' | 'system'; // Added theme preference
  showImageMetadataInBank?: boolean; // Added for showing image metadata in bank
  pendingInvitationCount?: number; // Optional: For UI badge
}

export interface AuthUserRecord extends User {
  passwordHash?: string; // Optional for OAuth users or users not yet set up with password
  createdAt?: string; // ISO string for creation timestamp
  updatedAt?: string; // ISO string for last update timestamp
}

export interface Sphere {
  id: string;
  name: string;
  gradientColors: [string, string]; // e.g., ['#FF0080', '#FF8C00'] hex colors for gradient
  ownerUserId?: string; // Optional: if spheres are user-creatable/owned
  backgroundUrl?: string; // Optional: URL for sphere-specific background image
}

export interface UserDescriptionEntry {
  userId: string;
  description: string;
  audioRecUrl?: string | null; // Allow null
  createdAt: string;
}

export interface ImageRecord {
  id: string;
  name: string; // Will be "Text Post" or similar if no image
  type: string; // Will be "text/plain" or similar if no image
  dataUrl?: string; // Optional: not present for text/audio-only posts
  dateTaken?: string;
  tags: string[];
  geminiAnalysis?: string | null; 
  userDescriptions: UserDescriptionEntry[]; 
  compiledStory?: string | null; 
  isProcessed: boolean;
  width?: number | null; // Updated to allow null
  height?: number | null; // Updated to allow null
  uploadedByUserId?: string;
  processedByHistory: string[];
  suggestedGeotags?: string[]; 
  aiGeneratedPlaceholder?: string | null; 
  filePath?: string | null; // Updated to allow null
  sphereId: string; 
  isPublishedToFeed?: boolean; 
  exifData?: Record<string, { description: string | number }> | null; 
  createdAt?: string; 
  updatedAt?: string; 
}

export interface SlideshowProject {
  id: string;
  name: string;
  imageIds: string[];
  createdAt: string;
  sphereId: string; 
  projectType: 'slideshow' | 'photoAlbum'; 
}

export interface DiaryEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD for the entry date
  content: string;
  createdAt: string; 
  updatedAt?: string; 
  audioRecUrl?: string | null; // Allow null
  transcribedText?: string | null; // Allow null
}

export interface SphereInvitation {
  id: string;
  inviterUserId: string;
  inviteeEmail: string; 
  inviteeUserId?: string; 
  sphereId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string; 
  respondedAt?: string; 
}

export enum View {
  Home = 'HOME', 
  EditImage = 'EDIT_IMAGE',
  SlideshowProjects = 'SLIDESHOW_PROJECTS',
  PlaySlideshow = 'PLAY_SLIDESHOW',
  ImageBank = 'IMAGE_BANK',
  Diary = 'DIARY',
  // Auth views
  Login = 'LOGIN',
  Signup = 'SIGNUP',
  ForgotPassword = 'FORGOT_PASSWORD',
  EmailConfirmation = 'EMAIL_CONFIRMATION',
  ProfileCompletion = 'PROFILE_COMPLETION',
}