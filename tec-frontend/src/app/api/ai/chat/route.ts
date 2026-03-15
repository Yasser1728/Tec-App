import { NextRequest, NextResponse } from 'next/server';
import { TEC_SYSTEM_PROMPT } from '@/lib/ai/tec-ai-system-prompt';

export const runtime = 'edge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const buildSystemPrompt = (userContext?: {
  username?: string;
  balance?: number;
  locale?: string;
}) => `${TEC_SYSTEM_PROMPT}

## CURRENT USER CONTEXT
${userContext?.username ? `- Username: @${userContext.username}` : '- User: Guest'}
${userContext?.balance !== undefined ? `- TEC Balance: ${userContext.balance.toFixed(2)} TEC` : ''}
${userContext?.locale ? `- Language preference: ${userContext.locale === 'ar' ? 'Arabic' : 'English'}` : ''}
`;

// ── 1️⃣ Claude (Anthropic) ─────────────────────────────────────────────────────
const callClaude = async (
  messages: Message[],
  systemPrompt: string,
  apiKey: string
): Promise<Response> => {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      stream: true,
    }),
  });
};

// ── 2️⃣ Groq (Free) ────────────────────────────────────────────────────────────
const callGroq = async (
  messages: Message[],
  systemPrompt: string,
  apiKey: string
): Promise<Response> => {
  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages,
      ],
      stream: true,
    }),
  });
};

// ── 3️⃣ Gemini (Free) ──────────────────────────────────────────────────────────
const callGemini = async (
  messages: Message[],
  systemPrompt: string,
  apiKey: string
): Promise<Response> => {
  // Convert messages to Gemini format
  const geminiMessages = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: geminiMessages,
        generationConfig: { maxOutputTokens: 1024 },
      }),
    }
  );
};

// ── Main Route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { messages, userContext } = await req.json() as {
      messages: Message[];
      userContext?: {
        username?: string;
        balance?: number;
        locale?: string;
      };
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'messages array is required' },
        { status: 400 }
      );
    }

    const systemPrompt = buildSystemPrompt(userContext);

    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!claudeKey && !groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503 }
      );
    }

    let response: Response | null = null;
    let provider = '';

    // 1️⃣ Claude
    if (claudeKey && !response) {
      try {
        const res = await callClaude(messages, systemPrompt, claudeKey);
        if (res.ok) { response = res; provider = 'claude'; }
        else console.warn('Claude failed:', res.status);
      } catch (e) {
        console.warn('Claude error:', (e as Error).message);
      }
    }

    // 2️⃣ Groq
    if (groqKey && !response) {
      try {
        const res = await callGroq(messages, systemPrompt, groqKey);
        if (res.ok) { response = res; provider = 'groq'; }
        else console.warn('Groq failed:', res.status);
      } catch (e) {
        console.warn('Groq error:', (e as Error).message);
      }
    }

    // 3️⃣ Gemini
    if (geminiKey && !response) {
      try {
        const res = await callGemini(messages, systemPrompt, geminiKey);
        if (res.ok) { response = res; provider = 'gemini'; }
        else console.warn('Gemini failed:', res.status);
      } catch (e) {
        console.warn('Gemini error:', (e as Error).message);
      }
    }

    if (!response) {
      return NextResponse.json(
        { error: 'All AI providers failed. Please try again.' },
        { status: 502 }
      );
    }

    return new NextResponse(response.body, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-AI-Provider': provider,
      },
    });

  } catch (error) {
    console.error('AI chat route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
