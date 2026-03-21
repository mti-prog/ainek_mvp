import './ClothingCard.css';

const CATEGORY_EMOJIS = {
  tops: '👕',
  bottoms: '👖',
  dresses: '👗',
  outerwear: '🧥',
  accessories: '🎒',
};

export default function ClothingCard({ item, selected, onSelect }) {
  const emoji = CATEGORY_EMOJIS[item.category] || '👔';

  return (
    <div
      className={`clothing-card ${selected ? 'selected' : ''} ${!item.in_stock ? 'out-of-stock' : ''}`}
      onClick={() => item.in_stock && onSelect(item)}
      style={{ animationDelay: `${Math.random() * 0.2}s` }}
    >
      <div className="clothing-card-image">
        {item.image_url && !item.image_url.startsWith('/placeholder') ? (
          <img src={item.image_url} alt={item.name} loading="lazy" />
        ) : (
          <span>{emoji}</span>
        )}
      </div>
      <div className="clothing-card-info">
        <div className="clothing-card-name" title={item.name}>
          {item.name}
        </div>
        <div className="clothing-card-meta">
          <span className="clothing-card-price">${item.price.toFixed(2)}</span>
          <span className="clothing-card-size">{item.size}</span>
        </div>
      </div>
      <button
        className="clothing-card-try-btn"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(item);
        }}
        title="Try on"
      >
        👁
      </button>
    </div>
  );
}
