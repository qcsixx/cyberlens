/**
 * Konfigurasi aplikasi CyberLens
 */

// DeepSeek API configuration
export const DEEPSEEK_API_KEY = 'sk-f8bf37ad31384aed9e032e498dfaa42';
export const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Tesseract OCR configuration
export const TESSERACT_CONFIG = {
  // Bahasa yang didukung
  languages: ['eng'],
  
  // Parameter untuk meningkatkan akurasi OCR
  parameters: {
    tessedit_ocr_engine_mode: 1,     // LSTM only (more accurate but slower)
    tessedit_pageseg_mode: 6,        // Assume single uniform block of text
    preserve_interword_spaces: 1,
    tessjs_create_hocr: '0',         // Disable HOCR to improve performance
    tessjs_create_tsv: '0',          // Disable TSV to improve performance
    tessjs_create_box: '0',          // Disable box output to improve performance
    tessjs_create_unlv: '0',         // Disable UNLV output to improve performance
    tessjs_create_osd: '0',          // Disable OSD to improve performance
    tessedit_char_whitelist: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,;:!?@#$%^&*()-_=+[]{}|<>/\\\'"`~ ',
  },
  
  // Timeouts
  timeouts: {
    initialization: 30000, // 30 seconds
    recognition: 15000,    // 15 seconds
  }
};

// Image processing configuration
export const IMAGE_PROCESSING_CONFIG = {
  maxWidth: 1024,
  maxHeight: 768,
  jpegQuality: 0.9,
  contrastThreshold: 120, // 0-255, higher means more black/white contrast
  processingMode: 'binarize', // 'text-enhance', 'binarize', 'adaptive', 'default'
};

// Application configuration
export const APP_CONFIG = {
  historyStorageKey: 'cyberlens_history',
  notificationDuration: 5000, // 5 seconds
  retryAttempts: 2,           // Number of retry attempts for OCR
  retryDelay: 1000,           // Delay between retry attempts in ms
};

// Default values
export const DEFAULT_VALUES = {
  safeRecommendations: [
    'Tetap berhati-hati dengan konten online',
    'Selalu verifikasi pengirim atau sumber informasi'
  ],
}; 