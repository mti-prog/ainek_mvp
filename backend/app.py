"""
Ainek FastAPI Application
Main backend server bridging the UI, local AI model, and inventory database.

Architecture: The browser is the sole owner of the webcam.
Frames are sent from the React frontend via WebSocket for processing.
"""

import logging
import base64
import asyncio
from typing import Optional
from contextlib import asynccontextmanager

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from uuid import UUID

from config import CORS_ORIGINS, HOST, PORT
from pipeline import DSVTONPipeline
from inventory import InventoryService
from models.schemas import (
    ClothingItem,
    TryOnRequest,
    TryOnResponse,
    SystemStatus,
)

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("ainek")

# ── Global Services ──
pipeline = DSVTONPipeline()
inventory = InventoryService()

# ── Latest frame received from browser (thread-safe via asyncio) ──
_latest_frame: Optional[np.ndarray] = None
_browser_camera_active: bool = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown."""
    # Startup
    logger.info("=" * 60)
    logger.info("  🪞 AINEK — AI Smart Mirror Starting...")
    logger.info("  📷 Camera: browser-only mode (no local OpenCV capture)")
    logger.info("=" * 60)

    # Attempt to load model weights
    if pipeline.load_weights():
        logger.info("✓ DS-VTON pipeline ready.")
    else:
        logger.warning("⚠ DS-VTON pipeline running in placeholder mode.")

    yield

    # Shutdown
    logger.info("Ainek server shut down.")


# ── FastAPI App ──
app = FastAPI(
    title="Ainek AI Smart Mirror",
    description="Real-time virtual clothing try-on powered by DS-VTON",
    version="0.2.0",
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
        camera_active=_browser_camera_active,
        lo_res=pipeline.lo_res,
        hi_res=pipeline.hi_res,
    )


# ═══════════════════════════════════════════════════
# WebSocket — Receive Frames from Browser
# ═══════════════════════════════════════════════════

@app.websocket("/ws/frames")
async def websocket_frames(websocket: WebSocket):
    """
    Receive webcam frames from the browser.
    The browser captures the webcam locally via getUserMedia() and streams
    base64-encoded JPEG frames over this WebSocket.
    """
    global _latest_frame, _browser_camera_active

    await websocket.accept()
    _browser_camera_active = True
    logger.info("🔌 Browser camera WebSocket connected.")

    try:
        while True:
            # Receive base64-encoded JPEG frame from the browser
            data = await websocket.receive_text()

            try:
                frame_data = base64.b64decode(data)
                frame_array = np.frombuffer(frame_data, dtype=np.uint8)
                frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
                if frame is not None:
                    _latest_frame = frame
            except Exception as e:
                logger.warning(f"Failed to decode frame: {e}")

    except WebSocketDisconnect:
        logger.info("🔌 Browser camera WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        _browser_camera_active = False
        _latest_frame = None


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

    Accepts a base64-encoded person frame AND one of:
    - clothing_id (catalog item)
    - custom_garment_base64 (user-uploaded image)
    - custom_garment_url (image URL)
    """
    # ── Decode the person frame ──
    try:
        frame_data = base64.b64decode(request.frame_base64)
        frame_array = np.frombuffer(frame_data, dtype=np.uint8)
        person_frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)
        if person_frame is None:
            raise ValueError("Could not decode image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid frame data: {e}")

    # ── Resolve the garment image ──
    garment_image = None

    # Option 1: Custom garment from base64 upload
    if request.custom_garment_base64:
        try:
            g_data = base64.b64decode(request.custom_garment_base64)
            g_array = np.frombuffer(g_data, dtype=np.uint8)
            garment_image = cv2.imdecode(g_array, cv2.IMREAD_COLOR)
            if garment_image is None:
                raise ValueError("Could not decode custom garment image")
            logger.info("Using custom garment image (base64 upload).")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid custom garment image: {e}")

    # Option 2: Custom garment from URL
    elif request.custom_garment_url:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(request.custom_garment_url)
                resp.raise_for_status()
            g_array = np.frombuffer(resp.content, dtype=np.uint8)
            garment_image = cv2.imdecode(g_array, cv2.IMREAD_COLOR)
            if garment_image is None:
                raise ValueError("Could not decode image from URL")
            logger.info(f"Using custom garment image from URL: {request.custom_garment_url}")
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to fetch garment from URL: {e}")

    # Option 3: Catalog item by ID
    elif request.clothing_id:
        item = await inventory.get_item_by_id(request.clothing_id)
        if item is None:
            raise HTTPException(
                status_code=404,
                detail=f"Clothing item {request.clothing_id} not found.",
            )
        # Placeholder: in production, load the actual garment image from storage
        garment_image = np.zeros((512, 384, 3), dtype=np.uint8)
        logger.info(f"Using catalog item: {item.name}")

    if garment_image is None:
        raise HTTPException(status_code=400, detail="No valid garment source provided.")

    # ── Run the DS-VTON pipeline ──
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
