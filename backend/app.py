"""
Ainek FastAPI Application
Main backend server bridging the UI, local AI model, and inventory database.
"""

import logging
import base64
from typing import Optional
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from uuid import UUID

from config import CORS_ORIGINS, HOST, PORT
from capture import CameraCapture
from pipeline import DSVTONPipeline
from inventory import InventoryService
from models.schemas import (
    ClothingItem,
    TryOnRequest,
    TryOnResponse,
    SystemStatus,
    CaptureStatus,
)

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ainek")

# ── Global Services ──
camera = CameraCapture()
pipeline = DSVTONPipeline()
inventory = InventoryService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    # Startup
    logger.info("=" * 60)
    logger.info("  🪞 AINEK — AI Smart Mirror Starting...")
    logger.info("=" * 60)

    # Attempt to load model weights
    if pipeline.load_weights():
        logger.info("✓ DS-VTON pipeline ready.")
    else:
        logger.warning("⚠ DS-VTON pipeline running in placeholder mode.")

    yield

    # Shutdown
    camera.stop()
    logger.info("Ainek server shut down.")


# ── FastAPI App ──
app = FastAPI(
    title="Ainek AI Smart Mirror",
    description="Real-time virtual clothing try-on powered by DS-VTON",
    version="0.1.0",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════
# Health & Status
# ═══════════════════════════════════════════════════

@app.get("/health", response_model=SystemStatus, tags=["System"])
async def health_check():
    """Health check endpoint with system status."""
    gpu_info = DSVTONPipeline.get_gpu_info()
    return SystemStatus(
        gpu_available=gpu_info["available"],
        gpu_name=gpu_info.get("name"),
        model_loaded=pipeline.model_loaded,
        camera_active=camera.is_active,
        lo_res=pipeline.lo_res,
        hi_res=pipeline.hi_res,
    )


# ═══════════════════════════════════════════════════
# Camera Capture
# ═══════════════════════════════════════════════════

@app.get("/api/capture/status", response_model=CaptureStatus, tags=["Camera"])
async def capture_status():
    """Get current webcam capture status."""
    return CaptureStatus(
        active=camera.is_active,
        camera_index=camera.camera_index,
        fps=camera.fps,
        frame_width=camera.frame_width,
        frame_height=camera.frame_height,
    )


@app.post("/api/capture/start", response_model=CaptureStatus, tags=["Camera"])
async def capture_start():
    """Start the webcam capture."""
    success = camera.start()
    if not success:
        raise HTTPException(
            status_code=500,
            detail="Failed to start camera. Check that a webcam is connected.",
        )
    return CaptureStatus(
        active=camera.is_active,
        camera_index=camera.camera_index,
        fps=camera.fps,
        frame_width=camera.frame_width,
        frame_height=camera.frame_height,
    )


@app.post("/api/capture/stop", response_model=CaptureStatus, tags=["Camera"])
async def capture_stop():
    """Stop the webcam capture."""
    camera.stop()
    return CaptureStatus(
        active=False,
        camera_index=camera.camera_index,
        fps=camera.fps,
    )


@app.get("/api/capture/frame", tags=["Camera"])
async def capture_frame():
    """Get the latest webcam frame as JPEG image."""
    if not camera.is_active:
        raise HTTPException(status_code=400, detail="Camera is not active. Start it first.")

    frame_bytes = camera.get_frame_bytes()
    if frame_bytes is None:
        raise HTTPException(status_code=500, detail="No frame available.")

    return StreamingResponse(
        iter([frame_bytes]),
        media_type="image/jpeg",
        headers={"Cache-Control": "no-cache"},
    )


# ═══════════════════════════════════════════════════
# Inventory
# ═══════════════════════════════════════════════════

@app.get("/api/inventory", response_model=list[ClothingItem], tags=["Inventory"])
async def get_inventory(
    category: Optional[str] = Query(None, description="Filter by category"),
):
    """Fetch all clothing items from the inventory."""
    return await inventory.get_all_items(category=category)


@app.get("/api/inventory/{item_id}", response_model=ClothingItem, tags=["Inventory"])
async def get_inventory_item(item_id: UUID):
    """Fetch a single clothing item by ID."""
    item = await inventory.get_item_by_id(item_id)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Item {item_id} not found.")
    return item


@app.get("/api/inventory/search/", response_model=list[ClothingItem], tags=["Inventory"])
async def search_inventory(
    q: str = Query(..., min_length=1, description="Search query"),
):
    """Search clothing items by name."""
    return await inventory.search_items(q)


# ═══════════════════════════════════════════════════
# Try-On
# ═══════════════════════════════════════════════════

@app.post("/api/tryon", response_model=TryOnResponse, tags=["Try-On"])
async def try_on(request: TryOnRequest):
    """
    Virtual try-on: combine a webcam frame with a garment image.

    Accepts a base64-encoded frame from the webcam and a clothing
    item ID. Returns the try-on result as a base64-encoded image.
    """
    # Decode the person frame
    try:
        frame_data = base64.b64decode(request.frame_base64)
        frame_array = np.frombuffer(frame_data, dtype=np.uint8)
        person_frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
        if person_frame is None:
            raise ValueError("Could not decode image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid frame data: {e}")

    # Get the garment image
    item = await inventory.get_item_by_id(request.clothing_id)
    if item is None:
        raise HTTPException(
            status_code=404,
            detail=f"Clothing item {request.clothing_id} not found.",
        )

    # For now, create a placeholder garment image
    # In production, this would load the actual garment image from storage
    garment_image = np.zeros((512, 384, 3), dtype=np.uint8)

    # Run the DS-VTON pipeline
    result_image, processing_time = pipeline.infer(person_frame, garment_image)

    # Encode result to base64
    success, buffer = cv2.imencode(".jpg", result_image, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if not success:
        raise HTTPException(status_code=500, detail="Failed to encode result image.")

    result_base64 = base64.b64encode(buffer).decode("utf-8")

    return TryOnResponse(
        result_image_base64=result_base64,
        processing_time_ms=round(processing_time, 2),
        pipeline_active=pipeline.model_loaded,
    )


# ═══════════════════════════════════════════════════
# Run Server
# ═══════════════════════════════════════════════════

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host=HOST, port=PORT, reload=True)
