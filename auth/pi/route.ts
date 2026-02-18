import { NextRequest, NextResponse } from 'next/server';

const PI_API_URL = 'https://api.minepi.com';

export async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { success: false, message: 'accessToken is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${PI_API_URL}/v2/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Invalid Pi token' },
        { status: 401 }
      );
    }

    const user = await response.json();

    return NextResponse.json({
      success: true,
      user: {
        uid: user.uid,
        username: user.username,
      },
    });

  } catch (error) {
    const message = error instanceof Error ? error.message : 'Auth error';
    return NextResponse.json(
      { success: false, message },
      { status: 500 }
    );
  }
}
