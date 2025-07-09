import React, { useState, useRef } from 'react';
import { storage } from '../../../../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ProfileImageUploaderProps {
  userId: string;
  currentImageUrl?: string;
  onUpload?: (url: string) => void;
}

export const ProfileImageUploader: React.FC<ProfileImageUploaderProps> = ({ userId, currentImageUrl, onUpload }) => {
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [showInput, setShowInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleEditClick = () => {
    setShowInput(true);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      // Visa förhandsgranskning direkt
      const reader = new FileReader();
      reader.onload = () => setImageUrl(reader.result as string);
      reader.readAsDataURL(file);

      // Ladda upp till Firebase Storage
      const fileRef = ref(storage, `profile_images/${userId}/${file.name}`);
      await uploadBytes(fileRef, file);
      const url = await getDownloadURL(fileRef);
      setImageUrl(url);
      onUpload?.(url);
    } catch (err) {
      alert('Kunde inte ladda upp profilbild.');
    } finally {
      setUploading(false);
      setShowInput(false);
    }
  };

  return (
    <div className="relative inline-block">
      <img
        src={imageUrl || '/default-profile.png'}
        alt="Profilbild"
        className="w-24 h-24 rounded-full object-cover mb-2 border border-slate-300 dark:border-slate-600"
      />
      <button
        type="button"
        className="absolute bottom-3 right-3 bg-white dark:bg-dark-bg border border-slate-300 dark:border-slate-600 rounded-full p-1 shadow hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        onClick={handleEditClick}
        aria-label="Byt profilbild"
        disabled={uploading}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
      </button>
      {showInput && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={uploading}
        />
      )}
      {uploading && <p className="text-xs text-slate-500 mt-2">Laddar upp...</p>}
    </div>
  );
}; 