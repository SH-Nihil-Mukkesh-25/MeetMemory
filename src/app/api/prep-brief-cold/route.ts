import { NextRequest, NextResponse } from 'next/server';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { PrepBrief } from '@/types';

const SYSTEM_PROMPT = `You are a generic meeting assistant with NO historical context about this client. You must generate a prep brief based only on the client's name — you have no meeting history, no notes, no memory.

Respond with ONLY a valid JSON object — no markdown, no explanation, no thinking tags:
{
  "contextSummary": "2-3 sentences — be honest that you have no relationship history",
  "openActionItems": [],
  "suggestedTopics": ["generic topics relevant to a first or unknown meeting"],
  "riskFlags": ["generic risks when you have no context"],
  "relationshipSentiment": "Unknown",
  "hindsightChunksUsed": 0
}`;

export async function POST(request: NextRequest) {
  try {
    const { clientName } = await request.json() as { clientName: string };

    if (!clientName) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Prepare me for a meeting with ${clientName}. I have no prior meeting history with them.` },
      ],
      temperature: 0.3,
      max_tokens: 800,
      stream: true,
    });

    let fullContent = '';
    for await (const chunk of stream) {
      fullContent += chunk.choices[0]?.delta?.content || '';
    }

    fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const jsonMatch = fullContent.match(/\{[\s\S]*\}/);

    let brief: PrepBrief;
    try {
      brief = JSON.parse(jsonMatch?.[0] || '{}');
      brief.hindsightChunksUsed = 0;
    } catch {
      brief = {
        contextSummary: `No memory context available for ${clientName}. Walking in blind.`,
        openActionItems: [],
        suggestedTopics: ['Introductions', 'Understanding their goals', 'Identifying pain points'],
        riskFlags: ['No relationship history — risk of repeating past conversations or missing context'],
        relationshipSentiment: 'Unknown',
        hindsightChunksUsed: 0,
      };
    }

    return NextResponse.json({ brief, memoriesUsed: 0 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
