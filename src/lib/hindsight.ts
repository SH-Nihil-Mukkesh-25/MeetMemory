import { MeetingMemory } from '../types';
import { v4 as uuidv4 } from 'uuid';

if (!process.env.HINDSIGHT_API_KEY) {
  console.warn('HINDSIGHT_API_KEY is not set — using mock Hindsight client');
}

// ─── Mock Hindsight Client ────────────────────────────────────────────────────
// Replace the class below with the real @hindsight-so/client SDK when available.

interface HindsightMatch {
  metadata: Record<string, unknown>;
}

class HindsightClient {
  constructor(public apiKey: string) {}

  async store(): Promise<{ id: string }> {
    // Mock: in production this would call the Hindsight REST/SDK endpoint
    return { id: uuidv4() };
  }

  async search(): Promise<{ matches: HindsightMatch[] }> {
    // Mock: always returns an empty result set so the real UI empty-state is exercised
    return { matches: [] };
  }
}

export const hindsight = new HindsightClient(process.env.HINDSIGHT_API_KEY || 'mock_key');

// ─── Public API ───────────────────────────────────────────────────────────────

export async function storeMemory(payload: MeetingMemory): Promise<string> {
  const result = await hindsight.store({
    text: [
      `Meeting on ${payload.meetingDate} with ${payload.clientName} (Client ID: ${payload.clientId}).`,
      `Topics discussed: ${payload.topicsDiscussed.join(', ') || 'none'}.`,
      `Concerns: ${payload.concernsRaised.join(', ') || 'none'}.`,
      `Action items: ${payload.actionItems.join(', ') || 'none'}.`,
      `Sentiment: ${payload.sentiment}. Deal stage: ${payload.dealStage}.`,
      payload.rawSummary ? `Summary: ${payload.rawSummary}` : '',
    ].filter(Boolean).join(' '),
    metadata: {
      memoryType:      payload.memoryType,
      clientId:        payload.clientId,
      clientName:      payload.clientName,
      meetingDate:     payload.meetingDate,
      meetingNumber:   payload.meetingNumber,
      topicsDiscussed: payload.topicsDiscussed,
      concernsRaised:  payload.concernsRaised,
      actionItems:     payload.actionItems,
      sentiment:       payload.sentiment,
      dealStage:       payload.dealStage,
      rawSummary:      payload.rawSummary || '',
      followUpDate:    payload.followUpDate || null,
    },
  });

  return result.id;
}

export async function recallMemories(
  query: string,
  clientId: string,
  topK: number = 10,
): Promise<MeetingMemory[]> {
  console.log(`[Hindsight] recall — query="${query}" clientId="${clientId}" topK=${topK}`);

  const results = await hindsight.search({ query, filters: { clientId, memoryType: 'meeting_record' }, topK });

  const memories = results.matches.map(m => m.metadata as unknown as MeetingMemory);

  // Sort newest-first
  memories.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

  console.log(`[Hindsight] retrieved ${memories.length} memories for clientId="${clientId}"`);
  return memories;
}
