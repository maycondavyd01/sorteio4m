import { useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { useRifa, useBilhetes } from '../hooks/useRifa';
import { useCarrinho } from '@/store/useCarrinho';
import { GradeBilhetes } from '../components/GradeBilhetes';
import { BarraCompra } from '../components/BarraCompra';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Trophy } from 'lucide-react';
import { RAFFLE_DEFAULT_IMAGE } from '@/lib/raffleDefaultImage';
import { FaWhatsapp, FaFacebookF, FaInstagram } from 'react-icons/fa';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaginaRifa() {
  const { id } = useParams<{ id: string }>();
  const { data: rifa, isLoading: loadingRifa } = useRifa(id!);
  const { data: bilhetes, isLoading: loadingBilhetes } = useBilhetes(id!);
  const { setRifaId, setPrecoUnitario } = useCarrinho();

  useEffect(() => {
    if (rifa) {
      setRifaId(rifa.id);
      setPrecoUnitario(Number(rifa.price_per_ticket));
    }
  }, [rifa, setRifaId, setPrecoUnitario]);

  if (loadingRifa) {
    return (
      <AppShell>
        <Header />
        <div className="p-4 space-y-4">
          <Skeleton className="w-full aspect-[2/3] max-w-lg mx-auto rounded-xl" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-6 w-32" />
        </div>
      </AppShell>
    );
  }

  if (!rifa) {
    return (
      <AppShell>
        <Header />
        <div className="p-8 text-center text-muted-foreground">Rifa não encontrada.</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header />
      {/* Prize image — proporção natural do arquivo (retrato); largura limitada para não esticar em telas grandes */}
      <div className="bg-secondary flex justify-center px-0">
        <img
          src={rifa.image_url ?? RAFFLE_DEFAULT_IMAGE}
          alt={rifa.title}
          width={800}
          height={1200}
          className="block h-auto w-full max-w-lg object-contain"
          decoding="async"
        />
      </div>

      {/* Info */}
      <div className="px-4 py-4 border-b border-border">
        <h1 className="text-xl font-bold">{rifa.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Por apenas{' '}
          <span className="bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full text-sm">
            R$ {Number(rifa.price_per_ticket).toFixed(2).replace('.', ',')}
          </span>
        </p>
      </div>

      {rifa.description && (
        <div className="px-4 py-3 text-sm text-muted-foreground border-b border-border">
          {rifa.description}
        </div>
      )}

      {/* Share */}
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm text-muted-foreground mb-2">Compartilhar:</p>
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-white"
          >
            <FaWhatsapp size={20} />
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-[#1877F2] flex items-center justify-center text-white"
          >
            <FaFacebookF size={18} />
          </a>
          <a
            href={`https://www.instagram.com/`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full flex items-center justify-center text-white"
            style={{
              background: 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'
            }}
          >
            <FaInstagram size={20} />
          </a>
        </div>
      </div>

      {/* Bilhetes */}
      <div className="py-4">
        {loadingBilhetes ? (
          <div className="px-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <GradeBilhetes bilhetes={bilhetes ?? []} totalCotas={rifa.total_tickets} />
        )}
      </div>

      {/* Prêmios */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={20} className="text-primary" />
          <h2 className="font-bold text-lg">Prêmios</h2>
        </div>
        <div className="bg-secondary rounded-xl p-4">
          <p className="text-sm">
            <strong>1º ganhador(a):</strong> {rifa.title}
          </p>
          {rifa.description && <p className="text-xs text-muted-foreground mt-1">{rifa.description}</p>}
        </div>
      </div>

      <div className="h-20" />
      <BarraCompra />

      <footer className="text-center text-xs text-muted-foreground py-6 border-t border-border mb-4">
        Plataforma de Sorteios Online
      </footer>
    </AppShell>
  );
}
