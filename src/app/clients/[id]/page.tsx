'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Building2, Briefcase, Tag, ExternalLink, Calendar, ChevronDown, ChevronUp,
  AlertCircle, CheckSquare2, Brain, Plus, Database, Clock, Network
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MeetingRecorder } from './components/MeetingRecorder';
import { MemorySearch } from './components/MemorySearch';
import { RelationshipHealth } from './components/RelationshipHealth';
import { VoiceNoteRecorder } from './components/VoiceNoteRecorder';
import { DemoSeeder } from './components/DemoSeeder';
import { getClient, getMeetings } from '@/lib/store';
import { Client, Meeting } from '@/types';

// ─── Config ──────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<Meeting['sentiment'], {
  label: string; badgeClass: string; dotClass: string; lineClass: string;
}> = {
  positive:           { label: 'Positive',   badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotClass: 'bg-emerald-500 shadow-emerald-500/40',  lineClass: 'bg-emerald-500/30' },
  cautiously_positive:{ label: 'Cautious',   badgeClass: 'bg-amber-500/15  text-amber-400  border-amber-500/30',   dotClass: 'bg-amber-500  shadow-amber-500/40',    lineClass: 'bg-amber-500/30'  },
  neutral:            { label: 'Neutral',     badgeClass: 'bg-zinc-500/15   text-zinc-400   border-zinc-500/30',    dotClass: 'bg-zinc-500   shadow-zinc-500/40',     lineClass: 'bg-zinc-500/30'   },
  negative:           { label: 'Negative',    badgeClass: 'bg-rose-500/15   text-rose-400   border-rose-500/30',    dotClass: 'bg-rose-500   shadow-rose-500/40',     lineClass: 'bg-rose-500/30'   },
};

const DEAL_STAGE_LABELS: Record<string, string> = {
  discovery: 'Discovery', proposal: 'Proposal', negotiation: 'Negotiation',
  closed_won: 'Closed Won', closed_lost: 'Closed Lost', on_hold: 'On Hold',
};

// ─── Timeline Meeting Node ────────────────────────────────────────────────────

