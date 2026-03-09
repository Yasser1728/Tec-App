import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, amount, userId } = body;

    if (!paymentId || !amount) {
      return NextResponse.json({ error: 'Missing paymentId or amount' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the core backend API Gateway
    const backendUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

    const response = await fetch(`${backendUrl}/api/payments/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        amount,
        userId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Approve Payment Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
