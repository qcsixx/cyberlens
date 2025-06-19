/**
 * Utilitas untuk memproses gambar sebelum OCR
 */
import { IMAGE_PROCESSING_CONFIG } from '../config';

/**
 * Memproses gambar untuk meningkatkan kualitas OCR
 * @param imageDataUrl Data URL gambar yang akan diproses
 * @returns Data URL gambar yang telah diproses
 */
export async function preprocessImageForOCR(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          // Buat canvas untuk memproses gambar
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.error('Failed to get canvas context');
            resolve(imageDataUrl); // Return original image if processing fails
            return;
          }
          
          // Set ukuran canvas
          const maxWidth = IMAGE_PROCESSING_CONFIG.maxWidth;
          const maxHeight = IMAGE_PROCESSING_CONFIG.maxHeight;
          
          let width = img.width;
          let height = img.height;
          
          // Resize gambar jika terlalu besar
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round(height * (maxWidth / width));
              width = maxWidth;
            } else {
              width = Math.round(width * (maxHeight / height));
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Gambar ke canvas
          ctx.drawImage(img, 0, 0, width, height);
          
          // Proses gambar untuk meningkatkan OCR
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Konversi ke grayscale dan tingkatkan kontras
          for (let i = 0; i < data.length; i += 4) {
            // Konversi ke grayscale
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            
            // Tingkatkan kontras
            const threshold = IMAGE_PROCESSING_CONFIG.contrastThreshold;
            const newValue = avg > threshold ? 255 : 0;
            
            // Terapkan nilai baru
            data[i] = newValue;     // R
            data[i + 1] = newValue; // G
            data[i + 2] = newValue; // B
          }
          
          // Terapkan perubahan ke canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Konversi canvas ke data URL
          const processedImageDataUrl = canvas.toDataURL('image/jpeg', IMAGE_PROCESSING_CONFIG.jpegQuality);
          resolve(processedImageDataUrl);
        } catch (error) {
          console.error('Error processing image:', error);
          resolve(imageDataUrl); // Return original image if processing fails
        }
      };
      
      img.onerror = () => {
        console.error('Failed to load image for processing');
        resolve(imageDataUrl); // Return original image if loading fails
      };
      
      img.src = imageDataUrl;
    } catch (error) {
      console.error('Error in image preprocessing:', error);
      resolve(imageDataUrl); // Return original image if any error occurs
    }
  });
} 