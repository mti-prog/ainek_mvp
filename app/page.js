'use client';

import { useEffect, useRef, useState } from 'react';

const PROCESSING_STEPS = [
  "Analyzing physical contours...",
  "Applying 3D garment mesh...",
  "Running Gemini Fusion model...",
  "Refining textures and lighting..."
];

export default function Home() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  
  const [streamActive, setStreamActive] = useState(false);
  const [garmentBase64, setGarmentBase64] = useState(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [resultImage, setResultImage] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 1280, height: 720, facingMode: "user" } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setStreamActive(true);
      } catch (err) {
        console.error("Camera access failed", err);
        setError("Camera access denied.");
      }
    }
    startCamera();
  }, []);

  // Cycle processing text
  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setStepIndex(prev => (prev + 1) % PROCESSING_STEPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isProcessing]);

  const handleGarmentUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setGarmentBase64(reader.result);
      setResultImage(null);
    };
    reader.readAsDataURL(file);
  };

  const captureFrameAndSend = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !garmentBase64) return;

    // We want 3:4 aspect ratio (e.g. 768x1024)
    const TARGET_RATIO = 768 / 1024;
    const vW = video.videoWidth;
    const vH = video.videoHeight;
    const vRatio = vW / vH;

    let sx = 0, sy = 0, sw = vW, sh = vH;
    
    // Center crop
    if (vRatio > TARGET_RATIO) {
      sh = vH;
      sw = vH * TARGET_RATIO;
      sx = (vW - sw) / 2;
    } else {
      sw = vW;
      sh = vW / TARGET_RATIO;
      sy = (vH - sh) / 2;
    }

    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    
    // Draw unmirrored frame
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, sw, sh);
    const personBase64 = canvas.toDataURL('image/jpeg', 0.9);

    triggerGeminiTryOn(personBase64, garmentBase64);
  };

  const triggerGeminiTryOn = async (personB64, garmentB64) => {
    setIsProcessing(true);
    setResultImage(null);
    setError(null);
    setStepIndex(0);

    try {
      const resp = await fetch('/api/tryon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person_image: personB64,
          garment_image: garmentB64
        })
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Generation failed.");
      
      setResultImage(data.result_image);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTryOn = () => {
    if (countdown > 0 || isProcessing) return;
    setResultImage(null);
    setCountdown(3);
    
    let timer = 3;
    const interval = setInterval(() => {
      timer -= 1;
      setCountdown(timer);
      if (timer === 0) {
        clearInterval(interval);
        captureFrameAndSend();
      }
    }, 1000);
  };

  return (
    <>
      <header>
        <div className="logo">AINEK</div>
        <div className="subtitle">NEXT-GEN AI VIRTUAL TRY-ON</div>
      </header>
      
      <main>
        <section className="mirror-section">
          <div className="video-container">
            <video ref={videoRef} autoPlay playsInline muted />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
            
            {resultImage && (
              <div 
                className="tryon-result" 
                style={{ backgroundImage: `url(${resultImage})` }} 
              />
            )}
            
            {countdown > 0 && (
              <div className="countdown-overlay">{countdown}</div>
            )}
            
            {isProcessing && (
              <div className="loading-overlay">
                <div className="spinner"></div>
                <div className="loading-text">{PROCESSING_STEPS[stepIndex]}</div>
              </div>
            )}
          </div>
          
          <div className="controls">
            <button 
              onClick={handleTryOn} 
              disabled={!streamActive || !garmentBase64 || isProcessing || countdown > 0}
            >
              {isProcessing ? 'GENERATING...' : resultImage ? 'TRY ANOTHER' : 'TRY ON NOW'}
            </button>
            {error && <div style={{ color: 'red', marginLeft: '1rem', alignSelf: 'center' }}>Error: {error}</div>}
          </div>
        </section>
        
        <aside className="sidebar">
          <div className="panel">
            <h3>Custom Garment</h3>
            <label className="upload-box">
              <input type="file" accept="image/*" onChange={handleGarmentUpload} />
              <p>📸 Click to upload your clothing</p>
              <small style={{ color: 'var(--text-muted)' }}>JPG/PNG up to 5MB</small>
            </label>
            
            {garmentBase64 && (
              <img src={garmentBase64} alt="Garment preview" className="garment-preview" />
            )}
          </div>
        </aside>
      </main>
    </>
  );
}
