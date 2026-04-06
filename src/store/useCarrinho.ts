import { create } from 'zustand';

interface CarrinhoState {
  bilhetesSelecionados: number[];
  rifaId: string | null;
  precoUnitario: number;
  toggleBilhete: (numero: number) => void;
  setRifaId: (id: string) => void;
  setPrecoUnitario: (preco: number) => void;
  limpar: () => void;
  total: () => number;
}

export const useCarrinho = create<CarrinhoState>((set, get) => ({
  bilhetesSelecionados: [],
  rifaId: null,
  precoUnitario: 0,
  toggleBilhete: (numero) =>
    set((state) => {
      const exists = state.bilhetesSelecionados.includes(numero);
      return {
        bilhetesSelecionados: exists
          ? state.bilhetesSelecionados.filter((n) => n !== numero)
          : [...state.bilhetesSelecionados, numero],
      };
    }),
  setRifaId: (id) => set({ rifaId: id }),
  setPrecoUnitario: (preco) => set({ precoUnitario: preco }),
  limpar: () => set({ bilhetesSelecionados: [], rifaId: null, precoUnitario: 0 }),
  total: () => get().bilhetesSelecionados.length * get().precoUnitario,
}));
