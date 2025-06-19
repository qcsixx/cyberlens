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
      console.log('Starting image preprocessing for OCR...');
      const img = new Image();
      
      img.onload = () => {
        try {
          // Buat canvas untuk memproses gambar
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          
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
          
          // Pastikan ukuran minimum untuk OCR yang lebih baik
          width = Math.max(width, 800);
          height = Math.max(height, 600);
          
          canvas.width = width;
          canvas.height = height;
          
          // Gambar ke canvas dengan latar belakang putih untuk memastikan kontras yang baik
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Proses gambar untuk meningkatkan OCR
          const imageData = ctx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Menerapkan beberapa teknik pemrosesan gambar
          applyImageProcessing(data, width, height, IMAGE_PROCESSING_CONFIG.processingMode);
          
          // Terapkan perubahan ke canvas
          ctx.putImageData(imageData, 0, 0);
          
          // Konversi canvas ke data URL dengan kualitas tinggi
          const processedImageDataUrl = canvas.toDataURL('image/jpeg', IMAGE_PROCESSING_CONFIG.jpegQuality);
          console.log('Image preprocessing completed');
          resolve(processedImageDataUrl);
        } catch (error) {
          console.error('Error processing image:', error);
          resolve(imageDataUrl); // Return original image if processing fails
        }
      };
      
      img.onerror = (error) => {
        console.error('Failed to load image for processing:', error);
        resolve(imageDataUrl); // Return original image if loading fails
      };
      
      img.src = imageDataUrl;
    } catch (error) {
      console.error('Error in image preprocessing:', error);
      resolve(imageDataUrl); // Return original image if any error occurs
    }
  });
}

/**
 * Menerapkan berbagai teknik pemrosesan gambar
 */
function applyImageProcessing(data: Uint8ClampedArray, width: number, height: number, mode: string) {
  switch (mode) {
    case 'text-enhance':
      applyTextEnhancement(data);
      break;
    case 'binarize':
      applyBinarization(data, IMAGE_PROCESSING_CONFIG.contrastThreshold);
      break;
    case 'adaptive':
      applyAdaptiveThreshold(data, width, height);
      break;
    default:
      applyDefaultProcessing(data, IMAGE_PROCESSING_CONFIG.contrastThreshold);
      break;
  }
}

/**
 * Meningkatkan teks dengan meningkatkan kontras dan ketajaman
 */
function applyTextEnhancement(data: Uint8ClampedArray) {
  // Tingkatkan kontras dan ketajaman untuk teks
  for (let i = 0; i < data.length; i += 4) {
    // Konversi ke grayscale dengan pembobotan untuk meningkatkan keterbacaan teks
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    
    // Pembobotan untuk teks hitam pada latar belakang putih
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;
    
    // Tingkatkan kontras
    const contrast = 1.5; // Nilai kontras (1.0 = normal)
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedGray = factor * (gray - 128) + 128;
    
    // Terapkan nilai baru
    data[i] = enhancedGray;     // R
    data[i + 1] = enhancedGray; // G
    data[i + 2] = enhancedGray; // B
  }
}

/**
 * Mengubah gambar menjadi hitam-putih dengan threshold tetap
 */
function applyBinarization(data: Uint8ClampedArray, threshold: number) {
  for (let i = 0; i < data.length; i += 4) {
    // Konversi ke grayscale
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Binarisasi dengan threshold
    const newValue = avg > threshold ? 255 : 0;
    
    // Terapkan nilai baru
    data[i] = newValue;     // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
  }
}

/**
 * Menggunakan threshold adaptif untuk gambar dengan pencahayaan tidak merata
 */
function applyAdaptiveThreshold(data: Uint8ClampedArray, width: number, height: number) {
  // Salin data untuk perhitungan
  const grayscale = new Uint8Array(width * height);
  for (let i = 0, j = 0; i < data.length; i += 4, j++) {
    grayscale[j] = Math.round((data[i] + data[i + 1] + data[i + 2]) / 3);
  }
  
  // Ukuran blok untuk threshold adaptif
  const blockSize = 11;
  const offset = 15; // Nilai offset untuk threshold
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Hitung rata-rata lokal
      let sum = 0;
      let count = 0;
      
      for (let dy = -blockSize; dy <= blockSize; dy++) {
        for (let dx = -blockSize; dx <= blockSize; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
            sum += grayscale[ny * width + nx];
            count++;
          }
        }
      }
      
      const avg = sum / count;
      const threshold = avg - offset;
      
      const i = (y * width + x) * 4;
      const pixelValue = grayscale[y * width + x];
      const newValue = pixelValue > threshold ? 255 : 0;
      
      data[i] = newValue;
      data[i + 1] = newValue;
      data[i + 2] = newValue;
    }
  }
}

/**
 * Pemrosesan default untuk OCR
 */
function applyDefaultProcessing(data: Uint8ClampedArray, threshold: number) {
  // Tingkatkan kontras dan binarisasi
  for (let i = 0; i < data.length; i += 4) {
    // Konversi ke grayscale
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
    
    // Tingkatkan kontras
    const contrast = 1.2;
    const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const enhancedValue = factor * (avg - 128) + 128;
    
    // Binarisasi dengan threshold
    const newValue = enhancedValue > threshold ? 255 : 0;
    
    // Terapkan nilai baru
    data[i] = newValue;     // R
    data[i + 1] = newValue; // G
    data[i + 2] = newValue; // B
  }
} 