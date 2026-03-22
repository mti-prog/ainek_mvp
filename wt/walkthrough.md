# Webcam Feed Fix — Walkthrough

## Root Cause

The webcam wasn't visible because of a **dual-capture architecture conflict**: the backend (`capture.py` via OpenCV) and the browser (`MirrorView.jsx` via `getUserMedia()`) both tried to lock the same webcam hardware. On Windows, only one process can hold the camera — whichever starts first blocks the other.

## Changes Made

### Backend

| File | Change |
|------|--------|
| [config.py](file:///c:/Users/cpu/Desktop/ainek_mvp/backend/config.py) | Added `WS_FRAME_RATE` constant |
| [app.py](file:///c:/Users/cpu/Desktop/ainek_mvp/backend/app.py) | Removed all OpenCV camera endpoints. Added WebSocket `/ws/frames` to receive frames from browser. Camera status now tracks WS connection state |

render_diffs(file:///c:/Users/cpu/Desktop/ainek_mvp/backend/app.py)

### Frontend

| File | Change |
|------|--------|
| [MirrorView.jsx](file:///c:/Users/cpu/Desktop/ainek_mvp/frontend/src/components/MirrorView.jsx) | Added `forwardRef` + `useImperativeHandle` to expose `captureFrameBase64()`. Added hidden `<canvas>` for frame capture. Added WebSocket streaming to backend at ~5 FPS |
| [App.jsx](file:///c:/Users/cpu/Desktop/ainek_mvp/frontend/src/App.jsx) | Wired try-on flow: captures frame via `mirrorRef.captureFrameBase64()` and sends to `/api/tryon` when garment selected |
| [client.js](file:///c:/Users/cpu/Desktop/ainek_mvp/frontend/src/api/client.js) | Removed backend camera-control APIs. Added `createFrameWebSocket()` helper |

render_diffs(file:///c:/Users/cpu/Desktop/ainek_mvp/frontend/src/components/MirrorView.jsx)

## Verification

### Browser Test Results

````carousel
![Backend connected, catalog loaded, zero JS errors](C:/Users/cpu/.gemini/antigravity/brain/032724be-ee2a-48eb-a23c-fa1117076b14/ainek_initial_state_1774166210799.png)
<!-- slide -->
![Catalog filter and garment selection working](C:/Users/cpu/.gemini/antigravity/brain/032724be-ee2a-48eb-a23c-fa1117076b14/ainek_final_test_state_1774166339156.png)
````

| Check | Result |
|-------|--------|
| Frontend compiles | ✅ No errors |
| Backend connected | ✅ "CONNECTED" in header |
| Catalog loads | ✅ 10 items visible |
| Camera `getUserMedia()` path | ✅ Code executes (blocked by sandbox — no hardware) |
| OpenCV conflict removed | ✅ Backend no longer imports `CameraCapture` |
| WebSocket endpoint exists | ✅ `/ws/frames` registered in backend |

> [!NOTE]
> The camera can't be tested in the automated browser sandbox (no webcam hardware). **You need to test "Start Camera" on your own machine** — the camera should now work without the OpenCV conflict blocking it.

## Your Next Step

1. The backend should already be running (`uvicorn` with `--reload` picked up the changes).
2. Open **http://localhost:5173** in your browser.
3. Click **"▶ Start Camera"** — you should now see your webcam feed.
4. Select a garment from the catalog to trigger the try-on pipeline.
