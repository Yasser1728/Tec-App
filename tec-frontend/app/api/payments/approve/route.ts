import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

// Approve timeout: configurable via PI_API_APPROVE_TIMEOUT (default 30 seconds)
const parseTimeout = (envVar: string | undefined, defaultMs: number): number => {
  const parsed = envVar ? parseInt(envVar, 10) : NaN;
  return (!isNaN(parsed) && parsed > 0) ? parsed : defaultMs;
};
const APPROVE_TIMEOUT_MS = parseTimeout(process.env.PI_API_APPROVE_TIMEOUT, 30000);

// Log configuration at startup
console.log('[Payment Approve] Configuration:', {
  PI_API_KEY_SET: !!PI_API_KEY,
  PI_SANDBOX,
  PI_API_URL,
});

// Warn if PI_API_KEY is missing in production
if (!PI_API_KEY && !PI_SANDBOX) {
  console.warn('[Payment Approve] WARNING: PI_API_KEY is not set in production mode! Payments will fail.');
}

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      console.error('[Payment Approve] Missing paymentId');
      return NextResponse.json(
        { success: false, message: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Validate paymentId format to prevent path traversal
    const paymentIdRegex = /^[a-zA-Z0-9]+([._-][a-zA-Z0-9]+)*$/;
    if (!paymentIdRegex.test(paymentId)) {
      console.error('[Payment Approve] Invalid paymentId format:', paymentId);
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId format' },
        { status: 400 }
      );
    }

    // Log request origin for security monitoring
    const origin = request.headers.get('origin') || 'unknown';
    const referer = request.headers.get('referer') || 'unknown';
    console.log('[Payment Approve] Request received:', {
      paymentId,
      origin,
      referer,
      timestamp: new Date().toISOString(),
    });

    // Sandbox mode fallback - simulate approval when PI_API_KEY is not set
    if (!PI_API_KEY && PI_SANDBOX) {
      console.log('[Payment Approve] Sandbox mode: Simulating approval for:', paymentId);
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
      console.error('[Payment Approve] PI_API_KEY is not set - cannot approve payment');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Approve the payment with Pi Platform API
    console.log('[Payment Approve] Calling Pi API for:', paymentId);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), APPROVE_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
    } catch (fetchErr: unknown) {
      clearTimeout(timeoutId);
      const isAbort = fetchErr instanceof Error && fetchErr.name === 'AbortError';
      const message = isAbort
        ? `Pi API approve request timed out after ${APPROVE_TIMEOUT_MS}ms`
        : (fetchErr instanceof Error ? fetchErr.message : 'Internal server error');
      console.error('[Payment Approve] Fetch error:', { paymentId, message });
      return NextResponse.json({ success: false, message }, { status: isAbort ? 504 : 500 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Payment Approve] Pi API error:', {
        paymentId,
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });
      return NextResponse.json(
        { success: false, message: 'Failed to approve payment' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Payment Approve] Success:', { paymentId, status: data.status });
    return NextResponse.json({ success: true, paymentId, data });
  } catch (error: unknown) {
    console.error('[Payment Approve] Exception:', {
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
