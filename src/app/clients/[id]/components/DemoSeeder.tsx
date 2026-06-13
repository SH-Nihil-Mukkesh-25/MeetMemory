'use client';

import { useState } from 'react';
import { Loader2, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { createMeeting } from '@/lib/store';

// ─── Seed data ────────────────────────────────────────────────────────────────

function buildSeedMeetings(clientId: string, clientName: string) {
  const now = Date.now();
  const day  = 86_400_000;

  return [
    {
      clientId,
      clientName,
      title:           'Initial Discovery Call',
      date:            new Date(now - 21 * day).toISOString(),
      meetingNumber:   1,
      topicsDiscussed: ['pricing structure', 'team size', 'current pain points'],
      concernsRaised:  ['budget constraints', 'competing vendor evaluation'],
      actionItems:     ['send pricing proposal', 'share case studies'],
      sentiment:       'cautiously_positive' as const,
      dealStage:       'discovery' as const,
      rawSummary:
        'First call with client. Strong interest but budget is a concern. They are evaluating two other vendors. Promised to send pricing proposal and relevant case studies by end of week.',
    },
    {
      clientId,
      clientName,
      title:           'Proposal Walkthrough',
      date:            new Date(now - 14 * day).toISOString(),
      meetingNumber:   2,
      topicsDiscussed: ['enterprise plan features', 'implementation timeline', 'onboarding process'],
      concernsRaised:  ['6-week implementation feels long', 'needs board approval for budget'],
      actionItems:     ['revise timeline to 4 weeks', 'prepare board presentation deck'],
      sentiment:       'positive' as const,
      dealStage:       'proposal' as const,
      rawSummary:
        'Walked through the enterprise proposal. Client loves the feature set. Main friction is the implementation timeline and internal budget approval. They are ready to move if we can compress the timeline and help them get board buy-in.',
    },
    {
      clientId,
      clientName,
      title:           'Technical Deep Dive',
      date:            new Date(now - 7 * day).toISOString(),
      meetingNumber:   3,
      topicsDiscussed: ['API integration', 'data migration', 'security compliance', 'mobile requirements'],
      concernsRaised:  ['GDPR compliance questions', 'mobile app not on roadmap'],
      actionItems:     ['send security whitepaper', 'confirm mobile app roadmap date', 'intro call with their IT team'],
      sentiment:       'cautiously_positive' as const,
      dealStage:       'negotiation' as const,
      rawSummary:
        'Technical stakeholder joined the call. Deep questions on security and compliance — we need to send the whitepaper. They revealed that mobile is a hard requirement and were disappointed it is not on the immediate roadmap. Need to escalate the mobile timeline internally.',
    },
    {
      clientId,
      clientName,
      title:           'Commercial Review',
      date:            new Date(now - 1 * day).toISOString(),
      meetingNumber:   4,
      topicsDiscussed: ['final pricing', 'contract terms', 'rollout plan'],
      concernsRaised:  ['mobile still unresolved', 'procurement process takes 3 weeks'],
      actionItems:     ['send revised contract', 'schedule kickoff for post-signing', 'confirm mobile roadmap commitment in writing'],
      sentiment:       'neutral' as const,
      dealStage:       'negotiation' as const,
      rawSummary:
        'Commercial review call. Pricing is agreed. Contract terms are mostly aligned. Two blockers remain: mobile roadmap commitment needs to be in writing, and their procurement process adds 3 weeks to the timeline. Deal is close but needs these resolved.',
    },
  ];
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DemoSeederProps {
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export function DemoSeeder({ clientId, clientName, onSuccess }: DemoSeederProps) {
  const [loading, setLoading] = useState(false);

  // Only show in development or when ?demo=true
  const isDev = process.env.NODE_ENV === 'development';
  const hasParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('demo') === 'true';
  if (!isDev && !hasParam) return null;

  const seed = async () => {
    setLoading(true);
    try {
      const meetings = buildSeedMeetings(clientId, clientName);
      for (const m of meetings) {
        // Store locally
        const local = createMeeting(m);

        // Store in Hindsight via API
        await fetch('/api/meetings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...m, id: local.id }),
        });

        // Small delay so Hindsight doesn't get hammered
        await new Promise(r => setTimeout(r, 200));
      }

      toast.success('🌱 4 meetings seeded to Hindsight', {
        description: 'Try the prep brief now — you should get a sharp, context-aware brief.',
      });
      onSuccess();
    } catch (err) {
      toast.error('✗ Seeding failed', {
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={seed}
      disabled={loading}
      className="border-dashed border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/60 transition-all"
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        : <Leaf className="h-3.5 w-3.5 mr-1.5" />
      }
      Seed Demo Data
    </Button>
  );
}
