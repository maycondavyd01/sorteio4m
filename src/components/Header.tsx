import { ShoppingCart } from 'lucide-react';
import { useCarrinho } from '@/store/useCarrinho';
import { Link } from 'react-router-dom';

export function Header() {
  const count = useCarrinho((s) => s.bilhetesSelecionados.length);

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="w-10" />
        <Link to="/" className="flex items-center">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-extrabold text-xl">R</span>
          </div>
        </Link>
        <Link to="/meus-bilhetes" className="relative flex flex-col items-center text-muted-foreground">
          <ShoppingCart size={22} />
          <span className="text-[10px] mt-0.5">Meus bilhetes</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
