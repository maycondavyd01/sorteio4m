import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';

export default function Pedidos() {
  const qc = useQueryClient();

  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['admin-pedidos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pedidos')
        .select('id, valor_total, status, created_at, comprador_id')
        .order('created_at', { ascending: false });
      if (error) throw error;

      // Fetch compradores separately
      const compradorIds = [...new Set(data.map(p => p.comprador_id))];
      const { data: compradores } = await supabase
        .from('compradores')
        .select('id, nome, whatsapp')
        .in('id', compradorIds);

      const compradorMap = new Map(compradores?.map(c => [c.id, c]) ?? []);

      return data.map(p => ({
        ...p,
        comprador: compradorMap.get(p.comprador_id) ?? null,
      }));
    },
  });

  const aprovar = async (pedidoId: string) => {
    await supabase.from('pedidos').update({ status: 'pago' }).eq('id', pedidoId);
    await supabase.from('bilhetes').update({ status: 'pago' }).eq('pedido_id', pedidoId);
    toast.success('Pagamento aprovado!');
    qc.invalidateQueries({ queryKey: ['admin-pedidos'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  const cancelar = async (pedidoId: string) => {
    await supabase.from('bilhetes').update({ status: 'disponivel', pedido_id: null }).eq('pedido_id', pedidoId);
    await supabase.from('pedidos').update({ status: 'cancelado' }).eq('id', pedidoId);
    toast.success('Pedido cancelado e bilhetes liberados.');
    qc.invalidateQueries({ queryKey: ['admin-pedidos'] });
    qc.invalidateQueries({ queryKey: ['admin-stats'] });
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      <h2 className="font-bold text-lg">Pedidos</h2>
      {pedidos?.length === 0 && <p className="text-sm text-muted-foreground">Nenhum pedido encontrado.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="pb-2 font-semibold">Comprador</th>
              <th className="pb-2 font-semibold">WhatsApp</th>
              <th className="pb-2 font-semibold">Valor</th>
              <th className="pb-2 font-semibold">Status</th>
              <th className="pb-2 font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos?.map((p) => (
              <tr key={p.id} className="border-b border-border">
                <td className="py-3">{p.comprador?.nome ?? '-'}</td>
                <td className="py-3">{p.comprador?.whatsapp ?? '-'}</td>
                <td className="py-3">R$ {Number(p.valor_total).toFixed(2).replace('.', ',')}</td>
                <td className="py-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    p.status === 'pago' ? 'bg-rifa-paid text-primary-foreground' :
                    p.status === 'pendente' ? 'bg-rifa-reserved text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="py-3">
                  {p.status === 'pendente' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => aprovar(p.id)}>
                        <Check size={14} className="text-rifa-paid" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => cancelar(p.id)}>
                        <X size={14} className="text-destructive" />
                      </Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
