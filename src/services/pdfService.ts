
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
    let currentPageY = MARGIN; // Reset Y for each new page dedicated to an image
    
    try {
      let imageDataForPdf: string | undefined = image.dataUrl;
      let imageMimeType: string = image.type; // Original MIME type from ImageRecord

      if (!imageDataForPdf) {
        console.warn(`Skipping image "${image.name || 'Okänd bild'}" in PDF due to missing dataUrl.`);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE_ALBUM_STORY);
        doc.text(`Bilddata saknas för: ${image.name || 'Okänd bild'}`, MARGIN, currentPageY);
        currentPageY += 7; 
        continue;
      }

      // If it's an HTTP/S URL, fetch it and convert to base64 data URL
      if (imageDataForPdf.startsWith('http')) {
        try {
          const response = await fetch(imageDataForPdf);
          if (!response.ok) {
            throw new Error(`Failed to fetch image ${image.name || 'Okänd bild'}: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();
          imageMimeType = blob.type; // Use the actual blob type for more accuracy
          
          imageDataForPdf = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(blob);
          });
        } catch (fetchError: any) {
          console.error(`Error fetching/converting image "${image.name || 'Okänd bild'}" from URL to base64:`, fetchError.message);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(FONT_SIZE_ALBUM_STORY);
          doc.text(`Kunde inte ladda bilddata (nätverksfel): ${image.name || 'Okänd bild'}`, MARGIN, currentPageY);
          currentPageY += 7;
          continue;
        }
      }
      
      // At this point, imageDataForPdf should be a base64 data URL.
      // Extract format for jsPDF (JPEG, PNG, etc.)
      const imageFormat = imageMimeType.split('/')[1]?.toUpperCase();
      const supportedFormats = ['JPEG', 'PNG', 'GIF', 'WEBP', 'JPG']; // JPG is alias for JPEG

      if (!imageFormat || !supportedFormats.includes(imageFormat)) {
        console.warn(`Skipping image "${image.name || 'Okänd bild'}" due to unsupported format for PDF: ${imageMimeType}`);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE_ALBUM_STORY);
        doc.text(`Bildformat (${imageMimeType}) stöds ej för PDF: ${image.name || 'Okänd bild'}`, MARGIN, currentPageY);
        currentPageY += 7;
        continue;
      }

      // Add Image
      const imgProps = doc.getImageProperties(imageDataForPdf); // Now this should work reliably
      const aspectRatio = imgProps.width / imgProps.height;
      
      let imgWidth = IMAGE_MAX_WIDTH_COMMON;
      let imgHeight = imgWidth / aspectRatio;

      if (imgHeight > IMAGE_MAX_HEIGHT_ALBUM) {
        imgHeight = IMAGE_MAX_HEIGHT_ALBUM;
        imgWidth = imgHeight * aspectRatio;
      }
      
      const imgX = (A4_PAGE_WIDTH - imgWidth) / 2; // Center image
      const imgYPosition = currentPageY;

      doc.addImage(imageDataForPdf, imageFormat === 'JPG' ? 'JPEG' : imageFormat, imgX, imgYPosition, imgWidth, imgHeight);
      currentPageY = imgYPosition + imgHeight + 10; // Update Y for text after image

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
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(FONT_SIZE_ALBUM_STORY);
        doc.setLineHeightFactor(LINE_HEIGHT_ALBUM_STORY);
        const storyLineHeight = doc.getLineHeight(); // Get line height in mm

        textLines.forEach((line: string) => {
          if (currentPageY + storyLineHeight > A4_PAGE_HEIGHT - MARGIN) {
            doc.addPage();
            currentPageY = MARGIN; // Reset Y for new page
            
            doc.setFontSize(FONT_SIZE_ALBUM_CONTINUATION_HEADER);
            doc.text(`(Fortsättning för: ${image.name || 'Okänd bild'})`, MARGIN, currentPageY);
            currentPageY += CONTINUATION_HEADER_ADVANCE_Y_ALBUM; 
            doc.setFontSize(FONT_SIZE_ALBUM_STORY); 
          }
          doc.text(line, MARGIN, currentPageY);
          currentPageY += storyLineHeight;
        });
      }
    } catch (error: any) { // Catch errors from getImageProperties or other jsPDF calls
      console.error(`Error processing image "${image.name || 'Okänd bild'}" for PDF:`, error.message);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(FONT_SIZE_ALBUM_STORY);
      if (currentPageY + 7 > A4_PAGE_HEIGHT - MARGIN) { 
          doc.addPage();
          currentPageY = MARGIN;
      }
      doc.text(`Fel vid bearbetning av bild: ${image.name || 'Okänd bild'}`, MARGIN, currentPageY);
    }
  }

  doc.save(`${project.name.replace(/\s+/g, '_').toLowerCase()}_fotoalbum.pdf`);
};
