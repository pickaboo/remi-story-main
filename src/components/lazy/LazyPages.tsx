import { lazy } from 'react';

// Auth pages
export const LoginPage = lazy(() => import('../../pages/auth/LoginPage').then(module => ({ default: module.LoginPage })));
export const SignupPage = lazy(() => import('../../pages/auth/SignupPage').then(module => ({ default: module.SignupPage })));
export const EmailConfirmationPage = lazy(() => import('../../pages/auth/EmailConfirmationPage').then(module => ({ default: module.EmailConfirmationPage })));
export const ProfileCompletionPage = lazy(() => import('../../pages/auth/ProfileCompletionPage').then(module => ({ default: module.ProfileCompletionPage })));

// Main pages
export const FeedPage = lazy(() => import('../../pages/FeedPage').then(module => ({ default: module.FeedPage })));
export const DiaryPage = lazy(() => import('../../pages/DiaryPage').then(module => ({ default: module.DiaryPage })));
export const EditImagePage = lazy(() => import('../../pages/EditImagePage').then(module => ({ default: module.EditImagePage })));
export const ImageBankPage = lazy(() => import('../../pages/ImageBankPage').then(module => ({ default: module.ImageBankPage })));
export const SlideshowProjectsPage = lazy(() => import('../../pages/SlideshowProjectsPage').then(module => ({ default: module.SlideshowProjectsPage })));
export const SlideshowPlayerPage = lazy(() => import('../../pages/SlideshowPlayerPage').then(module => ({ default: module.SlideshowPlayerPage }))); 