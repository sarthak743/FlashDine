import { ChefHat, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';

interface HeaderProps {
  title?: string;
  showTableId?: boolean;
  variant?: 'customer' | 'kitchen';
}

export function Header({ title = 'FlashDine', showTableId = true, variant = 'customer' }: HeaderProps) {
  const tableId = useStore((state) => state.tableId);

  return (
    <header className="sticky top-0 z-40 bg-zinc-900 border-b border-zinc-800">
      <div className="px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
            {variant === 'kitchen' ? (
              <ChefHat className="w-5 h-5 text-white" />
            ) : (
              <QrCode className="w-5 h-5 text-white" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">{title}</h1>
            {variant === 'kitchen' && (
              <p className="text-xs text-zinc-400">Kitchen Display</p>
            )}
          </div>
        </Link>
        
        {showTableId && tableId && (
          <div className="bg-orange-500/10 border border-orange-500/30 px-3 py-1.5 rounded-full">
            <span className="text-orange-400 text-sm font-semibold">Table {tableId}</span>
          </div>
        )}
        
        {variant === 'kitchen' && (
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-green-400 text-sm font-medium">Live</span>
          </div>
        )}
      </div>
    </header>
  );
}
