"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Camera, CameraOff, Zap, RefreshCw, ShoppingBag, X, AlertCircle } from "lucide-react";
import { startCamera, stopCamera, captureFrame, tryOnOutfit } from "@/lib/CameraHandler";
import Sidebar from "./Sidebar";

export interface UserProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  price?: string;
  addedAt: number;
}

type FittingState = "idle" | "countdown" | "capturing" | "processing" | "result" | "error";

export default function MirrorView() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<UserProduct | null>(null);
  const [fittingState, setFittingState] = useState<FittingState>("idle");
  const [countdown, setCountdown] = useState(5);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [resultVisible, setResultVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    initCamera();
    return () => {
      stopCamera(streamRef.current);
      if (countdownRef.current) clearTimeout(countdownRef.current);
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

  const handleSelectProduct = useCallback(async (product: UserProduct) => {
    if (!videoRef.current || !cameraActive) return;

    setSelectedProduct(product);
    setGeneratedImage(null);
    setResultVisible(false);
    setErrorMessage(null);
    setFittingState("countdown");
    setCountdown(5);

    let current = 5;
    const tick = () => {
      current -= 1;
      if (current > 0) {
        setCountdown(current);
        countdownRef.current = setTimeout(tick, 1000);
      } else {
        setFittingState("capturing");
        setTimeout(async () => {
          try {
            const snapshot = captureFrame(videoRef.current!);
            setFittingState("processing");
            const result = await tryOnOutfit(snapshot, product.name, product.imageUrl);
            if (result.generatedImage) {
              setGeneratedImage(result.generatedImage);
              setFittingState("result");
              setTimeout(() => setResultVisible(true), 50);
            } else {
              throw new Error("Изображение не было сгенерировано");
            }
          } catch (err) {
            setFittingState("error");
            setErrorMessage(err instanceof Error ? err.message : "Ошибка генерации");
          }
        }, 200);
      }
    };
    countdownRef.current = setTimeout(tick, 1000);
  }, [cameraActive]);

  const handleReset = () => {
    if (countdownRef.current) clearTimeout(countdownRef.current);
    setResultVisible(false);
    setTimeout(() => {
      setGeneratedImage(null);
      setFittingState("idle");
      setSelectedProduct(null);
      setErrorMessage(null);
      setCountdown(5);
    }, 400);
  };

  const isProcessing = fittingState === "capturing" || fittingState === "processing";
  const isCountdown = fittingState === "countdown";

  return (
    <div className="relative w-full h-screen overflow-hidden" style={{ background: "#06060f" }}>

      {/* AMBIENT GLOW */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #8b5cf6 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 rounded-full opacity-8"
          style={{ background: "radial-gradient(circle, #3b82f6 0%, transparent 70%)", filter: "blur(60px)" }} />
      </div>

      {/* VIDEO FEED */}
      <video ref={videoRef} autoPlay playsInline muted
        className="absolute inset-0 w-full h-full"
        style={{
          objectFit: "cover",
          transform: "scaleX(-1)",
          filter: cameraActive ? "brightness(0.85) contrast(1.05)" : "none",
        }}
      />

      {/* NO CAMERA */}
      {!cameraActive && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
          <div className="w-32 h-32 rounded-full flex items-center justify-center"
            style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
            <CameraOff size={48} className="text-violet-400/60" />
          </div>
          <div className="text-center">
            <p className="text-white/60 text-lg mb-1">{cameraError || "Инициализация камеры..."}</p>
            {cameraError && (
              <button onClick={initCamera}
                className="mt-3 flex items-center gap-2 mx-auto px-6 py-3 rounded-xl text-white font-medium"
                style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
                <RefreshCw size={16} /> Повторить
              </button>
            )}
          </div>
        </div>
      )}

      {/* GENERATED IMAGE OVERLAY */}
      {generatedImage && (
        <div className="absolute inset-0 transition-opacity duration-700 ease-in-out"
          style={{ opacity: resultVisible ? 1 : 0 }}>
          <Image src={generatedImage} alt="Virtual try-on result" fill
            className="object-cover" sizes="100vw" priority />
          <div className="absolute inset-0"
            style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)" }} />
        </div>
      )}

      {/* COUNTDOWN OVERLAY */}
      {isCountdown && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
          <div className="relative flex items-center justify-center">
            <svg className="absolute" width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none"
                stroke="rgba(139,92,246,0.2)" strokeWidth="4" />
              <circle cx="100" cy="100" r="90" fill="none"
                stroke="#8b5cf6" strokeWidth="4"
                strokeDasharray={`${2 * Math.PI * 90}`}
                strokeDashoffset={`${2 * Math.PI * 90 * (1 - countdown / 5)}`}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{ transition: "stroke-dashoffset 0.8s ease-in-out", filter: "drop-shadow(0 0 8px #8b5cf6)" }}
              />
            </svg>
            <span className="text-white font-bold"
              style={{ fontSize: "96px", lineHeight: 1, fontFamily: "'Playfair Display', serif",
                textShadow: "0 0 40px rgba(139,92,246,0.8)" }}>
              {countdown}
            </span>
          </div>
          <div className="text-center">
            <p className="text-white text-2xl font-medium mb-2">Примите позу!</p>
            {selectedProduct && (
              <p className="text-violet-300/80 text-base">Примерка: {selectedProduct.name}</p>
            )}
          </div>
          <button onClick={handleReset}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-white/60 text-sm transition-all hover:text-white"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <X size={16} /> Отмена
          </button>
        </div>
      )}

      {/* PROCESSING OVERLAY */}
      {isProcessing && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="relative w-64 h-64">
            <div className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(139,92,246,0.3) rgba(139,92,246,0.3) #8b5cf6 rgba(139,92,246,0.3)" }} />
            <div className="absolute inset-6 rounded-full border animate-spin"
              style={{ borderColor: "rgba(59,130,246,0.3) #3b82f6 rgba(59,130,246,0.3) rgba(59,130,246,0.3)",
                animationDirection: "reverse", animationDuration: "1.5s" }} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Zap size={32} className="text-violet-400 mb-2" style={{ filter: "drop-shadow(0 0 8px #8b5cf6)" }} />
              <p className="text-white text-xs tracking-widest uppercase">AI Примерка</p>
            </div>
            <div className="absolute left-0 right-0 h-0.5 animate-scan"
              style={{ background: "linear-gradient(90deg, transparent, #8b5cf6, transparent)",
                boxShadow: "0 0 12px #8b5cf6" }} />
          </div>
          <div className="text-center">
            <p className="text-white font-medium text-lg">
              {fittingState === "capturing" ? "Захват кадра..." : "Генерация образа..."}
            </p>
            {selectedProduct && <p className="text-violet-300/70 text-sm mt-1">{selectedProduct.name}</p>}
          </div>
        </div>
      )}

      {/* ERROR */}
      {fittingState === "error" && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
          <div className="flex items-center gap-3 px-5 py-4 rounded-2xl max-w-sm"
            style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
              backdropFilter: "blur(12px)" }}>
            <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">{errorMessage || "Ошибка генерации. Попробуйте снова."}</p>
            <button onClick={handleReset} className="text-red-400 hover:text-red-300 ml-2"><X size={16} /></button>
          </div>
        </div>
      )}

      {/* MIRROR FRAME */}
      {cameraActive && (
        <div className="absolute inset-0 pointer-events-none">
          {["top-6 left-6 border-t border-l","top-6 right-6 border-t border-r",
            "bottom-6 left-6 border-b border-l","bottom-6 right-6 border-b border-r"].map((cls, i) => (
            <div key={i} className={`absolute w-10 h-10 ${cls}`}
              style={{ borderColor: "rgba(139,92,246,0.4)" }} />
          ))}
        </div>
      )}

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-5 z-10"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)" }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)" }}>
            <span className="text-white font-bold text-sm"
              style={{ fontFamily: "'Playfair Display', serif" }}>A</span>
          </div>
          <span className="text-white text-xl font-semibold tracking-widest"
            style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.2em" }}>AINEK</span>
        </div>
        {cameraActive && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.08)" }}>
            <Camera size={12} className="text-emerald-400" />
            <span className="text-white/60 text-xs">Камера активна</span>
          </div>
        )}
      </div>

      {/* BOTTOM BAR */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)" }}>
        {fittingState === "result" && (
          <div className="flex items-center gap-3">
            <button onClick={handleReset}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-white/80 text-sm font-medium touch-manipulation"
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <RefreshCw size={16} /> Другой образ
            </button>
            <button className="flex items-center gap-2 px-6 py-3 rounded-xl text-white text-sm font-medium touch-manipulation"
              style={{ background: "linear-gradient(135deg, #8b5cf6, #3b82f6)",
                boxShadow: "0 4px 20px rgba(139,92,246,0.4)" }}>
              <ShoppingBag size={16} />
              {selectedProduct?.price ? selectedProduct.price : "Примерить ещё"}
            </button>
          </div>
        )}
        {fittingState === "idle" && (
          <p className="text-white/30 text-sm tracking-wider">Выберите одежду в панели справа →</p>
        )}
        <div />
      </div>

      {/* SIDEBAR */}
      <Sidebar onSelectProduct={handleSelectProduct} selectedProduct={selectedProduct}
        isLoading={isProcessing || isCountdown} />

      <style jsx global>{`
        @keyframes scan {
          0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; }
        }
        .animate-scan { animation: scan 2s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}