import { isPersonalSphere, Sphere } from '../../types';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as storageService from '../../services/storageService';
import * as userService from '../../services/userService';
import * as authService from '../../services/authService';
import { useSphereManagement } from '../../hooks/useSphereManagement';
import { renderHook, act } from '@testing-library/react';
import { createMockUser } from '../utils';

const mockUser = createMockUser({ avatarColor: 'bg-blue-500' });

describe('useSphereManagement (personal sphere logic)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should mark the first sphere as personal', async () => {
    vi.spyOn(storageService, 'getAllSpheres').mockResolvedValue([]);
    vi.spyOn(storageService, 'saveNewSphere').mockResolvedValue(undefined);
    vi.spyOn(authService, 'addUserToSphere').mockResolvedValue({ ...mockUser, sphereIds: ['sphere1'] });
    vi.spyOn(userService, 'getActiveSphere').mockResolvedValue(null);
    vi.spyOn(userService, 'getUserSpheres').mockResolvedValue([]);
    vi.spyOn(userService, 'setCurrentSphereId').mockResolvedValue(undefined);

    const { result } = renderHook(() => useSphereManagement());
    let sphere: Sphere | null = null;
    await act(async () => {
      sphere = await result.current.fetchUserAndSphereData({ ...mockUser, sphereIds: [] });
    });
    expect(sphere).toBeDefined();
    expect(sphere!.isPersonal).toBe(true);
    expect(isPersonalSphere(sphere!)).toBe(true);
  });

  it('should not mark additional spheres as personal', async () => {
    vi.spyOn(storageService, 'saveNewSphere').mockResolvedValue(undefined);
    vi.spyOn(authService, 'addUserToSphere').mockResolvedValue({ ...mockUser, sphereIds: ['sphere2'] });
    vi.spyOn(userService, 'setCurrentSphereId').mockResolvedValue(undefined);

    const { result } = renderHook(() => useSphereManagement());
    let res: any;
    await act(async () => {
      res = await result.current.handleCreateSphere('Delad sfär', ['#fff', '#000'], { ...mockUser, sphereIds: ['sphere1'] });
    });
    expect(res.success).toBe(true);
    expect(res.sphere!.isPersonal).toBe(false);
    expect(isPersonalSphere(res.sphere!)).toBe(false);
  });

  it('should not allow inviting to personal sphere', async () => {
    const personalSphere: Sphere = {
      id: 'sphere1',
      name: 'Personlig',
      gradientColors: ['#a', '#b'],
      memberIds: [mockUser.id],
      ownerId: mockUser.id,
      createdAt: '',
      updatedAt: '',
      isPersonal: true,
    };
    const { result } = renderHook(() => useSphereManagement());
    act(() => {
      result.current.setAllSpheres([personalSphere]);
    });
    let res: any;
    await act(async () => {
      res = await result.current.handleInviteUserToSphere('invitee@example.com', personalSphere.id);
    });
    expect(res.success).toBe(false);
    expect(res.message).toMatch(/personlig sfär/i);
  });

  it('should allow inviting to non-personal sphere', async () => {
    const nonPersonalSphere: Sphere = {
      id: 'sphere2',
      name: 'Delad',
      gradientColors: ['#a', '#b'],
      memberIds: [mockUser.id],
      ownerId: mockUser.id,
      createdAt: '',
      updatedAt: '',
      isPersonal: false,
    };
    vi.spyOn(authService, 'mock_inviteUserToSphereByEmail').mockResolvedValue({ success: true, message: 'Invited!' });
    const { result } = renderHook(() => useSphereManagement());
    act(() => {
      result.current.setAllSpheres([nonPersonalSphere]);
    });
    let res: any;
    await act(async () => {
      res = await result.current.handleInviteUserToSphere('invitee@example.com', nonPersonalSphere.id);
    });
    expect(res.success).toBe(true);
    expect(res.message).toMatch(/invited/i);
  });
}); 