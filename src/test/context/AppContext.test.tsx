import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppProvider, useAppContext } from '../../context/AppContext';
import { View } from '../../types';

// Mock Firebase
vi.mock('../../firebase', () => ({
  auth: {},
  db: {},
}));

// Mock services
vi.mock('../../services/authService', () => ({
  getCurrentAuthenticatedUser: vi.fn(),
}));

vi.mock('../../services/storageService', () => ({
  getUserSpheres: vi.fn(),
  getAllUsers: vi.fn(),
}));

// Test component to access context
const TestComponent = () => {
  const { currentUser, activeSphere, currentView, handleNavigate } = useAppContext();
  
  return (
    <div>
      <div data-testid="current-user">{currentUser?.name || 'No user'}</div>
      <div data-testid="active-sphere">{activeSphere?.name || 'No sphere'}</div>
      <div data-testid="current-view">{currentView}</div>
      <button onClick={() => handleNavigate(View.Home)}>Go Home</button>
      <button onClick={() => handleNavigate(View.Diary)}>Go Diary</button>
    </div>
  );
};

describe('AppContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('current-user')).toHaveTextContent('No user');
    expect(screen.getByTestId('active-sphere')).toHaveTextContent('No sphere');
    expect(screen.getByTestId('current-view')).toHaveTextContent('home');
  });

  it('should handle navigation', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial view should be home
    expect(screen.getByTestId('current-view')).toHaveTextContent('home');

    // Navigate to diary
    fireEvent.click(screen.getByText('Go Diary'));
    expect(screen.getByTestId('current-view')).toHaveTextContent('diary');
  });

  it('should provide context to child components', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Should render without errors
    expect(screen.getByTestId('current-user')).toBeInTheDocument();
    expect(screen.getByTestId('active-sphere')).toBeInTheDocument();
    expect(screen.getByTestId('current-view')).toBeInTheDocument();
  });

  it('should handle multiple navigation calls', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Navigate multiple times
    fireEvent.click(screen.getByText('Go Home'));
    fireEvent.click(screen.getByText('Go Diary'));
    fireEvent.click(screen.getByText('Go Home'));

    // Should end up on home
    expect(screen.getByTestId('current-view')).toHaveTextContent('home');
  });
}); 