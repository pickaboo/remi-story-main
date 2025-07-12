import React from 'react';
import { UserSettingsSection } from '../components/UserSettingsSection';

// TODO: Hämta dessa värden från context/store/userService
const mockUser = {
  id: 'user123',
  name: 'Andreas',
  imageUrl: '',
  theme: 'system',
};

export const UserSettingsPage: React.FC = () => {
  // TODO: Implementera logik för att spara namn, bild och tema
  const handleNameSave = (newName: string) => {
    console.log('Spara nytt namn:', newName);
  };
  const handleImageUpload = (url: string) => {
    console.log('Spara ny profilbild:', url);
  };
  const handleThemeChange = (theme: string) => {
    console.log('Spara nytt tema:', theme);
  };

  return (
    <div className="max-w-lg mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Användarinställningar</h1>
      <UserSettingsSection
        userId={mockUser.id}
        currentName={mockUser.name}
        currentImageUrl={mockUser.imageUrl}
        currentTheme={mockUser.theme}
        onNameSave={handleNameSave}
        onImageUpload={handleImageUpload}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}; 