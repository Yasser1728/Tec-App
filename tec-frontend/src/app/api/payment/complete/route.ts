import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentId, txid } = body;

    if (!paymentId || !txid) {
      return NextResponse.json({ error: "Missing paymentId or txid" }, { status: 400 });
    }

    // Call the core backend API Gateway
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

    const response = await fetch(`${backendUrl}/api/v1/payments/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentId, txid }),
    });

    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("Complete Payment Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
