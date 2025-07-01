import React from 'react';
import { Routes, Route, useNavigate, Navigate, useLocation, useParams } from 'react-router-dom';
import { useUser } from './context/UserContext';
import { User } from './types';
import { useAppState } from './context/AppStateContext';
import { useSphere } from './context/SphereContext';
import { useSphereManagement } from './features/spheres/hooks/useSphereManagement';
import { useAppModals } from './common/hooks/useAppModals';
import { LoadingSpinner } from './common/components/LoadingSpinner';
import { FeedPage } from './pages/FeedPage';
import { ImageBankPage } from './features/imageBank/components/ImageBankPage';
import { EditImagePage } from './features/imageBank/components/EditImagePage';
import { SlideshowProjectsPage } from './features/slideshow/components/SlideshowProjectsPage';
import { SlideshowPlayerPage } from './features/slideshow/components/SlideshowPlayerPage';
import { DiaryPage } from './features/diary/components/DiaryPage';
import { MainLayout } from './layout/MainLayout';
import { ModalManager } from './ModalManager';
import { FeedbackDisplay } from './common/components/FeedbackDisplay';
import { LoginPage } from './features/auth/components/LoginPage';
import { SignupPage } from './features/auth/components/SignupPage';
import { EmailConfirmationPage } from './features/auth/components/EmailConfirmationPage';
import { ProfileCompletionPage } from './features/auth/components/ProfileCompletionPage';
import { useModal } from './context';

const RouterLoginPage = () => {
  const navigate = useNavigate();
  const { handleLoginSuccess } = useUser();
  
  const handleLoginSuccessAndNavigate = async (user: User) => {
    await handleLoginSuccess(user);
    navigate('/');
  };
  
  return (
    <LoginPage
      onLoginSuccess={handleLoginSuccessAndNavigate}
      onNavigate={(view) => {
        if (view === 'SIGNUP') navigate('/signup');
        else if (view === 'LOGIN') navigate('/login');
      }}
    />
  );
};

const RouterSignupPage = () => {
  const navigate = useNavigate();
  const { handleLoginSuccess } = useUser();
  
  const handleLoginSuccessAndNavigate = async (user: User) => {
    await handleLoginSuccess(user);
    navigate('/');
  };
  
  return (
    <SignupPage
      onLoginSuccess={handleLoginSuccessAndNavigate}
      onNavigate={(view, params) => {
        if (view === 'LOGIN' || view === '#login') navigate('/login');
        else if (view === 'EMAIL_CONFIRMATION' && params?.email) navigate(`/email-confirmation?email=${encodeURIComponent(params.email)}`);
      }}
    />
  );
};

const RouterEmailConfirmationPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const email = params.get('email') || undefined;
  const navigate = useNavigate();
  return (
    <EmailConfirmationPage
      email={email}
      onLoginSuccess={() => navigate('/login')}
      onNavigate={(view) => {
        if (view === 'LOGIN' || view === '#login') navigate('/login');
        else if (view === 'SIGNUP' || view === '#signup') navigate('/signup');
      }}
    />
  );
};

const RouterProfileCompletionPage = () => {
  const navigate = useNavigate();
  const { currentUser, handleProfileComplete } = useUser();
  
  const handleProfileCompleteAndNavigate = async (updatedUser: User) => {
    await handleProfileComplete(updatedUser);
    navigate('/');
  };
  
  if (!currentUser) {
    return <LoadingSpinner message="Laddar användardata..." />;
  }
  
  return (
    <ProfileCompletionPage
      initialUser={currentUser}
      onProfileComplete={handleProfileCompleteAndNavigate}
      onNavigate={(view) => {
        if (view === 'LOGIN' || view === '#login') navigate('/login');
        else if (view === 'SIGNUP' || view === '#signup') navigate('/signup');
      }}
    />
  );
};

// Wrapper components for authenticated pages
const RouterFeedPage = () => {
  // Provide no-op functions for required props
  const noop = () => {};
  return (
    <MainLayout>
      <FeedPage onNavigate={noop} onVisiblePostsDateChange={noop} />
    </MainLayout>
  );
};

const RouterImageBankPage = () => {
  return (
    <MainLayout>
      <ImageBankPage />
    </MainLayout>
  );
};

const RouterEditImagePage = () => {
  const { imageId } = useParams<{ imageId: string }>();
  return (
    <MainLayout>
      <EditImagePage imageId={imageId!} />
    </MainLayout>
  );
};

