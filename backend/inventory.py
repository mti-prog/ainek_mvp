"""
Ainek Inventory Service
Connects to Supabase to manage the clothing inventory (mock ERP).
"""

import logging
from typing import List, Optional
from uuid import UUID

from config import SUPABASE_URL, SUPABASE_KEY

logger = logging.getLogger(__name__)

# Attempt to import Supabase client — graceful fallback
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("Supabase client not installed. Using mock data.")

from models.schemas import ClothingItem


# ── Mock Data (used when Supabase is not configured) ──
MOCK_INVENTORY: List[dict] = [
    {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "name": "Classic White T-Shirt",
        "category": "tops",
        "size": "M",
        "color": "White",
        "price": 29.99,
        "image_url": "/placeholder/white-tshirt.jpg",
        "sku": "TOP-WHT-001",
        "in_stock": True,
    },
    {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "name": "Slim Fit Dark Jeans",
        "category": "bottoms",
        "size": "32",
        "color": "Dark Blue",
        "price": 79.99,
        "image_url": "/placeholder/dark-jeans.jpg",
        "sku": "BOT-DBL-001",
        "in_stock": True,
    },
    {
        "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
        "name": "Floral Summer Dress",
        "category": "dresses",
        "size": "S",
        "color": "Multicolor",
        "price": 89.99,
        "image_url": "/placeholder/floral-dress.jpg",
        "sku": "DRS-FLR-001",
        "in_stock": True,
    },
    {
        "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
        "name": "Leather Bomber Jacket",
        "category": "outerwear",
        "size": "L",
        "color": "Black",
        "price": 199.99,
        "image_url": "/placeholder/bomber-jacket.jpg",
        "sku": "OUT-BLK-001",
        "in_stock": True,
    },
    {
        "id": "e5f6a7b8-c9d0-1234-efab-345678901234",
        "name": "Oversized Hoodie",
        "category": "tops",
        "size": "XL",
        "color": "Gray",
        "price": 59.99,
        "image_url": "/placeholder/gray-hoodie.jpg",
        "sku": "TOP-GRY-002",
        "in_stock": True,
    },
    {
        "id": "f6a7b8c9-d0e1-2345-fabc-456789012345",
        "name": "Pleated Midi Skirt",
        "category": "bottoms",
        "size": "M",
        "color": "Beige",
        "price": 49.99,
        "image_url": "/placeholder/midi-skirt.jpg",
        "sku": "BOT-BGE-002",
        "in_stock": True,
    },
    {
        "id": "a7b8c9d0-e1f2-3456-abcd-567890123456",
        "name": "Denim Trucker Jacket",
        "category": "outerwear",
        "size": "M",
        "color": "Light Blue",
        "price": 129.99,
        "image_url": "/placeholder/denim-jacket.jpg",
        "sku": "OUT-LBL-002",
        "in_stock": True,
    },
    {
        "id": "b8c9d0e1-f2a3-4567-bcde-678901234567",
        "name": "Silk Evening Gown",
        "category": "dresses",
        "size": "S",
        "color": "Red",
        "price": 249.99,
        "image_url": "/placeholder/evening-gown.jpg",
        "sku": "DRS-RED-002",
        "in_stock": True,
    },
    {
        "id": "c9d0e1f2-a3b4-5678-cdef-789012345678",
        "name": "Striped Polo Shirt",
        "category": "tops",
        "size": "L",
        "color": "Navy/White",
        "price": 44.99,
        "image_url": "/placeholder/polo-shirt.jpg",
        "sku": "TOP-NVW-003",
        "in_stock": True,
    },
    {
        "id": "d0e1f2a3-b4c5-6789-defa-890123456789",
        "name": "Wool Overcoat",
        "category": "outerwear",
        "size": "L",
        "color": "Camel",
        "price": 299.99,
        "image_url": "/placeholder/wool-overcoat.jpg",
        "sku": "OUT-CML-003",
        "in_stock": True,
    },
]


class InventoryService:
    """
    Inventory service that connects to Supabase for the clothing catalog.
    Falls back to mock data when Supabase is not configured.
    """

    def __init__(self):
        self._client: Optional["Client"] = None
        self._use_mock = True

        if SUPABASE_AVAILABLE and SUPABASE_URL and SUPABASE_KEY:
            try:
                self._client = create_client(SUPABASE_URL, SUPABASE_KEY)
                self._use_mock = False
                logger.info("Connected to Supabase inventory.")
            except Exception as e:
                logger.warning(f"Failed to connect to Supabase: {e}. Using mock data.")
        else:
            if not SUPABASE_URL or not SUPABASE_KEY:
                logger.info(
                    "Supabase URL/Key not configured. "
                    "Set SUPABASE_URL and SUPABASE_KEY env vars. Using mock data."
                )

    async def get_all_items(self, category: Optional[str] = None) -> List[ClothingItem]:
        """Fetch all clothing items, optionally filtered by category."""
        if self._use_mock:
            items = MOCK_INVENTORY
            if category:
                items = [i for i in items if i["category"] == category]
            return [ClothingItem(**item) for item in items]

        try:
            query = self._client.table("clothing_items").select("*")
            if category:
                query = query.eq("category", category)
            response = query.execute()
            return [ClothingItem(**item) for item in response.data]
        except Exception as e:
            logger.error(f"Failed to fetch inventory: {e}")
            return [ClothingItem(**item) for item in MOCK_INVENTORY]

    async def get_item_by_id(self, item_id: UUID) -> Optional[ClothingItem]:
        """Fetch a single clothing item by its ID."""
        if self._use_mock:
            for item in MOCK_INVENTORY:
                if item["id"] == str(item_id):
                    return ClothingItem(**item)
            return None

        try:
            response = (
                self._client.table("clothing_items")
                .select("*")
                .eq("id", str(item_id))
                .single()
                .execute()
            )
            if response.data:
                return ClothingItem(**response.data)
            return None
        except Exception as e:
            logger.error(f"Failed to fetch item {item_id}: {e}")
            return None

    async def search_items(self, query: str) -> List[ClothingItem]:
        """Search clothing items by name."""
        if self._use_mock:
            query_lower = query.lower()
            return [
                ClothingItem(**item)
                for item in MOCK_INVENTORY
                if query_lower in item["name"].lower()
            ]

        try:
            response = (
                self._client.table("clothing_items")
                .select("*")
                .ilike("name", f"%{query}%")
                .execute()
            )
            return [ClothingItem(**item) for item in response.data]
        except Exception as e:
            logger.error(f"Failed to search inventory: {e}")
            return []
