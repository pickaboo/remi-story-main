import React, { useState, useEffect } from 'react';
import { getUserById } from '../../services/userService';
import { getSphereById } from '../../services/storageService';

interface ImageMetadataUserDetailsProps {
  userId?: string;
  sphereId?: string;
}

export const ImageMetadataUserDetails: React.FC<ImageMetadataUserDetailsProps> = ({ userId, sphereId }) => {
  const [uploaderName, setUploaderName] = useState<string | null>(null);
  const [sphereName, setSphereName] = useState<string | null>(null);
  const [isLoadingUploader, setIsLoadingUploader] = useState(false);
  const [isLoadingSphere, setIsLoadingSphere] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsLoadingUploader(true);
      getUserById(userId)
        .then(user => setUploaderName(user?.name || 'Okänd'))
        .finally(() => setIsLoadingUploader(false));
    } else {
      setUploaderName(null);
    }
  }, [userId]);

  useEffect(() => {
    if (sphereId) {
      setIsLoadingSphere(true);
      getSphereById(sphereId)
        .then(sphere => setSphereName(sphere?.name || 'Okänd'))
        .finally(() => setIsLoadingSphere(false));
    } else {
      setSphereName(null);
    }
  }, [sphereId]);

  return (
    <>
      {userId && (
        <p className="truncate text-xs">
          <strong className="font-normal text-slate-500 dark:text-slate-400">Av:</strong>{' '}
          <span className="text-slate-700 dark:text-slate-300">
            {isLoadingUploader ? 'Laddar...' : uploaderName || 'Okänd'}
          </span>
        </p>
      )}
      {sphereId && (
        <p className="truncate text-xs">
          <strong className="font-normal text-slate-500 dark:text-slate-400">Sfär:</strong>{' '}
          <span className="text-slate-700 dark:text-slate-300">
            {isLoadingSphere ? 'Laddar...' : sphereName || 'Okänd'}
          </span>
        </p>
      )}
    </>
  );
}; 