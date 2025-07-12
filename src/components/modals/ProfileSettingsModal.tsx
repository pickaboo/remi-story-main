import React, { useState } from 'react';
import { ProfileSettingsForm } from '../../features/userSettings/components/ProfileSettingsForm';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  currentImageUrl?: string;
  currentAvatarColor: string;
  onNameSave: (newName: string) => Promise<void> | void;
  onImageUpload: (url: string) => Promise<void> | void;
  onAvatarColorChange: (color: string) => Promise<void> | void;
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-gray-500',
  'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500',
];

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
  userId,
  currentName,
  currentImageUrl,
  currentAvatarColor,
  onNameSave,
  onImageUpload,
  onAvatarColorChange,
}) => {
  const [name, setName] = useState(currentName);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [avatarColor, setAvatarColor] = useState(currentAvatarColor);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      if (name !== currentName) await onNameSave(name);
      if (imageUrl !== currentImageUrl && imageUrl) await onImageUpload(imageUrl);
      if (avatarColor !== currentAvatarColor) await onAvatarColorChange(avatarColor);
      setSaving(false);
      onClose();
    } catch (e) {
      setError('Kunde inte spara ändringar.');
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 min-h-screen">
      <div className="bg-white dark:bg-dark-bg rounded-xl shadow-2xl p-6 w-full max-w-md relative flex flex-col items-center">
        <button onClick={onClose} className="absolute top-3 right-3 text-xl font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">×</button>
        <h2 className="text-xl font-semibold mb-4 text-center w-full">Redigera profil</h2>
        <ProfileSettingsForm
          userId={userId}
          currentName={name}
          currentImageUrl={imageUrl}
          onNameSave={setName}
          onImageUpload={setImageUrl}
        />
        <div className="mt-6 w-full">
          <label className="block font-medium mb-2">Välj avatarfärg</label>
          <div className="flex flex-wrap gap-2">
            {AVATAR_COLORS.map(color => (
              <button
                key={color}
                type="button"
                className={`w-8 h-8 rounded-full border-2 ${color} ${avatarColor === color ? 'ring-2 ring-primary' : 'border-transparent'}`}
                onClick={() => setAvatarColor(color)}
                aria-label={color}
              />
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}
        <div className="flex justify-end gap-2 mt-8 w-full">
          <button onClick={onClose} className="px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200" disabled={saving}>Avbryt</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-primary text-white" disabled={saving}>{saving ? 'Sparar...' : 'Spara'}</button>
        </div>
      </div>
    </div>
  );
}; 