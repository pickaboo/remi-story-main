import { generateId } from '../services/storageService';
import { parseExifData } from './exifUtils';

export interface ExtractedFileDetails {
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string; 
  size: number;
}

/**
 * Extract image details from a file including EXIF data
 */
export async function extractImageDetailsFromFile(file: File): Promise<ExtractedFileDetails> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Validate dataUrl format early
  if (!dataUrl.includes(',')) {
    console.error("FileReader produced a dataUrl without a comma:", dataUrl.substring(0, 100), "for file:", file.name);
    throw new Error(`Filen "${file.name}" kunde inte bearbetas korrekt (ogiltigt dataUrl-format från FileReader).`);
  }

  const dimensions = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 0, height: 0 }); 
    img.src = dataUrl;
  });

  const newImageId = generateId(); 
  const filePath = `remi_files/images/${newImageId}/${file.name}`; 

  // Parse EXIF data using the existing utility
  const { exifData, dateTaken } = await parseExifData(file);

  return {
    dataUrl,
    width: dimensions.width,
    height: dimensions.height,
    dateTaken,
    exifData,
    filePath, 
    size: file.size,
  };
}

/**
 * Convert a URL to base64 data for analysis
 */
export async function getBase64FromUrl(url: string, originalMimeType?: string | null): Promise<{ base64Data: string, mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image for analysis: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64dataUrl = reader.result as string;
      const parts = base64dataUrl.split(',');
      if (parts.length < 2 || !parts[1]) {
          reject(new Error("Invalid base64 data from fetched URL."));
          return;
      }
      const actualMimeType = base64dataUrl.substring(base64dataUrl.indexOf(':') + 1, base64dataUrl.indexOf(';'));
      resolve({ base64Data: parts[1], mimeType: actualMimeType || originalMimeType || 'image/jpeg' });
    };
    reader.onerror = (error) => {
      reject(error);
    };
    reader.readAsDataURL(blob);
  });
} 