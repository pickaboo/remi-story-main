import { describe, it, expect } from 'vitest';
import { createMockUser, createMockSphere, createMockImageRecord } from './utils';

describe('Test Utilities', () => {
  describe('createMockUser', () => {
    it('should create a mock user with default values', () => {
      const user = createMockUser();
      
      expect(user).toEqual({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        initials: 'TU',
        avatarColor: 'bg-blue-500',
        emailVerified: true,
        themePreference: 'system',
        pendingInvitationCount: 0,
        sphereIds: ['test-sphere-id'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should allow overriding default values', () => {
      const user = createMockUser({
        name: 'Custom User',
        email: 'custom@example.com',
      });
      
      expect(user.name).toBe('Custom User');
      expect(user.email).toBe('custom@example.com');
      expect(user.id).toBe('test-user-id'); // Should keep default
    });
  });

  describe('createMockSphere', () => {
    it('should create a mock sphere with default values', () => {
      const sphere = createMockSphere();
      
      expect(sphere).toEqual({
        id: 'test-sphere-id',
        name: 'Test Sphere',
        description: 'A test sphere',
        gradientColors: ['#3B82F6', '#1D4ED8'],
        createdBy: 'test-user-id',
        members: ['test-user-id'],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should allow overriding default values', () => {
      const sphere = createMockSphere({
        name: 'Custom Sphere',
        gradientColors: ['#FF0000', '#00FF00'],
      });
      
      expect(sphere.name).toBe('Custom Sphere');
      expect(sphere.gradientColors).toEqual(['#FF0000', '#00FF00']);
      expect(sphere.id).toBe('test-sphere-id'); // Should keep default
    });
  });

  describe('createMockImageRecord', () => {
    it('should create a mock image record with default values', () => {
      const image = createMockImageRecord();
      
      expect(image).toEqual({
        id: 'test-image-id',
        sphereId: 'test-sphere-id',
        uploadedByUserId: 'test-user-id',
        dataUrl: 'data:image/jpeg;base64,test',
        width: 800,
        height: 600,
        size: 1024,
        filePath: 'test/path/image.jpg',
        dateTaken: '2024-01-01T00:00:00.000Z',
        userDescriptions: [],
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      });
    });

    it('should allow overriding default values', () => {
      const image = createMockImageRecord({
        width: 1920,
        height: 1080,
        size: 2048,
      });
      
      expect(image.width).toBe(1920);
      expect(image.height).toBe(1080);
      expect(image.size).toBe(2048);
      expect(image.id).toBe('test-image-id'); // Should keep default
    });
  });
}); 