"""
Ainek Webcam Capture Module
Thread-safe OpenCV webcam capture with background frame grabbing.
All video processing stays local — no frames leave this device.
"""

import cv2
import base64
import threading
import logging
import numpy as np
from typing import Optional

from config import CAMERA_INDEX, CAMERA_FPS

logger = logging.getLogger(__name__)


class CameraCapture:
    """
    Thread-safe webcam capture using OpenCV.
    Runs a background thread to continuously grab frames so the
    main thread always gets the latest frame without blocking.
    """

    def __init__(self, camera_index: int = CAMERA_INDEX, fps: int = CAMERA_FPS):
        self.camera_index = camera_index
        self.fps = fps
        self._capture: Optional[cv2.VideoCapture] = None
        self._frame: Optional[np.ndarray] = None
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

    @property
    def is_active(self) -> bool:
        return self._running and self._capture is not None and self._capture.isOpened()

    @property
    def frame_width(self) -> Optional[int]:
        if self._capture and self._capture.isOpened():
            return int(self._capture.get(cv2.CAP_PROP_FRAME_WIDTH))
        return None

    @property
    def frame_height(self) -> Optional[int]:
        if self._capture and self._capture.isOpened():
            return int(self._capture.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return None

    def start(self) -> bool:
        """Start the webcam capture in a background thread."""
        if self._running:
            logger.warning("Camera capture already running.")
            return True

        self._capture = cv2.VideoCapture(self.camera_index)
        if not self._capture.isOpened():
            logger.error(f"Failed to open camera at index {self.camera_index}")
            self._capture = None
            return False

        # Configure camera
        self._capture.set(cv2.CAP_PROP_FPS, self.fps)
        self._capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize latency

        self._running = True
        self._thread = threading.Thread(target=self._capture_loop, daemon=True)
        self._thread.start()

        logger.info(
            f"Camera started: index={self.camera_index}, "
            f"resolution={self.frame_width}x{self.frame_height}, "
            f"fps={self.fps}"
        )
        return True

    def stop(self):
        """Stop the webcam capture and release resources."""
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)
            self._thread = None
        if self._capture:
            self._capture.release()
            self._capture = None
        self._frame = None
        logger.info("Camera stopped.")

    def _capture_loop(self):
        """Background thread: continuously grab the latest frame."""
        while self._running:
            if self._capture and self._capture.isOpened():
                ret, frame = self._capture.read()
                if ret:
                    with self._lock:
                        self._frame = frame
                else:
                    logger.warning("Failed to read frame from camera.")

    def get_frame(self) -> Optional[np.ndarray]:
        """
        Get the latest captured frame as a BGR NumPy array.
        Returns None if no frame is available.
        """
        with self._lock:
            if self._frame is not None:
                return self._frame.copy()
        return None

    def get_frame_base64(self, quality: int = 85) -> Optional[str]:
        """
        Get the latest frame as a base64-encoded JPEG string.
        Suitable for sending over HTTP or WebSocket.
        """
        frame = self.get_frame()
        if frame is None:
            return None

        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        success, buffer = cv2.imencode(".jpg", frame, encode_params)
        if not success:
            return None

        return base64.b64encode(buffer).decode("utf-8")

    def get_frame_bytes(self, quality: int = 85) -> Optional[bytes]:
        """Get the latest frame as raw JPEG bytes (for streaming)."""
        frame = self.get_frame()
        if frame is None:
            return None

        encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
        success, buffer = cv2.imencode(".jpg", frame, encode_params)
        if not success:
            return None

        return buffer.tobytes()
