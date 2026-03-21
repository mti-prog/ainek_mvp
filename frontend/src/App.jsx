import { useState, useEffect, useCallback } from 'react';
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

export default function App() {
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState(DEFAULT_STATUS);
  const [selectedGarment, setSelectedGarment] = useState(null);
  const [tryOnResult, setTryOnResult] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  // Handle garment selection → trigger try-on
  const handleSelectGarment = useCallback(
    async (garment) => {
      setSelectedGarment(garment);
      setTryOnResult(null);

      // In a real flow, we'd capture a frame from the webcam and send it
      // For the MVP placeholder, we just show the selection
      // When the pipeline is active, this would call the try-on endpoint
      if (status.model_loaded) {
        setIsProcessing(true);
        try {
          // Placeholder: a real implementation would capture the current
          // webcam frame and send it for try-on
          // const result = await tryOn(frameBase64, garment.id);
          // setTryOnResult(result.result_image_base64);
        } catch (err) {
          console.error('Try-on failed:', err);
        } finally {
          setIsProcessing(false);
        }
      }
    },
    [status.model_loaded]
  );

  const handleClearGarment = useCallback(() => {
    setSelectedGarment(null);
    setTryOnResult(null);
  }, []);

  return (
    <div className="app">
      <Header connected={connected} />
      <main className="app-main">
        <MirrorView
          selectedGarment={selectedGarment}
          onClearGarment={handleClearGarment}
          tryOnResult={tryOnResult}
          isProcessing={isProcessing}
        />
        <ClothingCatalog
          selectedGarment={selectedGarment}
          onSelectGarment={handleSelectGarment}
        />
      </main>
      <StatusBar status={status} />
    </div>
  );
}
