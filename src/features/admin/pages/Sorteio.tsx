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
    queryKey: ['admin-raffles-draw'],
    queryFn: async () => {
      const { data: drawn } = await supabase.from('draws').select('raffle_id');
      const drawnIds = new Set(drawn?.map((d) => d.raffle_id) ?? []);

      const { data } = await supabase
        .from('raffles')
        .select('id, title, status')
        .in('status', ['active', 'closed']);

      return (data ?? []).filter((r) => !drawnIds.has(r.id));
    },
  });

  const sortear = async (rifaId: string) => {
    setSorteando(true);
    setGanhador(null);

    await new Promise((r) => setTimeout(r, 2000));

    const { data: bilhetesPagos } = await supabase
      .from('tickets')
      .select('number, order_id')
      .eq('raffle_id', rifaId)
      .eq('status', 'sold');

    if (!bilhetesPagos || bilhetesPagos.length === 0) {
      toast.error('Nenhum bilhete pago para sortear.');
      setSorteando(false);
      return;
    }

    const idx = Math.floor(Math.random() * bilhetesPagos.length);
    const vencedor = bilhetesPagos[idx];

    let nome = 'Desconhecido';
    let whatsapp = '';
    if (vencedor.order_id) {
      const { data: pedido } = await supabase
        .from('orders')
        .select('full_name, phone')
        .eq('id', vencedor.order_id)
        .single();
      if (pedido) {
        nome = pedido.full_name ?? nome;
        whatsapp = pedido.phone ?? '';
      }
    }

    const { error: drawErr } = await supabase.from('draws').insert({
      raffle_id: rifaId,
      winning_order_id: vencedor.order_id,
      winning_number: vencedor.number,
    });
    if (drawErr) {
      console.error(drawErr);
      toast.error('Erro ao registrar sorteio.');
      setSorteando(false);
      return;
    }

    await supabase.from('raffles').update({ status: 'finished' }).eq('id', rifaId);

    setGanhador({ nome, whatsapp, numero: vencedor.number });
    toast.success('Sorteio realizado!');
    setSorteando(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-bold text-lg">Sorteio</h2>

      {rifas?.length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma rifa ativa ou encerrada sem sorteio.</p>
      )}

      {rifas?.map((r) => (
        <div key={r.id} className="bg-background rounded-xl border border-border p-5">
          <p className="font-semibold mb-3">{r.title}</p>
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
