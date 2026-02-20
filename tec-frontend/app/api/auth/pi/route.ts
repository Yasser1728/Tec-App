import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    // Verify token with Pi API
    const verifyResponse = await fetch(`${PI_API_URL}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      return NextResponse.json(
        { error: 'Invalid Pi token' },
        { status: 401 }
      );
    }

    const user = await verifyResponse.json();

    // IMPORTANT:
    // Return accessToken exactly as Pi SDK expects
    return NextResponse.json({
      accessToken, // 👈 ده أهم سطر
      user: {
        uid: user.uid,
        username: user.username,
      },
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Auth failed' },
      { status: 500 }
    );
  }
}
