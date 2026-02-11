import { Category } from '@/types';
import { cn } from '@/utils/cn';
import { Coffee, Cookie, Utensils, IceCream, LayoutGrid } from 'lucide-react';

interface CategoryFilterProps {
  activeCategory: Category;
  onCategoryChange: (category: Category) => void;
}

const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
  { id: 'snacks', label: 'Snacks', icon: <Cookie className="w-4 h-4" /> },
  { id: 'meals', label: 'Meals', icon: <Utensils className="w-4 h-4" /> },
  { id: 'beverages', label: 'Beverages', icon: <Coffee className="w-4 h-4" /> },
  { id: 'desserts', label: 'Desserts', icon: <IceCream className="w-4 h-4" /> },
];

export function CategoryFilter({ activeCategory, onCategoryChange }: CategoryFilterProps) {
  return (
    <div className="sticky top-[60px] z-30 bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3">
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryChange(category.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all',
              activeCategory === category.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
            )}
          >
            {category.icon}
            {category.label}
          </button>
        ))}
      </div>
    </div>
  );
}
