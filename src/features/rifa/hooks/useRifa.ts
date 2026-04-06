import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Bilhete, Rifa } from '@/types';

export function useRifa(id: string) {
  return useQuery({
    queryKey: ['rifa', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rifas')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Rifa;
    },
  });
}

export function useBilhetes(rifaId: string) {
  return useQuery({
    queryKey: ['bilhetes', rifaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bilhetes')
        .select('*')
        .eq('rifa_id', rifaId)
        .order('numero', { ascending: true });
      if (error) throw error;
      return data as Bilhete[];
    },
    refetchInterval: 10000,
  });
}

export function useRifas() {
  return useQuery({
    queryKey: ['rifas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rifas')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Rifa[];
    },
  });
}
