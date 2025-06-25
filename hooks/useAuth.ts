import { useCallback, useEffect } from 'react';
import { useUser } from '../context/UserContext';

export const useAuth = () => {
  const { 
    currentUser, 
    isAuthenticated, 
    checkAuthAndLoadData, 
    handleLoginSuccess, 
    handleLogout 
  } = useUser();

  // Check authentication status on mount
  useEffect(() => {
    checkAuthAndLoadData();
  }, [checkAuthAndLoadData]);

  const login = useCallback(async (user: any, isNewUserViaOAuthOrEmailFlow?: boolean) => {
    await handleLoginSuccess(user, isNewUserViaOAuthOrEmailFlow);
  }, [handleLoginSuccess]);

  const logout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  return {
    currentUser,
    isAuthenticated,
    login,
    logout,
    checkAuth: checkAuthAndLoadData,
  };
}; 