import { createWorker, createScheduler, PSM } from 'tesseract.js';
import { TESSERACT_CONFIG } from '../config';

let worker: Tesseract.Worker | null = null;
let scheduler: any = null;
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
      const timeoutId = setTimeout(() => {
        console.error('OCR initialization timeout');
        reject(new Error('Timeout initializing OCR engine'));
      }, TESSERACT_CONFIG.timeouts.initialization);
      
      console.log('Initializing OCR engine...');
      
      // Gunakan scheduler untuk performa yang lebih baik
      scheduler = createScheduler();
      const newWorker = await createWorker({
        logger: progress => {
          if (progress.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.floor(progress.progress * 100)}%`);
          } else {
            console.log(`OCR status: ${progress.status}`);
          }
        },
        errorHandler: err => {
          console.error('OCR worker error:', err);
        },
        langPath: 'https://tessdata.projectnaptha.com/4.0.0',
        cachePath: '/tmp/tesseract-cache'
      });
      
      // Gabungkan bahasa untuk dukungan multi-bahasa
      const languages = TESSERACT_CONFIG.languages.join('+');
      console.log(`Loading OCR languages: ${languages}`);
      await newWorker.loadLanguage(languages);
      await newWorker.initialize(languages);
      
      // Konfigurasi tambahan untuk meningkatkan akurasi OCR
      await newWorker.setParameters({
        ...TESSERACT_CONFIG.parameters,
        tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      });
      
      scheduler.addWorker(newWorker);
      worker = newWorker;
      
      clearTimeout(timeoutId);
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
    
    // Buat promise dengan timeout
    const recognizePromise = new Promise<string>(async (resolve, reject) => {
      try {
        const timeoutId = setTimeout(() => {
          console.error('OCR recognition timeout');
          reject(new Error('Timeout during text recognition'));
        }, TESSERACT_CONFIG.timeouts.recognition);
        
        // Initialize OCR if not already done
        const ocrWorker = await initializeOCR();
        
        if (!ocrWorker) {
          throw new Error('OCR worker tidak tersedia');
        }
        
        console.log('Recognizing text from image...');
        const result = await ocrWorker.recognize(imageData);
        console.log('OCR completed successfully');
        
        clearTimeout(timeoutId);
        
        if (!result.data.text || result.data.text.trim().length === 0) {
          console.warn('No text detected in image');
          reject(new Error('Tidak ada teks yang terdeteksi dalam gambar'));
        } else {
          console.log('Text detected:', result.data.text.substring(0, 100) + '...');
          resolve(result.data.text);
        }
      } catch (error) {
        console.error('OCR recognition error:', error);
        reject(error);
      }
    });
    
    return await recognizePromise;
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
  if (scheduler) {
    try {
      await scheduler.terminate();
      scheduler = null;
    } catch (error) {
      console.error('Error terminating OCR scheduler:', error);
    }
  }
  
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