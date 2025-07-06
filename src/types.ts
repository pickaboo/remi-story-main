/**
 * REMI Story - TypeScript Type Definitions
 * 
 * This file contains all TypeScript interfaces and types used throughout the application.
 * Types are organized by feature area and include comprehensive documentation.
 */

// ============================================================================
// CORE APPLICATION TYPES
// ============================================================================

/**
 * Main application view types for navigation
 */
export enum View {
  // Authentication views
  Login = 'login',
  Signup = 'signup',
  EmailConfirmation = 'email-confirmation',
  ProfileCompletion = 'profile-completion',
  
  // Main application views
  Home = 'home',
  Diary = 'diary',
  ImageBank = 'image-bank',
  EditImage = 'edit-image',
  SlideshowProjects = 'slideshow-projects',
  PlaySlideshow = 'play-slideshow',
}

/**
 * Parameters passed to views for navigation
 */
export interface ViewParams {
  /** Image ID for edit image view */
  imageId?: string;
  /** Project ID for slideshow player */
  projectId?: string;
  /** Additional parameters as key-value pairs */
  [key: string]: string | undefined;
}

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

/**
 * User theme preference options
 */
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * User avatar color options for visual identification
 */
export type AvatarColor = 
  | 'bg-blue-500' | 'bg-green-500' | 'bg-yellow-500' | 'bg-red-500'
  | 'bg-purple-500' | 'bg-pink-500' | 'bg-indigo-500' | 'bg-gray-500'
  | 'bg-teal-500' | 'bg-orange-500' | 'bg-cyan-500' | 'bg-lime-500';

/**
 * User entity representing an application user
 */
export interface User {
  /** Unique user identifier */
  id: string;
  /** User's display name */
  name: string;
  /** User's email address */
  email: string | undefined;
  /** Whether email has been verified */
  emailVerified: boolean;
  /** User's initials for avatar display */
  initials: string;
  /** Avatar color for visual identification */
  avatarColor: AvatarColor;
  /** Theme preference (light/dark/system) */
  themePreference: ThemePreference;
  /** Background preference for customization */
  backgroundPreference?: BackgroundPreference;
  /** IDs of spheres the user belongs to */
  sphereIds: string[];
  /** Number of pending invitations */
  pendingInvitationCount?: number;
  /** Whether to show image metadata in bank */
  showImageMetadataInBank?: boolean;
  /** Timestamp when user was created */
  createdAt: string;
  /** Timestamp when user was last updated */
  updatedAt: string;
}

/**
 * Extended user record for authentication
 */
export interface AuthUserRecord extends User {
  /** Password hash for authentication */
  passwordHash?: string;
}

/**
 * Authentication state
 */
export interface AuthState {
  /** Whether user is authenticated */
  isAuthenticated: boolean | null;
  /** Current authenticated user */
  currentUser: User | null;
}

/**
 * Login result
 */
export interface LoginResult {
  /** Authenticated user */
  user: User | null;
  /** Error message if login failed */
  error?: string;
}

/**
 * OAuth login result
 */
export interface OAuthLoginResult {
  /** Authenticated user */
  user: User;
  /** Whether this is a new user */
  isNewUser: boolean;
}

// ============================================================================
// SPHERE TYPES
// ============================================================================

/**
 * Sphere entity representing a group or collection
 */
export interface Sphere {
  /** Unique sphere identifier */
  id: string;
  /** Sphere display name */
  name: string;
  /** Gradient colors for sphere visual representation */
  gradientColors: [string, string];
  /** IDs of users who are members of this sphere */
  memberIds: string[];
  /** ID of the sphere owner/creator */
  ownerId: string;
  /** Background URL for sphere customization */
  backgroundUrl?: string;
  /** Timestamp when sphere was created */
  createdAt: string;
  /** Timestamp when sphere was last updated */
  updatedAt: string;
}

/**
 * Helper function to check if a sphere is personal (only owner is member)
 */
