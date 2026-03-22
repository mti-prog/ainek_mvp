"""
Ainek Pydantic Models
Request/response schemas for the FastAPI endpoints.
"""

from pydantic import BaseModel, Field, model_validator
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
    clothing_id: Optional[UUID] = Field(
        default=None,
        description="UUID of a catalog clothing item to try on"
    )
    custom_garment_base64: Optional[str] = Field(
        default=None,
        description="Base64-encoded custom garment image uploaded by the user"
    )
    custom_garment_url: Optional[str] = Field(
        default=None,
        description="URL of a custom garment image"
    )

    @model_validator(mode="after")
    def check_garment_source(self):
        has_id = self.clothing_id is not None
        has_base64 = self.custom_garment_base64 is not None
        has_url = self.custom_garment_url is not None
        if not (has_id or has_base64 or has_url):
            raise ValueError(
                "Provide at least one garment source: "
                "clothing_id, custom_garment_base64, or custom_garment_url"
            )
        return self


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
