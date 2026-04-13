import { useRifas } from '@/features/rifa/hooks/useRifa';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Link } from 'react-router-dom';
import { Camera, Loader2 } from 'lucide-react';

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
                <div className="bg-secondary aspect-video flex items-center justify-center">
                  {rifa.foto_url ? (
                    <img src={rifa.foto_url} alt={rifa.nome} className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={48} className="text-muted-foreground/40" />
                  )}
                </div>
                <div className="p-3">
                  <h2 className="font-bold">{rifa.nome}</h2>
                  <p className="text-sm text-muted-foreground">
                    R$ {Number(rifa.preco_cota).toFixed(2).replace('.', ',')} por cota
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {rifa.total_cotas} cotas disponíveis
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