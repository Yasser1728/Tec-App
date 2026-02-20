import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

// Complete timeout: configurable via PI_API_COMPLETE_TIMEOUT (default 30 seconds)
const parseTimeout = (envVar: string | undefined, defaultMs: number): number => {
  const parsed = envVar ? parseInt(envVar, 10) : NaN;
  return (!isNaN(parsed) && parsed > 0) ? parsed : defaultMs;
};
const COMPLETE_TIMEOUT_MS = parseTimeout(process.env.PI_API_COMPLETE_TIMEOUT, 30000);

// Log configuration at startup
console.log('[Payment Complete] Configuration:', {
  PI_API_KEY_SET: !!PI_API_KEY,
  PI_SANDBOX,
  PI_API_URL,
});

// Warn if PI_API_KEY is missing in production
if (!PI_API_KEY && !PI_SANDBOX) {
  console.warn('[Payment Complete] WARNING: PI_API_KEY is not set in production mode! Payments will fail.');
}

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
    const paymentIdRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
    if (!paymentIdRegex.test(paymentId)) {
      console.error('[Payment Complete] Invalid paymentId format:', paymentId);
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId format' },
        { status: 400 }
      );
    }

    // Validate txid format (accept Pi testnet/mainnet IDs without allowing path separators)
    const txidRegex = /^[a-zA-Z0-9_-]{8,128}$/;
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), COMPLETE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid }),
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      const message = isAbort
        ? `Pi API complete request timed out after ${COMPLETE_TIMEOUT_MS}ms`
        : (fetchErr instanceof Error ? fetchErr.message : 'Internal server error');
      console.error('[Payment Complete] Fetch error:', { paymentId, txid, message });
      return NextResponse.json({ success: false, message }, { status: isAbort ? 504 : 500 });
    } finally {
      clearTimeout(timeoutId);
    }

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
