import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

// Log configuration at startup
console.log('[Payment Complete] Configuration:', {
  PI_API_KEY_SET: !!PI_API_KEY,
  PI_SANDBOX,
  PI_API_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { paymentId, txid } = await request.json();
    
    if (!paymentId || !txid) {
      console.error('[Payment Complete] Missing required fields:', { paymentId: !!paymentId, txid: !!txid });
      return NextResponse.json(
        { success: false, message: 'paymentId and txid are required' },
        { status: 400 }
      );
    }

    // Validate paymentId format to prevent path traversal
    const paymentIdRegex = /^[a-zA-Z0-9._-]+$/;
    if (!paymentIdRegex.test(paymentId)) {
      console.error('[Payment Complete] Invalid paymentId format:', paymentId);
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId format' },
        { status: 400 }
      );
    }

    // Validate txid format (accept Pi testnet/mainnet IDs without allowing path separators)
    const txidRegex = /^[a-zA-Z0-9._-]{8,128}$/;
    if (!txidRegex.test(txid)) {
      console.error('[Payment Complete] Invalid txid format:', txid);
      return NextResponse.json(
        { success: false, message: 'Invalid transaction ID format' },
        { status: 400 }
      );
    }

    // Log request origin for security monitoring
    const origin = request.headers.get('origin') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    console.log('[Payment Complete] Request received:', {
      paymentId,
      txid,
      origin,
      referer,
      timestamp: new Date().toISOString(),
    });

    // Sandbox mode fallback - simulate completion when PI_API_KEY is not set
    if (!PI_API_KEY && PI_SANDBOX) {
      console.log('[Payment Complete] Sandbox mode: Simulating completion for:', paymentId, txid);
      return NextResponse.json({ 
        success: true, 
        paymentId,
        txid,
        status: 'completed',
        amount: 1,
        memo: 'TEC Demo Payment (Sandbox)',
        data: {
          identifier: paymentId,
          transaction: {
            txid,
            verified: true,
            _link: `https://testnet.minepi.com/blockexplorer/tx/${txid}`,
          },
          status: {
            developer_approved: true,
            transaction_verified: true,
            developer_completed: true,
            cancelled: false,
            user_cancelled: false,
          },
          amount: 1,
          memo: 'TEC Demo Payment (Sandbox)',
        }
      });
    }

    if (!PI_API_KEY) {
      console.error('[Payment Complete] PI_API_KEY is not set - cannot complete payment');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Complete the payment with Pi Platform API
    console.log('[Payment Complete] Calling Pi API for:', paymentId, txid);
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
      console.error('[Payment Complete] Pi API error:', {
        paymentId,
        txid,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { success: false, message: 'Failed to complete payment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Payment Complete] Success:', { paymentId, txid, status: data.status });
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
    console.error('[Payment Complete] Exception:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
