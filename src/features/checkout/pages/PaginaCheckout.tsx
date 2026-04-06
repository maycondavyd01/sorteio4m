import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCarrinho } from '@/store/useCarrinho';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';
import { Copy, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const schema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100),
  whatsapp: z.string()
    .min(14, 'WhatsApp inválido')
    .max(15, 'WhatsApp inválido')
    .regex(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, 'Formato: (11) 99999-9999'),
});

type FormData = z.infer<typeof schema>;

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function PaginaCheckout() {
  const { bilhetesSelecionados, rifaId, precoUnitario, limpar } = useCarrinho();
  const navigate = useNavigate();
  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Poll for payment status
  useQuery({
    queryKey: ['pedido-status', pedidoId],
    queryFn: async () => {
      if (!pedidoId) return null;
      const { data } = await supabase
        .from('pedidos')
        .select('status')
        .eq('id', pedidoId)
        .single();
      if (data?.status === 'pago') {
        toast.success('Pagamento confirmado! 🎉');
        limpar();
        navigate('/meus-bilhetes');
      }
      return data;
    },
    enabled: !!pedidoId,
    refetchInterval: 5000,
  });

  if (bilhetesSelecionados.length === 0 && !pedidoId) {
    return (
      <AppShell>
        <Header />
        <div className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Nenhum bilhete selecionado.</p>
          <Button onClick={() => navigate(-1)}>Voltar</Button>
        </div>
      </AppShell>
    );
  }

  const total = bilhetesSelecionados.length * precoUnitario;

  const onSubmit = async (form: FormData) => {
    if (!rifaId) return;
    setSubmitting(true);
    try {
      // Upsert comprador
      let compradorId: string;
      const { data: existing } = await supabase
        .from('compradores')
        .select('id')
        .eq('whatsapp', form.whatsapp)
        .maybeSingle();

      if (existing) {
        compradorId = existing.id;
      } else {
        const { data: newC, error: errC } = await supabase
          .from('compradores')
          .insert({ nome: form.nome, whatsapp: form.whatsapp })
          .select('id')
          .single();
        if (errC) throw errC;
        compradorId = newC.id;
      }

      // Create pedido
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${crypto.randomUUID()}5204000053039865404${total.toFixed(2)}5802BR`;
      const { data: pedido, error: errP } = await supabase
        .from('pedidos')
        .insert({
          comprador_id: compradorId,
          rifa_id: rifaId,
          valor_total: total,
          pix_copia_cola: pixCode,
        })
        .select()
        .single();
      if (errP) throw errP;

      // Update bilhetes to reservado
      for (const numero of bilhetesSelecionados) {
        await supabase
          .from('bilhetes')
          .update({ status: 'reservado', pedido_id: pedido.id })
          .eq('rifa_id', rifaId)
          .eq('numero', numero);
      }

      setPedidoId(pedido.id);
      setPixCopiaECola(pixCode);
      setExpiresAt(pedido.expires_at);
      toast.success('Pedido criado! Realize o pagamento via PIX.');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao criar pedido. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pedidoId && pixCopiaECola) {
    return (
      <AppShell>
        <Header />
        <div className="p-4 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Clock size={32} className="text-primary" />
            </div>
            <h2 className="font-bold text-xl">Pagamento PIX</h2>
            <p className="text-sm text-muted-foreground mt-1">Copie o código e pague no seu banco</p>
          </div>

          <TimerCountdown expiresAt={expiresAt!} />

          <div className="bg-secondary rounded-xl p-4">
            <p className="text-xs text-muted-foreground mb-2">PIX Copia e Cola:</p>
            <p className="text-xs font-mono break-all mb-3">{pixCopiaECola}</p>
            <Button
              className="w-full"
              onClick={() => {
                navigator.clipboard.writeText(pixCopiaECola);
                toast.success('Código PIX copiado!');
              }}
            >
              <Copy size={16} className="mr-2" />
              Copiar código PIX
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Aguardando confirmação do pagamento...
          </p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header />
      <div className="p-4 space-y-6">
        <h2 className="font-bold text-xl">Finalizar Compra</h2>

        <div className="bg-secondary rounded-xl p-4">
          <p className="text-sm font-semibold mb-2">
            Bilhetes selecionados ({bilhetesSelecionados.length}):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {bilhetesSelecionados.sort((a, b) => a - b).map((n) => (
              <span key={n} className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {String(n).padStart(3, '0')}
              </span>
            ))}
          </div>
          <p className="text-sm font-bold mt-3">
            Total: R$ {total.toFixed(2).replace('.', ',')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome completo</Label>
            <Input id="nome" placeholder="Seu nome" {...register('nome')} />
            {errors.nome && <p className="text-xs text-destructive mt-1">{errors.nome.message}</p>}
          </div>
          <div>
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              placeholder="(11) 99999-9999"
              {...register('whatsapp')}
              onChange={(e) => {
                const masked = maskPhone(e.target.value);
                setValue('whatsapp', masked, { shouldValidate: true });
              }}
            />
            {errors.whatsapp && <p className="text-xs text-destructive mt-1">{errors.whatsapp.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Processando...' : 'Confirmar e Pagar via PIX'}
          </Button>
        </form>
      </div>
    </AppShell>
  );
}

function TimerCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useState(() => {
    const interval = setInterval(() => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining('Expirado');
        clearInterval(interval);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setRemaining(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(interval);
  });

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-destructive font-mono">{remaining}</p>
      <p className="text-xs text-muted-foreground">Tempo restante para pagamento</p>
    </div>
  );
}
