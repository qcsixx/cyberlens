'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import Webcam from 'react-webcam';
import { CameraIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

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
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [isMirror, setIsMirror] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);

    useEffect(() => {
      // Mendapatkan daftar perangkat kamera
      const getDevices = async () => {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          setDevices(videoDevices);
          
          if (videoDevices.length > 0) {
            setSelectedDeviceId(videoDevices[0].deviceId);
          }
        } catch (error) {
          console.error('Error accessing media devices:', error);
          setCameraError('Tidak dapat mengakses perangkat kamera');
        }
      };

      getDevices();
    }, []);

    const handleUserMedia = () => {
      setIsCameraReady(true);
      setCameraError(null);
    };

    const handleUserMediaError = (error: string | DOMException) => {
      console.error('Error accessing webcam:', error);
      setCameraError('Tidak dapat mengakses kamera. Pastikan Anda telah memberikan izin.');
      setIsCameraReady(false);
    };

    const captureImage = () => {
      if (webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if (imageSrc) {
          onCapture(imageSrc);
        } else {
          console.error('Failed to capture image');
        }
      } else {
        console.error('Webcam reference not available');
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
        setTimeout(() => setIsCameraReady(true), 300);
      }
    };

    const videoConstraints = {
      width: 1280,
      height: 720,
      deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
    };

    return (
      <div className="rounded-lg overflow-hidden bg-slate-800 border border-slate-700">
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center">
          <div className="flex items-center space-x-2">
            <CameraIcon className="h-6 w-6 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">Camera Preview</h2>
          </div>
        </div>
        
        <div className="camera-container relative">
          {cameraError ? (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="text-red-400 text-center p-4">
                <p className="mb-2">{cameraError}</p>
                <button 
                  onClick={refreshCamera}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md text-white"
                >
                  Coba Lagi
                </button>
              </div>
            </div>
          ) : isCameraReady ? (
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
              onUserMedia={handleUserMedia}
              onUserMediaError={handleUserMediaError}
              mirrored={isMirror}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-800">
              <div className="text-slate-400">Memuat kamera...</div>
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
            {devices.length > 1 && (
              <select 
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="bg-slate-700 text-white text-sm rounded-md px-3 py-2 border-none outline-none focus:ring-2 focus:ring-blue-500"
              >
                {devices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${devices.indexOf(device) + 1}`}
                  </option>
                ))}
              </select>
            )}
            
            <button 
              onClick={() => setIsMirror(!isMirror)} 
              className="text-sm text-white bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-md"
            >
              {isMirror ? 'Mirror: ON' : 'Mirror: OFF'}
            </button>
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