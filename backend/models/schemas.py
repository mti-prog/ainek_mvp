"""
Ainek Pydantic Models
Request/response schemas for the FastAPI endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class ClothingItem(BaseModel):
    """Represents a clothing item from the inventory."""
    id: UUID
    name: str
    category: str
    size: str
    color: str
    price: float
    image_url: Optional[str] = None
    sku: str
    in_stock: bool = True
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class TryOnRequest(BaseModel):
    """Request body for the try-on endpoint."""
    frame_base64: str = Field(
        ...,
        description="Base64-encoded webcam frame (JPEG or PNG)"
    )
    clothing_id: UUID = Field(
        ...,
        description="UUID of the clothing item to try on"
    )


class TryOnResponse(BaseModel):
    """Response from the try-on endpoint."""
    result_image_base64: str = Field(
        ...,
        description="Base64-encoded result image with virtual try-on applied"
    )
    processing_time_ms: float = Field(
        ...,
        description="Inference time in milliseconds"
    )
    pipeline_active: bool = Field(
        default=False,
        description="Whether the DS-VTON pipeline was used (vs placeholder)"
    )


class SystemStatus(BaseModel):
    """System health and status information."""
    gpu_available: bool
    gpu_name: Optional[str] = None
    model_loaded: bool
    camera_active: bool
    lo_res: tuple = (384, 512)
    hi_res: tuple = (768, 1024)


class CaptureStatus(BaseModel):
    """Webcam capture status."""
    active: bool
    camera_index: int
    fps: int
    frame_width: Optional[int] = None
    frame_height: Optional[int] = None
