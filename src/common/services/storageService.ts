/**
 * @deprecated This file is deprecated. Use the domain-specific services instead:
 * - imageService.ts for image operations
 * - projectService.ts for project operations
 * - diaryService.ts for diary operations
 * - sphereService.ts for sphere operations
 * - invitationService.ts for invitation operations
 * - firebaseUtils.ts for utilities
 */

// Re-export all functions from domain-specific services for backward compatibility
export { generateId } from './firebaseUtils';

// Image operations
export {
  getAllImages,
  getSphereFeedPostsListener,
  getImageById,
  saveImage,
  deleteImage
} from './imageService';

// Project operations
export {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProject
} from './projectService';

// Diary operations
export {
  getDiaryEntriesByUserId,
  saveDiaryEntry,
  deleteDiaryEntry,
  uploadAudioFile
} from './diaryService';

// Sphere operations
export {
  getAllSpheres,
  getSphereById,
  saveNewSphere
} from './sphereService';

// Invitation operations
export {
  createSphereInvitation,
  getPendingInvitationsForEmail,
  updateSphereInvitationStatus
} from './invitationService';
