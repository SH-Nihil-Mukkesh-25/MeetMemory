import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { safeGroqTextCompletion } from '@/lib/groq';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json() as {
      query: string;
    };

    if (!query) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Recall relevant memories globally (no clientId)
    const memories = await recallMemories(query, undefined, 10);

    if (memories.length === 0) {
      return NextResponse.json({
        answer: "No meeting history found across any clients. Add some meetings first to enable global memory chat.",
        memoriesUsed: 0,
        memories: [],
      });
    }

    // Format memories for the prompt, explicitly including Client Name
    const memoriesText = memories
      .map(m => {
        const date = format(new Date(m.meetingDate), 'MMM d, yyyy');
        return [
          `[Client: ${m.clientName} | Meeting ${m.meetingNumber} — ${date}]`,
          m.topicsDiscussed.length ? `Topics: ${m.topicsDiscussed.join(', ')}` : '',
          m.concernsRaised.length ? `Concerns: ${m.concernsRaised.join(', ')}` : '',
          m.actionItems.length ? `Action Items: ${m.actionItems.join(', ')}` : '',
          `Sentiment: ${m.sentiment}`,
          m.rawSummary ? `Summary: ${m.rawSummary}` : '',
        ].filter(Boolean).join('\n');
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are MeetMemory, a premium AI colleague powered by Hindsight semantic memory. 
You are currently in Global Mode, meaning you have access to memories across ALL clients.
Answer the user's question intelligently based on the provided Hindsight Memories.
Always be concise, intelligent, and cite specific clients, meeting numbers, and dates from your memory when applicable.
Do not use markdown headers, just plain conversational text.`;

    const userPrompt = `Question: "${query}"\n\nHindsight Memories (Global):\n\n${memoriesText}`;

    const answer = await safeGroqTextCompletion(systemPrompt, userPrompt, 'Request timed out or failed to generate an answer.', 0.3, 600);

    return NextResponse.json({ 
      answer, 
      memoriesUsed: memories.length,
      memories 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ask-meetmemory] Error:', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
