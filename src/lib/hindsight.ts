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

let _mockStore: Array<{ id: string; text: string; metadata: Record<string, unknown> }> = [];

class HindsightClient {
  constructor(public apiKey: string) {}

  async store(payload: { text: string; metadata: Record<string, unknown> }): Promise<{ id: string }> {
    const id = uuidv4();
    _mockStore.push({ id, ...payload });
    return { id };
  }

  async search(query: { query: string; filters?: Record<string, string>; topK?: number }): Promise<{ matches: HindsightMatch[] }> {
    // Basic mock implementation: filter by metadata filters and basic keyword match
    let results = _mockStore;
    if (query.filters) {
      for (const [key, val] of Object.entries(query.filters)) {
        results = results.filter(item => item.metadata[key] === val);
      }
    }
    
    // Simulate keyword matching (very basic)
    const qTerms = query.query.toLowerCase().split(' ').filter(t => t.length > 2);
    if (qTerms.length > 0) {
      results = results.filter(item => {
        const text = item.text.toLowerCase();
        return qTerms.some(term => text.includes(term));
      });
    }

    // Return mapped matches
    return {
      matches: results.slice(0, query.topK || 10).map(r => ({ metadata: r.metadata }))
    };
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
  clientId?: string,
  topK: number = 10,
): Promise<MeetingMemory[]> {
  console.log(`[Hindsight] recall — query="${query}" clientId="${clientId || 'GLOBAL'}" topK=${topK}`);

  const filters: Record<string, string> = { memoryType: 'meeting_record' };
  if (clientId) {
    filters.clientId = clientId;
  }

  const results = await hindsight.search({ query, filters, topK });

  const memories = results.matches.map(m => m.metadata as unknown as MeetingMemory);

  // Sort newest-first
  memories.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

  console.log(`[Hindsight] retrieved ${memories.length} memories for clientId="${clientId}"`);
  return memories;
}
