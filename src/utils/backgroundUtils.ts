import { Sphere, User } from '../types';

export const applyBackgroundPreference = (sphereForBackground?: Sphere | null, userForBackground?: User | null) => {
  const pageBackground = document.getElementById('page-background');
  const body = document.body;
  
  if (!pageBackground) return;

  // 1. Reset dynamic styles and classes
  pageBackground.style.backgroundImage = '';
  pageBackground.className = ''; 
  pageBackground.style.display = 'block'; 

  body.style.backgroundColor = ''; 
  body.classList.remove('solid-background-transition');
  body.classList.remove('bg-light-bg', 'dark:bg-dark-bg');

  let preferenceApplied = false; 
  let isImageBackground = false; 

  if (sphereForBackground?.backgroundUrl) {
    pageBackground.style.backgroundImage = `url('${sphereForBackground.backgroundUrl}')`;
    pageBackground.classList.add('kenburns-zoom-in');
    isImageBackground = true;
    preferenceApplied = true;
  } 
  else if (userForBackground?.backgroundPreference) {
    const userPref = userForBackground.backgroundPreference;
    if (userPref.type === 'url' && userPref.value) {
      pageBackground.style.backgroundImage = `url('${userPref.value}')`;
      pageBackground.classList.add('kenburns-pan-tl-br');
      isImageBackground = true;
      preferenceApplied = true;
    } else if (userPref.type === 'color' && userPref.value) {
      body.style.backgroundColor = userPref.value;
      body.classList.add('solid-background-transition');
      pageBackground.style.display = 'none'; 
      isImageBackground = false; 
      preferenceApplied = true;
    }
  }

  if (!preferenceApplied) { 
    pageBackground.style.backgroundImage = `url('/images/Login.jpg')`;
    pageBackground.classList.add('kenburns-pan-br-tl');
    isImageBackground = true; 
  }

  if (isImageBackground) {
    // Body Tailwind classes stay removed (transparent). page-background is visible.
  } else {
    const isUserSolidColorApplied = userForBackground?.backgroundPreference?.type === 'color' && userForBackground?.backgroundPreference?.value;
    if (!isUserSolidColorApplied) {
      body.classList.add('bg-light-bg', 'dark:bg-dark-bg'); 
      pageBackground.style.display = 'none'; 
    }
  }
}; 