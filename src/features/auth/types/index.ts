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

export enum AuthView {
  Login = 'LOGIN',
  Signup = 'SIGNUP',
  ForgotPassword = 'FORGOT_PASSWORD',
  EmailConfirmation = 'EMAIL_CONFIRMATION',
  ProfileCompletion = 'PROFILE_COMPLETION',
} 