import { User, Sphere } from './types';

// Keys for mock Firestore database collections (managed within firebase.ts)
// export const LOCAL_STORAGE_IMAGES_COLLECTION_KEY = 'imageStoryteller_images_collection'; // Example, now managed in firebase.ts
// export const LOCAL_STORAGE_PROJECTS_COLLECTION_KEY = 'imageStoryteller_projects_collection'; // Example, now managed in firebase.ts
// export const LOCAL_STORAGE_DIARY_ENTRIES_COLLECTION_KEY = 'imageStoryteller_diaryEntries_collection'; // Removed
// export const LOCAL_STORAGE_SPHERES_COLLECTION_KEY = 'imageStoryteller_spheres_collection'; // Removed
// export const LOCAL_STORAGE_USERS_COLLECTION_KEY = 'imageStoryteller_users_collection'; // Will be migrated to Firestore mock

// Old keys for migration purposes (will be used internally in firebase.ts or removed if migration is done)
export const OLD_LOCAL_STORAGE_IMAGES_KEY = 'imageStoryteller_images';
export const OLD_LOCAL_STORAGE_PROJECTS_KEY = 'imageStoryteller_projects';
export const OLD_LOCAL_STORAGE_DIARY_ENTRIES_KEY = 'imageStoryteller_diaryEntries';
export const OLD_LOCAL_STORAGE_SPHERES_KEY = 'imageStoryteller_spheres';
export const OLD_LOCAL_STORAGE_USERS_COLLECTION_KEY = 'imageStoryteller_users_collection';


export const LOCAL_STORAGE_CURRENT_USER_ID_KEY = 'imageStoryteller_currentUserId';
export const LOCAL_STORAGE_CURRENT_SPHERE_ID_KEY = 'imageStoryteller_currentSphereId';
export const LOCAL_STORAGE_AUTH_SESSION_KEY = 'imageStoryteller_authSession';
export const LOCAL_STORAGE_USER_BACKGROUND_PREFERENCE_KEY_PREFIX = 'imageStoryteller_userBackgroundPreference_';
export const LOCAL_STORAGE_USER_THEME_PREFERENCE_KEY_PREFIX = 'imageStoryteller_userThemePreference_';
export const LOCAL_STORAGE_USER_SHOW_IMAGE_METADATA_KEY_PREFIX = 'imageStoryteller_userShowImageMetadata_';


export const GEMINI_TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';
export const GEMINI_IMAGE_MODEL = 'gemini-2.5-flash-preview-04-17';

// export const NAV_ITEMS = [
//   { label: 'Hem', path: '/' }, 
//   { label: 'Skapa', path: '/projects' },
// ];

export const MAX_AUDIO_DURATION_MS = 60000; // 1 minute

export const MOCK_SPHERES: Sphere[] = [
  { id: 'sphere1', name: 'Familjen Hemma', gradientColors: ['#a855f7', '#ec4899'], memberIds: ['user1'], ownerId: 'user1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sphere2', name: 'Vännerna på Stan', gradientColors: ['#22d3ee', '#0ea5e9'], memberIds: ['user1'], ownerId: 'user1', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'sphere3', name: 'Jobbkollegor', gradientColors: ['#f59e0b', '#facc15'], memberIds: ['user2'], ownerId: 'user2', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, 
  { id: 'sphere4', name: 'Resekompisar', gradientColors: ['#10b981', '#34d399'], memberIds: ['user3'], ownerId: 'user3', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }, 
];


export const PREDEFINED_SPHERE_GRADIENTS: { name: string, colors: [string, string] }[] = [
  { name: 'Solnedgång', colors: ['#FF8C00', '#FF0080'] },
  { name: 'Skogsdjup', colors: ['#228B22', '#006400'] },
  { name: 'Havsbris', colors: ['#00BFFF', '#1E90FF'] },
  { name: 'Purpurdröm', colors: ['#8A2BE2', '#BA55D3'] },
  { name: 'Citrusglöd', colors: ['#FFA500', '#FFD700'] },
  { name: 'Lavendelfält', colors: ['#E6E6FA', '#D8BFD8'] },
  { name: 'Rubinröd', colors: ['#DC143C', '#FF6347'] },
  { name: 'Midnatt', colors: ['#191970', '#483D8B'] },
  { name: 'Smaragd', colors: ['#10b981', '#34d399'] },
  { name: 'Ametist', colors: ['#a855f7', '#ec4899'] },
  { name: 'Turkos', colors: ['#22d3ee', '#0ea5e9'] },
  { name: 'Bärnsten', colors: ['#f59e0b', '#facc15'] },
];