import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { GROQ_MODEL } from '@/lib/groq';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const clientId   = formData.get('clientId')   as string | null;
    const clientName = formData.get('clientName') as string | null;

    if (!audioFile || !clientId || !clientName) {
      return NextResponse.json(
        { error: 'missing_fields', message: 'audio, clientId, and clientName are required' },
        { status: 400 }
      );
    }

    // ── Step 1: Transcribe with Whisper ──────────────────────────────────────
    let transcript = '';
    try {
      const transcription = await groq.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-large-v3',
        response_format: 'text',
      });
      // response_format: 'text' returns the string directly
      transcript = (transcription as unknown as string).trim();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transcription failed';
      console.error('[voice-ingest] Whisper error:', msg);
      return NextResponse.json(
        { error: 'transcription_failed', message: msg },
        { status: 500 }
      );
    }

    if (!transcript) {
      return NextResponse.json(
        { error: 'empty_transcript', message: 'No speech detected in the audio.' },
        { status: 422 }
      );
    }

    // ── Step 2: Extract structured memory with Groq ───────────────────────────
    const systemPrompt = `You are a meeting analyst. Extract structured meeting information and return ONLY valid JSON. No markdown, no thinking tags, no commentary.`;

    const userPrompt = `Extract structured meeting information from this voice note transcript for client "${clientName}".

Return ONLY this JSON:
{
  "title": "<short, specific meeting title>",
  "topicsDiscussed": ["<topic1>", "<topic2>"],
  "concernsRaised": ["<concern1>"],
  "actionItems": ["<action1>", "<action2>"],
  "sentiment": "positive" | "cautiously_positive" | "neutral" | "negative",
  "dealStage": "discovery" | "proposal" | "negotiation" | "closed_won" | "closed_lost" | "on_hold",
  "rawSummary": "<2-3 sentence summary of the meeting>"
}

Transcript:
${transcript}`;

    let extracted: {
      title: string;
      topicsDiscussed: string[];
      concernsRaised: string[];
      actionItems: string[];
      sentiment: 'positive' | 'cautiously_positive' | 'neutral' | 'negative';
      dealStage: 'discovery' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'on_hold';
      rawSummary: string;
    };

    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user',   content: userPrompt },
        ],
        temperature: 0.2,
        max_tokens: 800,
        stream: false,
      });

      let content = completion.choices[0]?.message?.content || '';
      // Strip thinking tags
      content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      extracted = JSON.parse(jsonMatch[0]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Extraction failed';
      console.error('[voice-ingest] Extraction error:', msg);
      // Return a fallback so the UI can still surface the transcript
      extracted = {
        title: 'Voice Note — ' + new Date().toLocaleDateString(),
        topicsDiscussed: [],
        concernsRaised: [],
        actionItems: [],
        sentiment: 'neutral',
        dealStage: 'discovery',
        rawSummary: transcript.slice(0, 300),
      };
    }

    // Sanitise arrays
    extracted.topicsDiscussed = (extracted.topicsDiscussed || []).filter(Boolean);
    extracted.concernsRaised  = (extracted.concernsRaised  || []).filter(Boolean);
    extracted.actionItems     = (extracted.actionItems     || []).filter(Boolean);

    return NextResponse.json({ transcript, extracted });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[voice-ingest]', message);
    return NextResponse.json({ error: 'server_error', message }, { status: 500 });
  }
}
