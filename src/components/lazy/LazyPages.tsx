import { lazy } from 'react';

// Auth pages
export const LoginPage = lazy(() => import('../../features/auth/pages/LoginPage').then(module => ({ default: module.LoginPage })));
export const SignupPage = lazy(() => import('../../features/auth/pages/SignupPage').then(module => ({ default: module.SignupPage })));
export const EmailConfirmationPage = lazy(() => import('../../features/auth/pages/EmailConfirmationPage').then(module => ({ default: module.EmailConfirmationPage })));
export const ProfileCompletionPage = lazy(() => import('../../features/auth/pages/ProfileCompletionPage').then(module => ({ default: module.ProfileCompletionPage })));

// Main pages
export const FeedPage = lazy(() => import('../../features/feed/FeedPage').then(module => ({ default: module.FeedPage })));
export const DiaryPage = lazy(() => import('../../features/diary/DiaryPage').then(module => ({ default: module.DiaryPage })));
export const EditImagePage = lazy(() => import('../../pages/EditImagePage').then(module => ({ default: module.EditImagePage })));
export const ImageBankPage = lazy(() => import('../../features/imageBank/pages/ImageBankPage').then(module => ({ default: module.ImageBankPage })));
export const SlideshowProjectsPage = lazy(() => import('../../pages/SlideshowProjectsPage').then(module => ({ default: module.SlideshowProjectsPage })));
export const SlideshowPlayerPage = lazy(() => import('../../pages/SlideshowPlayerPage').then(module => ({ default: module.SlideshowPlayerPage }))); 