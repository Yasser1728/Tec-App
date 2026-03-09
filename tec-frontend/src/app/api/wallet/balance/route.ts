import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const backendUrl = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://localhost:8080';

    // Fetch wallets for the user from the API Gateway → Wallet Service
    const response = await fetch(`${backendUrl}/api/wallets?userId=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch balance from backend');
    }

    const data = await response.json();

    // Extract balance from the primary wallet (or the first wallet)
    const wallets: Array<{ balance: number; is_primary: boolean; currency: string }> =
      data?.data?.wallets ?? [];
    const primary = wallets.find((w) => w.is_primary) ?? wallets[0];
    const balance = primary?.balance ?? 0;

    return NextResponse.json({ balance }, { status: 200 });
  } catch (error) {
    console.error('Balance fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
