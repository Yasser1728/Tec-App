import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

// Log configuration at startup
console.log('[Payment Incomplete] Configuration:', {
  PI_API_KEY_SET: !!PI_API_KEY,
  PI_SANDBOX,
  PI_API_URL,
});

export async function POST(request: NextRequest) {
  try {
    const { paymentId } = await request.json();
    
    if (!paymentId) {
      console.error('[Payment Incomplete] Missing paymentId');
      return NextResponse.json(
        { success: false, message: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Validate paymentId format to prevent path traversal
    const paymentIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!paymentIdRegex.test(paymentId)) {
      console.error('[Payment Incomplete] Invalid paymentId format:', paymentId);
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId format' },
        { status: 400 }
      );
    }

    console.log('[Payment Incomplete] Processing incomplete payment:', paymentId);

    // Sandbox mode fallback
    if (!PI_API_KEY && PI_SANDBOX) {
      console.log('[Payment Incomplete] Sandbox mode: No action needed for:', paymentId);
      return NextResponse.json({ 
        success: true, 
        action: 'no_action_needed', 
        paymentId,
        message: 'Sandbox mode - no incomplete payment handling needed'
      });
    }

    if (!PI_API_KEY) {
      console.error('[Payment Incomplete] PI_API_KEY is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Get the payment details
    console.log('[Payment Incomplete] Fetching payment details for:', paymentId);
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Payment Incomplete] Failed to fetch payment:', {
        paymentId,
        status: response.status,
        error: errorText,
      });
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment' },
        { status: response.status }
      );
    }

    const payment = await response.json();
    console.log('[Payment Incomplete] Payment status:', {
      paymentId,
      developer_approved: payment.status?.developer_approved,
      developer_completed: payment.status?.developer_completed,
      has_txid: !!payment.transaction?.txid,
    });

    // If the payment has a txid but isn't completed, complete it
    if (payment.transaction && payment.transaction.txid && !payment.status.developer_completed) {
      console.log('[Payment Incomplete] Attempting to complete payment:', paymentId);
      const completeResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ txid: payment.transaction.txid }),
      });

      if (completeResponse.ok) {
        console.log('[Payment Incomplete] Successfully completed payment:', paymentId);
        return NextResponse.json({ success: true, action: 'completed', paymentId });
      } else {
        const errorText = await completeResponse.text();
        console.error('[Payment Incomplete] Failed to complete payment:', {
          paymentId,
          status: completeResponse.status,
          error: errorText,
        });
        return NextResponse.json(
          { success: false, message: 'Failed to complete payment', action: 'complete_failed' },
          { status: completeResponse.status }
        );
      }
    }

    // If payment is not approved yet, approve it
    if (!payment.status.developer_approved) {
      console.log('[Payment Incomplete] Attempting to approve payment:', paymentId);
      const approveResponse = await fetch(`${PI_API_URL}/v2/payments/${paymentId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Key ${PI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (approveResponse.ok) {
        console.log('[Payment Incomplete] Successfully approved payment:', paymentId);
        return NextResponse.json({ success: true, action: 'approved', paymentId });
      } else {
        const errorText = await approveResponse.text();
        console.error('[Payment Incomplete] Failed to approve payment:', {
          paymentId,
          status: approveResponse.status,
          error: errorText,
        });
        return NextResponse.json(
          { success: false, message: 'Failed to approve payment', action: 'approve_failed' },
          { status: approveResponse.status }
        );
      }
    }

    console.log('[Payment Incomplete] No action needed for payment:', paymentId);
    return NextResponse.json({ success: true, action: 'no_action_needed', paymentId });
  } catch (error: unknown) {
    console.error('[Payment Incomplete] Exception:', {
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
