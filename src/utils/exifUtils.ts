import ExifReader from 'exifreader';

/**
 * Helper map for EXIF data display
 */
export const formatOrientation = (orientationValue: number): string => {
  switch (orientationValue) {
    case 1: return "Normal (0°)";
    case 2: return "Spegelvänd horisontellt";
    case 3: return "Roterad 180°";
    case 4: return "Spegelvänd vertikalt";
    case 5: return "Roterad 90° MOTSOLS och spegelvänd vertikalt";
    case 6: return "Roterad 90° MEDSOLS";
    case 7: return "Roterad 90° MEDSOLS och spegelvänd vertikalt";
    case 8: return "Roterad 90° MOTSOLS";
    default: return String(orientationValue);
  }
};

export const EXIF_DISPLAY_MAP: Record<string, { label: string; formatter?: (value: {description: string | number}) => string }> = {
  DateTimeOriginal: { label: 'Tagen (EXIF)', formatter: (val) => {
    if (!val.description) return 'Okänt';
    // EXIF DateTimeOriginal is often YYYY:MM:DD HH:MM:SS. Safari needs YYYY-MM-DD for Date() constructor.
    const dateStr = String(val.description).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(val.description); // Return original if parsing failed
    return date.toLocaleString('sv-SE', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }},
  Model: { label: 'Kameramodell' },
  Make: { label: 'Tillverkare' },
  Software: { label: 'Programvara' },
  ExposureTime: { label: 'Exponeringstid', formatter: (val) => val.description ? `${val.description} s` : '' },
  FNumber: { label: 'Bländartal', formatter: (val) => val.description ? `f/${val.description}`: '' },
  ISOSpeedRatings: { label: 'ISO' },
  FocalLength: { label: 'Brännvidd', formatter: (val) => val.description ? `${val.description} mm` : '' },
  GPSLatitude: { label: 'Latitud (GPS)' },
  GPSLongitude: { label: 'Longitud (GPS)' },
  Orientation: { label: 'Orientering', formatter: (val) => val.description ? formatOrientation(Number(val.description)) : '' },
  ImageWidth: { label: 'Bredd (EXIF)' }, // EXIF ImageWidth
  ImageLength: { label: 'Höjd (EXIF)' }, // EXIF ImageLength (often used instead of ImageHeight)
  PixelXDimension: { label: 'Pixel Bredd (EXIF)' },
  PixelYDimension: { label: 'Pixel Höjd (EXIF)' },
};

/**
 * Parse EXIF data from a file
 */
export const parseExifData = async (file: File): Promise<{
  exifData?: Record<string, { description: string | number }>;
  dateTaken: string;
}> => {
  let parsedExifData: Record<string, { description: string | number }> | undefined = undefined;
  let imageDateTaken: string = new Date().toISOString().split('T')[0]; // Default to today

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
    exifData: parsedExifData,
    dateTaken: imageDateTaken,
  };
}; 