import React, { useState, useRef, useEffect, memo } from 'react';
import { View, Sphere, User, ViewParams, isPersonalSphere } from '@/types';
import { SphereDisplay } from '@/components/ui';
import { useAppContext } from '@/context/AppContext';

interface SidebarProps {
  currentPath: string;
  onNavigate: (view: View, params?: ViewParams) => void;
  isExpanded: boolean;
  onToggle: () => void;
  activeSphere: Sphere | null;
  userSpheres: Sphere[];
  onSwitchSphere: (sphereId: string) => void;
  currentUser: User | null; 
  onOpenCreateSphereModal: () => void; 
  onOpenInviteModal: (sphere: Sphere) => void; 
  onOpenLookAndFeelModal: () => void; 
  onOpenManageSphereModal: () => void; 
  onOpenImageBankSettingsModal: () => void; 
  allUsers: User[]; // Added for member count
}

// ... (NAV_ITEMS_SIDEBAR and Icons remain the same) ...
const NAV_ITEMS_SIDEBAR = [
  { 
    label: 'Hem', 
    path: '/', 
    view: View.Home, 
    icon: (isExpanded: boolean, isActive: boolean) => 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 flex-shrink-0 ${isExpanded ? (isActive ? 'mr-2' : 'mr-3') : 'mr-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
      </svg> 
  },
  { 
    label: 'Bildbank', 
    path: '/image-bank', 
    view: View.ImageBank, 
    icon: (isExpanded: boolean, isActive: boolean) => 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 flex-shrink-0 ${isExpanded ? (isActive ? 'mr-2' : 'mr-3') : 'mr-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
  },
  { 
    label: 'Skapa', 
    path: '/projects', 
    view: View.SlideshowProjects, 
    icon: (isExpanded: boolean, isActive: boolean) => 
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 flex-shrink-0 ${isExpanded ? (isActive ? 'mr-2' : 'mr-3') : 'mr-0'}`}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3.75v3.75m4.125-3.75v3.75m2.625-3.75v3.75M12 21.75H4.875A2.625 2.625 0 012.25 19.125V7.875A2.625 2.625 0 014.875 5.25h14.25A2.625 2.625 0 0121.75 7.875v8.625M12 5.25v3.75m0 0H8.25m3.75 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" />
      </svg> 
  },
];

const ChevronLeftIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.23 8.29a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

const PlusCircleIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const UserPlusIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
    </svg>
);

const Cog6ToothIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => ( 
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.646.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.43.992a6.759 6.759 0 010 1.255c-.008.378.138.75.43.99l1.004.827a1.125 1.125 0 01.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.333.183-.582.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.759 6.759 0 010-1.255c.008-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PaintBrushIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
  </svg>
);

const PhotoIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
);

const UsersIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-3.741-3.741m-2.55 3.741a9.094 9.094 0 013.741-.479 3 3 0 01-3.741-3.741M15.525 15.375a3 3 0 01-3.741 3.741M15.525 15.375a3 3 0 00-3.741 3.741m6.036-3.741a9.094 9.094 0 01-3.741.479m-2.175 0a3 3 0 01-3.741-3.741m0 0a3 3 0 00-3.741-3.741m2.175 0a9.094 9.094 0 00-3.741-.479m3.741.479a3 3 0 003.741 3.741M3.75 14.25a3 3 0 003.741 3.741M3.75 14.25a3 3 0 013.741 3.741m0 0a9.094 9.094 0 003.741.479M3.75 14.25a3 3 0 01-.479-3.741M3.75 14.25a3 3 0 00-.479-3.741m-.055 0a9.094 9.094 0 00-3.741.479m0 0a3 3 0 013.741 3.741M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);


export const Sidebar: React.FC<SidebarProps> = memo(({ 
    currentPath, 
    onNavigate, 
    isExpanded, 
    onToggle, 
    activeSphere, 
    userSpheres, 
    onSwitchSphere,
    currentUser,
    onOpenCreateSphereModal,
    onOpenInviteModal, 
    onOpenLookAndFeelModal,
    onOpenManageSphereModal,
    onOpenImageBankSettingsModal,
    allUsers
}) => {
  const { themePreference } = useAppContext();
  // Add CSS for the large logo
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .sidebar-logo-large {
        width: ${isExpanded ? '400px' : '100px'} !important;
        height: auto !important;
        min-width: ${isExpanded ? '400px' : '100px'} !important;
        max-width: none !important;
        transform: rotate(-90deg) !important;
        flex-shrink: 0 !important;
        flex-grow: 0 !important;
        position: absolute !important;
        z-index: 1000 !important;
        transition: all 0.3s ease-in-out !important;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, [isExpanded]);
  const [isSphereDropdownOpen, setIsSphereDropdownOpen] = useState(false);
  const sphereSwitcherRef = useRef<HTMLDivElement>(null);
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sphereSwitcherRef.current && !sphereSwitcherRef.current.contains(event.target as Node)) {
        setIsSphereDropdownOpen(false);
      }
      if (settingsButtonRef.current && !settingsButtonRef.current.contains(event.target as Node) &&
          !document.getElementById('settings-popover')?.contains(event.target as Node)) {
        setIsSettingsPopoverOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const otherSpheres = activeSphere ? userSpheres.filter(s => s.id !== activeSphere.id) : [];
  
  const memberCount = activeSphere ? allUsers.filter(user => user.sphereIds.includes(activeSphere.id)).length : 0;

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white/90 dark:bg-dark-bg/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 flex flex-col z-40 transition-all duration-300 ease-in-out shadow-lg border-r border-border-color dark:border-dark-bg/50 ${isExpanded ? 'w-60' : 'w-20'}`}
    >
      <div 
        className={`py-4 flex items-center relative ${isExpanded ? 'px-4' : 'justify-center px-0'}`} 
        ref={sphereSwitcherRef}
      >
        {activeSphere && currentUser ? (
          <div 
            className={`flex items-center cursor-pointer group ${isExpanded ? 'w-full gap-2' : 'gap-0'}`} 
            onClick={() => setIsSphereDropdownOpen(prev => !prev)}
            role="button"
            aria-haspopup="true"
            aria-expanded={isSphereDropdownOpen}
            aria-controls="sphere-dropdown-menu"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsSphereDropdownOpen(prev => !prev);}}
            title={isExpanded && activeSphere ? activeSphere.name : (activeSphere ? `Aktiv sfär: ${activeSphere.name}` : "Välj sfär")}
          >
            <SphereDisplay sphere={activeSphere} size={isExpanded ? 'lg' : 'xs'} showName={isExpanded} isActive={true} />
            
            {isExpanded && (
                <ChevronDownIcon 
                    className={`w-4 h-4 text-muted-text dark:text-slate-400 transition-transform duration-200 group-hover:text-primary dark:group-hover:text-blue-400 ${isSphereDropdownOpen ? 'rotate-180' : ''} flex-shrink-0 ml-auto`} 
                />
            )}
          </div>
        ) : (
          isExpanded ? (
            <button
                onClick={onOpenCreateSphereModal}
                className="flex items-center text-sm font-medium p-2 rounded-lg transition-colors w-full text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-blue-400/50 justify-start"
                title="Skapa din första sfär"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Skapa din första sfär
            </button>
          ) : (
            <button 
                onClick={onOpenCreateSphereModal}
                title="Skapa ny sfär"
                className="p-2 text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary dark:focus:ring-blue-400"
                aria-label="Skapa ny sfär"
            >
                <PlusCircleIcon className="w-6 h-6" />
            </button>
          )
        )}

        {isSphereDropdownOpen && (
          <div 
            id="sphere-dropdown-menu"
            className={`absolute top-full mt-1.5 rounded-xl shadow-xl border border-border-color dark:border-dark-bg/50
bg-white/80 dark:bg-dark-bg/80 backdrop-blur-md overflow-hidden z-50
                          ${isExpanded ? 'left-3 right-3' : 'left-1/2 -translate-x-1/2 w-max min-w-[56px] ml-4'} 
                          p-2.5`}
          >
            {/* Active Sphere Info and Invite Section */}
            {activeSphere && currentUser && (
              <div className="p-1.5 mb-2 border-b border-border-color dark:border-dark-bg/30">
                <div className="flex items-center justify-between">
                  <span 
                    className={`font-bold text-slate-700 dark:text-slate-200 truncate ${isExpanded ? 'text-lg' : 'text-sm'}`} 
                    title={activeSphere.name}
                  >
                    {isExpanded ? activeSphere.name : activeSphere.name.substring(0,12) + (activeSphere.name.length > 12 ? '...' : '')}
                  </span>
                  {!isPersonalSphere(activeSphere) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); 
                        onOpenInviteModal(activeSphere);
                        setIsSphereDropdownOpen(false);
                      }}
                      className="p-1 rounded-full hover:bg-primary/10 dark:hover:bg-blue-400/10 text-primary dark:text-blue-400 flex-shrink-0"
                      title={`Bjud in till ${activeSphere.name}`}
                    >
                      <UserPlusIcon className="w-5 h-5" />
                    </button>
                  )}
                </div>
                <p className={`text-muted-text dark:text-slate-400 mt-0.5 ${isExpanded ? 'text-xs' : 'text-[10px]'}`}>
                  {memberCount} medlem{memberCount !== 1 ? 'mar' : ''}
                </p>
              </div>
            )}

            <div className={`flex ${isExpanded ? 'flex-col items-stretch' : 'flex-col items-center'} gap-2.5`}>
              {otherSpheres.map(sphere => (
                 <div key={sphere.id} className={`flex items-center ${isExpanded ? 'justify-start w-full' : 'justify-center'}`}>
                    <SphereDisplay
                      sphere={sphere}
                      size={'sm'}
                      onClick={() => {
                          onSwitchSphere(sphere.id);
                          setIsSphereDropdownOpen(false);
                      }}
                      className={`hover:ring-2 hover:ring-primary dark:hover:ring-blue-400 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 ${isExpanded ? 'flex-grow justify-start' : ''}`}
                      ariaLabel={`Byt till sfär: ${sphere.name}`}
                      tabIndex={0}
                      showName={isExpanded} 
                    />
                 </div>
              ))}
               {(otherSpheres.length > 0 || (activeSphere && currentUser) ) && <hr className="my-1 border-border-color dark:border-dark-bg/50" />}
              
              <button
                onClick={() => {
                  onOpenCreateSphereModal();
                  setIsSphereDropdownOpen(false);
                }}
                className={`flex items-center text-sm font-medium p-2 rounded-lg transition-colors w-full
                            text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-blue-400/50
                            ${isExpanded ? 'justify-start' : 'justify-center'}`}
                title="Skapa ny sfär"
              >
                <PlusCircleIcon className={`w-5 h-5 ${isExpanded ? 'mr-2' : ''}`} />
                {isExpanded && "Skapa ny sfär"}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex-grow flex flex-col">
        <nav className="mt-4 flex-grow" role="navigation" aria-label="Huvudnavigation">
          {NAV_ITEMS_SIDEBAR.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.view)}
                title={isExpanded ? undefined : item.label}
                aria-label={isExpanded ? undefined : item.label}
                className={`
                  flex items-center text-left text-sm font-medium transition-all duration-150 ease-in-out group
                  ${isExpanded
                    ? (isActive 
                        ? 'bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-300 rounded-full mx-2 px-4 py-3 my-0.5 shadow-sm' 
                        : 'text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-bg/50 hover:text-slate-700 dark:hover:text-slate-200 px-6 py-3 w-full')
                    : (isActive 
                        ? 'bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-300 rounded-lg mx-auto w-11 h-11 p-0 justify-center my-1 shadow-sm' 
                        : 'text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-bg/50 hover:text-slate-700 dark:hover:text-slate-200 justify-center py-3 w-11 h-11 mx-auto rounded-lg')
                  }
                `}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.icon(isExpanded, isActive)}
                {isExpanded && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>

                {/* Rotated Logo */}
        <div className={`py-0 ${isExpanded ? 'px-0' : 'px-0'}`} style={{ overflow: 'visible' }}>
          <div className="relative flex items-start justify-end">
            <img 
              src={themePreference === 'dark' ? "/images/Remi_namn_neg.gif" : "/images/Remi_namn_neg.gif"} 
              alt="REMI Namn" 
              className="sidebar-logo-large"
              style={{
                marginBottom: isExpanded ? '20rem' : '1rem',
                marginTop: isExpanded ? '-16rem' : '-6rem',
                transformOrigin: 'center',
                position: 'absolute',
                zIndex: 10,
                left: isExpanded ? '-8rem' : '-1rem',
                right: isExpanded ? 'auto' : '1rem'
              }}
            />
          </div>
        </div>

          {/* Settings Button and Popover */}
        <div className={`py-2 relative ${isExpanded ? 'px-3' : 'px-0 flex justify-center'}`}>
            <button
                ref={settingsButtonRef}
                onClick={() => setIsSettingsPopoverOpen(prev => !prev)}
                title="Inställningar"
                className={`flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
                            text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-bg/50 hover:text-slate-700 dark:hover:text-slate-200
${isExpanded ? 'px-2 justify-start w-full' : 'justify-center w-11 h-11'}`}
                aria-haspopup="true"
                aria-expanded={isSettingsPopoverOpen}
                aria-controls="settings-popover"
            >
                <Cog6ToothIcon className={`text-slate-500 dark:text-slate-400 w-5 h-5 ${isExpanded ? 'mr-2' : ''}`} />
                {isExpanded && <span className="text-slate-600 dark:text-slate-300">Inställningar</span>}
            </button>
            {isSettingsPopoverOpen && (
                <div 
                    id="settings-popover"
                    className={`absolute bottom-full mb-2 p-2 rounded-xl shadow-2xl border border-border-color dark:border-dark-bg/50 
bg-white dark:bg-dark-bg z-[1000]
                               ${isExpanded ? 'left-3 w-[calc(100%-1.5rem)]' : 'left-1/2 -translate-x-1/2 w-max'}`}
                    role="menu"
                >
                    <button
                        onClick={() => { onOpenLookAndFeelModal(); setIsSettingsPopoverOpen(false); }}
                        className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 dark:hover:bg-blue-400/10 hover:text-primary dark:hover:text-blue-300 transition-colors ${!isExpanded && 'justify-center'}`}
                        role="menuitem"
                        title={!isExpanded ? "Utseende" : undefined}
                    >
                        <PaintBrushIcon className={`w-5 h-5 ${isExpanded ? 'mr-2.5 text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && "Utseende"}
                    </button>
                    <button
                        onClick={() => { onOpenImageBankSettingsModal(); setIsSettingsPopoverOpen(false); }}
                        className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 dark:hover:bg-blue-400/10 hover:text-primary dark:hover:text-blue-300 transition-colors ${!isExpanded && 'justify-center'}`}
                        role="menuitem"
                        title={!isExpanded ? "Bildbank" : undefined}
                    >
                        <PhotoIcon className={`w-5 h-5 ${isExpanded ? 'mr-2.5 text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && "Bildbank"}
                    </button>
                    <button
                        onClick={() => { onOpenManageSphereModal(); setIsSettingsPopoverOpen(false); }}
                        className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 dark:hover:bg-blue-400/10 hover:text-primary dark:hover:text-blue-300 transition-colors ${!isExpanded && 'justify-center'}`}
                        role="menuitem"
                        title={!isExpanded ? "Hantera Sfärer" : undefined}
                    >
                        <UsersIcon className={`w-5 h-5 ${isExpanded ? 'mr-2.5 text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && "Hantera Sfärer"}
                    </button>
                </div>
            )}
        </div>
        
        <div className={`py-3 border-t border-border-color dark:border-dark-bg/50 ${isExpanded ? 'px-3' : 'px-0'}`}>
          <button
            onClick={onToggle}
            title={isExpanded ? "Förminska sidofältet" : "Expandera sidofältet"}
            aria-label={isExpanded ? "Förminska sidofältet" : "Expandera sidofältet"}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
              text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-dark-bg/50 hover:text-slate-700 dark:hover:text-slate-200
${isExpanded ? 'px-2 justify-start' : 'justify-center'}
            `}
          >
            {isExpanded ? <ChevronLeftIcon className="w-5 h-5 mr-2 text-slate-500 dark:text-slate-400" /> : <ChevronRightIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />}
            {isExpanded && <span className="text-slate-600 dark:text-slate-300">Förminska</span>}
          </button>
        </div>
      </div>
    </aside>
    
  );
});

Sidebar.displayName = 'Sidebar';