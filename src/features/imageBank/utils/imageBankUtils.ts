// Helper map for EXIF data display
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

export const formatDataUrlSize = (dataUrl?: string): string => {
  if (!dataUrl) return 'Okänd';
  const sizeInBytes = (dataUrl.length * (3/4));
  if (sizeInBytes < 1024) return `${Math.round(sizeInBytes)} B`;
  if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
  return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
}; 