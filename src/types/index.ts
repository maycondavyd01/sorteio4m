export interface Rifa {
  id: string;
  nome: string;
  descricao: string | null;
  foto_url: string | null;
  preco_cota: number;
  total_cotas: number;
  status: 'ativa' | 'encerrada' | 'sorteada';
  ganhador_id: string | null;
  created_at: string;
}

export interface Comprador {
  id: string;
  nome: string;
  whatsapp: string;
  created_at: string;
}

export interface Pedido {
  id: string;
  comprador_id: string;
  rifa_id: string;
  valor_total: number;
  status: 'pendente' | 'pago' | 'cancelado';
  pix_copia_cola: string | null;
  expires_at: string;
  created_at: string;
  comprador?: Comprador;
}

export interface Bilhete {
  id: string;
  rifa_id: string;
  numero: number;
  status: 'disponivel' | 'reservado' | 'pago';
  pedido_id: string | null;
}

export type FiltroStatus = 'todos' | 'disponivel' | 'pago' | 'reservado';
