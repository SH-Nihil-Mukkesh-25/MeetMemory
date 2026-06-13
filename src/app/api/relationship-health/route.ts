import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { groq, GROQ_MODEL } from '@/lib/groq';
import { format } from 'date-fns';

export interface RelationshipHealthData {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  engagementLevel: 'high' | 'medium' | 'low';
  dealMomentum: 'strong' | 'moderate' | 'stalled' | 'lost';
  sentimentHistory: number[];
  topRisk: string;
  topOpportunity: string;
  reasoning: string;
}

export async function POST(request: NextRequest) {
  try {
    const { clientId, clientName } = await request.json() as {
      clientId: string;
      clientName: string;
    };

    if (!clientId || !clientName) {
      return NextResponse.json({ error: 'missing_fields' }, { status: 400 });
    }

    const memories = await recallMemories(
      `${clientName} relationship sentiment engagement deal progress`,
      clientId,
      20
    );

    if (memories.length === 0) {
      return NextResponse.json({ error: 'no_memories', message: 'No meetings found for this client.' }, { status: 404 });
    }

    // Sort chronologically for sentimentHistory
    const chronological = [...memories].sort(
      (a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime()
    );

    const memoriesText = chronological
      .map(m => {
        const date = format(new Date(m.meetingDate), 'MMM d, yyyy');
        return [
          `[Meeting ${m.meetingNumber} — ${date}]`,
          `Sentiment: ${m.sentiment}`,
          `Deal Stage: ${m.dealStage}`,
          m.concernsRaised.length ? `Concerns: ${m.concernsRaised.join(', ')}` : '',
          m.actionItems.length ? `Action Items: ${m.actionItems.join(', ')}` : '',
          m.rawSummary ? `Summary: ${m.rawSummary}` : '',
        ].filter(Boolean).join('\n');
      })
      .join('\n\n---\n\n');

    const systemPrompt = `You are an expert relationship analyst. Analyze client meeting data and return ONLY a valid JSON object with no markdown, no thinking tags, no preamble.

The sentimentHistory array must have exactly ${chronological.length} values (one per meeting in chronological order), each an integer 0-100.
Map sentiment strings to scores: positive=80, cautiously_positive=60, neutral=50, negative=25.`;

    const userPrompt = `Analyze this client relationship history for ${clientName} and return a JSON object:
{
  "overallScore": <0-100 integer representing overall relationship health>,
  "trend": "improving" | "stable" | "declining",
  "engagementLevel": "high" | "medium" | "low",
  "dealMomentum": "strong" | "moderate" | "stalled" | "lost",
  "sentimentHistory": [<integer 0-100 per meeting in chronological order, ${chronological.length} values>],
  "topRisk": "<single biggest relationship risk in one sentence>",
  "topOpportunity": "<single biggest opportunity in one sentence>",
  "reasoning": "<2 sentences explaining the score>"
}

Meeting history (${memories.length} meetings):

${memoriesText}

Return ONLY the JSON object.`;

    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 800,
      stream: false,
    });

    let content = completion.choices[0]?.message?.content || '';
    content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const data: RelationshipHealthData = JSON.parse(jsonMatch[0]);

    // Validate + clamp
    data.overallScore = Math.max(0, Math.min(100, Math.round(data.overallScore)));
    if (!Array.isArray(data.sentimentHistory)) data.sentimentHistory = [];
    data.sentimentHistory = data.sentimentHistory.map(v => Math.max(0, Math.min(100, Math.round(Number(v) || 50))));

    return NextResponse.json({ health: data, meetingsAnalyzed: memories.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[relationship-health]', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
