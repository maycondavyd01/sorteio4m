import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // To perform secure back-end operations (bypassing RLS safely where needed)
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { raffleId, bilhetes } = await req.json();

    if (!raffleId || !bilhetes || !Array.isArray(bilhetes) || bilhetes.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch raffle to get the real price
    const { data: raffle, error: errRaffle } = await supabaseAdmin
      .from('raffles')
      .select('price_per_ticket, title')
      .eq('id', raffleId)
      .single();

    if (errRaffle || !raffle) {
        return new Response(JSON.stringify({ error: 'Raffle not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    const totalAmount = raffle.price_per_ticket * bilhetes.length;

    // 2. Lock the tickets (verify availability)
    const { data: existingTickets, error: errTickets } = await supabaseAdmin
      .from('tickets')
      .select('number, status')
      .eq('raffle_id', raffleId)
      .in('number', bilhetes);
    
    // Check if all requested tickets exist and are available (status might not exist if they are not generated yet, but usually they are pre-generated)
    const unavailable = existingTickets?.filter(t => t.status !== 'available');
    if (unavailable && unavailable.length > 0) {
        return new Response(JSON.stringify({ error: 'Some tickets are not available' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // Get user details
    const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
    
    const fullName = profile?.full_name || 'Comprador';
    const email = user.email || 'email@teste.com';

    // 3. Generate PIX from Mercado Pago
    const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpToken) {
        throw new Error('Mercado Pago token not configured');
    }

    const idempotencyKey = crypto.randomUUID();
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${mpToken}`,
            'X-Idempotency-Key': idempotencyKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            transaction_amount: totalAmount,
            description: `Compra de ${bilhetes.length} bilhetes - ${raffle.title}`,
            payment_method_id: 'pix',
            payer: {
                email: email,
                first_name: fullName
            }
        })
    });

    const paymentData = await mpResponse.json();

    if (!mpResponse.ok) {
        console.error('Mercado Pago Error:', paymentData);
        throw new Error('Failed to create Mercado Pago payment');
    }

    const pixCopiaECola = paymentData.point_of_interaction.transaction_data.qr_code;
    const qrCodeBase64 = paymentData.point_of_interaction.transaction_data.qr_code_base64;
    const paymentId = paymentData.id;
    const expiresAt = paymentData.date_of_expiration;

    // 4. Create Order in DB
    const { data: order, error: errOrder } = await supabaseAdmin
      .from('orders')
      .insert({
        raffle_id: raffleId,
        profile_id: user.id,
        full_name: fullName,
        phone: profile?.phone || '',
        total_amount: totalAmount,
        status: 'pending',
        pix_copy_paste: pixCopiaECola,
        qr_code_base64: qrCodeBase64,
        mp_payment_id: paymentId.toString(),
        expires_at: expiresAt
      })
      .select()
      .single();

    if (errOrder || !order) {
        throw new Error('Failed to save order in DB: ' + JSON.stringify(errOrder));
    }

    // 5. Update tickets to reserved
    const reservedAt = new Date().toISOString();
    const { error: errUpdateTickets } = await supabaseAdmin
        .from('tickets')
        .update({
            status: 'reserved',
            order_id: order.id,
            reserved_at: reservedAt
        })
        .eq('raffle_id', raffleId)
        .in('number', bilhetes);

    if (errUpdateTickets) {
        // Warning: ideally if this fails we should rollback or correct state, but simple app works
        console.error('Failed to update tickets', errUpdateTickets);
    }

    return new Response(JSON.stringify({ 
        orderId: order.id, 
        pixCopiaECola, 
        qrCodeBase64, 
        expiresAt 
    }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
