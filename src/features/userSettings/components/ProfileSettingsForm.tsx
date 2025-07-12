import React from 'react';
import { ProfileImageUploader } from './ProfileImageUploader';
import { ProfileNameEditor } from './ProfileNameEditor';

interface ProfileSettingsFormProps {
  userId: string;
  currentName: string;
  currentImageUrl?: string;
  onNameSave: (newName: string) => void;
  onImageUpload: (url: string) => void;
}

export const ProfileSettingsForm: React.FC<ProfileSettingsFormProps> = ({
  userId,
  currentName,
  currentImageUrl,
  onNameSave,
  onImageUpload,
}) => {
  return (
    <div className="space-y-6">
      <ProfileImageUploader userId={userId} currentImageUrl={currentImageUrl} onUpload={onImageUpload} />
      <ProfileNameEditor currentName={currentName} onSave={onNameSave} />
    </div>
  );
}; 