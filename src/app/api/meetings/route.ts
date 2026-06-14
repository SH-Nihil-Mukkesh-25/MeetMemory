import { NextRequest, NextResponse } from 'next/server';
import { storeMemory } from '@/lib/hindsight';
import { MeetingMemory } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const payload: MeetingMemory = await request.json();
    
    if (!payload.clientId || !payload.clientName || !payload.meetingDate) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const memoryId = await storeMemory(payload);
    return NextResponse.json({ success: true, memoryId });
  } catch (error: unknown) {
    console.error('[API/Meetings] Failed:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
