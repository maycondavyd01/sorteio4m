
CREATE TABLE public.rifas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  foto_url TEXT,
  preco_cota NUMERIC(10,2) NOT NULL,
  total_cotas INTEGER NOT NULL DEFAULT 1000,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','encerrada','sorteada')),
  ganhador_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.compradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comprador_id UUID NOT NULL REFERENCES public.compradores(id),
  rifa_id UUID NOT NULL REFERENCES public.rifas(id),
  valor_total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','pago','cancelado')),
  pix_copia_cola TEXT,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.bilhetes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rifa_id UUID NOT NULL REFERENCES public.rifas(id) ON DELETE CASCADE,
  numero INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel','reservado','pago')),
  pedido_id UUID REFERENCES public.pedidos(id),
  UNIQUE(rifa_id, numero)
);

-- RLS
ALTER TABLE public.rifas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública rifas" ON public.rifas FOR SELECT USING (true);
CREATE POLICY "Admin pode tudo em rifas" ON public.rifas FOR ALL TO authenticated USING (true) WITH CHECK (true);

ALTER TABLE public.compradores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública compradores" ON public.compradores FOR SELECT USING (true);
CREATE POLICY "Inserir compradores" ON public.compradores FOR INSERT WITH CHECK (true);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública pedidos" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Inserir pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar pedidos" ON public.pedidos FOR UPDATE USING (true) WITH CHECK (true);

ALTER TABLE public.bilhetes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Leitura pública bilhetes" ON public.bilhetes FOR SELECT USING (true);
CREATE POLICY "Inserir bilhetes" ON public.bilhetes FOR INSERT WITH CHECK (true);
CREATE POLICY "Atualizar bilhetes" ON public.bilhetes FOR UPDATE USING (true) WITH CHECK (true);

-- Create initial bilhetes for a demo rifa
INSERT INTO public.rifas (id, nome, descricao, preco_cota, total_cotas) 
VALUES ('00000000-0000-0000-0000-000000000001', 'tatuagem', 'Ganhe uma tatuagem exclusiva!', 1.00, 1000);

INSERT INTO public.bilhetes (rifa_id, numero)
SELECT '00000000-0000-0000-0000-000000000001', generate_series(0, 999);
