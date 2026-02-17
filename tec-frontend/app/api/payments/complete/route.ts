import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();
    
    if (!paymentId || !txid) {
      return NextResponse.json(
        { success: false, message: 'paymentId and txid are required' },
        { status: 400 }
      );
    }

    if (!PI_API_KEY) {
      console.error('PI_API_KEY is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Complete the payment with Pi Platform API
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txid }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pi API complete error:', errorText);
      return NextResponse.json(
        { success: false, message: 'Failed to complete payment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ 
      success: true, 
      paymentId,
      txid,
      status: 'completed',
      amount: data.amount || 0,
      memo: data.memo || '',
      data 
    });
  } catch (error: unknown) {
    console.error('Payment completion error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
