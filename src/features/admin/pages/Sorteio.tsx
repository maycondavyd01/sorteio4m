import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Shuffle, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Sorteio() {
  const [sorteando, setSorteando] = useState(false);
  const [ganhador, setGanhador] = useState<{ nome: string; whatsapp: string; numero: number } | null>(null);

  const { data: rifas } = useQuery({
    queryKey: ['admin-rifas-sorteio'],
    queryFn: async () => {
      const { data } = await supabase.from('rifas').select('id, nome, status').eq('status', 'ativa');
      return data ?? [];
    },
  });

  const sortear = async (rifaId: string) => {
    setSorteando(true);
    setGanhador(null);

    await new Promise((r) => setTimeout(r, 2000));

    const { data: bilhetesPagos } = await supabase
      .from('bilhetes')
      .select('numero, pedido_id')
      .eq('rifa_id', rifaId)
      .eq('status', 'pago');

    if (!bilhetesPagos || bilhetesPagos.length === 0) {
      toast.error('Nenhum bilhete pago para sortear.');
      setSorteando(false);
      return;
    }

    const idx = Math.floor(Math.random() * bilhetesPagos.length);
    const vencedor = bilhetesPagos[idx];

    // Get pedido and comprador info
    let nome = 'Desconhecido';
    let whatsapp = '';
    if (vencedor.pedido_id) {
      const { data: pedido } = await supabase
        .from('pedidos')
        .select('comprador_id')
        .eq('id', vencedor.pedido_id)
        .single();
      if (pedido) {
        const { data: comprador } = await supabase
          .from('compradores')
          .select('nome, whatsapp')
          .eq('id', pedido.comprador_id)
          .single();
        if (comprador) {
          nome = comprador.nome;
          whatsapp = comprador.whatsapp;
        }
      }
    }

    setGanhador({ nome, whatsapp, numero: vencedor.numero });
    await supabase.from('rifas').update({ status: 'sorteada' }).eq('id', rifaId);
    toast.success('Sorteio realizado!');
    setSorteando(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-lg">Sorteio</h2>

      {rifas?.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma rifa ativa para sortear.</p>
      )}

      {rifas?.map((r) => (
        <div key={r.id} className="bg-background rounded-xl border border-border p-5">
          <p className="font-semibold mb-3">{r.nome}</p>
          <Button
            onClick={() => sortear(r.id)}
            disabled={sorteando}
            className="w-full"
          >
            <Shuffle size={16} className={cn('mr-2', sorteando && 'animate-spin')} />
            {sorteando ? 'Sorteando...' : 'Sortear Vencedor'}
          </Button>
        </div>
      ))}

      {ganhador && (
        <div className="bg-background rounded-xl border-2 border-rifa-paid p-6 text-center space-y-3">
          <Trophy size={48} className="text-rifa-reserved mx-auto" />
          <h3 className="text-xl font-bold">🎉 Ganhador(a)!</h3>
          <p className="font-semibold text-lg">{ganhador.nome}</p>
          <p className="text-muted-foreground">{ganhador.whatsapp}</p>
          <p className="text-sm">
            Bilhete nº{' '}
            <span className="bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-bold">
              {String(ganhador.numero).padStart(3, '0')}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
