import { useRifas } from '@/features/rifa/hooks/useRifa';
import { Header } from '@/components/Header';
import { AppShell } from '@/components/AppShell';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { data: rifas, isLoading } = useRifas();
  const navigate = useNavigate();

  useEffect(() => {
    if (rifas && rifas.length > 0) {
      navigate(`/rifa/${rifas[0].id}`, { replace: true });
    }
  }, [rifas, navigate]);

  return (
    <AppShell>
      <Header />
      <div className="p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin" />
          </div>
        ) : rifas?.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhuma rifa disponível no momento.</p>
        ) : null}
      </div>
    </AppShell>
  );
}
