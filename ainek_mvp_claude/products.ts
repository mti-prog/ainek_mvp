export interface Product {
  id: string;
  sku: string;
  name: string;
  brand: string;
  price: number;
  currency: string;
  imageUrl: string;
  category: Category;
  colors: string[];
  tags: string[];
}

export type Category = "trench" | "dress" | "denim" | "sweater" | "skirt";

export interface CategoryMeta {
  id: Category;
  label: string;
  labelRu: string;
  icon: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "trench", label: "Trench", labelRu: "Тренч", icon: "🧥" },
  { id: "dress", label: "Dress", labelRu: "Платье", icon: "👗" },
  { id: "denim", label: "Denim", labelRu: "Деним", icon: "👖" },
  { id: "sweater", label: "Sweater", labelRu: "Свитер", icon: "🧶" },
  { id: "skirt", label: "Skirt", labelRu: "Юбка", icon: "👘" },
];

// Product catalog with Unsplash fashion images
export const PRODUCTS: Product[] = [
  // Trench
  {
    id: "t1", sku: "TRENCH-001", name: "Classic Camel Trench", brand: "Maison Ainek",
    price: 28900, currency: "сом", category: "trench",
    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&q=80",
    colors: ["camel", "beige"], tags: ["classic", "autumn"],
  },
  {
    id: "t2", sku: "TRENCH-002", name: "Black Oversized Trench", brand: "Studio KG",
    price: 31500, currency: "сом", category: "trench",
    imageUrl: "https://images.unsplash.com/photo-1548454782-15b189d129ab?w=400&q=80",
    colors: ["black"], tags: ["oversized", "minimal"],
  },
  {
    id: "t3", sku: "TRENCH-003", name: "Checked Wool Trench", brand: "Bishkek Edit",
    price: 35000, currency: "сом", category: "trench",
    imageUrl: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=400&q=80",
    colors: ["grey", "white"], tags: ["check", "winter"],
  },
  {
    id: "t4", sku: "TRENCH-004", name: "Belted Midi Trench", brand: "Maison Ainek",
    price: 26800, currency: "сом", category: "trench",
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&q=80",
    colors: ["khaki"], tags: ["belted", "midi"],
  },

  // Dress
  {
    id: "d1", sku: "DRESS-001", name: "Slip Satin Midi Dress", brand: "Soft Edition",
    price: 18500, currency: "сом", category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80",
    colors: ["champagne", "silver"], tags: ["satin", "evening"],
  },
  {
    id: "d2", sku: "DRESS-002", name: "Linen Wrap Dress", brand: "Natural KG",
    price: 14200, currency: "сом", category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400&q=80",
    colors: ["sand", "terracotta"], tags: ["linen", "summer"],
  },
  {
    id: "d3", sku: "DRESS-003", name: "Little Black Dress", brand: "Studio KG",
    price: 16800, currency: "сом", category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1520263115673-610416f52ab6?w=400&q=80",
    colors: ["black"], tags: ["classic", "LBD"],
  },
  {
    id: "d4", sku: "DRESS-004", name: "Floral Maxi Dress", brand: "Bishkek Edit",
    price: 22000, currency: "сом", category: "dress",
    imageUrl: "https://images.unsplash.com/photo-1496217590455-aa63a8350eea?w=400&q=80",
    colors: ["multicolor"], tags: ["floral", "maxi"],
  },

  // Denim
  {
    id: "dn1", sku: "DENIM-001", name: "Wide Leg Jeans", brand: "Raw Denim Co",
    price: 12500, currency: "сом", category: "denim",
    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&q=80",
    colors: ["light blue", "indigo"], tags: ["wide leg", "Y2K"],
  },
  {
    id: "dn2", sku: "DENIM-002", name: "Denim Jacket", brand: "Raw Denim Co",
    price: 15800, currency: "сом", category: "denim",
    imageUrl: "https://images.unsplash.com/photo-1551537482-f2075a1d41f2?w=400&q=80",
    colors: ["medium wash"], tags: ["jacket", "casual"],
  },
  {
    id: "dn3", sku: "DENIM-003", name: "Straight Cut Jeans", brand: "Bishkek Edit",
    price: 11200, currency: "сом", category: "denim",
    imageUrl: "https://images.unsplash.com/photo-1475178626620-a4d074967452?w=400&q=80",
    colors: ["dark wash"], tags: ["straight", "minimal"],
  },
  {
    id: "dn4", sku: "DENIM-004", name: "Denim Midi Skirt", brand: "Natural KG",
    price: 9800, currency: "сом", category: "denim",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80",
    colors: ["light wash"], tags: ["skirt", "denim"],
  },

  // Sweater
  {
    id: "sw1", sku: "SWEATER-001", name: "Merino Wool Turtleneck", brand: "Wool Studio",
    price: 13500, currency: "сом", category: "sweater",
    imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&q=80",
    colors: ["cream", "ecru"], tags: ["merino", "turtleneck"],
  },
  {
    id: "sw2", sku: "SWEATER-002", name: "Chunky Knit Cardigan", brand: "Soft Edition",
    price: 18900, currency: "сом", category: "sweater",
    imageUrl: "https://images.unsplash.com/photo-1520975922372-5ff7af45a4c4?w=400&q=80",
    colors: ["oat", "caramel"], tags: ["chunky", "cardigan"],
  },
  {
    id: "sw3", sku: "SWEATER-003", name: "Striped Breton Top", brand: "Maison Ainek",
    price: 9200, currency: "сом", category: "sweater",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=400&q=80",
    colors: ["navy", "white"], tags: ["breton", "stripes"],
  },
  {
    id: "sw4", sku: "SWEATER-004", name: "Cashmere V-Neck", brand: "Wool Studio",
    price: 24500, currency: "сом", category: "sweater",
    imageUrl: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&q=80",
    colors: ["dusty pink", "sage"], tags: ["cashmere", "luxury"],
  },

  // Skirt
  {
    id: "sk1", sku: "SKIRT-001", name: "Satin Bias Midi Skirt", brand: "Soft Edition",
    price: 11800, currency: "сом", category: "skirt",
    imageUrl: "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&q=80",
    colors: ["sage", "blush"], tags: ["satin", "bias cut"],
  },
  {
    id: "sk2", sku: "SKIRT-002", name: "Pleated Mini Skirt", brand: "Studio KG",
    price: 8500, currency: "сом", category: "skirt",
    imageUrl: "https://images.unsplash.com/photo-1518575387673-b1a1e1ba74a0?w=400&q=80",
    colors: ["black", "plaid"], tags: ["mini", "pleated"],
  },
  {
    id: "sk3", sku: "SKIRT-003", name: "Linen Maxi Wrap Skirt", brand: "Natural KG",
    price: 10200, currency: "сом", category: "skirt",
    imageUrl: "https://images.unsplash.com/photo-1594938298603-c8148c4b1726?w=400&q=80",
    colors: ["terracotta", "rust"], tags: ["linen", "maxi"],
  },
  {
    id: "sk4", sku: "SKIRT-004", name: "Leather A-Line Skirt", brand: "Bishkek Edit",
    price: 16500, currency: "сом", category: "skirt",
    imageUrl: "https://images.unsplash.com/photo-1571513722275-4b41940f54b8?w=400&q=80",
    colors: ["black", "cognac"], tags: ["leather", "A-line"],
  },
];