export const isPersonalSphere = (sphere: Sphere): boolean => {
  return sphere.memberIds.length === 1 && sphere.memberIds[0] === sphere.ownerId;
};

/**
 * Sphere invitation entity
 */
export interface SphereInvitation {
  /** Unique invitation identifier */
  id: string;
  /** ID of the sphere being invited to */
  sphereId: string;
  /** Email of the user being invited */
  inviteeEmail: string;
  /** ID of the user being invited (set when accepted) */
  invitedUserId?: string;
  /** ID of the user sending the invitation */
  invitedByUserId: string;
  /** Optional message with the invitation */
  message?: string;
  /** Invitation status */
  status: 'pending' | 'accepted' | 'declined';
  /** Timestamp when invitation was created */
  createdAt: string;
  /** Timestamp when invitation was last updated */
  updatedAt: string;
}

/**
 * Sphere creation result
 */
export interface SphereCreationResult {
  /** Whether creation was successful */
  success: boolean;
  /** Created sphere */
  sphere?: Sphere;
  /** Updated user data */
  updatedUser?: User;
  /** Error message if creation failed */
  error?: string;
}

/**
 * Invitation result
 */
export interface InvitationResult {
  /** Whether invitation was successful */
  success: boolean;
  /** Result message */
  message: string;
  /** Created invitation */
  invitation?: SphereInvitation;
}

// ============================================================================
// IMAGE & CONTENT TYPES
// ============================================================================

/**
 * Image record representing uploaded content
 */
export interface ImageRecord {
  /** Unique image identifier */
  id: string;
  /** Image display name */
  name: string;
  /** Image data URL or storage reference */
  dataUrl: string;
  /** Image width in pixels */
  width: number | null;
  /** Image height in pixels */
  height: number | null;
  /** Image file size in bytes */
  size: number;
  /** Image MIME type */
  type: string;
  /** ID of the user who uploaded the image */
  uploadedByUserId: string;
  /** ID of the sphere this image belongs to */
  sphereId: string;
  /** Date when image was taken (if available) */
  dateTaken?: string;
  /** AI-generated placeholder text for image description */
  aiGeneratedPlaceholder?: string;
  /** User-generated tags for the image */
  tags: string[];
  /** Suggested geotags from image metadata */
  suggestedGeotags?: string[];
  /** User descriptions and comments for the image */
  userDescriptions: UserDescriptionEntry[];
  /** File path in storage */
  filePath?: string;
  /** Whether image has been processed */
  isProcessed?: boolean;
  /** Whether image is published to feed */
  isPublishedToFeed?: boolean;
  /** EXIF data from image */
  exifData?: Record<string, { description: string | number }>;
  /** AI analysis of image */
  geminiAnalysis?: string;
  /** Compiled story from image */
  compiledStory?: string;
  /** Processing history */
  processedByHistory?: string[];
  /** Timestamp when image was created */
  createdAt: string;
  /** Timestamp when image was last updated */
  updatedAt: string;
}

/**
 * User description entry for images
 */
export interface UserDescriptionEntry {
  /** ID of the user who created this description */
  userId: string;
  /** Text description or comment */
  description: string;
  /** Audio recording URL (if applicable) */
  audioRecUrl?: string;
  /** Transcribed text from audio (if applicable) */
  transcribedText?: string;
  /** Timestamp when description was created */
  createdAt: string;
}

/**
 * File upload result
 */
export interface FileUploadResult {
  /** Whether upload was successful */
  success: boolean;
  /** File path in storage */
  filePath?: string;
  /** Error message if upload failed */
  error?: string;
}

/**
 * Image processing result
 */
export interface ImageProcessingResult {
  /** Whether processing was successful */
  success: boolean;
  /** Processed image record */
  processedImage?: ImageRecord;
  /** Error message if processing failed */
  error?: string;
}

// ============================================================================
// DIARY TYPES
// ============================================================================

/**
 * Diary entry entity
 */
