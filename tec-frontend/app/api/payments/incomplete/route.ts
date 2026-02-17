import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId || !PI_API_KEY) {
      return NextResponse.json(
        { success: false, message: 'Missing paymentId or API key' },
        { status: 400 }
      );
    }

    // Get the payment details
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment' },
        { status: response.status }
      );
    }

    const payment = await response.json();

    // If the payment has a txid but isn't completed, complete it
    if (payment.transaction && payment.transaction.txid && payment.status.developer_completed === false) {
      const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid: payment.transaction.txid }),
      });

      if (completeResponse.ok) {
        return NextResponse.json({ success: true, action: 'completed', paymentId });
      }
    }

    // If payment is not approved yet, approve it
    if (payment.status.developer_approved === false) {
      const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (approveResponse.ok) {
        return NextResponse.json({ success: true, action: 'approved', paymentId });
      }
    }

    return NextResponse.json({ success: true, action: 'no_action_needed', paymentId });
  } catch (error: unknown) {
    console.error('Incomplete payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
