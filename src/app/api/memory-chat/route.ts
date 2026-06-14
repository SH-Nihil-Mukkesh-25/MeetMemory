import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { groq, GROQ_MODEL } from '@/lib/groq';
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
        answer: `No meeting history found for ${clientName}. Add some meetings first to enable memory chat.`,
        memoriesUsed: 0,
        memories: [],
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

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        {
          role: 'system',
          content: `You are MeetMemory, a premium AI colleague powered by Hindsight semantic memory. 
Answer the user's question about the client ${clientName}.
Always be concise, intelligent, and cite specific meeting numbers/dates from your memory.
Do not use markdown headers, just plain conversational text.`,
        },
        {
          role: 'user',
          content: `Question: "${query}"\n\nHindsight Memories:\n\n${memoriesText}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 500,
      stream: false,
    });

    let answer = completion.choices[0]?.message?.content || 'No answer generated.';
    answer = answer.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    return NextResponse.json({ 
      answer, 
      memoriesUsed: memories.length,
      memories 
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[memory-chat] Error:', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
