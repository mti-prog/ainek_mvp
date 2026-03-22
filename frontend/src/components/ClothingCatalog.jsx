import { useState, useEffect, useMemo, useRef } from 'react';
import ClothingCard from './ClothingCard';
import { getInventory } from '../api/client';
import './ClothingCatalog.css';

const CATEGORIES = [
  { key: null, label: 'All' },
  { key: 'tops', label: 'Tops' },
  { key: 'bottoms', label: 'Bottoms' },
  { key: 'dresses', label: 'Dresses' },
  { key: 'outerwear', label: 'Outerwear' },
];

function SkeletonCard() {
  return (
    <div className="catalog-skeleton">
      <div className="catalog-skeleton-image" />
      <div className="catalog-skeleton-text">
        <div className="catalog-skeleton-line" />
        <div className="catalog-skeleton-line short" />
      </div>
    </div>
  );
}

export default function ClothingCatalog({ selectedGarment, onSelectGarment, onCustomGarment }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Custom garment state
  const [imageUrl, setImageUrl] = useState('');
  const [customPreview, setCustomPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Fetch inventory
  useEffect(() => {
    let cancelled = false;
    async function fetchItems() {
      setLoading(true);
      setError(null);
      try {
        const data = await getInventory(activeCategory);
        if (!cancelled) setItems(data);
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchItems();
    return () => { cancelled = true; };
  }, [activeCategory]);

  // Filter by search
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.color.toLowerCase().includes(q)
    );
  }, [items, searchQuery]);

  // ── Custom garment handlers ──
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(',')[1];
      setCustomPreview(dataUrl);
      onCustomGarment?.({ type: 'base64', data: base64, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    const url = imageUrl.trim();
    if (!url) return;
    setCustomPreview(url);
    onCustomGarment?.({ type: 'url', data: url, name: 'Custom (URL)' });
  };

  const clearCustom = () => {
    setCustomPreview(null);
    setImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="clothing-catalog">
      <div className="catalog-header">
        <div className="catalog-title">
          Catalog
          <span className="catalog-count">
            {loading ? '...' : `${filteredItems.length} items`}
          </span>
        </div>

        {/* ── Custom Garment Upload Section ── */}
        <div className="custom-garment-section">
          <div className="custom-garment-label">✨ Custom Garment</div>

          {customPreview ? (
            <div className="custom-garment-preview">
              <img
                src={customPreview}
                alt="Custom garment"
                className="custom-garment-thumb"
                onError={() => setCustomPreview(null)}
              />
              <div className="custom-garment-preview-info">
                <span className="custom-garment-active">Selected</span>
                <button className="custom-garment-clear" onClick={clearCustom}>
                  ✕ Clear
                </button>
              </div>
            </div>
          ) : (
            <div className="custom-garment-inputs">
              {/* File Upload */}
              <label className="custom-garment-upload-btn">
                📁 Upload Image
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>

              {/* URL Input */}
              <div className="custom-garment-url-row">
                <input
                  className="custom-garment-url-input"
                  type="text"
                  placeholder="Paste image URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                />
                <button
                  className="custom-garment-url-apply"
                  onClick={handleUrlSubmit}
                  disabled={!imageUrl.trim()}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="catalog-search">
          <span className="catalog-search-icon">🔍</span>
          <input
            className="catalog-search-input"
            type="text"
            placeholder="Search garments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Tabs */}
        <div className="catalog-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key || 'all'}
              className={`catalog-tab ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="catalog-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : error ? (
          <div className="catalog-empty">
            <div className="catalog-empty-icon">⚠️</div>
            <div className="catalog-empty-text">{error}</div>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="catalog-empty">
            <div className="catalog-empty-icon">🔍</div>
            <div className="catalog-empty-text">
              No items found{searchQuery ? ` for "${searchQuery}"` : ''}.
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <ClothingCard
              key={item.id}
              item={item}
              selected={selectedGarment?.id === item.id}
              onSelect={onSelectGarment}
            />
          ))
        )}
      </div>
    </div>
  );
}
