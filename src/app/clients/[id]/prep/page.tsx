'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Brain, CheckSquare2, MessageSquare, AlertTriangle, Activity,
  ArrowLeft, RefreshCw, ChevronDown, ChevronUp, Sparkles,
  X, Check, Clock, Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrepBrief, MeetingMemory } from '@/types';
import { getClient } from '@/lib/store';
import { Client } from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface BriefState {
  loading: boolean;
  brief: PrepBrief | null;
  memories: MeetingMemory[];
  error: string | null;
  generatedAt: Date | null;
}

// ─── Sentiment Config ────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<string, { label: string; className: string }> = {
  Warming:  { label: 'Warming',  className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  Stable:   { label: 'Stable',   className: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  Cooling:  { label: 'Cooling',  className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  Unknown:  { label: 'Unknown',  className: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30' },
};

// ─── Hindsight Retrieval Status ─────────────────────────────────────────────

const RETRIEVAL_STEPS = [
  { id: 0, emoji: '🔍', label: 'Querying Hindsight...'          },
  { id: 1, emoji: '📦', label: 'Retrieved memories'             },
  { id: 2, emoji: '🧠', label: 'Groq is synthesizing your brief...' },
  { id: 3, emoji: '✓',  label: 'Brief ready'                   },
] as const;

function HindsightStatus({ step, memoryCount }: { step: number; memoryCount?: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-violet-500/20 bg-violet-500/5 mb-4">
      <div className="flex-shrink-0 text-base">{RETRIEVAL_STEPS[step]?.emoji}</div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-violet-300">
          {step === 1 && memoryCount !== undefined
            ? `📦 Retrieved ${memoryCount} memor${memoryCount !== 1 ? 'ies' : 'y'}`
            : RETRIEVAL_STEPS[step]?.label}
        </p>
        <div className="flex gap-1 mt-1.5">
          {RETRIEVAL_STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-violet-500' : 'bg-violet-500/20'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-3 text-muted-foreground text-sm">
        <RefreshCw className="h-4 w-4 animate-spin text-violet-400" />
        <span className="text-violet-300">{label}</span>
      </div>
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-secondary" />
            <div className="h-4 w-32 rounded bg-secondary" />
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded bg-secondary" />
            <div className="h-3 w-4/5 rounded bg-secondary" />
            <div className="h-3 w-3/5 rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Brief Card ──────────────────────────────────────────────────────────────

function BriefCard({
  icon: Icon,
  title,
  children,
  className = '',
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border bg-card p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Memories Drawer ─────────────────────────────────────────────────────────

function MemoriesDrawer({ memories }: { memories: MeetingMemory[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 bg-secondary/30 hover:bg-secondary/50 transition-colors text-sm"
      >
        <span className="flex items-center gap-2 font-medium">
          <Database className="h-4 w-4 text-violet-400" />
          View retrieved Hindsight memories
          <Badge variant="outline" className="text-xs border-violet-500/30 bg-violet-500/10 text-violet-400">
            {memories.length} chunks
          </Badge>
        </span>
        {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="divide-y divide-border">
          {memories.map((m, i) => (
            <div key={i} className="px-5 py-4 bg-card hover:bg-secondary/20 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-violet-400">Meeting #{m.meetingNumber}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {format(new Date(m.meetingDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
                    {m.rawSummary || 'No summary recorded'}
                  </p>
                  {m.topicsDiscussed.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.topicsDiscussed.slice(0, 4).map(t => (
                        <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-xs text-secondary-foreground">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
                <Badge variant="outline" className="flex-shrink-0 text-xs capitalize">
                  {m.sentiment.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Brief Panel ─────────────────────────────────────────────────────────────

function BriefPanel({ brief, memories, isDemo = false }: {
  brief: PrepBrief;
  memories: MeetingMemory[];
  isDemo?: boolean;
}) {
  const sentiment = SENTIMENT_CONFIG[brief.relationshipSentiment] || SENTIMENT_CONFIG.Unknown;

  return (
    <div className="space-y-3">
      {/* Context Summary */}
      <BriefCard icon={Brain} title="Relationship Context">
        <p className="text-sm text-muted-foreground leading-relaxed">{brief.contextSummary}</p>
      </BriefCard>

      {/* Open Action Items */}
      <BriefCard icon={CheckSquare2} title="Open Action Items">
        {brief.openActionItems.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No open action items found.</p>
        ) : (
          <ul className="space-y-2">
            {brief.openActionItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded border border-border flex items-center justify-center">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        )}
      </BriefCard>

      {/* Suggested Topics */}
      <BriefCard icon={MessageSquare} title="Suggested Topics">
        {brief.suggestedTopics.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No topics suggested.</p>
        ) : (
          <ol className="space-y-2">
            {brief.suggestedTopics.map((topic, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="flex-shrink-0 h-5 w-5 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                {topic}
              </li>
            ))}
          </ol>
        )}
      </BriefCard>

      {/* Risk Flags */}
      <BriefCard
        icon={AlertTriangle}
        title="Risk Flags"
        className={brief.riskFlags.length > 0 ? 'border-amber-500/20 bg-amber-500/5' : ''}
      >
        {brief.riskFlags.length === 0 ? (
          <p className="text-sm text-emerald-400 italic">No risk flags detected.</p>
        ) : (
          <ul className="space-y-2">
            {brief.riskFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-amber-300">
                <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-amber-400" />
                {flag}
              </li>
            ))}
          </ul>
        )}
      </BriefCard>

      {/* Relationship Sentiment */}
      <BriefCard icon={Activity} title="Relationship Sentiment">
        <Badge variant="outline" className={`text-sm font-medium border px-3 py-1 ${sentiment.className}`}>
          {sentiment.label}
        </Badge>
      </BriefCard>

      {/* Memories drawer — only in full (non-demo) or demo mode with memories */}
      {!isDemo && memories.length > 0 && <MemoriesDrawer memories={memories} />}
    </div>
  );
}

// ─── Demo Split Panel ────────────────────────────────────────────────────────

function DemoSplitView({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [coldState, setColdState] = useState<BriefState>({ loading: true, brief: null, memories: [], error: null, generatedAt: null });
  const [hotState, setHotState] = useState<BriefState>({ loading: true, brief: null, memories: [], error: null, generatedAt: null });

  useEffect(() => {
    // Fire both requests simultaneously
    const coldFetch = fetch('/api/prep-brief-cold', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName }),
    }).then(r => r.json()).then(data => {
      setColdState({ loading: false, brief: data.brief, memories: [], error: data.error || null, generatedAt: new Date() });
    }).catch(e => setColdState(s => ({ ...s, loading: false, error: e.message })));

    const hotFetch = fetch('/api/prep-brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientName }),
    }).then(r => r.json()).then(data => {
      if (data.error) {
        setHotState(s => ({ ...s, loading: false, error: data.message }));
      } else {
        setHotState({ loading: false, brief: data.brief, memories: data.memories || [], error: null, generatedAt: new Date() });
      }
    }).catch(e => setHotState(s => ({ ...s, loading: false, error: e.message })));

    Promise.all([coldFetch, hotFetch]);
  }, [clientId, clientName]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left — Cold / No Memory */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
          <X className="h-4 w-4 text-rose-400" />
          <span className="text-sm font-semibold text-rose-400">No Memory</span>
          <span className="text-xs text-muted-foreground ml-auto">Generic AI response</span>
        </div>
        {coldState.loading ? (
          <LoadingSkeleton label="Generating without context..." />
        ) : coldState.error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-400">{coldState.error}</div>
        ) : coldState.brief ? (
          <BriefPanel brief={coldState.brief} memories={[]} isDemo />
        ) : null}
      </div>

      {/* Right — Hot / Hindsight Powered */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
          <Check className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-semibold text-emerald-400">Hindsight Powered</span>
          <span className="text-xs text-muted-foreground ml-auto">Personalized with memory</span>
        </div>
        {hotState.loading ? (
          <LoadingSkeleton label="Retrieving memories from Hindsight..." />
        ) : hotState.error ? (
          <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-5 text-sm text-rose-400">{hotState.error}</div>
        ) : hotState.brief ? (
          <>
            <BriefPanel brief={hotState.brief} memories={hotState.memories} isDemo />
            {hotState.memories.length > 0 && <MemoriesDrawer memories={hotState.memories} />}
          </>
        ) : null}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function PrepPage({ params }: { params: { id: string } }) {
  const [client, setClient]   = useState<Client | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [retrievalStep, setRetrievalStep] = useState(0);
  const [memoryCount, setMemoryCount]     = useState<number | undefined>(undefined);
  const [state, setState] = useState<BriefState>({
    loading: true,
    brief: null,
    memories: [],
    error: null,
    generatedAt: null,
  });

  useEffect(() => {
    setClient(getClient(params.id));
  }, [params.id]);

  const generateBrief = useCallback(async () => {
    if (!client) return;
    setState({ loading: true, brief: null, memories: [], error: null, generatedAt: null });
    setRetrievalStep(0);
    setMemoryCount(undefined);

    // Step 0: querying
    await new Promise(r => setTimeout(r, 500));
    setRetrievalStep(1);

    try {
      const res = await fetch('/api/prep-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, clientName: client.name }),
      });
      // Step 2: synthesizing
      setRetrievalStep(2);
      const data = await res.json();

      if (data.error) {
        setState(s => ({ ...s, loading: false, error: data.message }));
      } else {
        // Step 1 retroactively shows count, then jump to step 2→3
        setMemoryCount(data.memories?.length ?? 0);
        setRetrievalStep(3);
        await new Promise(r => setTimeout(r, 300));
        setState({
          loading: false,
          brief: data.brief,
          memories: data.memories || [],
          error: null,
          generatedAt: new Date(),
        });
      }
    } catch (err) {
      setState(s => ({ ...s, loading: false, error: err instanceof Error ? err.message : 'Unknown error' }));
    }
  }, [client]);

  useEffect(() => {
    if (client && !demoMode) generateBrief();
  }, [client, demoMode, generateBrief]);

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Link href="/clients"><Button variant="outline" className="mt-4">Back to Clients</Button></Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href={`/clients/${params.id}`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {client.name}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-400" />
            Meeting Prep
            <span className="text-muted-foreground font-normal">— {client.name}</span>
          </h1>
          {!demoMode && state.memories.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5 text-violet-400" />
              Powered by <span className="text-violet-400 font-medium">{state.memories.length} memories</span> from Hindsight
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Demo Mode Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDemoMode(d => !d)}
            className={demoMode ? 'border-violet-500/50 bg-violet-500/10 text-violet-400' : ''}
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            {demoMode ? 'Exit Demo Mode' : 'Demo Mode: Before/After'}
          </Button>

          {/* Regenerate */}
          {!demoMode && (
            <Button
              variant="outline"
              size="sm"
              onClick={generateBrief}
              disabled={state.loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${state.loading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          )}
        </div>
      </div>

      {/* Demo Mode */}
      {demoMode ? (
        <DemoSplitView clientId={client.id} clientName={client.name} />
      ) : (
        <>
          {/* Loading */}
          {state.loading && (
            <>
              <HindsightStatus step={retrievalStep} memoryCount={memoryCount} />
              <LoadingSkeleton
                label={retrievalStep <= 1 ? 'Querying Hindsight memory layer...' : 'Groq is synthesizing your brief...'}
              />
            </>
          )}

          {/* Error */}
          {!state.loading && state.error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
              <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-rose-400">{state.error}</p>
              {state.error.includes('No meeting history') && (
                <Link href={`/clients/${params.id}`}>
                  <Button variant="outline" size="sm" className="mt-4">
                    Add meetings first
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Brief Output */}
          {!state.loading && state.brief && (
            <>
              <BriefPanel brief={state.brief} memories={state.memories} />

              {/* Memories Drawer */}
              {state.memories.length > 0 && (
                <div className="mt-3">
                  <MemoriesDrawer memories={state.memories} />
                </div>
              )}

              {/* Footer */}
              {state.generatedAt && (
                <p className="text-xs text-muted-foreground text-center mt-6">
                  Brief generated from {state.brief.hindsightChunksUsed} Hindsight memory chunk{state.brief.hindsightChunksUsed !== 1 ? 's' : ''}
                  {' '}• {format(state.generatedAt, 'MMM d, yyyy h:mm a')}
                </p>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
