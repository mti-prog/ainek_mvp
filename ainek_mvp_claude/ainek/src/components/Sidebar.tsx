"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Sparkles, Package } from "lucide-react";
import { CATEGORIES, PRODUCTS, Product, Category } from "@/lib/products";
import { checkStock } from "@/lib/odinS-api";

interface SidebarProps {
  onSelectProduct: (product: Product) => void;
  selectedProduct: Product | null;
  isLoading: boolean;
}

interface StockStatus {
  [sku: string]: boolean;
}

export default function Sidebar({ onSelectProduct, selectedProduct, isLoading }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>("trench");
  const [stockStatus, setStockStatus] = useState<StockStatus>({});

  const filteredProducts = PRODUCTS.filter((p) => p.category === activeCategory);

  // Pre-fetch stock status for visible products
  useEffect(() => {
    const fetchStock = async () => {
      const statuses: StockStatus = {};
      await Promise.all(
        filteredProducts.map(async (p) => {
          const result = await checkStock(p.sku);
          statuses[p.sku] = result.inStock;
        })
      );
      setStockStatus((prev) => ({ ...prev, ...statuses }));
    };
    fetchStock();
  }, [activeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 flex items-center gap-2 px-3 py-6 rounded-l-2xl transition-all duration-300"
        style={{
          background: "linear-gradient(135deg, rgba(139,92,246,0.9), rgba(59,130,246,0.9))",
          backdropFilter: "blur(12px)",
          boxShadow: isOpen ? "none" : "-4px 0 24px rgba(139,92,246,0.5)",
        }}
        aria-label="Toggle boutique sidebar"
      >
        <span className="text-white text-xs font-medium tracking-widest uppercase writing-vertical" style={{ writingMode: "vertical-rl" }}>
          Примерить
        </span>
        {isOpen ? (
          <ChevronRight className="text-white" size={18} />
        ) : (
          <ChevronLeft className="text-white" size={18} />
        )}
      </button>

      {/* Sidebar Panel */}
      <aside
        className="fixed right-0 top-0 h-full z-40 transition-transform duration-500 ease-out flex flex-col"
        style={{
          width: "380px",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          background: "rgba(8, 8, 18, 0.95)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "-8px 0 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 mb-1">
            <Sparkles size={18} className="text-violet-400" />
            <h2 className="text-white font-semibold tracking-wide" style={{ fontFamily: "'Playfair Display', serif" }}>
              Попробуйте другое
            </h2>
          </div>
          <p className="text-white/40 text-xs tracking-wider">Выберите образ для примерки</p>
        </div>

        {/* Category Tabs */}
        <div className="flex px-4 pt-4 gap-1 flex-wrap">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 touch-manipulation"
              style={{
                background: activeCategory === cat.id
                  ? "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.8))"
                  : "rgba(255,255,255,0.05)",
                color: activeCategory === cat.id ? "#fff" : "rgba(255,255,255,0.45)",
                border: activeCategory === cat.id
                  ? "1px solid rgba(139,92,246,0.5)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span>{cat.icon}</span>
              <span>{cat.labelRu}</span>
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const isSelected = selectedProduct?.id === product.id;
              const inStock = stockStatus[product.sku];

              return (
                <button
                  key={product.id}
                  onClick={() => !isLoading && onSelectProduct(product)}
                  disabled={isLoading || inStock === false}
                  className="relative group rounded-2xl overflow-hidden transition-all duration-300 touch-manipulation text-left"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: isSelected
                      ? "1.5px solid rgba(139,92,246,0.8)"
                      : "1.5px solid rgba(255,255,255,0.06)",
                    boxShadow: isSelected
                      ? "0 0 20px rgba(139,92,246,0.3), inset 0 0 20px rgba(139,92,246,0.05)"
                      : "none",
                    opacity: inStock === false ? 0.4 : 1,
                  }}
                >
                  {/* Product Image */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 180px"
                    />

                    {/* Selected Overlay */}
                    {isSelected && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(139,92,246,0.2)" }}
                      >
                        <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                          <Sparkles size={14} className="text-white" />
                        </div>
                      </div>
                    )}

                    {/* Out of Stock Badge */}
                    {inStock === false && (
                      <div className="absolute top-2 left-2 bg-red-500/80 text-white text-[9px] font-medium px-2 py-0.5 rounded-full backdrop-blur-sm">
                        Нет в наличии
                      </div>
                    )}

                    {/* Stock Badge */}
                    {inStock === true && (
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Package size={12} className="text-emerald-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-2.5">
                    <p className="text-white/80 text-[11px] font-medium leading-tight line-clamp-2">{product.name}</p>
                    <p className="text-violet-400 text-[11px] font-semibold mt-1">
                      {product.price.toLocaleString()} {product.currency}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer CTA */}
        {selectedProduct && (
          <div className="p-4 border-t border-white/5">
            <div
              className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} fill className="object-cover" sizes="40px" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{selectedProduct.name}</p>
                <p className="text-violet-400 text-xs">{selectedProduct.price.toLocaleString()} {selectedProduct.currency}</p>
              </div>
              {isLoading && (
                <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
              )}
            </div>
          </div>
        )}
      </aside>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
