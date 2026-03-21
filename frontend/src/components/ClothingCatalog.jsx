import { useState, useEffect, useMemo } from 'react';
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

export default function ClothingCatalog({ selectedGarment, onSelectGarment }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

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
          // Use empty array on error — component shows empty state
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

  return (
    <div className="clothing-catalog">
      <div className="catalog-header">
        <div className="catalog-title">
          Catalog
          <span className="catalog-count">
            {loading ? '...' : `${filteredItems.length} items`}
          </span>
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
