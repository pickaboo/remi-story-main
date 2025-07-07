import { describe, it, expect } from "vitest";
import React from 'react';
import { render, screen } from '@testing-library/react';
import { Header } from '../../components/layout/Header';
import { User } from '../../types';

describe('Header - invitation icon', () => {
  const baseUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    emailVerified: true,
    initials: 'TU',
    avatarColor: 'bg-blue-500',
    themePreference: 'system',
    sphereIds: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('shows invitation icon and count when pendingInvitationCount > 0', () => {
    const userWithInvites = { ...baseUser, pendingInvitationCount: 2 };
    render(
      <Header
        currentUser={userWithInvites}
        isSidebarExpanded={true}
        onNavigate={() => {}}
        logoUrl={''}
        onLogout={async () => {}}
        onAcceptInvitation={async () => {}}
        onDeclineInvitation={async () => {}}
        onSaveThemePreference={async () => {}}
      />
    );
    // The badge should be visible and show the correct count
    expect(screen.getByLabelText(/väntande inbjudningar/i)).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('does not show invitation icon when pendingInvitationCount is 0 or undefined', () => {
    render(
      <Header
        currentUser={baseUser}
        isSidebarExpanded={true}
        onNavigate={() => {}}
        logoUrl={''}
        onLogout={async () => {}}
        onAcceptInvitation={async () => {}}
        onDeclineInvitation={async () => {}}
        onSaveThemePreference={async () => {}}
      />
    );
    // The badge should not be in the document
    expect(screen.queryByLabelText(/väntande inbjudningar/i)).not.toBeInTheDocument();
  });
}); 