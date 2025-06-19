// Definisikan interface untuk memperluas tipe Navigator
interface NavigatorWithLegacyUserMedia extends Navigator {
  webkitGetUserMedia?: (
    constraints: MediaStreamConstraints,
    onSuccess: (stream: MediaStream) => void,
    onError: (error: Error) => void
  ) => void;
  mozGetUserMedia?: (
    constraints: MediaStreamConstraints,
    onSuccess: (stream: MediaStream) => void,
    onError: (error: Error) => void
  ) => void;
}

// Polyfill untuk browser yang tidak mendukung MediaDevices API
if (typeof window !== 'undefined') {
  // Polyfill untuk navigator.mediaDevices
  if (!navigator.mediaDevices) {
    // Gunakan Object.defineProperty untuk mengatasi properti read-only
    Object.defineProperty(navigator, 'mediaDevices', {
      value: {},
      writable: true,
      configurable: true
    });
  }

  // Polyfill untuk navigator.mediaDevices.getUserMedia
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints: MediaStreamConstraints) {
      // Cast navigator ke tipe yang diperluas
      const nav = navigator as NavigatorWithLegacyUserMedia;
      const getUserMedia = nav.webkitGetUserMedia || nav.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      return new Promise(function(resolve, reject) {
        getUserMedia.call(nav, constraints, resolve, reject);
      });
    };
  }

  // Polyfill untuk enumerateDevices
  if (!navigator.mediaDevices.enumerateDevices) {
    navigator.mediaDevices.enumerateDevices = function() {
      return Promise.resolve([]);
    };
  }
}

export {}; 