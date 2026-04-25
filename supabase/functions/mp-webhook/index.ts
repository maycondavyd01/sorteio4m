import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.42.0';

serve(async (req) => {
  // Webhooks are usually POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(req.url);
    const body = await req.json();

    // Mercado Pago webhook can be sent in 'data.id' or 'id'
    const action = body.action || url.searchParams.get('topic');
    const paymentId = body.data?.id || body.id;

    if (!paymentId || (action !== 'payment.created' && action !== 'payment.updated' && action !== 'payment')) {
        return new Response(JSON.stringify({ message: 'Ignored or invalid payload' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const mpToken = Deno.env.get('MERCADO_PAGO_ACCESS_TOKEN');
    if (!mpToken) {
        throw new Error('Mercado Pago token not configured');
    }

    // Check actual payment status in MP
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
            'Authorization': `Bearer ${mpToken}`
        }
    });

    if (!mpResponse.ok) {
        throw new Error('Failed to fetch payment from Mercado Pago');
    }

    const paymentData = await mpResponse.json();
    const status = paymentData.status;

    // Connect to Supabase as Admin
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update DB if payment is approved
    if (status === 'approved') {
        const paymentIdStr = paymentId.toString();

        // Find the order
        const { data: order, error: errGetOrder } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('mp_payment_id', paymentIdStr)
            .single();

        if (order && order.status !== 'paid') {
            // Update order
            await supabaseAdmin
                .from('orders')
                .update({ status: 'paid' })
                .eq('id', order.id);

            // Update tickets
            await supabaseAdmin
                .from('tickets')
                .update({ status: 'paid' })
                .eq('order_id', order.id);
        }
    } else if (status === 'cancelled' || status === 'rejected') {
        const paymentIdStr = paymentId.toString();
        
        // Find the order
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, status')
            .eq('mp_payment_id', paymentIdStr)
            .single();

        if (order && order.status === 'pending') {
            await supabaseAdmin
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id);

            // Release tickets
            await supabaseAdmin
                .from('tickets')
                .update({ status: 'available', order_id: null, reserved_at: null })
                .eq('order_id', order.id);
        }
    }

    return new Response(JSON.stringify({ message: 'Processed successfully' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
    });
  }
});
