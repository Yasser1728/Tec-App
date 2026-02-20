import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';
const PI_SANDBOX = process.env.NEXT_PUBLIC_PI_SANDBOX !== 'false' && process.env.PI_SANDBOX !== 'false';

export async function POST(request: NextRequest) {
  try {
    const { recipientUid, amount, memo, metadata } = await request.json();

    if (!recipientUid || !amount || !memo) {
      return NextResponse.json({ success: false, message: 'recipientUid, amount, and memo are required' }, { status: 400 });
    }

    const uidRegex = /^[a-zA-Z0-9_-]+$/;
    if (typeof recipientUid !== 'string' || !uidRegex.test(recipientUid)) {
      return NextResponse.json({ success: false, message: 'Invalid recipientUid format' }, { status: 400 });
    }

    if (typeof amount !== 'number' || amount <= 0 || !isFinite(amount)) {
      return NextResponse.json({ success: false, message: 'Amount must be a positive number' }, { status: 400 });
    }

    if (typeof memo !== 'string' || memo.length === 0 || memo.length > 500) {
      return NextResponse.json({ success: false, message: 'Memo must be between 1 and 500 characters' }, { status: 400 });
    }

    if (!PI_API_KEY && PI_SANDBOX) {
      const mockPaymentId = `sandbox_a2u_${Date.now()}`;
      return NextResponse.json({
        success: true,
        paymentId: mockPaymentId,
        status: 'pending',
        amount,
        memo,
        data: {
          identifier: mockPaymentId,
          user_uid: recipientUid,
          amount,
          memo,
          metadata: metadata || {},
          status: {
            developer_approved: false,
            transaction_verified: false,
            developer_completed: false,
            cancelled: false,
            user_cancelled: false,
          }
        }
      });
    }

    if (!PI_API_KEY) {
      return NextResponse.json({ success: false, message: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${PI_API_URL}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: { amount, memo, metadata: metadata || {}, uid: recipientUid },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pi API A2U error:', response.status, errorText);
      return NextResponse.json({ success: false, message: 'Failed to create A2U payment' }, { status: response.status });
    }

    const data = await response.json();

    if (!data.identifier) {
      return NextResponse.json({ success: false, message: 'Invalid response from Pi API' }, { status: 500 });
    }

    return NextResponse.json({ success: true, paymentId: data.identifier, status: 'pending', amount, memo, data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
