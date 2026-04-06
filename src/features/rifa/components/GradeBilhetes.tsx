import { useMemo, useRef, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCarrinho } from '@/store/useCarrinho';
import { cn } from '@/lib/utils';

const COLS = 5;

type FiltroStatus = 'todos' | 'disponivel' | 'pago' | 'reservado';

interface BilheteRow {
  numero: number;
  status: string;
}

interface Props {
  bilhetes: BilheteRow[];
  totalCotas: number;
}

export function GradeBilhetes({ bilhetes, totalCotas }: Props) {
  const [filtro, setFiltro] = useState<FiltroStatus>('todos');
  const { bilhetesSelecionados, toggleBilhete } = useCarrinho();
  const parentRef = useRef<HTMLDivElement>(null);

  const bilhetesMap = useMemo(() => {
    const map = new Map<number, BilheteRow>();
    bilhetes.forEach((b) => map.set(b.numero, b));
    return map;
  }, [bilhetes]);

  const numerosVisiveis = useMemo(() => {
    const nums: number[] = [];
    for (let i = 0; i < totalCotas; i++) {
      const b = bilhetesMap.get(i);
      const status = b?.status ?? 'disponivel';
      if (filtro === 'todos' || filtro === status) {
        nums.push(i);
      }
    }
    return nums;
  }, [totalCotas, bilhetesMap, filtro]);

  const rows = useMemo(() => {
    const result: number[][] = [];
    for (let i = 0; i < numerosVisiveis.length; i += COLS) {
      result.push(numerosVisiveis.slice(i, i + COLS));
    }
    return result;
  }, [numerosVisiveis]);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 10,
  });

  const contagens = useMemo(() => {
    let disponivel = 0, pago = 0, reservado = 0;
    for (let i = 0; i < totalCotas; i++) {
      const b = bilhetesMap.get(i);
      const s = b?.status ?? 'disponivel';
      if (s === 'disponivel') disponivel++;
      else if (s === 'pago') pago++;
      else if (s === 'reservado') reservado++;
    }
    return { todos: totalCotas, disponivel, pago, reservado };
  }, [totalCotas, bilhetesMap]);

  const handleClick = useCallback((numero: number) => {
    const b = bilhetesMap.get(numero);
    const status = b?.status ?? 'disponivel';
    if (status === 'disponivel') {
      toggleBilhete(numero);
    }
  }, [bilhetesMap, toggleBilhete]);

  const filtros: { label: string; value: FiltroStatus; count: number; className: string }[] = [
    { label: 'Todos', value: 'todos', count: contagens.todos, className: 'bg-foreground text-background' },
    { label: 'Disponíveis', value: 'disponivel', count: contagens.disponivel, className: 'bg-secondary text-foreground' },
    { label: 'Pagos', value: 'pago', count: contagens.pago, className: 'bg-rifa-paid text-primary-foreground' },
    { label: 'Reservados', value: 'reservado', count: contagens.reservado, className: 'bg-rifa-reserved text-primary-foreground' },
  ];

  const formatNum = (n: number) => String(n).padStart(3, '0');

  return (
    <div>
      <div className="flex items-center gap-2 px-4 mb-4">
        <span className="text-lg mr-1">🎟️</span>
        <div>
          <h2 className="font-bold text-lg">Bilhetes</h2>
          <p className="text-sm text-muted-foreground">Selecione os bilhetes que deseja comprar</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 px-4 mb-4">
        {filtros.map((f) => (
          <button
            key={f.value}
            onClick={() => setFiltro(f.value)}
            className={cn(
              'rounded-full py-2 px-4 text-sm font-semibold flex items-center justify-center gap-2 transition-all',
              filtro === f.value ? f.className : 'bg-secondary text-muted-foreground'
            )}
          >
            {f.label}
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-bold',
              filtro === f.value ? 'bg-background/20 text-inherit' : 'bg-muted text-muted-foreground'
            )}>
              {f.count}
            </span>
          </button>
        ))}
      </div>

      <div ref={parentRef} className="h-[400px] overflow-auto px-4">
        <div
          style={{ height: `${virtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <div
                key={virtualRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                className="grid grid-cols-5 gap-1.5"
              >
                {row.map((numero) => {
                  const b = bilhetesMap.get(numero);
                  const status = b?.status ?? 'disponivel';
                  const selecionado = bilhetesSelecionados.includes(numero);

                  return (
                    <button
                      key={numero}
                      onClick={() => handleClick(numero)}
                      disabled={status !== 'disponivel'}
                      className={cn(
                        'rounded-lg py-2 text-sm font-semibold transition-all border',
                        status === 'pago' && 'bg-rifa-paid text-primary-foreground border-transparent cursor-not-allowed',
                        status === 'reservado' && 'bg-rifa-reserved text-primary-foreground border-transparent cursor-not-allowed',
                        status === 'disponivel' && !selecionado && 'bg-rifa-available text-foreground border-border hover:border-primary',
                        selecionado && 'bg-rifa-selected text-primary-foreground border-transparent scale-95',
                      )}
                    >
                      {formatNum(numero)}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
