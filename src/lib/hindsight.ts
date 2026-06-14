import { MeetingMemory } from '../types';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

if (!process.env.HINDSIGHT_API_KEY) {
  console.warn('HINDSIGHT_API_KEY is not set — using mock Hindsight client');
}

// ─── Mock Hindsight Client ────────────────────────────────────────────────────

interface HindsightMatch {
  metadata: Record<string, unknown>;
}

type StoreItem = { id: string; text: string; metadata: Record<string, unknown> };

const MOCK_DB_PATH = path.join(process.cwd(), 'hindsight-mock-db.json');

function loadMockStore(): StoreItem[] {
  try {
    if (fs.existsSync(MOCK_DB_PATH)) {
      const data = fs.readFileSync(MOCK_DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Failed to load mock DB:', err);
  }
  return [];
}

function saveMockStore(store: StoreItem[]) {
  try {
    fs.writeFileSync(MOCK_DB_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error('Failed to save mock DB:', err);
  }
}

let _mockStore: StoreItem[] = loadMockStore();

class HindsightClient {
  constructor(public apiKey: string) {}

  async store(payload: { text: string; metadata: Record<string, unknown> }): Promise<{ id: string }> {
    const id = uuidv4();
    _mockStore.push({ id, ...payload });
    saveMockStore(_mockStore);
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
    
    // In a real vector database, this would do semantic search.
    // For the demo mock, we simply return all matching documents for the client,
    // up to topK, and rely on Groq (the LLM) to semantically answer the user's query from the context.
    
    // Return mapped matches
    return {
      matches: results.slice(0, query.topK || 10).map(r => ({ metadata: r.metadata }))
    };
  }
}

export const hindsight = new HindsightClient(process.env.HINDSIGHT_API_KEY || 'mock_key');

// ─── Public API ───────────────────────────────────────────────────────────────

export async function storeMemory(payload: MeetingMemory): Promise<string> {
  try {
    const result = await hindsight.store({
      text: [
        `Meeting on ${payload.meetingDate} with ${payload.clientName} (Client ID: ${payload.clientId}).`,
        `Topics discussed: ${payload.topicsDiscussed?.join(', ') || 'none'}.`,
        `Concerns: ${payload.concernsRaised?.join(', ') || 'none'}.`,
        `Action items: ${payload.actionItems?.join(', ') || 'none'}.`,
        `Sentiment: ${payload.sentiment}. Deal stage: ${payload.dealStage}.`,
        payload.rawSummary ? `Summary: ${payload.rawSummary}` : '',
      ].filter(Boolean).join(' '),
      metadata: {
        memoryType:      payload.memoryType,
        clientId:        payload.clientId,
        clientName:      payload.clientName,
        meetingDate:     payload.meetingDate,
        meetingNumber:   payload.meetingNumber,
        topicsDiscussed: payload.topicsDiscussed || [],
        concernsRaised:  payload.concernsRaised || [],
        actionItems:     payload.actionItems || [],
        sentiment:       payload.sentiment,
        dealStage:       payload.dealStage,
        rawSummary:      payload.rawSummary || '',
        followUpDate:    payload.followUpDate || null,
      },
    });

    return result.id;
  } catch (error) {
    console.error('[Hindsight] Failed to store memory:', error);
    return `fallback_${Date.now()}`;
  }
}

export async function recallMemories(
  query: string,
  clientId?: string,
  topK: number = 10,
): Promise<MeetingMemory[]> {
  try {
    console.log(`[Hindsight] recall — query="${query}" clientId="${clientId || 'GLOBAL'}" topK=${topK}`);

    const filters: Record<string, string> = { memoryType: 'meeting_record' };
    if (clientId) {
      filters.clientId = clientId;
    }

    const results = await hindsight.search({ query, filters, topK });

    const memories = results.matches.map(m => m.metadata as unknown as MeetingMemory);

    // Sort newest-first
    memories.sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());

    console.log(`[Hindsight] retrieved ${memories.length} memories for clientId="${clientId || 'GLOBAL'}"`);
    return memories;
  } catch (error) {
    console.error('[Hindsight] Failed to recall memories:', error);
    return [];
  }
}