export interface DiaryEntry {
  /** Unique diary entry identifier */
  id: string;
  /** ID of the user who created this entry */
  userId: string;
  /** Date of the diary entry (YYYY-MM-DD format) */
  date: string;
  /** Text content of the diary entry */
  content: string;
  /** Audio recording URL (if applicable) */
  audioRecUrl?: string;
  /** Transcribed text from audio (if applicable) */
  transcribedText?: string;
  /** Timestamp when entry was created */
  createdAt: string;
  /** Timestamp when entry was last updated */
  updatedAt: string;
}

// ============================================================================
// SLIDESHOW TYPES
// ============================================================================

/**
 * Slideshow project entity
 */
export interface SlideshowProject {
  /** Unique project identifier */
  id: string;
  /** Project display name */
  name: string;
  /** Project description */
  description?: string;
  /** ID of the user who created this project */
  createdByUserId: string;
  /** ID of the sphere this project belongs to */
  sphereId: string;
  /** Array of image IDs in the slideshow order */
  imageIds: string[];
  /** Project type */
  projectType?: 'slideshow' | 'photoAlbum';
  /** Slideshow settings and configuration */
  settings?: SlideshowSettings;
  /** Timestamp when project was created */
  createdAt: string;
  /** Timestamp when project was last updated */
  updatedAt: string;
}

/**
 * Slideshow settings and configuration
 */
export interface SlideshowSettings {
  /** Duration each slide is shown (in seconds) */
  slideDuration: number;
  /** Transition effect between slides */
  transitionEffect: 'fade' | 'slide' | 'zoom';
  /** Whether slideshow should loop */
  loop: boolean;
  /** Whether to show navigation controls */
  showControls: boolean;
  /** Background color for slideshow */
  backgroundColor: string;
  /** Whether to include audio narration */
  includeAudio: boolean;
}

// ============================================================================
// ERROR & VALIDATION TYPES
// ============================================================================

/**
 * Application error types
 */
export enum ErrorType {
  /** Authentication errors */
  AUTHENTICATION = 'authentication',
  /** Authorization errors */
  AUTHORIZATION = 'authorization',
  /** Validation errors */
  VALIDATION = 'validation',
  /** Network errors */
  NETWORK = 'network',
  /** Server errors */
  SERVER = 'server',
  /** Unknown errors */
  UNKNOWN = 'unknown',
}

/**
 * Error codes for specific error types
 */
export type ErrorCode = 
  | 'AUTH_FAILED'
  | 'NETWORK_ERROR'
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NOT_FOUND'
  | 'ALREADY_EXISTS'
  | 'INVALID_INPUT'
  | 'UPLOAD_FAILED'
  | 'PROCESSING_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * Standardized error structure
 */
export interface AppError {
  /** Error type classification */
  type: ErrorType;
  /** Error code for programmatic handling */
  code: string;
  /** Human-readable error message */
  message: string;
  /** Technical error details (for debugging) */
  details?: string;
  /** Timestamp when error occurred */
  timestamp: string;
  /** Additional context data */
  context?: Record<string, unknown>;
}

/**
 * Validation error for form fields
 */
export interface ValidationError {
  /** Field name that failed validation */
  field: string;
  /** Validation error message */
  message: string;
  /** Validation error code */
  code: string;
  /** Invalid value that caused the error */
  value?: unknown;
}

/**
 * Form validation result
 */
export interface ValidationResult {
  /** Whether the form is valid */
  isValid: boolean;
  /** Array of validation errors */
  errors: ValidationError[];
}

/**
 * Form validation interface
 */
export interface FormValidation {
  /** Validate entire form */
  validate: (values: Record<string, unknown>) => ValidationResult;
  /** Validate single field */
  validateField: (field: string, value: unknown) => ValidationError | null;
}

/**
 * Error handler interface
 */
export interface ErrorHandler {
  /** Handle errors */
  handleError: (error: AppError | Error | string) => void;
  /** Log errors */
  logError: (error: AppError | Error | string, context?: Record<string, unknown>) => void;
  /** Show user-friendly error messages */
  showUserFriendlyError: (error: AppError | Error | string) => void;
}

