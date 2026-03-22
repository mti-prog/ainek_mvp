// Mock skeleton for 1С API integration
// In production, replace with real 1С REST API endpoints

export interface StockItem {
  sku: string;
  name: string;
  available: boolean;
  quantity: number;
  sizes: string[];
  lastUpdated: string;
}

export interface StockCheckResult {
  sku: string;
  inStock: boolean;
  availableSizes: string[];
  quantity: number;
  error?: string;
}

// TODO: Replace with actual 1С API endpoint
const ODIN_S_API_BASE_URL = process.env.ODIN_S_API_URL || "http://your-1c-server/api";
const ODIN_S_API_KEY = process.env.ODIN_S_API_KEY || "";

/**
 * Check stock availability for a clothing item in 1С
 * @param sku - Article number / SKU of the product
 * @returns Stock availability information
 */
export async function checkStock(sku: string): Promise<StockCheckResult> {
  // MOCK: In production, call real 1С API
  // Simulating network delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  // Mock response — replace with:
  // const response = await fetch(`${ODIN_S_API_BASE_URL}/stock/${sku}`, {
  //   headers: { Authorization: `Bearer ${ODIN_S_API_KEY}` }
  // });
  // const data = await response.json();

  const mockData: Record<string, StockCheckResult> = {
    "TRENCH-001": { sku: "TRENCH-001", inStock: true, availableSizes: ["XS", "S", "M", "L"], quantity: 12 },
    "DRESS-001": { sku: "DRESS-001", inStock: true, availableSizes: ["S", "M"], quantity: 3 },
    "DENIM-001": { sku: "DENIM-001", inStock: false, availableSizes: [], quantity: 0 },
    "SWEATER-001": { sku: "SWEATER-001", inStock: true, availableSizes: ["M", "L", "XL"], quantity: 7 },
    "SKIRT-001": { sku: "SKIRT-001", inStock: true, availableSizes: ["XS", "S", "M", "L", "XL"], quantity: 15 },
  };

  return mockData[sku] || {
    sku,
    inStock: Math.random() > 0.3,
    availableSizes: ["S", "M", "L"],
    quantity: Math.floor(Math.random() * 20),
  };
}

/**
 * Get full product catalog from 1С
 * @param category - Category filter
 * @returns List of products with stock info
 */
export async function getCatalog(category?: string): Promise<StockItem[]> {
  // TODO: Replace with real 1С catalog endpoint
  // const response = await fetch(`${ODIN_S_API_BASE_URL}/catalog?category=${category}`, {
  //   headers: { Authorization: `Bearer ${ODIN_S_API_KEY}` }
  // });
  // return response.json();

  console.log(`[1С Mock] Fetching catalog for category: ${category || "all"}`);
  return [];
}

/**
 * Reserve item for customer (pre-purchase hold)
 * @param sku - Product SKU
 * @param size - Selected size
 * @param customerId - Customer identifier
 */
export async function reserveItem(sku: string, size: string, customerId: string): Promise<boolean> {
  // TODO: Implement with real 1С API
  // POST ${ODIN_S_API_BASE_URL}/reserve
  console.log(`[1С Mock] Reserving ${sku} size ${size} for customer ${customerId}`);
  return true;
}
