import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    
    if (!paymentId) {
      return NextResponse.json(
        { success: false, message: 'paymentId is required' },
        { status: 400 }
      );
    }

    // Validate paymentId format to prevent path traversal
    const paymentIdRegex = /^[a-zA-Z0-9._-]+$/;
    if (!paymentIdRegex.test(paymentId)) {
      console.error('[Payment Status] Invalid paymentId format:', paymentId);
      return NextResponse.json(
        { success: false, message: 'Invalid paymentId format' },
        { status: 400 }
      );
    }

    // Sandbox mode fallback
    if (!PI_API_KEY && PI_SANDBOX) {
      console.log('[Sandbox] Returning mock payment status for:', paymentId);
      
      // Check if it's a sandbox payment
      const isSandboxPayment = paymentId.startsWith('sandbox_');
      
      // Generate deterministic txid based on paymentId for consistency
      const mockTxid = isSandboxPayment ? `tx_${paymentId.slice(8)}` : undefined;
      
      return NextResponse.json({
        success: true,
        paymentId,
        status: isSandboxPayment ? 'completed' : 'pending',
        amount: 1,
        memo: 'TEC Demo Payment (Sandbox)',
        txid: mockTxid,
        data: {
          identifier: paymentId,
          amount: 1,
          memo: 'TEC Demo Payment (Sandbox)',
          status: {
            developer_approved: true,
            transaction_verified: isSandboxPayment,
            developer_completed: isSandboxPayment,
            cancelled: false,
            user_cancelled: false,
          },
          transaction: isSandboxPayment ? {
            txid: mockTxid,
            verified: true,
          } : null,
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

    // Get payment status from Pi Platform API
    const response = await fetch(`${PI_API_URL}/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pi API status error:', errorText);
      return NextResponse.json(
        { success: false, message: 'Failed to fetch payment status' },
        { status: response.status }
      );
    }

    const payment = await response.json();
    
    // Determine payment status
    let status: 'pending' | 'approved' | 'completed' | 'cancelled' | 'failed' = 'pending';
    if (payment.status.cancelled || payment.status.user_cancelled) {
      status = 'cancelled';
    } else if (payment.status.developer_completed) {
      status = 'completed';
    } else if (payment.status.developer_approved) {
      status = 'approved';
    }
    
    return NextResponse.json({
      success: true,
      paymentId: payment.identifier,
      status,
      amount: payment.amount || 0,
      memo: payment.memo || '',
      txid: payment.transaction?.txid,
      data: payment,
    });
  } catch (error: unknown) {
    console.error('Payment status error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
