import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { MeetingMemory, PrepBrief } from '@/types';
import { format } from 'date-fns';

function formatMemoriesForPrompt(memories: MeetingMemory[]): string {
  return memories
    .map(m => {
      const date = format(new Date(m.meetingDate), 'MMM d, yyyy');
      return [
        `[Meeting ${m.meetingNumber} — ${date}]`,
        `Topics: ${m.topicsDiscussed.length ? m.topicsDiscussed.join(', ') : 'None recorded'}`,
        `Concerns: ${m.concernsRaised.length ? m.concernsRaised.join(', ') : 'None recorded'}`,
        `Action Items: ${m.actionItems.length ? m.actionItems.join(', ') : 'None recorded'}`,
        `Sentiment: ${m.sentiment}`,
        `Deal Stage: ${m.dealStage}`,
        `Summary: ${m.rawSummary || 'No summary provided'}`,
        '---',
      ].join('\n');
    })
    .join('\n\n');
}

const SYSTEM_PROMPT = `You are MeetMemory, an AI meeting intelligence assistant. You help professionals prepare for client meetings using their complete relationship history stored in memory.

Always respond with ONLY a valid JSON object — no markdown, no explanation, no thinking tags, no extra text. The JSON must have exactly these keys:
{
  "contextSummary": "2-3 sentences summarizing the relationship history and where things stand",
  "openActionItems": ["array of specific unresolved commitments or follow-ups"],
  "suggestedTopics": ["array of topics to address in the upcoming meeting"],
  "riskFlags": ["array of risks, concerns, or things that could derail the meeting"],
  "relationshipSentiment": "one word: Warming / Stable / Cooling / Unknown",
  "hindsightChunksUsed": 0
}

Be specific. Reference meeting numbers and dates. Surface commitments the user might have forgotten. Never be generic. If you don't have enough context, say so inside the relevant field.`;

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientName, query } = await request.json() as {
      clientId: string;
      clientName: string;
      query?: string;
    };

    if (!clientId || !clientName) {
      return NextResponse.json({ error: 'missing_fields', message: 'clientId and clientName are required' }, { status: 400 });
    }

    const recallQuery = query || `${clientName} meeting history concerns action items commitments deal stage`;

    // 1. Recall memories from Hindsight
    const memories = await recallMemories(recallQuery, clientId, 10);

    // 2. No memories guard
    if (memories.length === 0) {
      return NextResponse.json({
        error: 'no_memories',
        message: 'No meeting history found for this client. Add some meetings first.',
      }, { status: 404 });
    }

    // 3. Build prompt
    const memoriesText = formatMemoriesForPrompt(memories);
    const userMessage = `Prepare me for my upcoming meeting with ${clientName}.

Here is my complete relationship history retrieved from Hindsight memory (${memories.length} memories):

${memoriesText}

Generate the meeting prep brief now. Respond with ONLY the JSON object.`;

    // 4. Call Groq with streaming
    const stream = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.4,
      max_tokens: 1500,
      stream: true,
    });

    // 5. Collect streamed chunks
    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      fullContent += delta;
    }

    // 6. Strip any thinking tags (qwen3 sometimes emits <think>...</think>)
    fullContent = fullContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // 7. Extract JSON from response (handle possible markdown code fences)
    const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('LLM returned no parseable JSON');
    }

    let brief: PrepBrief;
    try {
      brief = JSON.parse(jsonMatch[0]);
      brief.hindsightChunksUsed = memories.length;
    } catch {
      brief = {
        contextSummary: `Failed to parse AI response. Raw output: ${fullContent.slice(0, 200)}`,
        openActionItems: [],
        suggestedTopics: [],
        riskFlags: ['AI response was malformed — try regenerating'],
        relationshipSentiment: 'Unknown',
        hindsightChunksUsed: memories.length,
      };
    }

    return NextResponse.json({ brief, memoriesUsed: memories.length, memories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[prep-brief] Error:', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
