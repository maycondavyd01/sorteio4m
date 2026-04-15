import { useRifas } from '@/features/rifa/hooks/useRifa';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { RAFFLE_DEFAULT_IMAGE } from '@/lib/raffleDefaultImage';

export default function Index() {
  const { data: rifas, isLoading } = useRifas();

  return (
    <AppShell>
      <Header />
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Rifas Disponíveis</h1>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : rifas && rifas.length > 0 ? (
          <div className="grid gap-4">
            {rifas?.map((rifa) => (
              <Link
                key={rifa.id}
                to={`/rifa/${rifa.id}`}
                className="block border rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
              >
                <div className="bg-secondary flex justify-center">
                  <img
                    src={rifa.image_url ?? RAFFLE_DEFAULT_IMAGE}
                    alt={rifa.title}
                    width={800}
                    height={1200}
                    className="block h-auto w-full max-h-[min(70vh,520px)] w-auto max-w-full object-contain mx-auto"
                    decoding="async"
                  />
                </div>
                <div className="p-3">
                  <h2 className="font-bold">{rifa.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(rifa.price_per_ticket).toFixed(2).replace('.', ',')} por cota
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rifa.total_tickets} cotas disponíveis
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhuma rifa disponível no momento.</p>
        )}
      </div>
    </AppShell>
  );
}
