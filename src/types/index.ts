export interface Client {
  id: string;
  name: string;
  company: string;
  createdAt: string;
}

export interface Meeting {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  date: string;
  meetingNumber: number;
  topicsDiscussed: string[];
  concernsRaised: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'cautiously_positive' | 'negative';
  dealStage: string;
  followUpDate?: string;
  rawSummary: string;
  hindsightMemoryId?: string;
  createdAt: string;
}

export interface MeetingMemory {
  memoryType: 'meeting_record';
  clientId: string;
  clientName: string;
  meetingDate: string;
  meetingNumber: number;
  topicsDiscussed: string[];
  concernsRaised: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'cautiously_positive' | 'negative';
  dealStage: string;
  followUpDate?: string;
  rawSummary: string;
}

export interface PrepBrief {
  contextSummary: string;
  openActionItems: string[];
  suggestedTopics: string[];
  riskFlags: string[];
  relationshipSentiment: string;
  hindsightChunksUsed: number;
}
