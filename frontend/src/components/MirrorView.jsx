import { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createFrameWebSocket } from '../api/client';
import './MirrorView.css';

const FRAME_SEND_INTERVAL_MS = 200; // ~5 FPS to backend

// DS-VTON pipeline target aspect ratio (3:4 portrait)
const PIPELINE_WIDTH = 768;
const PIPELINE_HEIGHT = 1024;
const TARGET_RATIO = PIPELINE_WIDTH / PIPELINE_HEIGHT; // 0.75

const MirrorView = forwardRef(function MirrorView(
  { selectedGarment, onClearGarment, tryOnResult, isProcessing, countdown },
  ref
) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);

  // ── Once cameraActive flips to true and the <video> mounts, wire the stream ──
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraActive]);

  /**
   * Center-crop the video frame to a 3:4 portrait aspect ratio.
   * Returns { sx, sy, sw, sh } — the source rectangle to draw from the video.
   */
  function getCenterCrop3x4(videoWidth, videoHeight) {
    const videoRatio = videoWidth / videoHeight;

    let sx, sy, sw, sh;

    if (videoRatio > TARGET_RATIO) {
      // Video is wider than 3:4 → crop left/right
      sh = videoHeight;
      sw = videoHeight * TARGET_RATIO;
      sx = (videoWidth - sw) / 2;
      sy = 0;
    } else {
      // Video is taller than 3:4 → crop top/bottom
      sw = videoWidth;
      sh = videoWidth / TARGET_RATIO;
      sx = 0;
      sy = (videoHeight - sh) / 2;
    }

    return { sx, sy, sw, sh };
  }

  // Expose captureFrameBase64() to parent via ref
  useImperativeHandle(ref, () => ({
    captureFrameBase64() {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || !cameraActive) return null;

      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return null;

      // Center-crop to 3:4 and draw at pipeline resolution
      const { sx, sy, sw, sh } = getCenterCrop3x4(vw, vh);
      canvas.width = PIPELINE_WIDTH;
      canvas.height = PIPELINE_HEIGHT;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, PIPELINE_WIDTH, PIPELINE_HEIGHT);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.90);
      return dataUrl.split(',')[1];
    },
  }));

  // ── Send frames to backend via WebSocket ──
  const startFrameStreaming = useCallback(() => {
    const ws = createFrameWebSocket();
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[Ainek] WebSocket connected – streaming frames to backend');

      intervalRef.current = setInterval(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || ws.readyState !== WebSocket.OPEN) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        const base64 = dataUrl.split(',')[1];
        ws.send(base64);
      }, FRAME_SEND_INTERVAL_MS);
    };

    ws.onclose = () => {
      console.log('[Ainek] WebSocket disconnected');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    ws.onerror = (err) => {
      console.warn('[Ainek] WebSocket error:', err);
    };
  }, []);

  const stopFrameStreaming = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // ── Camera Controls ──
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

      streamRef.current = stream;
      setCameraActive(true);
      startFrameStreaming();
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access.'
          : 'Could not access camera. Is a webcam connected?'
      );
    }
  }, [startFrameStreaming]);

  const stopCamera = useCallback(() => {
    stopFrameStreaming();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, [stopFrameStreaming]);

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="mirror-view">
      <div className="mirror-frame">
        {/* Hidden canvas for frame capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {cameraActive ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />

            {/* Countdown overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="mirror-countdown-overlay">
                <div className="mirror-countdown-number">{countdown}</div>
              </div>
            )}

            {/* Flash effect at capture moment */}
            {countdown === 0 && (
              <div className="mirror-flash" />
            )}

            {/* Try-on result overlay */}
            {tryOnResult && (
              <div className="mirror-tryon-overlay">
                <img
                  src={`data:image/jpeg;base64,${tryOnResult}`}
                  alt="Virtual try-on result"
                  style={{ objectFit: 'contain' }}
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
});

export default MirrorView;
