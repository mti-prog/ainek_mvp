// CameraHandler.ts — utility functions for webcam and canvas operations

export interface CameraConstraints {
  width?: number;
  height?: number;
  facingMode?: "user" | "environment";
}

/**
 * Start webcam stream and attach to a video element
 */
export async function startCamera(
  videoElement: HTMLVideoElement,
  constraints: CameraConstraints = {}
): Promise<MediaStream> {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      width: { ideal: constraints.width || 1280 },
      height: { ideal: constraints.height || 720 },
      facingMode: constraints.facingMode || "user",
    },
    audio: false,
  });

  videoElement.srcObject = stream;
  videoElement.setAttribute("playsinline", "true");
  await videoElement.play();

  return stream;
}

/**
 * Stop all tracks in a media stream
 */
export function stopCamera(stream: MediaStream | null): void {
  if (!stream) return;
  stream.getTracks().forEach((track) => track.stop());
}

/**
 * Capture a single frame from a video element as a base64 JPEG
 */
export function captureFrame(
  videoElement: HTMLVideoElement,
  quality = 0.92
): string {
  const canvas = document.createElement("canvas");
  canvas.width = videoElement.videoWidth || 1280;
  canvas.height = videoElement.videoHeight || 720;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");

  // Mirror horizontally (selfie-mode)
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Send captured frame + clothing info to Gemini API
 */
export async function tryOnOutfit(
  imageBase64: string,
  clothingName: string,
  clothingImageUrl: string
): Promise<{ generatedImage: string | null; text: string | null }> {
  const response = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageBase64, clothingName, clothingImageUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to generate try-on");
  }

  return response.json();
}

/**
 * Check if the browser supports getUserMedia
 */
export function isCameraSupported(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}
