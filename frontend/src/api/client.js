/**
 * Ainek API Client
 * Thin fetch wrapper for communicating with the FastAPI backend.
 */

const BASE_URL = 'http://localhost:8000';

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

// ── Camera ──
export const getCaptureStatus = () => request('/api/capture/status');
export const startCapture = () => request('/api/capture/start', { method: 'POST' });
export const stopCapture = () => request('/api/capture/stop', { method: 'POST' });
export const getFrameUrl = () => `${BASE_URL}/api/capture/frame`;

// ── Inventory ──
export const getInventory = (category) => {
  const params = category ? `?category=${category}` : '';
  return request(`/api/inventory${params}`);
};
export const getInventoryItem = (id) => request(`/api/inventory/${id}`);
export const searchInventory = (query) => request(`/api/inventory/search/?q=${encodeURIComponent(query)}`);

// ── Try-On ──
export const tryOn = (frameBase64, clothingId) =>
  request('/api/tryon', {
    method: 'POST',
    body: JSON.stringify({
      frame_base64: frameBase64,
      clothing_id: clothingId,
    }),
  });
