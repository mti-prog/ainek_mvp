"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, CameraOff, Zap, RefreshCw, ShoppingBag, X, AlertCircle } from "lucide-react";
import { startCamera, stopCamera, captureFrame, tryOnOutfit } from "@/lib/CameraHandler";
import { Product } from "@/lib/products";
import Sidebar from "./Sidebar";

type FittingState = "idle" | "capturing" | "processing" | "result" | "error";

export default function MirrorView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [fittingState, setFittingState] = useState<FittingState>("idle");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Start camera on mount
  useEffect(() => {
    initCamera();
    return () => {
      stopCamera(streamRef.current);
    };
  }, []);

  const initCamera = async () => {
    if (!videoRef.current) return;
    try {
      setCameraError(null);
      const stream = await startCamera(videoRef.current);
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err) {
      setCameraError("Не удалось получить доступ к камере. Проверьте разрешения.");
      console.error("Camera error:", err);
    }
  };

  const handleSelectProduct = useCallback(async (product: Product) => {
    if (!videoRef.current || !cameraActive) return;

    setSelectedProduct(product);
    setGeneratedImage(null);
    setResultVisible(false);
    setFittingState("capturing");
    setErrorMessage(null);

    try {
      // Step 1: Capture frame
      const snapshot = captureFrame(videoRef.current);

      // Step 2: Send to Gemini
      setFittingState("processing");
      const result = await tryOnOutfit(snapshot, product.name, product.imageUrl);

      if (result.generatedImage) {
        setGeneratedImage(result.generatedImage);
        setFittingState("result");

        // Trigger fade-in after a small delay (DOM needs to render)
        setTimeout(() => setResultVisible(true), 50);
      } else {
        throw new Error("Изображение не было сгенерировано");
      }
    } catch (err) {
      setFittingState("error");
      setErrorMessage(err instanceof Error ? err.message : "Ошибка генерации");
      console.error("Try-on error:", err);
    }
  }, [cameraActive]);

  const handleReset = () => {
    setResultVisible(false);
    setTimeout(() => {
      setGeneratedImage(null);
      setFittingState("idle");
      setSelectedProduct(null);
      setErrorMessage(null);
    }, 400);
  };

  const isProcessing = fittingState === "capturing" || fittingState === "processing";

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "#06060f" }}
    >
      {/* === AMBIENT GLOW BACKGROUND === */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }}
        />
      </div>

      {/* === VIDEO FEED === */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: "cover",
          transform: "scaleX(-1)", // Mirror effect
          filter: cameraActive ? "brightness(0.85) contrast(1.05)" : "none",
        }}
      />

      {/* === NO CAMERA STATE === */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div
            className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
          >
            <CameraOff size={48} className="text-violet-400/60" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-lg mb-1">{cameraError || "Инициализация камеры..."}</p>
            {cameraError && (
              <button
                onClick={initCamera}
                className="mt-3 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-white font-medium transition-all"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
              >
                <RefreshCw size={16} />
                Повторить
              </button>
            )}
          </div>
        </div>
      )}

      {/* === GENERATED IMAGE OVERLAY (Magic Fade-in) === */}
      {generatedImage && (
        <div
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: resultVisible ? 1 : 0 }}
        >
          <Image
            src={generatedImage}
            alt="Virtual try-on result"
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
          {/* Subtle vignette */}
          <div
            className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)" }}
          />
        </div>
      )}

      {/* === PROCESSING OVERLAY === */}
      {isProcessing && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          {/* Scanning animation */}
          <div className="relative w-64 h-64">
            {/* Outer ring */}
            <div
              className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(139,92,246,0.3) rgba(139,92,246,0.3) #8b5cf6 rgba(139,92,246,0.3)" }}
            />
            {/* Inner ring */}
            <div
              className="absolute inset-6 rounded-full border animate-spin"
              style={{
                borderColor: "rgba(59,130,246,0.3) #3b82f6 rgba(59,130,246,0.3) rgba(59,130,246,0.3)",
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            />
            {/* Center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Zap size={32} className="text-violet-400 mb-2" style={{ filter: "drop-shadow(0 0 8px #8b5cf6)" }} />
              <p className="text-white text-xs tracking-widest uppercase">AI Примерка</p>
            </div>

            {/* Scanning line */}
            <div
              className="absolute left-0 right-0 h-0.5 animate-scan"
              style={{
                background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
                boxShadow: "0 0 12px #8b5cf6",
              }}
            />
          </div>

          <div className="text-center">
            <p className="text-white font-medium text-lg">
              {fittingState === "capturing" ? "Захват кадра..." : "Генерация образа..."}
            </p>
            {selectedProduct && (
              <p className="text-violet-300/70 text-sm mt-1">{selectedProduct.name}</p>
            )}
          </div>
        </div>
      )}

      {/* === ERROR STATE === */}
      {fittingState === "error" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl max-w-sm"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.3)",
              backdropFilter: "blur(12px)",
            }}
          >
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{errorMessage || "Ошибка генерации. Попробуйте снова."}</p>
            <button onClick={handleReset} className="text-red-400 hover:text-red-300 ml-2">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* === MIRROR FRAME OVERLAY === */}
      {cameraActive && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Corner accents */}
          {[
            "top-6 left-6 border-t border-l",
            "top-6 right-6 border-t border-r",
            "bottom-6 left-6 border-b border-l",
            "bottom-6 right-6 border-b border-r",
          ].map((cls, i) => (
            <div
              key={i}
              className={`absolute w-10 h-10 ${cls}`}
              style={{ borderColor: "rgba(139,92,246,0.4)" }}
            />
          ))}
        </div>
      )}

      {/* === TOP BAR (Logo) === */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}
          >
            <span className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>A</span>
          </div>
          <span
            className="text-white text-xl font-semibold tracking-widest"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.2em" }}
          >
            AINEK
          </span>
        </div>

        <div className="flex items-center gap-2">
          {cameraActive && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <Camera size={12} className="text-emerald-400" />
              <span className="text-white/60 text-xs">Камера активна</span>
            </div>
          )}
        </div>
      </div>

      {/* === BOTTOM BAR === */}
      <div
        className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}
      >
        {/* Result controls */}
        {fittingState === "result" && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white/80 text-sm font-medium transition-all hover:bg-white/10 touch-manipulation"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <RefreshCw size={16} />
              Другой образ
            </button>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium transition-all touch-manipulation"
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: "0 4px 20px rgba(139,92,246,0.4)",
              }}
            >
              <ShoppingBag size={16} />
              {selectedProduct ? `${selectedProduct.price.toLocaleString()} ${selectedProduct.currency}` : "Купить"}
            </button>
          </div>
        )}

        {fittingState === "idle" && (
          <p className="text-white/30 text-sm tracking-wider">Выберите одежду в панели справа →</p>
        )}

        <div /> {/* Spacer */}
      </div>

      {/* === SIDEBAR === */}
      <Sidebar
        onSelectProduct={handleSelectProduct}
        selectedProduct={selectedProduct}
        isLoading={isProcessing}
      />

      {/* Scanning line keyframe via inline style */}
      <style jsx global>{`
        @keyframes scan {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
