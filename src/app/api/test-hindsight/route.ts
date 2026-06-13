import { NextResponse } from 'next/server';
import { storeMemory, recallMemories } from '../../../lib/hindsight';
import { MeetingMemory } from '../../../types';

export async function POST() {
  try {
    const testMemory: MeetingMemory = {
      memoryType: 'meeting_record',
      clientId: 'client-123',
      clientName: 'Acme Corp',
      meetingDate: new Date().toISOString(),
      meetingNumber: 1,
      topicsDiscussed: ['AI integration', 'Security'],
      concernsRaised: ['Cost'],
      actionItems: ['Send proposal'],
      sentiment: 'positive',
      dealStage: 'Discovery',
      rawSummary: 'Great meeting with Acme Corp regarding AI.'
    };

    const id = await storeMemory(testMemory);
    
    // Immediate recall
    const recalled = await recallMemories('AI integration', 'client-123', 1);

    return NextResponse.json({
      stored: true,
      id,
      recalled
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
