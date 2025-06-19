// DeepSeek API Service
import { DEEPSEEK_API_KEY, DEEPSEEK_API_URL, DEFAULT_VALUES } from '../config';

interface DeepSeekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

interface AnalysisRequest {
  text: string;
}

interface AnalysisResult {
  threatLevel: 'safe' | 'medium' | 'high';
  confidence: number;
  threatType?: string;
  recommendations: string[];
  analysis: string;
}

export async function analyzeTextWithDeepSeek(text: string): Promise<AnalysisResult> {
  try {
    console.log('Analyzing text with DeepSeek API...');
    
    if (!text || text.trim().length === 0) {
      throw new Error('Tidak ada teks untuk dianalisis');
    }
    
    // Prepare the prompt for DeepSeek
    const prompt = `
      Analisis teks berikut untuk mendeteksi potensi ancaman keamanan seperti phishing, penipuan, atau konten berbahaya lainnya.
      
      Teks:
      """
      ${text}
      """
      
      Berikan respon dalam format JSON dengan struktur berikut:
      {
        "threatLevel": "safe|medium|high",
        "confidence": <nilai antara 0-100>,
        "threatType": "<jenis ancaman jika terdeteksi>",
        "recommendations": ["rekomendasi 1", "rekomendasi 2", ...],
        "analysis": "<analisis singkat tentang teks>"
      }
      
      Jangan sertakan penjelasan atau teks lain selain JSON.
    `;
    
    // Fallback to local analysis if API call fails
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('DeepSeek API error:', errorData);
        throw new Error(`DeepSeek API error: ${response.status}`);
      }
      
      const data: DeepSeekResponse = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Tidak ada respon dari DeepSeek API');
      }
      
      // Parse the JSON response
      try {
        const result = JSON.parse(content);
        return {
          threatLevel: result.threatLevel,
          confidence: result.confidence,
          threatType: result.threatType,
          recommendations: result.recommendations,
          analysis: result.analysis
        };
      } catch (parseError) {
        console.error('Error parsing DeepSeek response:', parseError);
        throw new Error('Format respon DeepSeek tidak valid');
      }
    } catch (apiError) {
      console.error('Error calling DeepSeek API, falling back to local analysis:', apiError);
      return analyzeTextLocally(text);
    }
  } catch (error) {
    console.error('Error in DeepSeek analysis:', error);
    return analyzeTextLocally(text);
  }
}

// Fallback local analysis
function analyzeTextLocally(text: string): AnalysisResult {
  console.log('Using local analysis fallback');
  
  // Kata kunci yang dapat menunjukkan potensi ancaman
  const HIGH_RISK_KEYWORDS = [
    'password', 'kata sandi', 'kredit', 'kartu kredit', 'rekening', 'bank', 'transfer', 
    'dana', 'uang', 'bayar', 'kirim', 'verifikasi', 'akun', 'login', 'masuk', 'klik', 
    'tautan', 'link', 'mendesak', 'segera', 'darurat', 'batas waktu', 'deadline', 
    'hadiah', 'menang', 'undian', 'lotere', 'bitcoin', 'crypto', 'wallet'
  ];
  
  const MEDIUM_RISK_KEYWORDS = [
    'promo', 'diskon', 'gratis', 'free', 'bonus', 'penawaran', 'terbatas', 'limited', 
    'kesempatan', 'opportunity', 'investasi', 'keuntungan', 'profit', 'penghasilan', 
    'income', 'jutaan', 'milyaran', 'ratusan', 'ribuan'
  ];
  
  // Pola teks yang mencurigakan
  const SUSPICIOUS_PATTERNS = [
    /\b(password|kata\s*sandi|pin)\b.{0,30}\b(kirim|berikan|masukkan)\b/i,
    /\b(bank|rekening|kartu\s*kredit).{0,50}\b(verifikasi|konfirmasi)\b/i,
    /\b(menang|hadiah|undian).{0,50}\b(klaim|ambil|dapatkan)\b/i,
    /\b(bayar|transfer).{0,30}\b(sekarang|segera|hari\s*ini)\b/i,
    /\b(klik|buka).{0,20}\b(link|tautan|url)\b/i
  ];
  
  // Menghitung skor ancaman
  let threatScore = 0;
  let matchedKeywords: string[] = [];
  let detectedPatterns = 0;
  
  // Periksa kata kunci berisiko tinggi
  HIGH_RISK_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(text)) {
      threatScore += 15;
      matchedKeywords.push(keyword);
    }
  });
  
  // Periksa kata kunci berisiko sedang
  MEDIUM_RISK_KEYWORDS.forEach(keyword => {
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
  let threatLevel: 'safe' | 'medium' | 'high' = 'safe';
  let confidence = 75;
  let threatType = '';
  let recommendations: string[] = [];
  let analysis = '';
  
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
      analysis = 'Teks ini berisi permintaan informasi keuangan yang mencurigakan dan mungkin merupakan upaya phishing.';
    } else if (text.match(/\b(hadiah|menang|undian|lotere)\b/i)) {
      threatType = 'penipuan hadiah';
      recommendations = [
        'Abaikan pesan ini - hadiah yang sah tidak meminta biaya di muka',
        'Jangan transfer uang atau memberikan informasi pribadi',
        'Laporkan ke platform tempat Anda menerima pesan ini'
      ];
      analysis = 'Teks ini berisi penawaran hadiah yang mencurigakan dan kemungkinan besar merupakan penipuan.';
    } else {
      threatType = 'penipuan umum';
      recommendations = [
        'Hindari berinteraksi dengan konten ini',
        'Jangan membuka tautan atau lampiran apa pun',
        'Blokir pengirim dan laporkan ke platform terkait'
      ];
      analysis = 'Teks ini menunjukkan beberapa indikator penipuan dan sebaiknya dihindari.';
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
    analysis = 'Teks ini menunjukkan beberapa indikator yang mencurigakan dan perlu diperiksa lebih lanjut.';
  } else {
    recommendations = DEFAULT_VALUES.safeRecommendations;
    analysis = 'Teks ini tidak menunjukkan indikator ancaman yang signifikan.';
  }
  
  return {
    threatLevel,
    confidence: Math.round(confidence),
    threatType,
    recommendations,
    analysis
  };
} 