const RouterSlideshowProjectsPage = () => {
  return (
    <MainLayout>
      <SlideshowProjectsPage />
    </MainLayout>
  );
};

const RouterSlideshowPlayerPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  return (
    <MainLayout>
      <SlideshowPlayerPage projectId={projectId!} />
    </MainLayout>
  );
};

const RouterDiaryPage = () => {
  return (
    <MainLayout>
      <DiaryPage />
    </MainLayout>
  );
};

// Authenticated app wrapper with modals and feedback
const AuthenticatedAppWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useUser();
  const { activeSphere } = useSphere();
  const { allUsersForManageModal } = useSphereManagement(currentUser);
  const { modalManagerProps } = useAppModals(currentUser);
  const { openCreateSphereModal } = useModal();

  return (
    <>
      <MainLayout>
        {!activeSphere ? (
          <div className="flex flex-col items-center justify-center h-full py-20">
            <h2 className="text-2xl font-bold mb-4">Välkommen till REMI Story!</h2>
            <p className="mb-6 text-lg text-center max-w-md">Du har ännu ingen sfär. Skapa en för att komma igång och börja dela berättelser och bilder.</p>
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg font-semibold text-lg shadow hover:bg-primary-hover transition-colors"
              onClick={openCreateSphereModal}
            >
              Skapa sfär
            </button>
          </div>
        ) : (
          children
        )}
      </MainLayout>
      <ModalManager {...modalManagerProps} activeSphere={activeSphere} />
      <FeedbackDisplay />
    </>
  );
};

export const AppRouter: React.FC = () => {
  const { isAuthenticated, currentUser } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to /login if not authenticated and not on a public route
  React.useEffect(() => {
    const publicPaths = ['/login', '/signup', '/email-confirmation'];
    if (
      isAuthenticated === false &&
      !publicPaths.includes(location.pathname)
    ) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate, location.pathname]);

  // Redirect to /profile-completion if profile is incomplete
  React.useEffect(() => {
    const publicPaths = [
      '/login',
      '/signup',
      '/email-confirmation',
      '/profile-completion'
    ];
    if (
      isAuthenticated &&
      currentUser &&
      (!currentUser.name || currentUser.name === 'Ny Användare') &&
      !publicPaths.includes(location.pathname)
    ) {
      navigate('/profile-completion', { replace: true });
    }
  }, [isAuthenticated, currentUser, location.pathname, navigate]);

  // Show loading spinner while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> 
        <LoadingSpinner message="Autentiserar..." size="lg" /> 
      </div>
    );
  }

  // Show loading spinner if authenticated but user data is still loading
  if (isAuthenticated && !currentUser) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-light-bg dark:bg-slate-900"> 
        <LoadingSpinner message="Laddar användardata..." size="lg" /> 
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<RouterLoginPage />} />
        <Route path="/signup" element={<RouterSignupPage />} />
        <Route path="/email-confirmation" element={<RouterEmailConfirmationPage />} />
        <Route path="/profile-completion" element={<RouterProfileCompletionPage />} />
        
        {/* Authenticated routes */}
        <Route path="/" element={
          <AuthenticatedAppWrapper>
            <RouterFeedPage />
          </AuthenticatedAppWrapper>
        } />
        <Route path="/image-bank" element={
          <AuthenticatedAppWrapper>
            <RouterImageBankPage />
          </AuthenticatedAppWrapper>
        } />
        <Route path="/edit/:imageId" element={
          <AuthenticatedAppWrapper>
            <RouterEditImagePage />
          </AuthenticatedAppWrapper>
        } />
        <Route path="/projects" element={
          <AuthenticatedAppWrapper>
            <RouterSlideshowProjectsPage />
          </AuthenticatedAppWrapper>
        } />
        <Route path="/play/:projectId" element={
          <AuthenticatedAppWrapper>
            <RouterSlideshowPlayerPage />
          </AuthenticatedAppWrapper>
        } />
        <Route path="/diary" element={
          <AuthenticatedAppWrapper>
            <RouterDiaryPage />
          </AuthenticatedAppWrapper>
        } />
        {/* Catch all - only redirect if not on /login, /signup, or /email-confirmation */}
        <Route path="*" element={
          ["/login", "/signup", "/email-confirmation"].includes(window.location.pathname)
            ? null
            : isAuthenticated && currentUser
            ? <Navigate to="/" replace />
            : <Navigate to="/login" replace />
        } />
      </Routes>
    </>
  );
}; 