export const Views = {
  Login: 'login',
  Signup: 'signup',
  EmailConfirmation: 'email-confirmation',
  ProfileCompletion: 'profile-completion',
  Home: 'home',
  Diary: 'diary',
  ImageBank: 'image-bank',
  EditImage: 'edit-image',
  SlideshowProjects: 'slideshow-projects',
  PlaySlideshow: 'play-slideshow',
} as const;

export type View = typeof Views[keyof typeof Views]; 