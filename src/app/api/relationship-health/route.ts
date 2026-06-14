import { NextRequest, NextResponse } from 'next/server';
import { recallMemories } from '@/lib/hindsight';
import { safeGroqJsonCompletion } from '@/lib/groq';
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
      return NextResponse.json({
        health: {
          overallScore: 50,
          trend: 'stable',
          engagementLevel: 'low',
          dealMomentum: 'moderate',
          sentimentHistory: [],
          topRisk: 'No historical data to assess risk.',
          topOpportunity: 'Establish initial relationship and trust.',
          reasoning: 'No meeting history exists for this client. Score reflects a neutral baseline.'
        },
        meetingsAnalyzed: 0
      });
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

    const fallbackHealth: RelationshipHealthData = {
      overallScore: 50,
      trend: 'stable',
      engagementLevel: 'medium',
      dealMomentum: 'moderate',
      sentimentHistory: Array(chronological.length).fill(50),
      topRisk: 'Data processing timeout or error.',
      topOpportunity: 'Refresh the analysis.',
      reasoning: 'The AI model timed out or failed to parse the response.'
    };

    const data = await safeGroqJsonCompletion<RelationshipHealthData>(systemPrompt, userPrompt, fallbackHealth, 0.2);

    // Validate + clamp
    data.overallScore = Math.max(0, Math.min(100, Math.round(data.overallScore || 50)));
    if (!Array.isArray(data.sentimentHistory)) data.sentimentHistory = Array(chronological.length).fill(50);
    data.sentimentHistory = data.sentimentHistory.map(v => Math.max(0, Math.min(100, Math.round(Number(v) || 50))));

    return NextResponse.json({ health: data, meetingsAnalyzed: memories.length });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[relationship-health]', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
