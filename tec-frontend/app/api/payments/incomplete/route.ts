import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

console.log('[Payment Incomplete] Configuration:', { PI_API_KEY_SET: !!PI_API_KEY, PI_SANDBOX, PI_API_URL });

if (!PI_API_KEY && !PI_SANDBOX) {
  console.warn('[Payment Incomplete] WARNING: PI_API_KEY is not set in production mode!');
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json({ success: false, message: 'paymentId is required' }, { status: 400 });
    }

    const paymentIdRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
    if (!paymentIdRegex.test(paymentId)) {
      return NextResponse.json({ success: false, message: 'Invalid paymentId format' }, { status: 400 });
    }

    console.log('[Payment Incomplete] Processing:', paymentId);

    if (!PI_API_KEY && PI_SANDBOX) {
      return NextResponse.json({ success: true, action: 'no_action_needed', paymentId, message: 'Sandbox mode' });
    }

    if (!PI_API_KEY) {
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Payment Incomplete] Failed to fetch payment:', { paymentId, status: response.status, error: errorText });
      return NextResponse.json({ success: false, message: 'Failed to fetch payment' }, { status: response.status });
    }

    const payment = await response.json();

    if (payment.transaction && payment.transaction.txid && !payment.status.developer_completed) {
      const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ txid: payment.transaction.txid }),
      });
      if (completeResponse.ok) {
        return NextResponse.json({ success: true, action: 'completed', paymentId });
      } else {
        return NextResponse.json({ success: false, message: 'Failed to complete payment', action: 'complete_failed' }, { status: completeResponse.status });
      }
    }

    if (!payment.status.developer_approved) {
      const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Key ${PI_API_KEY}`, 'Content-Type': 'application/json' },
      });
      if (approveResponse.ok) {
        return NextResponse.json({ success: true, action: 'approved', paymentId });
      } else {
        return NextResponse.json({ success: false, message: 'Failed to approve payment', action: 'approve_failed' }, { status: approveResponse.status });
      }
    }

    return NextResponse.json({ success: true, action: 'no_action_needed', paymentId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
