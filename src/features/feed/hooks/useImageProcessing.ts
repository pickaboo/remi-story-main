import { useState } from 'react';
import { ImageRecord, User, UserDescriptionEntry } from '../../../../types';
import { generateId, saveImage, getImageById } from '../../../../services/storageService';
import { analyzeImageWithGemini, generateEngagingQuestionFromAnalysis } from '../../../../services/geminiService';
import ExifReader from 'exifreader';
import { getDownloadURL, ref } from 'firebase/storage'; 
import { storage } from '../../../../firebase';

interface ExtractedFileDetails {
  dataUrl: string;
  width: number;
  height: number;
  dateTaken: string;
  exifData?: Record<string, { description: string | number }>;
  filePath: string; 
}

export const useImageProcessing = () => {
  const [uploadedFileDetails, setUploadedFileDetails] = useState<ExtractedFileDetails | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  const extractImageDetailsFromFile = async (file: File): Promise<ExtractedFileDetails> => {
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

    let parsedExifData: Record<string, { description: string | number }> | undefined = undefined;
    let imageDateTaken: string = new Date().toISOString().split('T')[0]; 
    const newImageId = generateId(); 
    const filePath = `remi_files/images/${newImageId}/${file.name}`; 

    try {
      const arrayBuffer = await file.arrayBuffer();
      const rawExifTags = ExifReader.load(arrayBuffer);
      
      const exifDataToStore: Record<string, { description: string | number }> = {};
      if (rawExifTags) {
          for (const tagName in rawExifTags) {
              const tagValue = rawExifTags[tagName];
              if (tagValue && typeof tagValue.description !== 'undefined') {
                  const excludedTagsByName = ['MakerNote', 'UserComment', 'ThumbnailOffset', 'ThumbnailLength', 'JPEGTables', 'Padding', 'ThumbnailData', 'ApplicationNotes', 'ComponentsConfiguration', 'ExifToolVersion', 'InteropOffset', 'GPSProcessingMethod', 'FileSource', 'SceneType'];
                  if (excludedTagsByName.includes(tagName) || tagName.startsWith('Thumbnail')) {
                      continue;
                  }
                  if (typeof tagValue.value === 'object' && tagValue.value !== null && ArrayBuffer.isView(tagValue.value)) {
                      continue;
                  }
                  if (typeof tagValue.description === 'string' || typeof tagValue.description === 'number') {
                      exifDataToStore[tagName] = { description: tagValue.description };
                  }
              }
          }
      }
      parsedExifData = Object.keys(exifDataToStore).length > 0 ? exifDataToStore : undefined;

      if (parsedExifData?.DateTimeOriginal?.description) {
          const dtOriginalStr = String(parsedExifData.DateTimeOriginal.description);
          const parsableDateStr = dtOriginalStr.substring(0, 10).replace(/:/g, '-') + dtOriginalStr.substring(10);
          const exifDate = new Date(parsableDateStr);
          if (!isNaN(exifDate.getTime())) {
            imageDateTaken = exifDate.toISOString().split('T')[0];
          } else {
              console.warn(`Could not parse EXIF DateTimeOriginal: ${dtOriginalStr}`);
          }
      }
    } catch (exifError) {
      console.warn(`Could not parse EXIF data for ${file.name}:`, exifError);
    }

    return {
      dataUrl,
      width: dimensions.width,
      height: dimensions.height,
      dateTaken: imageDateTaken,
      exifData: parsedExifData,
      filePath, 
    };
  };

  const getBase64FromUrl = async (url: string, originalMimeType?: string | null): Promise<{ base64Data: string, mimeType: string }> => {
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
  };

  const loadImageFromId = async (imageId: string, activeSphereId: string, currentUser: User): Promise<{ image: ImageRecord; prefillText: string }> => {
    const imageFromDb = await getImageById(imageId);
    if (!imageFromDb || imageFromDb.sphereId !== activeSphereId) {
      throw new Error(`Image not found or doesn't belong to current sphere`);
    }

    let dataUrlForPreview = imageFromDb.dataUrl; 

    if ((!dataUrlForPreview || !dataUrlForPreview.startsWith('data:')) && imageFromDb.filePath) {
      try {
        dataUrlForPreview = await getDownloadURL(ref(storage, imageFromDb.filePath));
      } catch (urlError) {
        console.error(`Failed to get download URL for ${imageFromDb.filePath}:`, urlError);
        throw new Error(`Kunde inte ladda förhandsgranskning för vald bild (ID: ${imageId}). Fel vid hämtning av URL.`);
      }
    }
    
    const finalImageToLoad: ImageRecord = {
      ...imageFromDb,
      dataUrl: dataUrlForPreview || undefined, 
    };

    let prefillText = finalImageToLoad.aiGeneratedPlaceholder || '';
    if (!prefillText) {
        const currentUserDescForBankedImage = finalImageToLoad.userDescriptions.find(ud => ud.userId === currentUser.id);
        if (currentUserDescForBankedImage) {
            prefillText = currentUserDescForBankedImage.description;
        }
    }

    return { image: finalImageToLoad, prefillText };
  };

  const processAndAnalyzeImage = async (
    file: File, 
    currentUser: User, 
    activeSphereId: string
  ): Promise<{ imageRecord: ImageRecord; aiAnalysis: string; engagingQuestion: string }> => {
    setIsProcessingFile(true);
    
    try {
      const extractedDetails = await extractImageDetailsFromFile(file);
      setUploadedFileDetails(extractedDetails);

      // Analyze image with Gemini
      const { base64Data, mimeType } = await getBase64FromUrl(extractedDetails.dataUrl, file.type);
      const aiAnalysisResult = await analyzeImageWithGemini(base64Data, mimeType);
      const aiAnalysis = aiAnalysisResult.description;
      const engagingQuestion = await generateEngagingQuestionFromAnalysis(aiAnalysis);

      // Create image record
      const imageRecord: ImageRecord = {
        id: generateId(),
        name: file.name,
        dataUrl: extractedDetails.dataUrl,
        filePath: extractedDetails.filePath,
        width: extractedDetails.width,
        height: extractedDetails.height,
        dateTaken: extractedDetails.dateTaken,
        exifData: extractedDetails.exifData,
        sphereId: activeSphereId,
        uploadedByUserId: currentUser.id,
        createdAt: new Date().toISOString(),
        userDescriptions: [],
        aiGeneratedPlaceholder: aiAnalysis,
        type: file.type,
        tags: [],
        isProcessed: true,
        processedByHistory: [],
      };

      return { imageRecord, aiAnalysis, engagingQuestion };
    } finally {
      setIsProcessingFile(false);
    }
  };

  return {
    uploadedFileDetails,
    isProcessingFile,
    extractImageDetailsFromFile,
    getBase64FromUrl,
    loadImageFromId,
    processAndAnalyzeImage,
    setUploadedFileDetails,
  };
}; 