function TimelineNode({ meeting, isLast }: { meeting: Meeting; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const s = SENTIMENT_CONFIG[meeting.sentiment];

  return (
    <div className="flex gap-4">
      {/* Left — dot + vertical line */}
      <div className="flex flex-col items-center flex-shrink-0">
        {/* Dot with meeting badge */}
        <div className={`relative flex h-9 w-9 items-center justify-center rounded-full ${s.dotClass} shadow-lg flex-shrink-0 z-10`}>
          <span className="text-white text-[10px] font-bold">M{meeting.meetingNumber}</span>
        </div>
        {/* Vertical connector */}
        {!isLast && (
          <div className={`w-0.5 flex-1 min-h-6 mt-1 ${s.lineClass}`} />
        )}
      </div>

      {/* Right — card */}
      <div className="flex-1 pb-6">
        <div className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-200 hover:border-border/80">
          {/* Card header — always visible */}
          <button
            className="w-full text-left px-4 py-4 hover:bg-secondary/20 transition-colors"
            onClick={() => setExpanded(e => !e)}
          >
            {/* Row 1: title + date */}
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">
                  {meeting.title || `Meeting #${meeting.meetingNumber}`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  {format(new Date(meeting.date), 'MMM d, yyyy')}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="outline" className={`text-xs font-medium border ${s.badgeClass}`}>
                  {s.label}
                </Badge>
                {expanded
                  ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  : <ChevronDown className="h-4 w-4 text-muted-foreground" />
                }
              </div>
            </div>

            {/* Row 2: topic chips */}
            {meeting.topicsDiscussed.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {meeting.topicsDiscussed.slice(0, 3).map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{t}</span>
                ))}
                {meeting.topicsDiscussed.length > 3 && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                    +{meeting.topicsDiscussed.length - 3} more
                  </span>
                )}
              </div>
            )}

            {/* Row 3: stats */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              {meeting.actionItems.length > 0 && (
                <span className="flex items-center gap-1">
                  <CheckSquare2 className="h-3 w-3" />
                  {meeting.actionItems.length} action{meeting.actionItems.length !== 1 ? 's' : ''}
                </span>
              )}
              {meeting.concernsRaised.length > 0 && (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {meeting.concernsRaised.length} concern{meeting.concernsRaised.length !== 1 ? 's' : ''}
                </span>
              )}
              {meeting.dealStage && (
                <Badge variant="outline" className="text-xs border-border py-0">
                  {DEAL_STAGE_LABELS[meeting.dealStage] || meeting.dealStage}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                Show details {expanded ? '▲' : '▼'}
              </span>
            </div>
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="px-4 pb-4 border-t border-border pt-4 space-y-4">
              {/* Full topics */}
              {meeting.topicsDiscussed.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="h-3 w-3" />Topics Discussed
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meeting.topicsDiscussed.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-secondary text-xs text-secondary-foreground">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {meeting.concernsRaised.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3" />Concerns Raised
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meeting.concernsRaised.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action items as checklist */}
              {meeting.actionItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare2 className="h-3 w-3" />Action Items
                  </p>
                  <ul className="space-y-1.5">
                    {meeting.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded border border-border flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Raw summary as blockquote */}
              {meeting.rawSummary && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Summary</p>
                  <blockquote className="border-l-2 border-border pl-3 text-sm text-muted-foreground leading-relaxed italic">
                    {meeting.rawSummary}
                  </blockquote>
                </div>
              )}

              {/* Follow-up date */}
              {meeting.followUpDate && (
                <div className="flex items-center gap-2 text-sm text-amber-400">
                  <Clock className="h-3.5 w-3.5" />
                  Follow-up: {format(new Date(meeting.followUpDate), 'MMM d, yyyy')}
                </div>
              )}

              {/* Hindsight memory ID badge */}
              {meeting.hindsightMemoryId && (
                <div className="flex items-center gap-2 pt-1">
                  <Badge variant="outline" className="border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs gap-1.5">
                    <Database className="h-3 w-3" />
                    Stored in Hindsight · {meeting.hindsightMemoryId.slice(0, 8)}…
                  </Badge>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyMeetings({ clientName, onAdd }: { clientName: string; onAdd: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border p-10 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center mx-auto">
        <Brain className="h-7 w-7 text-muted-foreground opacity-60" />
      </div>
      <div>
        <p className="text-sm font-semibold">No meetings yet</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
          Add your first meeting to start building <span className="text-foreground font-medium">{clientName}</span>&apos;s memory profile.
        </p>
      </div>
      <Button onClick={onAdd} className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25">
        <Plus className="h-4 w-4 mr-1.5" />Add First Meeting
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [recorderOpen, setRecorderOpen] = useState(false);

  const refresh = useCallback(() => {
    const c = getClient(params.id);
    setClient(c);
    if (c) {
      const m = getMeetings(params.id).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setMeetings(m);
    }
  }, [params.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  if (!client) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-muted-foreground">Client not found.</p>
        <Link href="/clients"><Button variant="outline" className="mt-4">Back to Clients</Button></Link>
      </div>
    );
  }

  const totalActionItems = meetings.reduce((sum, m) => sum + m.actionItems.length, 0);
  const lastMeeting = meetings[0];
  const memoriesInHindsight = meetings.filter(m => m.hindsightMemoryId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Client Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-violet-500/20 flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />{client.company}
              </span>
              {client.role && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Briefcase className="h-3.5 w-3.5" />{client.role}
                </span>
              )}
              {client.industry && (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Tag className="h-3.5 w-3.5" />{client.industry}
                </span>
              )}
              {client.linkedinUrl && (
                <a href={client.linkedinUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  LinkedIn <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            {/* Memory stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="outline" className="gap-1.5 text-xs border-border">
                <Calendar className="h-3 w-3" />
                {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
              </Badge>
              <Badge variant="outline" className="gap-1.5 text-xs border-violet-500/30 bg-violet-500/10 text-violet-400">
                <Database className="h-3 w-3" />
                {memoriesInHindsight} in Hindsight
              </Badge>
              {lastMeeting && (
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last meeting: {format(new Date(lastMeeting.date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <DemoSeeder clientId={client.id} clientName={client.name} onSuccess={refresh} />
          <Link href={`/graph?highlight=${params.id}`}>
            <Button variant="outline" size="sm">
              <Network className="h-4 w-4 mr-1.5" />View in Graph
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setRecorderOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Add Meeting
          </Button>
          <Link href={`/clients/${params.id}/prep`}>
            <Button size="sm" className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-violet-500/25">
              <Brain className="h-4 w-4 mr-1.5" />Prepare
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Memory Search ─────────────────────────────────────────────── */}
      {meetings.length > 0 && (
        <div className="mb-8">
          <MemorySearch clientId={client.id} clientName={client.name} />
        </div>
      )}

      {/* ── Main layout ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Meeting Timeline */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Meeting History
              {meetings.length > 0 && (
                <span className="text-muted-foreground text-sm font-normal">({meetings.length})</span>
              )}
            </h2>
          </div>

          {meetings.length === 0 ? (
            <EmptyMeetings clientName={client.name} onAdd={() => setRecorderOpen(true)} />
          ) : (
            <div>
              {meetings.map((m, i) => (
                <TimelineNode key={m.id} meeting={m} isLast={i === meetings.length - 1} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Voice note recorder */}
          <VoiceNoteRecorder
            clientId={client.id}
            clientName={client.name}
            meetingCount={meetings.length}
            onSuccess={refresh}
          />

          {/* Relationship health */}
          <RelationshipHealth
            clientId={client.id}
            clientName={client.name}
            meetingCount={meetings.length}
          />

          {/* Quick stats */}
          {meetings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <h3 className="text-sm font-semibold">Quick Stats</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total meetings</span>
                  <span className="font-medium tabular-nums">{meetings.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Memories stored</span>
                  <span className="font-medium tabular-nums text-violet-400">{memoriesInHindsight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Open actions</span>
                  <span className="font-medium tabular-nums">{totalActionItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Deal stage</span>
                  <span className="font-medium text-right">{DEAL_STAGE_LABELS[lastMeeting.dealStage] || lastMeeting.dealStage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last meeting</span>
                  <span className="font-medium">{format(new Date(lastMeeting.date), 'MMM d')}</span>
                </div>
                {lastMeeting.followUpDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Follow-up</span>
                    <span className="font-medium text-amber-400">{format(new Date(lastMeeting.followUpDate), 'MMM d')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sentiment legend */}
          {meetings.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-5 space-y-2">
              <h3 className="text-sm font-semibold mb-3">Sentiment Key</h3>
              {Object.entries(SENTIMENT_CONFIG).map(([key, cfg]) => (
                <div key={key} className="flex items-center gap-2 text-xs">
                  <span className={`h-2 w-2 rounded-full ${cfg.dotClass}`} />
                  <span className="text-muted-foreground">{cfg.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MeetingRecorder
        open={recorderOpen}
        onOpenChange={setRecorderOpen}
        clientId={client.id}
        clientName={client.name}
        onSuccess={refresh}
      />
    </div>
  );
}
