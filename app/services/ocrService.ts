import { createWorker } from 'tesseract.js';
import { TESSERACT_CONFIG } from '../config';

// Definisikan tipe untuk worker Tesseract
interface WorkerWithState extends Tesseract.Worker {
  isLoaded?: boolean;
}

// Enum PSM dari definisi tesseract.js
enum PSM {
  SINGLE_BLOCK = '6'
}

let worker: WorkerWithState | null = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export async function initializeOCR() {
  if (worker && worker.isLoaded) {
    return worker;
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  isInitializing = true;
  
  // Buat promise dengan timeout
  initPromise = new Promise(async (resolve, reject) => {
    try {
      console.log('Initializing OCR engine...');
      
      // Gunakan opsi yang lebih sederhana untuk meningkatkan kecepatan
      const newWorker = await createWorker() as WorkerWithState;
      
      // Konfigurasi worker
      console.log('Configuring OCR worker...');
      
      // Gabungkan bahasa untuk dukungan multi-bahasa
      const languages = TESSERACT_CONFIG.languages.join('+');
      console.log(`Loading OCR languages: ${languages}`);
      await newWorker.loadLanguage(languages);
      await newWorker.initialize(languages);
      
      // Konfigurasi tambahan untuk meningkatkan akurasi OCR
      await newWorker.setParameters({
        tessedit_ocr_engine_mode: '1', // LSTM only
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
        preserve_interword_spaces: '1',
        tessjs_create_hocr: '0',
        tessjs_create_tsv: '0',
        tessjs_create_box: '0',
        tessjs_create_unlv: '0',
        tessjs_create_osd: '0',
        tessedit_char_whitelist: TESSERACT_CONFIG.parameters.tessedit_char_whitelist
      });
      
      worker = newWorker;
      worker.isLoaded = true;
      
      isInitializing = false;
      console.log('OCR engine initialized successfully');
      resolve(worker);
    } catch (error) {
      console.error('Error initializing OCR:', error);
      isInitializing = false;
      initPromise = null;
      
      // Coba bersihkan worker yang mungkin sebagian terinisialisasi
      try {
        if (worker) {
          await worker.terminate();
          worker = null;
        }
      } catch (cleanupError) {
        console.error('Error cleaning up worker:', cleanupError);
      }
      
      reject(error);
    }
  });
  
  return initPromise;
}

export async function recognizeText(imageData: string): Promise<string> {
  try {
    console.log('Starting OCR process...');
    
    // Coba inisialisasi OCR
    let ocrWorker: WorkerWithState | null = null;
    try {
      ocrWorker = await initializeOCR();
    } catch (initError) {
      console.error('Failed to initialize OCR, trying with simpler options:', initError);
      
      // Jika gagal, coba dengan opsi yang lebih sederhana
      worker = null;
      initPromise = null;
      
      ocrWorker = await createWorker() as WorkerWithState;
      
      // Konfigurasi sederhana
      await ocrWorker.loadLanguage('eng');
      await ocrWorker.initialize('eng');
      
      // Gunakan parameter minimal
      await ocrWorker.setParameters({
        tessedit_ocr_engine_mode: '1',
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK
      });
    }
    
    if (!ocrWorker) {
      throw new Error('OCR worker tidak tersedia');
    }
    
    console.log('Recognizing text from image...');
    const result = await ocrWorker.recognize(imageData);
    console.log('OCR completed successfully');
    
    if (!result.data.text || result.data.text.trim().length === 0) {
      console.warn('No text detected in image');
      throw new Error('Tidak ada teks yang terdeteksi dalam gambar');
    } else {
      console.log('Text detected:', result.data.text.substring(0, 100) + '...');
      return result.data.text;
    }
  } catch (error) {
    console.error('OCR error:', error);
    
    // Coba reinisialisasi OCR jika terjadi error
    try {
      await terminateOCR();
    } catch (terminateError) {
      console.error('Error terminating OCR after failure:', terminateError);
    }
    
    throw new Error('Gagal mengekstrak teks dari gambar. Silakan coba lagi.');
  }
}

export async function terminateOCR() {
  if (worker) {
    try {
      await worker.terminate();
      worker = null;
      initPromise = null;
    } catch (error) {
      console.error('Error terminating OCR worker:', error);
    }
  }
} 