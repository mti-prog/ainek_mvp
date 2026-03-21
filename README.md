# 🪞 Ainek — AI Smart Mirror for Virtual Try-On

Real-time, privacy-first virtual clothing try-on powered by the DS-VTON (Dual-Scale Virtual Try-On) architecture.

## Architecture

| Layer | Technology |
|-------|-----------|
| **AI Engine** | DS-VTON (Stable Diffusion 1.5 backbone, Dual U-Net, mask-free) |
| **Backend** | Python 3.10+, FastAPI, PyTorch, OpenCV |
| **Frontend** | React 18, Vite |
| **Inventory** | Supabase (mock ERP) |

### DS-VTON Pipeline

```
Person Frame ──┐
               ├──▶ Stage 1: Low-Res U-Net (384×512) ──▶ Structural Alignment
Garment Image ─┘                                              │
                                                              ▼
                                              Stage 2: High-Res U-Net (768×1024)
                                                   Blend-Refine Diffusion
                                                              │
                                                              ▼
                                                      Try-On Result
```

> ⚠️ **Privacy:** All video capture and AI inference runs locally. No cloud APIs are used for image processing.

## Quick Start

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Model Weights

Place your Stable Diffusion 1.5 weights in `backend/weights/`:
- `v1-5-pruned.safetensors` (or equivalent)

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check & GPU status |
| GET | `/api/inventory` | List all clothing items |
| GET | `/api/inventory/{id}` | Get clothing item details |
| POST | `/api/tryon` | Submit frame + garment for try-on |
| POST | `/api/capture/start` | Start webcam capture |
| POST | `/api/capture/stop` | Stop webcam capture |
| GET | `/api/capture/status` | Webcam capture status |

## License

Proprietary — Ainek © 2026