// ============================================================================
// API & SERVICE TYPES
// ============================================================================

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  /** Whether the request was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error information if request failed */
  error?: AppError;
  /** Response metadata */
  metadata?: {
    /** Total count for paginated responses */
    totalCount?: number;
    /** Current page for paginated responses */
    currentPage?: number;
    /** Items per page for paginated responses */
    itemsPerPage?: number;
  };
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  /** Page number (1-based) */
  page: number;
  /** Number of items per page */
  limit: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Search parameters
 */
export interface SearchParams extends PaginationParams {
  /** Search query string */
  query?: string;
  /** Filter criteria */
  filters?: Record<string, unknown>;
}

// ============================================================================
// UI & COMPONENT TYPES
// ============================================================================

/**
 * Modal state management
 */
export interface ModalState {
  /** Whether modal is currently open */
  isOpen: boolean;
  /** Modal type identifier */
  type: string;
  /** Modal-specific data */
  data?: Record<string, unknown>;
}

/**
 * Loading state for async operations
 */
export interface LoadingState {
  /** Whether operation is in progress */
  isLoading: boolean;
  /** Loading message to display */
  message?: string;
  /** Progress percentage (0-100) */
  progress?: number;
}

/**
 * Notification message
 */
export interface Notification {
  /** Unique notification identifier */
  id: string;
  /** Notification type */
  type: 'success' | 'error' | 'warning' | 'info';
  /** Notification title */
  title: string;
  /** Notification message */
  message: string;
  /** Whether notification can be dismissed */
  dismissible: boolean;
  /** Auto-dismiss duration in milliseconds */
  autoDismiss?: number;
  /** Timestamp when notification was created */
  createdAt: string;
}

/**
 * Base component props
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  className?: string;
  /** Component children */
  children?: React.ReactNode;
}

/**
 * Loading component props
 */
export interface LoadingProps extends BaseComponentProps {
  /** Loading message */
  message?: string;
  /** Loading spinner size */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Error component props
 */
export interface ErrorProps extends BaseComponentProps {
  /** Error to display */
  error: string | Error | AppError;
  /** Retry function */
  onRetry?: () => void;
  /** Whether to show error details */
  showDetails?: boolean;
}

/**
 * Form field state
 */
export interface FormField {
  /** Field value */
  value: string;
  /** Field error message */
  error?: string;
  /** Whether field is valid */
  isValid: boolean;
  /** Whether field has been touched */
  isTouched: boolean;
}

/**
 * Form state
 */
export interface FormState {
  [key: string]: FormField;
}

/**
 * File upload event
 */
export interface FileUploadEvent {
  /** Uploaded file */
  file: File;
  /** Upload progress (0-100) */
  progress: number;
  /** Upload status */
  status: 'uploading' | 'success' | 'error';
  /** Error message if upload failed */
  error?: string;
}

/**
 * Navigation handler type
 */
export type NavigationHandler = (view: View, params?: ViewParams) => void;

/**
 * Feedback type
 */
export type FeedbackType = 'success' | 'error' | 'warning' | 'info';

/**
 * Global feedback
 */
export interface GlobalFeedback {
  /** Feedback message */
  message: string;
  /** Feedback type */
  type: FeedbackType;
}

/**
 * Legacy feedback type for backward compatibility
 */
export interface LegacyFeedback {
  /** Feedback message */
  message: string;
  /** Feedback type */
  type: 'success' | 'error';
}

/**
 * Background preference
 */
export interface BackgroundPreference {
  /** Background type */
  type: 'url' | 'color';
  /** Background value (URL or hex color) */
  value: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Optional utility type for making properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Required utility type for making properties required
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Deep partial utility type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Event handler type for common events
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * Async event handler type
 */
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// ============================================================================
// GLOBAL DECLARATIONS
// ============================================================================

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





