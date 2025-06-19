declare namespace Tesseract {
  interface Worker {
    load(): Promise<Worker>;
    loadLanguage(lang: string): Promise<Worker>;
    initialize(lang: string): Promise<Worker>;
    recognize(image: string | HTMLImageElement | HTMLCanvasElement): Promise<RecognizeResult>;
    terminate(): Promise<void>;
  }

  interface RecognizeResult {
    data: {
      text: string;
      lines: Array<{
        text: string;
        confidence: number;
      }>;
      words: Array<{
        text: string;
        confidence: number;
      }>;
    };
  }
}

declare module 'tesseract.js' {
  export function createWorker(language?: string): Promise<Tesseract.Worker>;
} 