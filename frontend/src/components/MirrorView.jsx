import { useState, useRef, useEffect, useCallback } from 'react';
import './MirrorView.css';

export default function MirrorView({ selectedGarment, onClearGarment, tryOnResult, isProcessing }) {
  const videoRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Could not access camera. Is a webcam connected?'
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="mirror-view">
      <div className="mirror-frame">
        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              className="mirror-video"
              autoPlay
              playsInline
              muted
            />

            {/* Try-on result overlay */}
            {tryOnResult && (
              <div className="mirror-tryon-overlay">
                <img
                  src={`data:image/jpeg;base64,${tryOnResult}`}
                  alt="Virtual try-on result"
                />
              </div>
            )}

            {/* Selected garment indicator */}
            {selectedGarment && (
              <div className="mirror-selected-garment">
                <span>👗 {selectedGarment.name}</span>
                <button className="close-btn" onClick={onClearGarment}>✕</button>
              </div>
            )}

            {/* Processing spinner */}
            {isProcessing && (
              <div className="mirror-processing">
                <div className="mirror-processing-pill">
                  <div className="mirror-processing-spinner" />
                  Processing DS-VTON...
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="mirror-placeholder">
            <div className="mirror-placeholder-icon">🪞</div>
            <div className="mirror-placeholder-title">Smart Mirror</div>
            <div className="mirror-placeholder-text">
              {cameraError || 'Start the camera to see your reflection and try on clothes virtually.'}
            </div>
            <button className="mirror-start-btn" onClick={startCamera}>
              ▶ Start Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
