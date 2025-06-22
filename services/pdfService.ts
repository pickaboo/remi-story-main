
import { jsPDF } from 'jspdf';
import { ImageRecord, SlideshowProject } from '../types';

const A4_PAGE_WIDTH = 210;
const A4_PAGE_HEIGHT = 297;
const MARGIN = 15; // mm
const IMAGE_MAX_WIDTH_COMMON = A4_PAGE_WIDTH - 2 * MARGIN;

// Constants for Photo Album PDF
const IMAGE_MAX_HEIGHT_ALBUM = A4_PAGE_HEIGHT * 0.6; 
const FONT_SIZE_ALBUM_TITLE = 20;
const FONT_SIZE_ALBUM_STORY = 10;
const FONT_SIZE_ALBUM_CONTINUATION_HEADER = FONT_SIZE_ALBUM_STORY - 2;
const LINE_HEIGHT_ALBUM_STORY = 1.0; 
const CONTINUATION_HEADER_ADVANCE_Y_ALBUM = 7; // mm space for continuation header + small padding

// Helper to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};


export const generatePhotoAlbumPdf = async (project: SlideshowProject, images: ImageRecord[]): Promise<void> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Cover Page
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(FONT_SIZE_ALBUM_TITLE + 8);
  const titleTextWidth = doc.getTextWidth(project.name);
  const titleX = (A4_PAGE_WIDTH - titleTextWidth) / 2;
  doc.text(project.name, titleX, A4_PAGE_HEIGHT / 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(FONT_SIZE_ALBUM_STORY);
  const subtitle = "Ett fotoalbum genererat av REMI Story";
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (A4_PAGE_WIDTH - subtitleWidth) / 2, A4_PAGE_HEIGHT / 2 + 10);

  // Image Pages
  for (const image of images) {
    doc.addPage();
    let imageDataForPdf: string | undefined = image.dataUrl; // Fallback to existing dataUrl if present

    try {
      if (image.storageUrl && !imageDataForPdf) { // Prioritize storageUrl if dataUrl is not present
        const response = await fetch(image.storageUrl);
        if (!response.ok) throw new Error(`Failed to fetch image from ${image.storageUrl}: ${response.statusText}`);
        const blob = await response.blob();
        imageDataForPdf = await blobToBase64(blob);
      }

      if (!imageDataForPdf) {
        throw new Error(`No image data available for ${image.name || 'Okänd bild'}`);
      }

      // Add Image
      const imgProps = doc.getImageProperties(imageDataForPdf);
      const aspectRatio = imgProps.width / imgProps.height;
      
      let imgWidth = IMAGE_MAX_WIDTH_COMMON;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > IMAGE_MAX_HEIGHT_ALBUM) {
        imgHeight = IMAGE_MAX_HEIGHT_ALBUM;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (A4_PAGE_WIDTH - imgWidth) / 2; // Center image
      const imgY = MARGIN;

      doc.addImage(imageDataForPdf, imgProps.fileType || 'JPEG', imgX, imgY, imgWidth, imgHeight);

      // Add Compiled Story Text (or uploader's description if story is missing)
      let storyToUse = image.compiledStory;
      if (!storyToUse && image.userDescriptions && image.uploadedByUserId) {
        const uploaderDesc = image.userDescriptions.find(ud => ud.userId === image.uploadedByUserId);
        if (uploaderDesc && uploaderDesc.description) {
            storyToUse = uploaderDesc.description;
        }
      }
      
      if (storyToUse) {
        const textLines = doc.splitTextToSize(storyToUse, IMAGE_MAX_WIDTH_COMMON);
        let currentTextY = imgY + imgHeight + 10; // Start text 10mm below image
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE_ALBUM_STORY);
        doc.setLineHeightFactor(LINE_HEIGHT_ALBUM_STORY);
        const storyLineHeight = doc.getLineHeight(); // Get line height in mm

        textLines.forEach((line: string) => {
          if (currentTextY + storyLineHeight > A4_PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            currentTextY = MARGIN; // Reset Y for new page
            
            doc.setFontSize(FONT_SIZE_ALBUM_CONTINUATION_HEADER);
            doc.text(`(Fortsättning för: ${image.name || 'Okänd bild'})`, MARGIN, currentTextY);
            currentTextY += CONTINUATION_HEADER_ADVANCE_Y_ALBUM; 
            doc.setFontSize(FONT_SIZE_ALBUM_STORY); 
          }
          doc.text(line, MARGIN, currentTextY);
          currentTextY += storyLineHeight;
        });
      }
    } catch (error) {
      console.error(`Error adding image ${image.name || 'Okänd bild'} to PDF:`, error);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE_ALBUM_STORY);
      doc.text(`Kunde inte ladda text/bild för: ${image.name || 'Okänd bild'}`, MARGIN, MARGIN + 10);
    }
  }

  doc.save(`${project.name.replace(/\s+/g, '_').toLowerCase()}_fotoalbum.pdf`);
};

// Removed generateImageBankExportPdf function