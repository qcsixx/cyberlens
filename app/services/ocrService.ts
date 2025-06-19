import { createWorker, createScheduler } from 'tesseract.js';
import { TESSERACT_CONFIG } from '../config';

let worker: Tesseract.Worker | null = null;
let scheduler: any = null;
let isInitializing = false;
let initPromise: Promise<any> | null = null;

export async function initializeOCR() {
  if (worker) {
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
        reject(new Error('Timeout initializing OCR engine'));
      }, TESSERACT_CONFIG.timeouts.initialization);
      
      // Gunakan scheduler untuk performa yang lebih baik
      scheduler = createScheduler();
      const newWorker = await createWorker();
      
      // Gabungkan bahasa untuk dukungan multi-bahasa
      const languages = TESSERACT_CONFIG.languages.join('+');
      await newWorker.loadLanguage(languages);
      await newWorker.initialize(languages);
      
      // Konfigurasi tambahan untuk meningkatkan akurasi OCR
      await newWorker.setParameters(TESSERACT_CONFIG.parameters);
      
      scheduler.addWorker(newWorker);
      worker = newWorker;
      
      clearTimeout(timeoutId);
      isInitializing = false;
      resolve(scheduler);
    } catch (error) {
      console.error('Error initializing OCR:', error);
      isInitializing = false;
      initPromise = null;
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
          reject(new Error('Timeout during text recognition'));
        }, TESSERACT_CONFIG.timeouts.recognition);
        
        // Initialize OCR if not already done
        await initializeOCR();
        
        // Use worker directly for simplicity
        if (worker) {
          const result = await worker.recognize(imageData);
          console.log('OCR result:', result.data.text.substring(0, 100) + '...');
          
          clearTimeout(timeoutId);
          
          if (!result.data.text || result.data.text.trim().length === 0) {
            reject(new Error('Tidak ada teks yang terdeteksi dalam gambar'));
          } else {
            resolve(result.data.text);
          }
        } else {
          reject(new Error('OCR worker tidak tersedia'));
        }
      } catch (error) {
        console.error('OCR recognition error:', error);
        reject(error);
      }
    });
    
    return await recognizePromise;
  } catch (error) {
    console.error('OCR error:', error);
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