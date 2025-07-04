import { User } from '../types';

type Theme = User['themePreference'];

export const applyThemePreference = (theme: Theme) => {
  const root = document.documentElement;
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  if (theme === 'dark' || (theme === 'system' && systemPrefersDark)) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

export const setupThemeListener = (currentUser: User | null, applyTheme: (theme: Theme) => void) => {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handleChange = () => {
    if (currentUser?.themePreference === 'system' || !currentUser) {
      applyTheme('system');
    }
  };
  
  mediaQuery.addEventListener('change', handleChange);
  
  return () => mediaQuery.removeEventListener('change', handleChange);
}; 