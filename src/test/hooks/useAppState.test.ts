import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAppState } from '../../hooks/useAppState';
import { View } from '../../types';

// Mock AppContext
vi.mock('../../context/AppContext', () => ({
  useAppContext: vi.fn(),
}));

describe('useAppState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return initial state', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.currentView).toBe(View.Home);
    expect(result.current.currentUser).toBeNull();
    expect(result.current.isAuthenticated).toBeNull();
    expect(result.current.isSidebarExpanded).toBe(true);
  });

  it('should handle navigation', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleNavigate(View.Home);
    });

    expect(result.current.currentView).toBe(View.Home);
  });

  it('should handle multiple navigation calls', () => {
    const { result } = renderHook(() => useAppState());

    act(() => {
      result.current.handleNavigate(View.Diary);
    });

    expect(result.current.currentView).toBe(View.Diary);

    act(() => {
      result.current.handleNavigate(View.ImageBank);
    });

    expect(result.current.currentView).toBe(View.ImageBank);
  });

  it('should toggle sidebar', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.isSidebarExpanded).toBe(true);

    act(() => {
      result.current.toggleSidebar();
    });

    expect(result.current.isSidebarExpanded).toBe(false);
  });

  it('should show global feedback', () => {
    const { result } = renderHook(() => useAppState());

    expect(result.current.globalFeedback).toBeNull();

    act(() => {
      result.current.showGlobalFeedback('Test message', 'success');
    });

    expect(result.current.globalFeedback).toEqual({
      message: 'Test message',
      type: 'success'
    });
  });


}); 