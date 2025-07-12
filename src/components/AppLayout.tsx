import React, { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './layout/Header';
import { Sidebar } from './layout/Sidebar';
import { useAppContext } from '../context/AppContext';

interface AppLayoutProps {
  children: React.ReactNode;
  onLogout?: () => Promise<void>;
}

// Compound component pattern för layout
interface AppLayoutComposition {
  Sidebar: React.FC<SidebarProps>;
  Header: React.FC<HeaderProps>;
  Main: React.FC<MainProps>;
}

interface SidebarProps {
  children?: React.ReactNode;
}

interface HeaderProps {
  children?: React.ReactNode;
}

interface MainProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> & AppLayoutComposition = ({ children, onLogout }) => {
  const location = useLocation();
  
  const {
    isSidebarExpanded,
    currentUser,
    activeSphere,
    userSpheres,
    handleNavigate,
    toggleSidebar,
    handleSwitchSphere,
    handleOpenCreateSphereModal,
    handleOpenInviteModal,
    handleOpenLookAndFeelModal,
    handleOpenManageSphereModal,
    handleOpenImageBankSettingsModal,
    allUsersForManageModal,
    handleLogout,
    handleAcceptSphereInvitation,
    handleDeclineSphereInvitation,
    handleSaveThemePreference,
    setThemePreference,
    setCurrentUser,
    fetchUserAndSphereData,
  } = useAppContext();

  const mainScrollContainerRef = useRef<HTMLDivElement>(null);

  const getCurrentPathForSidebar = () => {
    return location.pathname;
  };

  const handleSwitchSphereWithUser = async (sphereId: string) => {
    if (currentUser) {
      await handleSwitchSphere(sphereId, currentUser);
    }
  };

  const handleAcceptInvitationWrapper = async (invitationId: string) => {
    if (currentUser) {
      const updatedUser = await handleAcceptSphereInvitation(invitationId, currentUser);
      if (updatedUser) {
        // Update the current user with the updated user data
        setCurrentUser(updatedUser);
        
        // Refresh sphere data to include the new sphere
        await fetchUserAndSphereData(updatedUser);
      }
    }
  };

  const handleDeclineInvitationWrapper = async (invitationId: string) => {
    if (currentUser) {
      const success = await handleDeclineSphereInvitation(invitationId, currentUser.email);
      if (success) {
        // Refresh sphere data to update pending invitation count
        await fetchUserAndSphereData(currentUser);
      }
    }
  };

  const handleSaveThemePreferenceWithUser = async (theme: any) => {
    if (currentUser) {
      setThemePreference(theme);
      const updatedUser = { ...currentUser, themePreference: theme };
      setCurrentUser(updatedUser);
      
      // Save to localStorage immediately
      localStorage.setItem('themePreference', theme);
      
      try {
        await handleSaveThemePreference(theme, currentUser.id);
      } catch (error) {
        console.error('Failed to save theme preference to database:', error);
      }
    } else {
      // If no user is logged in, still save to localStorage
      localStorage.setItem('themePreference', theme);
    }
  };

  return (
    <div className="h-full flex">
      <Sidebar
        currentPath={getCurrentPathForSidebar()}
        onNavigate={handleNavigate}
        isExpanded={isSidebarExpanded}
        onToggle={toggleSidebar}
        activeSphere={activeSphere}
        userSpheres={userSpheres}
        onSwitchSphere={handleSwitchSphereWithUser}
        currentUser={currentUser}
        onOpenCreateSphereModal={handleOpenCreateSphereModal}
        onOpenInviteModal={handleOpenInviteModal}
        onOpenLookAndFeelModal={handleOpenLookAndFeelModal}
        onOpenManageSphereModal={handleOpenManageSphereModal}
        onOpenImageBankSettingsModal={handleOpenImageBankSettingsModal}
        allUsers={allUsersForManageModal}
      />
      <Header
        currentUser={currentUser}
        isSidebarExpanded={isSidebarExpanded}
        onNavigate={handleNavigate}
        onLogout={onLogout || handleLogout}
        onAcceptInvitation={handleAcceptInvitationWrapper}
        onDeclineInvitation={handleDeclineInvitationWrapper}
        onSaveThemePreference={handleSaveThemePreferenceWithUser}
      />
      <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-60' : 'ml-20'} pt-16 h-full`}>
        <div className="h-full overflow-y-auto no-scrollbar" ref={mainScrollContainerRef}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Compound components
AppLayout.Sidebar = ({ children }) => {
  const { isSidebarExpanded } = useAppContext();
  return (
    <div className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'w-60' : 'w-20'}`}>
      {children}
    </div>
  );
};

AppLayout.Header = ({ children }) => {
  const { isSidebarExpanded } = useAppContext();
  return (
    <div className={`transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-60' : 'ml-20'}`}>
      {children}
    </div>
  );
};

AppLayout.Main = ({ children }) => {
  const { isSidebarExpanded } = useAppContext();
  return (
    <div className={`flex-1 transition-all duration-300 ease-in-out ${isSidebarExpanded ? 'ml-60' : 'ml-20'} pt-16 h-full`}>
      <div className="h-full overflow-y-auto no-scrollbar">
        {children}
      </div>
    </div>
  );
}; 