import { useNavigate } from 'react-router-dom';
import { useCarrinho } from '@/store/useCarrinho';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { Copy, Clock, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckoutAuth } from '../components/CheckoutAuth';
import { useRifa } from '@/features/rifa/hooks/useRifa';

export default function PaginaCheckout() {
  const { bilhetesSelecionados, rifaId, precoUnitario, limpar } = useCarrinho();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [session, setSession] = useState<any>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  const [pedidoId, setPedidoId] = useState<string | null>(null);
  const [pixCopiaECola, setPixCopiaECola] = useState<string | null>(null);
  const [qrCodeBase64, setQrCodeBase64] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Puxar descrição da rifa usando o hook existente
  const { data: rifa } = useRifa(rifaId || '');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useQuery({
    queryKey: ['order-status', pedidoId],
    queryFn: async () => {
      if (!pedidoId) return null;
      const { data } = await supabase
        .from('orders')
        .select('status')
        .eq('id', pedidoId)
        .single();
      if (data && data.status === 'paid') {
        toast.success('Pagamento confirmado! 🎉');
        limpar();
        queryClient.invalidateQueries({ queryKey: ['tickets'] });
        navigate('/meus-bilhetes');
      }
      return data;
    },
    enabled: !!pedidoId,
    refetchInterval: 3000,
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

  const onConfirmPurchase = async () => {
    if (!rifaId || !session) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-pix-payment', {
        body: { raffleId: rifaId, bilhetes: bilhetesSelecionados },
      });

      if (error) throw new Error(error.message);
      if (data.error) throw new Error(data.error);

      setPedidoId(data.orderId);
      setPixCopiaECola(data.pixCopiaECola);
      setQrCodeBase64(data.qrCodeBase64);
      setExpiresAt(data.expiresAt);
      
      toast.success('PIX gerado! Realize o pagamento para garantir seus bilhetes.');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Erro ao gerar pagamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (pedidoId && pixCopiaECola) {
    return (
      <AppShell>
        <Header />
        <div className="p-4 space-y-6 max-w-lg mx-auto">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <Clock size={32} className="text-primary" />
            </div>
            <h2 className="font-bold text-xl">Pagamento PIX</h2>
            <p className="text-sm text-muted-foreground mt-1">Sua compra foi reservada.</p>
          </div>

          {expiresAt && <TimerCountdown expiresAt={expiresAt} />}

          <div className="bg-secondary rounded-xl p-4 flex flex-col items-center">
            {qrCodeBase64 && (
               <img 
                 src={`data:image/png;base64,${qrCodeBase64}`} 
                 alt="QR Code PIX" 
                 className="w-48 h-48 mb-4 border rounded-xl shadow-sm bg-white p-2"
               />
            )}
            
            <p className="text-xs text-muted-foreground w-full text-left mb-2">Ou use o PIX Copia e Cola:</p>
            <div className="w-full bg-background p-2 rounded-md border break-all text-xs font-mono mb-3 overflow-hidden text-ellipsis whitespace-nowrap">
               {pixCopiaECola}
            </div>
            
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

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
             <Loader2 size={12} className="animate-spin" />
             Aguardando confirmação do pagamento...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Header />
      <div className="p-4 space-y-6 max-w-lg mx-auto">
        <h2 className="font-bold text-xl">Finalizar Compra</h2>

        <div className="bg-secondary/50 rounded-xl p-4 border border-border">
          {rifa && (
             <div className="mb-4 pb-4 border-b border-border">
                <h3 className="font-bold">{rifa.title}</h3>
                {rifa.description && (
                   <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rifa.description}</p>
                )}
             </div>
          )}
          
          <p className="text-sm font-semibold mb-2">
            Bilhetes selecionados ({bilhetesSelecionados.length}):
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto mb-2">
            {bilhetesSelecionados.sort((a, b) => a - b).map((n) => (
              <span key={n} className="bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                {String(n).padStart(3, '0')}
              </span>
            ))}
          </div>
          <p className="text-lg font-bold mt-3 text-primary">
            Total: R$ {total.toFixed(2).replace('.', ',')}
          </p>
        </div>

        {loadingSession ? (
           <div className="py-8 flex justify-center"><Loader2 className="animate-spin" /></div>
        ) : !session ? (
           <CheckoutAuth onAuthSuccess={() => {}} />
        ) : (
           <div className="space-y-4">
              <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm font-medium text-center">
                 Autenticado com {session.user.email}. Tudo pronto para a compra!
              </div>
              <Button onClick={onConfirmPurchase} className="w-full h-12 text-md" disabled={submitting}>
                {submitting ? (
                   <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processando...</>
                ) : 'Confirmar e Gerar PIX'}
              </Button>
           </div>
        )}
      </div>
    </AppShell>
  );
}

function TimerCountdown({ expiresAt }: { expiresAt: string }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
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
  }, [expiresAt]);

  return (
    <div className="text-center">
      <p className="text-3xl font-bold text-destructive font-mono">{remaining}</p>
      <p className="text-xs text-muted-foreground">Tempo restante para efetuar o pagamento</p>
    </div>
  );
}
