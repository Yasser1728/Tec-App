import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';
const PI_API_KEY = process.env.PI_API_KEY || '';

export async function POST(request: NextRequest) {
  try {
    const { recipientUid, amount, memo, metadata } = await request.json();

    if (!recipientUid || !amount || !memo) {
      return NextResponse.json(
        { success: false, message: 'recipientUid, amount, and memo are required' },
        { status: 400 }
      );
    }

    if (!PI_API_KEY) {
      console.error('PI_API_KEY is not set');
      return NextResponse.json(
        { success: false, message: 'Server configuration error: PI_API_KEY not set' },
        { status: 500 }
      );
    }

    // Create A2U payment via Pi Platform API
    const response = await fetch(`${PI_API_URL}/v2/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${PI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        payment: {
          amount,
          memo,
          metadata: metadata || {},
          uid: recipientUid,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Pi API A2U error:', response.status, errorText);
      return NextResponse.json(
        { success: false, message: `Pi API error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.identifier) {
      console.error('Pi API response missing identifier:', data);
      return NextResponse.json(
        { success: false, message: 'Invalid response from Pi API: missing payment identifier' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      paymentId: data.identifier,
      status: 'pending',
      amount,
      memo,
      data,
    });
  } catch (error: unknown) {
    console.error('A2U Payment error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
