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

function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  const isAllowed = origin.endsWith('.vercel.app') || origin.startsWith('http://localhost');
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

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
      model: 'claude-3-5-sonnet-20240620',
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

  // Using alt=sse ensures we get a stream of SSE events instead of a raw JSON array
  return fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`,
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

// ── Transform Stream for Unified Output ────────────────────────────────────────
function createUnifiedStream(provider: string) {
  const decoder = new TextDecoder('utf-8');
  const encoder = new TextEncoder();
  let buffer = '';

  return new TransformStream({
    transform(chunk, controller) {
      // Decode the chunk, stream: true prevents breaking multibyte characters (like Arabic)
      buffer += decoder.decode(chunk, { stream: true });

      const lines = buffer.split('\n');
      // Keep the last potentially incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        
        const dataStr = trimmed.slice(5).trim();
        if (dataStr === '[DONE]' || !dataStr) continue;

        try {
          const parsed = JSON.parse(dataStr);
          let text = '';

          if (provider === 'claude') {
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              text = parsed.delta.text;
            }
          } else if (provider === 'groq') {
            if (parsed.choices?.[0]?.delta?.content) {
              text = parsed.choices[0].delta.content;
            }
          } else if (provider === 'gemini') {
            if (parsed.candidates?.[0]?.content?.parts?.[0]?.text) {
              text = parsed.candidates[0].content.parts[0].text;
            }
          }

          if (text) {
            // Encode the JSON safely and dispatch standardized SSE format
            const payload = JSON.stringify({ text });
            controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
          }
        } catch (e) {
          // Ignore incomplete or unparseable JSON (expected in some SSE formats)
        }
      }
    },
    flush(controller) {
      // Flush the remaining decoder buffer
      buffer += decoder.decode(new Uint8Array(), { stream: false });
    }
  });
}

// ── Main Route ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

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
        { status: 400, headers: corsHeaders }
      );
    }

    const systemPrompt = buildSystemPrompt(userContext);

    const claudeKey = process.env.ANTHROPIC_API_KEY;
    const groqKey   = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!claudeKey && !groqKey && !geminiKey) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 503, headers: corsHeaders }
      );
    }

    let response: Response | null = null;
    let provider = '';

    // 1️⃣ Claude
    if (claudeKey && !response) {
      try {
        const res = await callClaude(messages, systemPrompt, claudeKey);
        if (res.ok) { 
          response = res; 
          provider = 'claude'; 
        } else {
          console.warn('Claude failed:', res.status, await res.text().catch(() => ''));
        }
      } catch (e) {
        console.warn('Claude error:', (e as Error).message);
      }
    }

    // 2️⃣ Groq
    if (groqKey && !response) {
      try {
        const res = await callGroq(messages, systemPrompt, groqKey);
        if (res.ok) { 
          response = res; 
          provider = 'groq'; 
        } else {
          console.warn('Groq failed:', res.status, await res.text().catch(() => ''));
        }
      } catch (e) {
        console.warn('Groq error:', (e as Error).message);
      }
    }

    // 3️⃣ Gemini
    if (geminiKey && !response) {
      try {
        const res = await callGemini(messages, systemPrompt, geminiKey);
        if (res.ok) { 
          response = res; 
          provider = 'gemini'; 
        } else {
          console.warn('Gemini failed:', res.status, await res.text().catch(() => ''));
        }
      } catch (e) {
        console.warn('Gemini error:', (e as Error).message);
      }
    }

    if (!response || !response.body) {
      return NextResponse.json(
        { error: 'All AI providers failed. Please try again.' },
        { status: 502, headers: corsHeaders }
      );
    }

    // Transform the raw stream into the unified SSE format
    const stream = response.body.pipeThrough(createUnifiedStream(provider));

    return new NextResponse(stream, {
      headers: {
        ...corsHeaders,
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
      { status: 500, headers: corsHeaders }
    );
  }
}