'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, ArrowPathIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface CameraPreviewProps {
  onCapture: (imageSrc: string) => void;
  isScanning: boolean;
}

interface CameraPreviewRef {
  captureImage: () => void;
}

const CameraPreview = forwardRef<CameraPreviewRef, CameraPreviewProps>(
  function CameraPreview({ onCapture, isScanning }, ref) {
    const webcamRef = useRef<Webcam>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isInitializing, setIsInitializing] = useState(true);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [isMirror, setIsMirror] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [retryCount, setRetryCount] = useState(0);

    // Mengukur dimensi container untuk memastikan kamera proporsional
    useEffect(() => {
      if (!containerRef.current) return;
      
      const updateDimensions = () => {
        if (containerRef.current) {
          const { width, height } = containerRef.current.getBoundingClientRect();
          setContainerDimensions({ width, height });
        }
      };
      
      updateDimensions();
      
      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
      
      return () => {
        if (containerRef.current) {
          resizeObserver.unobserve(containerRef.current);
        }
        resizeObserver.disconnect();
      };
    }, []);

    // Inisialisasi kamera dan permintaan izin
    useEffect(() => {
      let mounted = true;
      let timeoutId: NodeJS.Timeout | null = null;

      const initializeCamera = async () => {
        setIsInitializing(true);
        
        try {
          // Cek apakah browser mendukung getUserMedia
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Browser Anda tidak mendukung akses kamera. Gunakan browser modern seperti Chrome, Firefox, atau Edge.');
          }

          // Minta izin kamera terlebih dahulu dengan timeout
          const permissionPromise = navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: "user" 
            } 
          });
          
          // Set timeout untuk permintaan izin
          const timeoutPromise = new Promise<MediaStream>((_, reject) => {
            timeoutId = setTimeout(() => {
              reject(new Error('Timeout requesting camera permission'));
            }, 10000); // 10 detik timeout
          });
          
          // Race antara permintaan izin dan timeout
          await Promise.race([permissionPromise, timeoutPromise]);
          
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          
          // Dapatkan daftar perangkat kamera
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (mounted) {
            if (videoDevices.length === 0) {
              throw new Error('Tidak ada kamera yang terdeteksi pada perangkat Anda.');
            }
            
            // Pilih kamera belakang secara default jika tersedia
            const backCamera = videoDevices.find(device => 
              device.label.toLowerCase().includes('back') || 
              device.label.toLowerCase().includes('belakang')
            );
            
            setDevices(videoDevices);
            setSelectedDeviceId(backCamera?.deviceId || videoDevices[0].deviceId);
            setPermissionDenied(false);
            setRetryCount(0);
          }
        } catch (error) {
          console.error('Error initializing camera:', error);
          
          if (mounted) {
            if (error instanceof DOMException && error.name === 'NotAllowedError') {
              setPermissionDenied(true);
              setCameraError('Izin kamera ditolak. Silakan berikan izin kamera melalui pengaturan browser Anda.');
            } else if (error instanceof DOMException && error.name === 'NotReadableError') {
              setCameraError('Kamera tidak dapat diakses. Mungkin sedang digunakan oleh aplikasi lain.');
              
              // Retry automatically after a delay
              if (retryCount < 3) {
                const newRetryCount = retryCount + 1;
                setRetryCount(newRetryCount);
                
                setTimeout(() => {
                  if (mounted) {
                    console.log(`Auto-retrying camera initialization (attempt ${newRetryCount})...`);
                    initializeCamera();
                  }
                }, 2000);
              }
            } else {
              setCameraError(`Gagal mengakses kamera: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
            }
          }
        } finally {
          if (mounted) {
            setIsInitializing(false);
          }
        }
      };

      initializeCamera();

      return () => {
        mounted = false;
        if (timeoutId) clearTimeout(timeoutId);
        
        // Hentikan stream kamera saat komponen unmount
        if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.srcObject) {
          const stream = webcamRef.current.video.srcObject as MediaStream;
          stream.getTracks().forEach(track => track.stop());
        }
      };
    }, [retryCount]);

    const handleUserMedia = () => {
      console.log("Kamera berhasil diinisialisasi");
      setIsCameraReady(true);
      setCameraError(null);
    };

    const handleUserMediaError = (error: string | DOMException) => {
      console.error('Error accessing webcam:', error);
      
      let errorMessage = 'Tidak dapat mengakses kamera.';
      
      if (error instanceof DOMException) {
        if (error.name === 'NotAllowedError') {
          setPermissionDenied(true);
          errorMessage = 'Izin kamera ditolak. Silakan berikan izin kamera melalui pengaturan browser Anda.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'Tidak ada kamera yang terdeteksi pada perangkat Anda.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Kamera Anda mungkin sedang digunakan oleh aplikasi lain.';
          
          // Auto retry for NotReadableError
          if (retryCount < 3) {
            const newRetryCount = retryCount + 1;
            setRetryCount(newRetryCount);
            
            setTimeout(() => {
              console.log(`Auto-retrying after NotReadableError (attempt ${newRetryCount})...`);
              refreshCamera();
            }, 2000);
          }
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      setCameraError(errorMessage);
      setIsCameraReady(false);
    };

    const captureImage = () => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          console.log("Image captured successfully");
          onCapture(imageSrc);
        } else {
          console.error('Failed to capture image');
          setCameraError('Gagal mengambil gambar. Silakan coba lagi.');
        }
      } else {
        console.error('Webcam not ready for capture');
        setCameraError('Kamera belum siap. Silakan tunggu sebentar dan coba lagi.');
      }
    };

    // Ekspos fungsi captureImage ke parent component
    useImperativeHandle(ref, () => ({
      captureImage
    }));

    const refreshCamera = () => {
      if (webcamRef.current) {
        const track = webcamRef.current.video?.srcObject as MediaStream;
        if (track) {
          track.getTracks().forEach(t => t.stop());
        }
        setIsCameraReady(false);
        setCameraError(null);
        setPermissionDenied(false);
        
        // Re-initialize camera
        setIsInitializing(true);
        setTimeout(() => {
          setIsInitializing(false);
        }, 500);
      }
    };

    const requestCameraPermission = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        setPermissionDenied(false);
        setCameraError(null);
        refreshCamera();
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          setCameraError('Izin kamera masih ditolak. Silakan ubah pengaturan izin di browser Anda.');
        } else {
          setCameraError(`Gagal mengakses kamera: ${error instanceof Error ? error.message : 'Error tidak diketahui'}`);
        }
      }
    };

    // Hitung aspek rasio yang optimal berdasarkan dimensi container
    const getVideoConstraints = () => {
      // Default constraints
      const constraints = {
        width: { ideal: 1280, min: 640 },
        height: { ideal: 720, min: 480 },
        facingMode: "user"
      };
      
      // Tambahkan deviceId jika ada
      if (selectedDeviceId) {
        return {
          ...constraints,
          deviceId: { exact: selectedDeviceId }
        };
      }
      
      return constraints;
    };

    return (
      <div className="rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center">
          <div className="flex items-center space-x-2">
            <CameraIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Camera Preview</h2>
          </div>
        </div>
        
        <div 
          ref={containerRef}
          className="camera-container relative w-full"
          style={{ height: "400px" }}
        >
          {permissionDenied ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-6">
              <ShieldExclamationIcon className="h-16 w-16 text-red-500 mb-4" />
              <p className="text-red-400 text-center mb-4">
                Izin kamera ditolak. Anda perlu memberikan izin kamera untuk menggunakan fitur ini.
              </p>
              <div className="flex flex-col space-y-4">
                <button 
                  onClick={requestCameraPermission}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white"
                >
                  Minta Izin Kamera
                </button>
                <a 
                  href="https://support.google.com/chrome/answer/2693767?hl=id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline text-center text-sm"
                >
                  Cara mengaktifkan izin kamera di browser
                </a>
              </div>
            </div>
          ) : cameraError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 p-6">
              <div className="text-red-400 text-center p-4">
                <p className="mb-4">{cameraError}</p>
                <button 
                  onClick={refreshCamera}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : isInitializing ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <div className="text-slate-400">Memuat kamera...</div>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden bg-black">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={getVideoConstraints()}
                onUserMedia={handleUserMedia}
                onUserMediaError={handleUserMediaError}
                mirrored={isMirror}
                className="w-full h-full object-contain"
                forceScreenshotSourceSize
                imageSmoothing
                screenshotQuality={0.95}
              />
            </div>
          )}
          
          {isScanning && (
            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
              <div className="scanning-animation">
                <div className="text-white font-medium text-xl">Scanning...</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-4 bg-slate-800 border-t border-slate-700 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setIsMirror(!isMirror)} 
              className="text-sm text-white bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md"
              disabled={!isCameraReady}
            >
              {isMirror ? 'Mirror: ON' : 'Mirror: OFF'}
            </button>
            
            {devices.length > 1 && (
              <select 
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded-md px-3 py-2 border-none outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!isCameraReady}
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button 
              onClick={refreshCamera}
              className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 text-white"
              title="Refresh camera"
            >
              <ArrowPathIcon className="h-5 w-5" />
            </button>
            
            <button 
              onClick={captureImage}
              disabled={isScanning || !isCameraReady}
              className="scan-button text-white font-medium px-6 py-2 rounded-full flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CameraIcon className="h-5 w-5" />
              <span>Capture Now</span>
            </button>
          </div>
        </div>
      </div>
    );
  }
);

export default CameraPreview; 