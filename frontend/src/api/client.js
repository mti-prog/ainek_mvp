/**
 * Ainek API Client
 * Thin fetch wrapper for communicating with the FastAPI backend.
 */

const BASE_URL = 'http://localhost:8000';
const WS_URL = 'ws://localhost:8000';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: response.statusText }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('Backend not reachable. Is the server running on port 8000?');
    }
    throw err;
  }
}

// ── System ──
export const getHealth = () => request('/health');

// ── Inventory ──
export const getInventory = (category) => {
  const params = category ? `?category=${category}` : '';
  return request(`/api/inventory${params}`);
};
export const getInventoryItem = (id) => request(`/api/inventory/${id}`);
export const searchInventory = (query) => request(`/api/inventory/search/?q=${encodeURIComponent(query)}`);

// ── Try-On ──
export const tryOn = (frameBase64, { clothingId, customGarmentBase64, customGarmentUrl } = {}) =>
  request('/api/tryon', {
    method: 'POST',
    body: JSON.stringify({
      frame_base64: frameBase64,
      ...(clothingId && { clothing_id: clothingId }),
      ...(customGarmentBase64 && { custom_garment_base64: customGarmentBase64 }),
      ...(customGarmentUrl && { custom_garment_url: customGarmentUrl }),
    }),
  });

// ── WebSocket – Stream frames to backend ──
export function createFrameWebSocket() {
  return new WebSocket(`${WS_URL}/ws/frames`);
}
