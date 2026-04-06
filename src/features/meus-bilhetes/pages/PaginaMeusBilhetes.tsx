import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { Pedido, Bilhete } from '@/types';

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PaginaMeusBilhetes() {
  const [whatsapp, setWhatsapp] = useState('');
  const [pedidos, setPedidos] = useState<(Pedido & { bilhetes: Bilhete[] })[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const buscar = async () => {
    if (whatsapp.length < 14) return;
    setLoading(true);
    setSearched(true);
    try {
      const { data: comprador } = await supabase
        .from('compradores')
        .select('id')
        .eq('whatsapp', whatsapp)
        .maybeSingle();

      if (!comprador) {
        setPedidos([]);
        return;
      }

      const { data: pedidosData } = await supabase
        .from('pedidos')
        .select('*')
        .eq('comprador_id', comprador.id)
        .order('created_at', { ascending: false });

      if (!pedidosData) {
        setPedidos([]);
        return;
      }

      const result: (Pedido & { bilhetes: Bilhete[] })[] = [];
      for (const p of pedidosData) {
        const { data: bilhetes } = await supabase
          .from('bilhetes')
          .select('*')
          .eq('pedido_id', p.id)
          .order('numero');
        result.push({ ...p, bilhetes: bilhetes ?? [] } as Pedido & { bilhetes: Bilhete[] });
      }
      setPedidos(result);
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    if (status === 'pago') return 'bg-rifa-paid text-primary-foreground';
    if (status === 'pendente') return 'bg-rifa-reserved text-primary-foreground';
    return 'bg-muted text-muted-foreground';
  };

  return (
    <AppShell>
      <Header />
      <div className="p-4 space-y-6">
        <h2 className="font-bold text-xl">Meus Bilhetes</h2>
        <div className="flex gap-2">
          <Input
            placeholder="(11) 99999-9999"
            value={whatsapp}
            onChange={(e) => setWhatsapp(maskPhone(e.target.value))}
            className="flex-1"
          />
          <Button onClick={buscar} disabled={loading}>
            <Search size={18} />
          </Button>
        </div>

        {searched && pedidos.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nenhum bilhete encontrado para este número.
          </p>
        )}

        {pedidos.map((p) => (
          <div key={p.id} className="bg-secondary rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Pedido</p>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusBadge(p.status)}`}>
                {p.status === 'pago' ? 'Pago' : p.status === 'pendente' ? 'Pendente' : 'Cancelado'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              R$ {Number(p.valor_total).toFixed(2).replace('.', ',')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.bilhetes.map((b) => (
                <span
                  key={b.id}
                  className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    b.status === 'pago'
                      ? 'bg-rifa-paid text-primary-foreground'
                      : 'bg-rifa-reserved text-primary-foreground'
                  }`}
                >
                  {String(b.numero).padStart(3, '0')}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
