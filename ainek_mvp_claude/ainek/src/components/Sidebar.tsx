"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { ChevronRight, ChevronLeft, Sparkles, Plus, Trash2, Upload, Tag, X } from "lucide-react";
import { CATEGORIES, Category } from "@/lib/products";

interface UserProduct {
  id: string;
  name: string;
  category: string;
  imageUrl: string; // base64 or URL
  price?: string;
  addedAt: number;
}

interface SidebarProps {
  onSelectProduct: (product: UserProduct) => void;
  selectedProduct: UserProduct | null;
  isLoading: boolean;
}

const STORAGE_KEY = "ainek_wardrobe";

function loadWardrobe(): UserProduct[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveWardrobe(items: UserProduct[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    console.error("Failed to save wardrobe");
  }
}

export default function Sidebar({ onSelectProduct, selectedProduct, isLoading }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("trench");
  const [wardrobe, setWardrobe] = useState<UserProduct[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState<string>("trench");
  const [newPrice, setNewPrice] = useState("");
  const [newImageBase64, setNewImageBase64] = useState<string | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load wardrobe from localStorage on mount
  useEffect(() => {
    setWardrobe(loadWardrobe());
  }, []);

  const filteredItems = wardrobe.filter(p => p.category === activeCategory);

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setNewImageBase64(result);
      setNewImagePreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileChange(file);
  };

  const handleAddItem = () => {
    if (!newName.trim() || !newImageBase64) return;

    const newItem: UserProduct = {
      id: `item_${Date.now()}`,
      name: newName.trim(),
      category: newCategory,
      imageUrl: newImageBase64,
      price: newPrice.trim() || undefined,
      addedAt: Date.now(),
    };

    const updated = [newItem, ...wardrobe];
    setWardrobe(updated);
    saveWardrobe(updated);

    // Reset form
    setNewName("");
    setNewCategory("trench");
    setNewPrice("");
    setNewImageBase64(null);
    setNewImagePreview(null);
    setShowAddModal(false);
    setActiveCategory(newItem.category);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = wardrobe.filter(p => p.id !== id);
    setWardrobe(updated);
    saveWardrobe(updated);
  };

  const resetForm = () => {
    setNewName("");
    setNewCategory("trench");
    setNewPrice("");
    setNewImageBase64(null);
    setNewImagePreview(null);
    setShowAddModal(false);
  };

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
      >
        <span className="text-white text-xs font-medium tracking-widest uppercase"
          style={{ writingMode: "vertical-rl" }}>Гардероб</span>
        {isOpen ? <ChevronRight className="text-white" size={18} /> : <ChevronLeft className="text-white" size={18} />}
      </button>

      {/* Sidebar Panel */}
      <aside
        className="fixed right-0 top-0 h-full z-40 transition-transform duration-500 ease-out flex flex-col"
        style={{
          width: "380px",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          background: "rgba(8, 8, 18, 0.97)",
          backdropFilter: "blur(24px)",
          borderLeft: "1px solid rgba(139, 92, 246, 0.2)",
          boxShadow: "-8px 0 64px rgba(0,0,0,0.8)",
        }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles size={18} className="text-violet-400" />
              <h2 className="text-white font-semibold tracking-wide"
                style={{ fontFamily: "'Playfair Display', serif" }}>Мой гардероб</h2>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-medium transition-all"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.8))",
                border: "1px solid rgba(139,92,246,0.4)" }}
            >
              <Plus size={14} /> Добавить
            </button>
          </div>
          <p className="text-white/40 text-xs tracking-wider mt-1">
            {wardrobe.length} {wardrobe.length === 1 ? "вещь" : wardrobe.length < 5 ? "вещи" : "вещей"} сохранено
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex px-4 pt-4 gap-1 flex-wrap">
          {CATEGORIES.map((cat) => {
            const count = wardrobe.filter(p => p.category === cat.id).length;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200"
                style={{
                  background: activeCategory === cat.id
                    ? "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.8))"
                    : "rgba(255,255,255,0.05)",
                  color: activeCategory === cat.id ? "#fff" : "rgba(255,255,255,0.45)",
                  border: activeCategory === cat.id
                    ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.06)",
                }}>
                <span>{cat.icon}</span>
                <span>{cat.labelRu}</span>
                {count > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 rounded-full text-[9px]"
                    style={{ background: activeCategory === cat.id ? "rgba(255,255,255,0.2)" : "rgba(139,92,246,0.3)" }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: "rgba(139,92,246,0.1)", border: "1px dashed rgba(139,92,246,0.3)" }}>
                <Upload size={24} className="text-violet-400/60" />
              </div>
              <div className="text-center">
                <p className="text-white/40 text-sm">Нет вещей в этой категории</p>
                <button onClick={() => { setNewCategory(activeCategory); setShowAddModal(true); }}
                  className="mt-3 text-violet-400 text-xs underline underline-offset-2">
                  Добавить первую вещь
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredItems.map((product) => {
                const isSelected = selectedProduct?.id === product.id;
                return (
                  <button key={product.id}
                    onClick={() => !isLoading && onSelectProduct(product)}
                    disabled={isLoading}
                    className="relative group rounded-2xl overflow-hidden transition-all duration-300 text-left"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: isSelected ? "1.5px solid rgba(139,92,246,0.8)" : "1.5px solid rgba(255,255,255,0.06)",
                      boxShadow: isSelected ? "0 0 20px rgba(139,92,246,0.3)" : "none",
                    }}>
                    {/* Image */}
                    <div className="relative w-full aspect-[3/4] overflow-hidden">
                      <Image src={product.imageUrl} alt={product.name} fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="180px" unoptimized />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center"
                          style={{ background: "rgba(139,92,246,0.2)" }}>
                          <div className="w-8 h-8 rounded-full bg-violet-500 flex items-center justify-center">
                            <Sparkles size={14} className="text-white" />
                          </div>
                        </div>
                      )}
                      {/* Delete button */}
                      <button
                        onClick={(e) => handleDelete(product.id, e)}
                        className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: "rgba(239,68,68,0.8)", backdropFilter: "blur(4px)" }}>
                        <Trash2 size={12} className="text-white" />
                      </button>
                    </div>
                    {/* Info */}
                    <div className="p-2.5">
                      <p className="text-white/80 text-[11px] font-medium leading-tight line-clamp-2">{product.name}</p>
                      {product.price && (
                        <p className="text-violet-400 text-[11px] font-semibold mt-1">{product.price}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected item footer */}
        {selectedProduct && (
          <div className="p-4 border-t border-white/5">
            <div className="rounded-xl p-3 flex items-center gap-3"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                <Image src={selectedProduct.imageUrl} alt={selectedProduct.name} fill
                  className="object-cover" sizes="40px" unoptimized />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{selectedProduct.name}</p>
                {selectedProduct.price && <p className="text-violet-400 text-xs">{selectedProduct.price}</p>}
              </div>
              {isLoading && <div className="w-5 h-5 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />}
            </div>
          </div>
        )}
      </aside>

      {/* ADD ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
          <div className="w-full max-w-sm rounded-3xl overflow-hidden"
            style={{ background: "rgba(12,12,24,0.98)", border: "1px solid rgba(139,92,246,0.3)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>

            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <h3 className="text-white font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Добавить вещь
              </h3>
              <button onClick={resetForm}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}>
                <X size={16} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Image Upload */}
              <div
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 flex items-center justify-center"
                style={{
                  background: newImagePreview ? "transparent" : "rgba(139,92,246,0.05)",
                  border: dragOver ? "2px solid #8b5cf6" : "2px dashed rgba(139,92,246,0.3)",
                  boxShadow: dragOver ? "0 0 20px rgba(139,92,246,0.2)" : "none",
                }}>
                {newImagePreview ? (
                  <Image src={newImagePreview} alt="Preview" fill className="object-cover" sizes="350px" unoptimized />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-center p-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(139,92,246,0.15)" }}>
                      <Upload size={22} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-white/70 text-sm font-medium">Нажмите или перетащите фото</p>
                      <p className="text-white/30 text-xs mt-1">JPG, PNG, WEBP</p>
                    </div>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])} />
              </div>

              {/* Name */}
              <div>
                <label className="text-white/50 text-xs tracking-wider uppercase mb-2 block">
                  <Tag size={10} className="inline mr-1" />Название
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Например: Чёрный тренч Zara"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-white/50 text-xs tracking-wider uppercase mb-2 block">Категория</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat.id} onClick={() => setNewCategory(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                      style={{
                        background: newCategory === cat.id
                          ? "linear-gradient(135deg, rgba(139,92,246,0.8), rgba(59,130,246,0.8))"
                          : "rgba(255,255,255,0.05)",
                        color: newCategory === cat.id ? "#fff" : "rgba(255,255,255,0.4)",
                        border: newCategory === cat.id ? "1px solid rgba(139,92,246,0.5)" : "1px solid rgba(255,255,255,0.06)",
                      }}>
                      {cat.icon} {cat.labelRu}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price (optional) */}
              <div>
                <label className="text-white/50 text-xs tracking-wider uppercase mb-2 block">
                  Цена <span className="text-white/20 normal-case">(необязательно)</span>
                </label>
                <input
                  type="text"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  placeholder="Например: 15 000 сом"
                  className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-white/20 outline-none transition-all"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleAddItem}
                disabled={!newName.trim() || !newImageBase64}
                className="w-full py-4 rounded-xl text-white font-semibold text-sm transition-all"
                style={{
                  background: newName.trim() && newImageBase64
                    ? "linear-gradient(135deg, #8b5cf6, #3b82f6)"
                    : "rgba(255,255,255,0.05)",
                  color: newName.trim() && newImageBase64 ? "#fff" : "rgba(255,255,255,0.2)",
                  boxShadow: newName.trim() && newImageBase64 ? "0 4px 20px rgba(139,92,246,0.4)" : "none",
                }}>
                Добавить в гардероб
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-30 lg:hidden"
          style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(2px)" }}
          onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}