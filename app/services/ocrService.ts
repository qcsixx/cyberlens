import { createWorker } from 'tesseract.js';

let worker: Tesseract.Worker | null = null;

export async function initializeOCR() {
  if (!worker) {
    worker = await createWorker('ind');
    await worker.load();
    await worker.loadLanguage('ind');
    await worker.initialize('ind');
  }
  return worker;
}

export async function recognizeText(imageData: string): Promise<string> {
  try {
    const ocrWorker = await initializeOCR();
    const result = await ocrWorker.recognize(imageData);
    return result.data.text;
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('Gagal mengekstrak teks dari gambar');
  }
}

export async function terminateOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
} 