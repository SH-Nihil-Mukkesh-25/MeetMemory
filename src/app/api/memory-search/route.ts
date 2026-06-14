import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { safeGroqTextCompletion } from '@/lib/groq';
import { format } from 'date-fns';

export async function POST(request: NextRequest) {
  try {
    const { query, clientId, clientName } = await request.json() as {
      query: string;
      clientId: string;
      clientName: string;
    };

    if (!query || !clientId) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    // Recall relevant memories
    const memories = await recallMemories(query, clientId, 5);

    if (memories.length === 0) {
      return NextResponse.json({
        answer: `No meeting history found for ${clientName}. Add some meetings first to enable memory search.`,
        meetingsReferenced: [],
      });
    }

    // Format memories for the prompt
    const memoriesText = memories
      .map(m => {
        const date = format(new Date(m.meetingDate), 'MMM d, yyyy');
        return [
          `[Meeting ${m.meetingNumber} — ${date}]`,
          m.topicsDiscussed.length ? `Topics: ${m.topicsDiscussed.join(', ')}` : '',
          m.concernsRaised.length ? `Concerns: ${m.concernsRaised.join(', ')}` : '',
          m.actionItems.length ? `Action Items: ${m.actionItems.join(', ')}` : '',
          `Sentiment: ${m.sentiment}`,
          m.rawSummary ? `Summary: ${m.rawSummary}` : '',
        ].filter(Boolean).join('\n');
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are MeetMemory, an AI assistant with access to a user's meeting history with ${clientName}. 
Answer questions concisely and specifically. Always cite meeting numbers and dates when referencing facts. 
Be direct. If the answer isn't in the memories, say so clearly. No thinking tags, no preamble — just the answer.`;

    const userPrompt = `Based on these meeting memories with ${clientName}, answer this question concisely:\n\n"${query}"\n\nMeeting history:\n\n${memoriesText}`;

    const answer = await safeGroqTextCompletion(systemPrompt, userPrompt, 'No answer generated.', 0.3, 400);

    const meetingsReferenced = memories.map(m => m.meetingNumber);

    return NextResponse.json({ answer, meetingsReferenced, memoriesUsed: memories.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[memory-search] Error:', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
