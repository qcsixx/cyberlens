import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;
let isInitializing = false;
let initPromise: Promise<Tesseract.Worker> | null = null;

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
      }, 30000); // 30 detik timeout
      
      const newWorker = await createWorker('ind');
      await newWorker.load();
      await newWorker.loadLanguage('ind');
      await newWorker.initialize('ind');
      
      clearTimeout(timeoutId);
      worker = newWorker;
      isInitializing = false;
      resolve(worker);
    } catch (error) {
      isInitializing = false;
      initPromise = null;
      reject(error);
    }
  });
  
  return initPromise;
}

export async function recognizeText(imageData: string): Promise<string> {
  try {
    // Buat promise dengan timeout
    const recognizePromise = new Promise<string>(async (resolve, reject) => {
      try {
        const timeoutId = setTimeout(() => {
          reject(new Error('Timeout during text recognition'));
        }, 15000); // 15 detik timeout
        
        const ocrWorker = await initializeOCR();
        const result = await ocrWorker.recognize(imageData);
        
        clearTimeout(timeoutId);
        resolve(result.data.text);
      } catch (error) {
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