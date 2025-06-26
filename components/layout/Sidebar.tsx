import React, { useState, useRef, useEffect } from 'react';
import { View } from '../../types';
import { SphereDisplay } from '../../src/features/spheres/components/SphereDisplay'; 
import { useSphere } from '../../context/SphereContext';
import { useUser } from '../../context/UserContext';
import { useModal } from '../../context';
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from '../common/icons/ChevronIcons';
import { PlusCircleIcon, UserPlusIcon, Cog6ToothIcon, PaintBrushIcon, UsersIcon } from '../common/icons/ActionIcons';
import { PhotoIcon } from '../common/icons/ActionIcons';

interface SidebarProps {
  currentPath: string;
  onNavigate: (view: View, params?: any) => void;
  isExpanded: boolean;
  onToggle: () => void;
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

export const Sidebar: React.FC<SidebarProps> = ({ 
    currentPath, 
    onNavigate, 
    isExpanded, 
    onToggle, 
}) => {
  // Use context instead of props
  const { currentUser } = useUser();
  const { 
    activeSphere, 
    userSpheres, 
    handleSwitchSphere,
  } = useSphere();
  
  // Sidebar internal state
  const [isSphereDropdownOpen, setIsSphereDropdownOpen] = useState(false);
  const sphereSwitcherRef = useRef<HTMLDivElement>(null);
  const [isSettingsPopoverOpen, setIsSettingsPopoverOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  const { openCreateSphereModal, openInviteToSphereModal, openLookAndFeelModal, openManageSphereModal, openImageBankSettingsModal } = useModal();

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
  
  // Calculate member count - for now, we'll use a placeholder since we need user data
  const memberCount = 1; // TODO: Get actual member count when we have user data in context

  // Handle sphere switching
  const handleSwitchSphereClick = async (sphereId: string) => {
    await handleSwitchSphere(sphereId);
    setIsSphereDropdownOpen(false);
  };

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm text-slate-800 dark:text-slate-200 flex flex-col z-40 transition-all duration-300 ease-in-out shadow-lg border-r border-border-color dark:border-slate-700 ${isExpanded ? 'w-60' : 'w-20'}`}
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
            <SphereDisplay sphere={activeSphere} size={'lg'} />
            
            {isExpanded && (
                <ChevronDownIcon 
                    className={`w-4 h-4 text-muted-text dark:text-slate-400 transition-transform duration-200 group-hover:text-primary dark:group-hover:text-blue-400 ${isSphereDropdownOpen ? 'rotate-180' : ''} flex-shrink-0 ml-auto`} 
                />
            )}
          </div>
        ) : (
          isExpanded ? (
            <button
                onClick={() => openCreateSphereModal()}
                className="flex items-center text-sm font-medium p-2 rounded-lg transition-colors w-full text-primary dark:text-blue-400 hover:bg-primary/10 dark:hover:bg-blue-400/10 focus:outline-none focus:ring-2 focus:ring-primary/50 dark:focus:ring-blue-400/50 justify-start"
                title="Skapa din första sfär"
            >
                <PlusCircleIcon className="w-5 h-5 mr-2" />
                Skapa din första sfär
            </button>
          ) : (
            <button 
                onClick={() => openCreateSphereModal()}
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
            className={`absolute top-full mt-1.5 rounded-xl shadow-xl border border-border-color dark:border-slate-700
                          bg-white/80 dark:bg-slate-800/80 backdrop-blur-md overflow-hidden z-50
                          ${isExpanded ? 'left-3 right-3' : 'left-1/2 -translate-x-1/2 w-max min-w-[56px]'} 
                          p-2.5`}
          >
            {/* Active Sphere Info and Invite Section */}
            {activeSphere && currentUser && (
              <div className="p-1.5 mb-2 border-b border-border-color dark:border-slate-600">
                <div className="flex items-center justify-between">
                  <span 
                    className={`font-semibold text-slate-700 dark:text-slate-200 truncate ${isExpanded ? 'text-sm' : 'text-xs'}`} 
                    title={activeSphere.name}
                  >
                    {isExpanded ? activeSphere.name : activeSphere.name.substring(0,12) + (activeSphere.name.length > 12 ? '...' : '')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); 
                      openInviteToSphereModal(activeSphere);
                    }}
                    className="p-1 rounded-full hover:bg-primary/10 dark:hover:bg-blue-400/10 text-primary dark:text-blue-400 flex-shrink-0"
                    title={`Bjud in till ${activeSphere.name}`}
                  >
                    <UserPlusIcon className="w-5 h-5" />
                  </button>
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
                      size={'lg'}
                      onClick={() => handleSwitchSphereClick(sphere.id)}
                      className={`hover:ring-2 hover:ring-primary dark:hover:ring-blue-400 focus:ring-2 focus:ring-primary dark:focus:ring-blue-400 ${isExpanded ? 'flex-grow justify-start' : ''}`}
                      ariaLabel={`Byt till sfär: ${sphere.name}`}
                      tabIndex={0}
                      showName={isExpanded} 
                    />
                 </div>
              ))}
               {(otherSpheres.length > 0 || (activeSphere && currentUser) ) && <hr className="my-1 border-border-color dark:border-slate-700" />}
              
              <button
                onClick={() => {
                  openCreateSphereModal();
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
        <nav className="mt-4 flex-grow">
          {NAV_ITEMS_SIDEBAR.map((item) => {
            const isActive = currentPath === item.path || (item.path !== '/' && currentPath.startsWith(item.path));
            return (
              <button
                key={item.path}
                onClick={() => onNavigate(item.view)}
                title={isExpanded ? undefined : item.label}
                className={`
                  flex items-center text-left text-sm font-medium transition-all duration-150 ease-in-out group
                  ${isExpanded
                    ? (isActive 
                        ? 'bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-300 rounded-full mx-2 px-4 py-3 my-0.5 shadow-sm' 
                        : 'text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 px-6 py-3 w-full')
                    : (isActive 
                        ? 'bg-primary/10 dark:bg-blue-400/10 text-primary dark:text-blue-300 rounded-lg mx-auto w-11 h-11 p-0 justify-center my-1 shadow-sm' 
                        : 'text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 justify-center py-3 w-11 h-11 mx-auto rounded-lg')
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

        {/* Settings Button and Popover */}
        <div className={`py-2 relative ${isExpanded ? 'px-3' : 'px-0 flex justify-center'}`}>
            <button
                ref={settingsButtonRef}
                onClick={() => setIsSettingsPopoverOpen(prev => !prev)}
                title="Inställningar"
                className={`flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
                            text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200
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
                    className={`absolute bottom-full mb-2 p-2 rounded-xl shadow-2xl border border-border-color dark:border-slate-700 
                               bg-white/90 dark:bg-slate-800/90 backdrop-blur-md z-50
                               ${isExpanded ? 'left-3 w-[calc(100%-1.5rem)]' : 'left-1/2 -translate-x-1/2 w-max'}`}
                    role="menu"
                >
                    <button
                        onClick={() => { openLookAndFeelModal(); setIsSettingsPopoverOpen(false); }}
                        className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 dark:hover:bg-blue-400/10 hover:text-primary dark:hover:text-blue-300 transition-colors ${!isExpanded && 'justify-center'}`}
                        role="menuitem"
                        title={!isExpanded ? "Utseende" : undefined}
                    >
                        <PaintBrushIcon className={`w-5 h-5 ${isExpanded ? 'mr-2.5 text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && "Utseende"}
                    </button>
                    <button
                        onClick={() => { openImageBankSettingsModal(); setIsSettingsPopoverOpen(false); }}
                        className={`flex items-center w-full text-left p-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-primary/10 dark:hover:bg-blue-400/10 hover:text-primary dark:hover:text-blue-300 transition-colors ${!isExpanded && 'justify-center'}`}
                        role="menuitem"
                        title={!isExpanded ? "Bildbank" : undefined}
                    >
                        <PhotoIcon className={`w-5 h-5 ${isExpanded ? 'mr-2.5 text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`} />
                        {isExpanded && "Bildbank"}
                    </button>
                    <button
                        onClick={() => { openManageSphereModal(); setIsSettingsPopoverOpen(false); }}
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
        
        <div className={`py-3 border-t border-border-color dark:border-slate-700 ${isExpanded ? 'px-3' : 'px-0'}`}>
          <button
            onClick={onToggle}
            title={isExpanded ? "Förminska sidofältet" : "Expandera sidofältet"}
            className={`w-full flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors duration-150 ease-in-out
              text-muted-text dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200
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
};