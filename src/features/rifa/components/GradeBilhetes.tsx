import { useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useCarrinho } from '@/store/useCarrinho';
import { cn } from '@/lib/utils';

const COLS = 5;

interface BilheteRow {
  number: number;
  status: string;
}

interface Props {
  bilhetes: BilheteRow[];
  totalCotas: number;
}

export function GradeBilhetes({ bilhetes, totalCotas }: Props) {
  const { bilhetesSelecionados, toggleBilhete } = useCarrinho();
  const parentRef = useRef<HTMLDivElement>(null);

  const bilhetesMap = useMemo(() => {
    const map = new Map<number, BilheteRow>();
    bilhetes.forEach((b) => map.set(b.number, b));
    return map;
  }, [bilhetes]);

  const numerosVisiveis = useMemo(() => {
    const nums: number[] = [];
    for (let i = 1; i <= totalCotas; i++) {
      nums.push(i);
    }
    return nums;
  }, [totalCotas]);

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

  const handleClick = useCallback((numero: number) => {
    const b = bilhetesMap.get(numero);
    const status = b?.status ?? 'available';
    if (status === 'available') {
      toggleBilhete(numero);
    }
  }, [bilhetesMap, toggleBilhete]);

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
                  const status = b?.status ?? 'available';
                  const selecionado = bilhetesSelecionados.includes(numero);

                  return (
                    <button
                      key={numero}
                      onClick={() => handleClick(numero)}
                      disabled={status !== 'available'}
                      className={cn(
                        'rounded-lg py-2 text-sm font-semibold transition-all border',
                        status === 'sold' && 'bg-rifa-paid text-primary-foreground border-transparent cursor-not-allowed',
                        status === 'reserved' && 'bg-rifa-reserved text-primary-foreground border-transparent cursor-not-allowed',
                        status === 'available' && !selecionado && 'bg-rifa-available text-foreground border-border hover:border-primary',
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
