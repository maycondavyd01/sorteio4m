-- Migration to add MercadoPago fields and update Security Rules

-- Add new columns to orders
ALTER TABLE public.orders 
ADD COLUMN mp_payment_id TEXT,
ADD COLUMN qr_code_base64 TEXT;

-- Update RLS for orders. Only Service Role can insert/update safely (or authenticated insert if needed, but we do it via EF to be safe).
-- Actually, our Edge function will use the Service Role key to insert orders.
-- However, we still want the user to be able to SELECT their own orders. Profile ID is already in the table.
-- Let's define the SELECT policy:
DROP POLICY IF EXISTS "Leitura pública pedidos" ON public.orders;
CREATE POLICY "Leitura de pedidos pelo proprio usuario" ON public.orders 
FOR SELECT TO authenticated USING (profile_id = auth.uid());

-- Disable frontend INSERT/UPDATE for orders
DROP POLICY IF EXISTS "Inserir pedidos" ON public.orders;
DROP POLICY IF EXISTS "Atualizar pedidos" ON public.orders;
-- (Service role in Edge Function bypasses RLS and handles inserts/updates directly)

-- Update RLS for tickets
DROP POLICY IF EXISTS "Inserir bilhetes" ON public.tickets;
DROP POLICY IF EXISTS "Atualizar bilhetes" ON public.tickets;
-- Tickets should only be SELECTable publically. Writes come from the Edge Function.
-- Create policy to select tickets
CREATE POLICY "Leitura tickets publica" ON public.tickets FOR SELECT USING (true);
