"""
Ainek Configuration
Central configuration constants and environment variable loading.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# --- Paths ---
BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = BASE_DIR / "weights"

# --- DS-VTON Resolution Constants ---
LO_RES = (384, 512)     # Width x Height for Stage 1 (structural alignment)
HI_RES = (768, 1024)    # Width x Height for Stage 2 (blend-refine diffusion)

# --- Camera Settings ---
CAMERA_INDEX = int(os.getenv("CAMERA_INDEX", "0"))
CAMERA_FPS = int(os.getenv("CAMERA_FPS", "30"))

# --- WebSocket ---
WS_FRAME_RATE = int(os.getenv("WS_FRAME_RATE", "5"))  # Expected FPS from browser

# --- Supabase ---
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# --- Server ---
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")

# --- Model ---
SD_MODEL_ID = os.getenv("SD_MODEL_ID", "runwayml/stable-diffusion-v1-5")
USE_GPU = os.getenv("USE_GPU", "true").lower() == "true"
