import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { safeGroqJsonCompletion } from '@/lib/groq';
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

    // 2. No memories guard - Return graceful zero-state
    if (memories.length === 0) {
      return NextResponse.json({
        brief: {
          contextSummary: `No meeting history exists for ${clientName}. This will be your first recorded interaction.`,
          openActionItems: ['None'],
          suggestedTopics: ['Introductions', 'Discovery', 'Establish expectations'],
          riskFlags: ['None known'],
          relationshipSentiment: 'Unknown',
          hindsightChunksUsed: 0,
        },
        memoriesUsed: 0,
        memories: []
      });
    }

    // 3. Build prompt
    const memoriesText = formatMemoriesForPrompt(memories);
    const userMessage = `Prepare me for my upcoming meeting with ${clientName}.

Here is my complete relationship history retrieved from Hindsight memory (${memories.length} memories):

${memoriesText}

Generate the meeting prep brief now. Respond with ONLY the JSON object.`;

    const fallbackBrief: PrepBrief = {
      contextSummary: 'Failed to parse AI response or request timed out.',
      openActionItems: [],
      suggestedTopics: [],
      riskFlags: ['AI response failed — try regenerating'],
      relationshipSentiment: 'Unknown',
      hindsightChunksUsed: memories.length,
    };

    const brief = await safeGroqJsonCompletion<PrepBrief>(SYSTEM_PROMPT, userMessage, fallbackBrief, 0.4);
    brief.hindsightChunksUsed = memories.length;

    return NextResponse.json({ brief, memoriesUsed: memories.length, memories });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[prep-brief] Error:', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
