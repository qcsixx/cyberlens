'use client';

import { useState, useEffect, useRef } from 'react';
import CameraPreview from './components/CameraPreview';
import ThreatAnalysis, { AnalysisResult } from './components/ThreatAnalysis';
import HistoryPanel from './components/HistoryPanel';
import Header from './components/Header';
import Footer from './components/Footer';
import Notification, { NotificationType } from './components/Notification';
import { recognizeText, terminateOCR } from './services/ocrService';
import { analyzeText } from './services/threatAnalysisService';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const [showHistory, setShowHistory] = useState(true);
  const cameraRef = useRef<{ captureImage: () => void } | null>(null);
  
  // Notifikasi
  const [notification, setNotification] = useState({
    type: 'success' as NotificationType,
    message: '',
    isVisible: false
  });

  // Load history from localStorage on component mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('cyberlens_history');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
    
    // Cleanup OCR worker when component unmounts
    return () => {
      terminateOCR();
    };
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('cyberlens_history', JSON.stringify(history));
    } catch (error) {
      console.error('Error saving history:', error);
    }
  }, [history]);

  const showNotification = (type: NotificationType, message: string) => {
    setNotification({
      type,
      message,
      isVisible: true
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  const handleCapture = async (imageSrc: string) => {
    try {
      setIsScanning(true);
      setIsAnalyzing(true);
      
      // Extract text using OCR
      const extractedText = await recognizeText(imageSrc);
      
      if (!extractedText || extractedText.trim().length === 0) {
        showNotification('error', 'Tidak ada teks yang terdeteksi dalam gambar. Coba ambil gambar yang lebih jelas.');
        setIsScanning(false);
        setIsAnalyzing(false);
        return;
      }
      
      // Analyze the extracted text
      const result = await analyzeText(extractedText);
      
      // Update state with the analysis result
      setAnalysisResult(result);
      
      // Add to history
      setHistory(prev => [result, ...prev]);
      
      showNotification('success', 'Analisis teks berhasil dilakukan');
      
    } catch (error) {
      console.error('Error processing image:', error);
      showNotification('error', error instanceof Error ? error.message : 'Terjadi kesalahan saat memproses gambar');
    } finally {
      setIsScanning(false);
      setIsAnalyzing(false);
    }
  };

  const handleStartScanning = () => {
    if (cameraRef.current) {
      cameraRef.current.captureImage();
    } else {
      showNotification('error', 'Kamera belum siap. Mohon tunggu sebentar atau refresh halaman.');
    }
  };

  const handleSelectHistory = (result: AnalysisResult) => {
    setAnalysisResult(result);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem('cyberlens_history');
    showNotification('success', 'Riwayat berhasil dihapus');
  };

  const handleToggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900">
      <Header 
        onToggleHistory={handleToggleHistory} 
        onStartScanning={handleStartScanning}
      />
      
      <main className="flex-grow p-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CameraPreview 
                onCapture={handleCapture} 
                isScanning={isScanning} 
                ref={cameraRef}
              />
            </div>
            
            <div>
              <ThreatAnalysis analysisResult={analysisResult} isAnalyzing={isAnalyzing} />
            </div>
            
            {showHistory && (
              <div className="lg:col-span-3">
                <HistoryPanel 
                  history={history} 
                  onSelectHistory={handleSelectHistory} 
                  onClearHistory={handleClearHistory} 
                />
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
      
      <Notification 
        type={notification.type}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />
    </div>
  );
}
