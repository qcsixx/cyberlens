'use client';

import { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

export type NotificationType = 'success' | 'error';

interface NotificationProps {
  type: NotificationType;
  message: string;
  isVisible: boolean;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export default function Notification({
  type,
  message,
  isVisible,
  onClose,
  autoClose = true,
  duration = 5000
}: NotificationProps) {
  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoClose, duration, onClose]);
  
  if (!isVisible) return null;
  
  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className={`rounded-lg shadow-lg p-4 flex items-start space-x-3 ${
        type === 'success' ? 'bg-green-500/90' : 'bg-red-500/90'
      }`}>
        <div className="flex-shrink-0">
          {type === 'success' ? (
            <CheckCircleIcon className="h-6 w-6 text-white" />
          ) : (
            <XCircleIcon className="h-6 w-6 text-white" />
          )}
        </div>
        
        <div className="flex-1">
          <p className="text-white">{message}</p>
        </div>
        
        <button 
          onClick={onClose}
          className="flex-shrink-0 text-white hover:text-gray-200"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
} 