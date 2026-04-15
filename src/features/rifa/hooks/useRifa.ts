import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRifa(id: string) {
  return useQuery({
    queryKey: ['rifa', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

export function useBilhetes(rifaId: string) {
  return useQuery({
    queryKey: ['tickets', rifaId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('raffle_id', rifaId)
        .order('number', { ascending: true });
      if (error) throw error;
      return data;
    },
    refetchInterval: 10000,
  });
}

export function useRifas() {
  return useQuery({
    queryKey: ['raffles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('raffles')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
