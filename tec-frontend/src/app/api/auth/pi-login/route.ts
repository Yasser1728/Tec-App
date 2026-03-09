import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { authResult } = await request.json();

    if (!authResult) {
      return NextResponse.json({ error: 'Missing authResult' }, { status: 400 });
    }

    // Forward to backend API Gateway
    const backendUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

    const response = await fetch(`${backendUrl}/api/auth/pi-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ authResult }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Pi Auth Route Error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
