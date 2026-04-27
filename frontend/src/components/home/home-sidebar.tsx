"use client";

import { useState } from "react";

interface HomeSidebarProps {
  categories: any[];
  selectedCategory: number | null;
  onSelectCategory: (id: number | null) => void;
  priceRange: [number, number];
  onPriceChange: (range: [number, number]) => void;
  showOnlyDiscounted: boolean;
  onDiscountChange: (val: boolean) => void;
}

export default function HomeSidebar({
  categories,
  selectedCategory,
  onSelectCategory,
  priceRange,
  onPriceChange,
  showOnlyDiscounted,
  onDiscountChange
}: HomeSidebarProps) {
  const [localPrice, setLocalPrice] = useState(priceRange[1]);

  return (
    <aside className="flex flex-col gap-10">
      {/* Discount Toggle */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase text-zinc-900">ការផ្តល់ជូន</h3>
        </div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input 
              type="checkbox" 
              className="sr-only peer"
              checked={!!showOnlyDiscounted}
              onChange={(e) => onDiscountChange(e.target.checked)}
            />
            <div className="w-10 h-5 bg-zinc-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
          </div>
          <span className="text-xs font-black text-zinc-600 group-hover:text-primary transition-colors">
            សៀវភៅបញ្ចុះតម្លៃ
          </span>
        </label>
      </div>

      <div className="h-px bg-zinc-100" />

      {/* Categories List */}
      <div className="flex flex-col gap-6">
        <h3 className="text-sm font-black uppercase text-zinc-900 border-b-2 border-primary/10 pb-3">ប្រភេទសៀវភៅ</h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => onSelectCategory(null)}
            className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              selectedCategory === null 
                ? "bg-primary text-white shadow-lg shadow-primary/20" 
                : "text-zinc-500 hover:bg-zinc-50 hover:text-primary"
            }`}
          >
            ទាំងអស់
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                selectedCategory === cat.id 
                  ? "bg-primary text-white shadow-lg shadow-primary/20" 
                  : "text-zinc-500 hover:bg-zinc-50 hover:text-primary"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Filter */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-black uppercase text-zinc-900">តម្លៃសៀវភៅ</h3>
           <span className="text-xs font-black text-primary">${localPrice}</span>
        </div>
        <div className="flex flex-col gap-4 px-1">
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={localPrice}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setLocalPrice(val);
            }}
            onMouseUp={() => onPriceChange([0, localPrice])}
            onTouchEnd={() => onPriceChange([0, localPrice])}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-100 accent-primary"
          />
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400">
            <span>$0</span>
            <span>$100</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
