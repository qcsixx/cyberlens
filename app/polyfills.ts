// Polyfill untuk browser yang tidak mendukung MediaDevices API
if (typeof window !== 'undefined') {
  // Polyfill untuk navigator.mediaDevices
  if (!navigator.mediaDevices) {
    navigator.mediaDevices = {} as MediaDevices;
  }

  // Polyfill untuk navigator.mediaDevices.getUserMedia
  if (!navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia = function(constraints) {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented in this browser'));
      }

      return new Promise(function(resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
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