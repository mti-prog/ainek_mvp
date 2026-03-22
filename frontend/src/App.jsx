import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header';
import StatusBar from './components/StatusBar';
import MirrorView from './components/MirrorView';
import ClothingCatalog from './components/ClothingCatalog';
import { getHealth, tryOn } from './api/client';
import './App.css';

const DEFAULT_STATUS = {
  gpu_available: false,
  gpu_name: null,
  model_loaded: false,
  camera_active: false,
  lo_res: [384, 512],
  hi_res: [768, 1024],
};

const COUNTDOWN_SECONDS = 3;

export default function App() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(null);

  // Custom garment state
  const [customGarment, setCustomGarment] = useState(null);

  const mirrorRef = useRef(null);
  const countdownRef = useRef(null);

  // Poll backend health
  useEffect(() => {
    let timeout;
    async function checkHealth() {
      try {
        const data = await getHealth();
        setStatus(data);
        setConnected(true);
      } catch {
        setConnected(false);
        setStatus(DEFAULT_STATUS);
      }
      timeout = setTimeout(checkHealth, 5000);
    }
    checkHealth();
    return () => clearTimeout(timeout);
  }, []);

  /**
   * Shared countdown + capture logic.
   * @param {object} garmentPayload — { clothingId?, customGarmentBase64?, customGarmentUrl? }
   */
  const startTryOnCountdown = useCallback((garmentPayload) => {
    // Cancel any in-progress countdown
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }

    setTryOnResult(null);
    setCountdown(COUNTDOWN_SECONDS);

    let remaining = COUNTDOWN_SECONDS;

    countdownRef.current = setInterval(async () => {
      remaining -= 1;
      setCountdown(remaining);

      if (remaining <= 0) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;

        // Brief pause (flash effect) then capture
        await new Promise((r) => setTimeout(r, 150));
        setCountdown(null);

        const frameBase64 = mirrorRef.current?.captureFrameBase64();
        if (!frameBase64) {
          console.warn('No webcam frame available for try-on. Is the camera started?');
          return;
        }

        setIsProcessing(true);
        try {
          const result = await tryOn(frameBase64, garmentPayload);
          setTryOnResult(result.result_image_base64);
        } catch (err) {
          console.error('Try-on failed:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    }, 1000);
  }, []);

  // Handle catalog garment selection → countdown → try-on
  const handleSelectGarment = useCallback(
    (garment) => {
      setSelectedGarment(garment);
      setCustomGarment(null);
      startTryOnCountdown({ clothingId: garment.id });
    },
    [startTryOnCountdown]
  );

  // Handle custom garment → countdown → try-on
  const handleCustomGarment = useCallback(
    (custom) => {
      setCustomGarment(custom);
      setSelectedGarment(null);

      const garmentPayload =
        custom.type === 'base64'
          ? { customGarmentBase64: custom.data }
          : { customGarmentUrl: custom.data };

      startTryOnCountdown(garmentPayload);
    },
    [startTryOnCountdown]
  );

  const handleClearGarment = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setCountdown(null);
    setSelectedGarment(null);
    setCustomGarment(null);
    setTryOnResult(null);
  }, []);

  // Build the garment indicator label
  const activeGarmentForMirror = selectedGarment
    || (customGarment ? { name: customGarment.name || 'Custom Garment' } : null);

  return (
    <div className="app">
      <Header connected={connected} />
      <main className="app-main">
        <MirrorView
          ref={mirrorRef}
          selectedGarment={activeGarmentForMirror}
          onClearGarment={handleClearGarment}
          tryOnResult={tryOnResult}
          isProcessing={isProcessing}
          countdown={countdown}
        />
        <ClothingCatalog
          selectedGarment={selectedGarment}
          onSelectGarment={handleSelectGarment}
          onCustomGarment={handleCustomGarment}
        />
      </main>
      <StatusBar status={status} />
    </div>
  );
}
