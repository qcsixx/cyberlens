import { AnalysisResult, ThreatLevel } from '../components/ThreatAnalysis';

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
  // Simulasi waktu pemrosesan
  await new Promise(resolve => setTimeout(resolve, 1500));
  
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
  
  // Menghitung skor ancaman berdasarkan kata kunci dan pola
  let threatScore = 0;
  let matchedKeywords: string[] = [];
  let detectedPatterns = 0;
  
  // Periksa kata kunci berisiko tinggi
  THREAT_KEYWORDS.high.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      threatScore += 15;
      matchedKeywords.push(keyword);
    }
  });
  
  // Periksa kata kunci berisiko sedang
  THREAT_KEYWORDS.medium.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      threatScore += 5;
      matchedKeywords.push(keyword);
    }
  });
  
  // Periksa pola mencurigakan
  SUSPICIOUS_PATTERNS.forEach(pattern => {
    if (pattern.test(text)) {
      threatScore += 20;
      detectedPatterns++;
    }
  });
  
  // Tentukan level ancaman berdasarkan skor
  let threatLevel: ThreatLevel = 'safe';
  let confidence = 95;
  let threatType = '';
  let recommendations: string[] = [];
  
  if (threatScore >= 50) {
    threatLevel = 'high';
    confidence = Math.min(95, 75 + threatScore / 5);
    
    if (text.match(/\b(bank|rekening|kartu\s*kredit)\b/i)) {
      threatType = 'phishing keuangan';
      recommendations = [
        'Jangan memberikan informasi keuangan atau pribadi',
        'Verifikasi langsung dengan pihak resmi melalui saluran yang terpercaya',
        'Laporkan pesan ini ke pihak berwenang'
      ];
    } else if (text.match(/\b(hadiah|menang|undian|lotere)\b/i)) {
      threatType = 'penipuan hadiah';
      recommendations = [
        'Abaikan pesan ini - hadiah yang sah tidak meminta biaya di muka',
        'Jangan transfer uang atau memberikan informasi pribadi',
        'Laporkan ke platform tempat Anda menerima pesan ini'
      ];
    } else {
      threatType = 'penipuan umum';
      recommendations = [
        'Hindari berinteraksi dengan konten ini',
        'Jangan membuka tautan atau lampiran apa pun',
        'Blokir pengirim dan laporkan ke platform terkait'
      ];
    }
  } else if (threatScore >= 20) {
    threatLevel = 'medium';
    confidence = Math.min(90, 60 + threatScore / 3);
    threatType = 'potensi penipuan';
    recommendations = [
      'Berhati-hatilah dengan konten ini',
      'Verifikasi keaslian informasi dari sumber resmi',
      'Jangan memberikan informasi pribadi atau keuangan'
    ];
  } else {
    recommendations = [
      'Tetap berhati-hati dengan konten online',
      'Selalu verifikasi pengirim atau sumber informasi'
    ];
  }
  
  return {
    text,
    threatLevel,
    confidence: Math.round(confidence),
    threatType,
    recommendations,
    timestamp: new Date().toISOString()
  };
} 