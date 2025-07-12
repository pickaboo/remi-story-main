import React from 'react';
import { ProfileSettingsForm } from './ProfileSettingsForm';
import { ThemeSelector } from './ThemeSelector';

interface UserSettingsSectionProps {
  userId: string;
  currentName: string;
  currentImageUrl?: string;
  currentTheme: string;
  onNameSave: (newName: string) => void;
  onImageUpload: (url: string) => void;
  onThemeChange: (theme: string) => void;
}

export const UserSettingsSection: React.FC<UserSettingsSectionProps> = ({
  userId,
  currentName,
  currentImageUrl,
  currentTheme,
  onNameSave,
  onImageUpload,
  onThemeChange,
}) => {
  return (
    <div className="space-y-8">
      <ProfileSettingsForm
        userId={userId}
        currentName={currentName}
        currentImageUrl={currentImageUrl}
        onNameSave={onNameSave}
        onImageUpload={onImageUpload}
      />
      <ThemeSelector currentTheme={currentTheme} onThemeChange={onThemeChange} />
    </div>
  );
}; 