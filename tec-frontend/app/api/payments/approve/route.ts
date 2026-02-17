import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Sandbox mode fallback - simulate approval when PI_API_KEY is not set
    if (!PI_API_KEY && PI_SANDBOX) {
      console.log('[Sandbox] Simulating payment approval for:', paymentId);
      return NextResponse.json({ 
        success: true, 
        paymentId,
        data: {
          identifier: paymentId,
          status: {
            developer_approved: true,
            transaction_verified: false,
            developer_completed: false,
            cancelled: false,
            user_cancelled: false,
          }
        }
      });
    }

    if (!PI_API_KEY) {
      console.error('PI_API_KEY is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Approve the payment with Pi Platform API
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pi API approve error:', errorText);
      return NextResponse.json(
        { success: false, message: 'Failed to approve payment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ success: true, paymentId, data });
  } catch (error: unknown) {
    console.error('Payment approval error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
