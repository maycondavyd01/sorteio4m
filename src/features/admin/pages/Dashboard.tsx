import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Ticket, Clock } from 'lucide-react';

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: pedidosPagos } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'paid');

      const { data: bilhetesPagos } = await supabase
        .from('tickets')
        .select('id')
        .eq('status', 'sold');

      const { data: reservas } = await supabase
        .from('orders')
        .select('id')
        .eq('status', 'pending');

      const totalArrecadado = pedidosPagos?.reduce((s, p) => s + Number(p.total_amount), 0) ?? 0;

      return {
        totalArrecadado,
        bilhetesVendidos: bilhetesPagos?.length ?? 0,
        reservasPendentes: reservas?.length ?? 0,
      };
    },
  });

  const cards = [
    {
      title: 'Total Arrecadado',
      value: `R$ ${(stats?.totalArrecadado ?? 0).toFixed(2).replace('.', ',')}`,
      icon: DollarSign,
      color: 'text-rifa-paid',
    },
    {
      title: 'Bilhetes Vendidos',
      value: String(stats?.bilhetesVendidos ?? 0),
      icon: Ticket,
      color: 'text-primary',
    },
    {
      title: 'Reservas Pendentes',
      value: String(stats?.reservasPendentes ?? 0),
      icon: Clock,
      color: 'text-rifa-reserved',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((c) => (
        <div key={c.title} className="bg-background rounded-xl border border-border p-5">
          <div className="flex items-center gap-3 mb-2">
            <c.icon size={20} className={c.color} />
            <p className="text-sm text-muted-foreground">{c.title}</p>
          </div>
          <p className="text-2xl font-bold">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
