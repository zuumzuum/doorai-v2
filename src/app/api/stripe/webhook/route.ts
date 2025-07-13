import { NextRequest, NextResponse } from 'next/server';
import { stripe, planFromPriceId, tokenLimitFromPlan } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // ---- idempotency を INSERT 一本に絞る -----------------
    const { error: insertErr } = await supabase
      .from('stripe_webhook_events')
      .insert({
        id: event.id,
        event_type: event.type,
        metadata: { livemode: event.livemode },
      })
      .select('id');

    if (insertErr && insertErr.code !== '23505') {
      console.error('Failed to record event:', insertErr);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    if (insertErr?.code === '23505') {
      console.info(`Event ${event.id} already processed`);
      return new NextResponse(null, { status: 200 });
    }

    console.info(`Processing event: ${event.type} (${event.id})`);

    // Handle events
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      default:
        console.info(`Unhandled event type: ${event.type}`);
    }

    return new NextResponse(null, { status: 200 });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.client_reference_id;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!tenantId || !customerId || !subscriptionId) {
    console.error('Missing required session data');
    return;
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    const planType = planFromPriceId(priceId);
    const tokenLimit = tokenLimitFromPlan(planType);

    // Update subscription
    await supabase.from('subscriptions').upsert({
      tenant_id: tenantId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      status: subscription.status,
      plan_type: planType,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'tenant_id' });

    // Update token limit
    await supabase.from('usage_tokens').update({
      tokens_limit: tokenLimit,
      updated_at: new Date().toISOString()
    }).eq('tenant_id', tenantId);

    console.info(`Checkout completed for tenant: ${tenantId}`);
  } catch (error) {
    console.error('Error handling checkout:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    const priceId = subscription.items.data[0]?.price.id;
    const planType = planFromPriceId(priceId);

    await supabase.from('subscriptions').update({
      stripe_price_id: priceId,
      status: subscription.status,
      plan_type: planType,
      current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscription.id);

    console.info(`Subscription updated: ${subscription.id}`);
  } catch (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as any).subscription as string;
  if (!subscriptionId) return;

  try {
    await supabase.from('subscriptions').update({
      status: 'active',
      updated_at: new Date().toISOString()
    }).eq('stripe_subscription_id', subscriptionId);

    console.info(`Payment succeeded for subscription: ${subscriptionId}`);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}