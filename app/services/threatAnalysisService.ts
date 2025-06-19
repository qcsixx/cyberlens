import { AnalysisResult, ThreatLevel } from '../components/ThreatAnalysis';
import { analyzeTextWithDeepSeek } from './deepseekService';

// Kata kunci yang dapat menunjukkan potensi ancaman
const THREAT_KEYWORDS = {
  high: [
    'password', 'kata sandi', 'kredit', 'kartu kredit', 'rekening', 'bank', 'transfer', 
    'dana', 'uang', 'bayar', 'kirim', 'verifikasi', 'akun', 'login', 'masuk', 'klik', 
    'tautan', 'link', 'mendesak', 'segera', 'darurat', 'batas waktu', 'deadline', 
    'hadiah', 'menang', 'undian', 'lotere', 'bitcoin', 'crypto', 'wallet'
  ],
  medium: [
    'promo', 'diskon', 'gratis', 'free', 'bonus', 'penawaran', 'terbatas', 'limited', 
    'kesempatan', 'opportunity', 'investasi', 'keuntungan', 'profit', 'penghasilan', 
    'income', 'jutaan', 'milyaran', 'ratusan', 'ribuan'
  ]
};

// Pola teks yang mencurigakan
const SUSPICIOUS_PATTERNS = [
  /\b(password|kata\s*sandi|pin)\b.{0,30}\b(kirim|berikan|masukkan)\b/i,
  /\b(bank|rekening|kartu\s*kredit).{0,50}\b(verifikasi|konfirmasi)\b/i,
  /\b(menang|hadiah|undian).{0,50}\b(klaim|ambil|dapatkan)\b/i,
  /\b(bayar|transfer).{0,30}\b(sekarang|segera|hari\s*ini)\b/i,
  /\b(klik|buka).{0,20}\b(link|tautan|url)\b/i
];

// Simulasi analisis ancaman menggunakan AI
export async function analyzeText(text: string): Promise<AnalysisResult> {
  try {
    // Simulasi waktu pemrosesan
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!text || text.trim().length === 0) {
      return {
        text: '',
        threatLevel: 'safe',
        confidence: 95,
        recommendations: [
          'Tetap berhati-hati dengan konten online',
          'Selalu verifikasi pengirim atau sumber informasi'
        ],
        timestamp: new Date().toISOString()
      };
    }
    
    // Gunakan DeepSeek API untuk analisis
    const deepseekResult = await analyzeTextWithDeepSeek(text);
    
    return {
      text,
      threatLevel: deepseekResult.threatLevel as ThreatLevel,
      confidence: deepseekResult.confidence,
      threatType: deepseekResult.threatType,
      recommendations: deepseekResult.recommendations,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in threat analysis:', error);
    
    // Fallback jika terjadi error
    return {
      text,
      threatLevel: 'safe',
      confidence: 70,
      threatType: 'tidak dapat dianalisis',
      recommendations: [
        'Sistem tidak dapat menganalisis teks dengan baik',
        'Tetap berhati-hati dengan konten online',
        'Selalu verifikasi pengirim atau sumber informasi'
      ],
      timestamp: new Date().toISOString()
    };
  }
} 