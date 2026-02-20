import { NextRequest, NextResponse } from 'next/server';

const isSandbox = process.env.PI_SANDBOX === 'true';

const PI_API_URL = isSandbox
  ? 'https://api.sandbox.minepi.com'
  : 'https://api.minepi.com';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: 'accessToken is required' },
        { status: 400 }
      );
    }

    const verifyResponse = await fetch(`${PI_API_URL}/v2/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!verifyResponse.ok) {
      const text = await verifyResponse.text();
      console.error("Pi verify failed:", text);

      return NextResponse.json(
        { error: 'Invalid Pi token' },
        { status: 401 }
      );
    }

    const user = await verifyResponse.json();

    return NextResponse.json({
      accessToken,
      user: {
        uid: user.uid,
        username: user.username,
      },
    });

  } catch (error) {
    console.error("Auth error:", error);
    return NextResponse.json(
      { error: 'Auth failed' },
      { status: 500 }
    );
  }
}
