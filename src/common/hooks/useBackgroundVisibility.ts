import { useEffect } from 'react';
import { useUser } from '../../context/UserContext';

export const useBackgroundVisibility = () => {
  const { isAuthenticated } = useUser();
  
  useEffect(() => {
    const pageBackground = document.getElementById('page-background');
    
    if (!pageBackground) return;

    // When not authenticated, hide the background to show clean auth pages
    if (isAuthenticated === false) {
      pageBackground.style.display = 'none';
    } else if (isAuthenticated === true) {
      // When authenticated, show the background (it will be styled by useAppLogic/SphereContext)
      pageBackground.style.display = 'block';
    }
    // When isAuthenticated is null (loading), keep current state
  }, [isAuthenticated]);
}; 