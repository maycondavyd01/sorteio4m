import { useCarrinho } from '@/store/useCarrinho';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export function BarraCompra() {
  const { bilhetesSelecionados, precoUnitario } = useCarrinho();
  const navigate = useNavigate();
  const count = bilhetesSelecionados.length;

  if (count === 0) return null;

  const total = count * precoUnitario;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="mx-auto max-w-md">
        <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between rounded-t-2xl shadow-lg">
          <div className="flex items-center gap-3">
            <ShoppingCart size={20} />
            <div>
              <p className="text-sm font-semibold">{count} bilhete{count > 1 ? 's' : ''}</p>
              <p className="text-xs opacity-80">R$ {total.toFixed(2).replace('.', ',')}</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            className="bg-primary text-primary-foreground font-bold px-6 py-2.5 rounded-full text-sm hover:opacity-90 transition"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}
