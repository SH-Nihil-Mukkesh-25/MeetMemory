'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import {
  Building2, Calendar, ChevronDown, ChevronUp, AlertCircle, CheckSquare2, Brain, Plus, Database, Clock, Network, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MeetingRecorder } from './components/MeetingRecorder';
import { MemoryChat } from './components/MemoryChat';
import { RelationshipHealth } from './components/RelationshipHealth';
import { VoiceNoteRecorder } from './components/VoiceNoteRecorder';
import { DemoSeeder } from './components/DemoSeeder';
import { getClient, getMeetings, deleteClient } from '@/lib/store';
import { Client, Meeting } from '@/types';
import { useRouter } from 'next/navigation';

// ─── Config ──────────────────────────────────────────────────────────────────

const SENTIMENT_CONFIG: Record<Meeting['sentiment'], {
  label: string; badgeClass: string; dotClass: string; lineClass: string;
}> = {
  positive:           { label: 'Positive',   badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', dotClass: 'bg-emerald-500 shadow-emerald-500/40',  lineClass: 'bg-emerald-500/30' },
  cautiously_positive:{ label: 'Cautious',   badgeClass: 'bg-amber-500/15  text-amber-400  border-amber-500/30',   dotClass: 'bg-amber-500  shadow-amber-500/40',    lineClass: 'bg-amber-500/30'  },
  neutral:            { label: 'Neutral',     badgeClass: 'bg-zinc-500/15   text-zinc-400   border-zinc-500/30',    dotClass: 'bg-zinc-500   shadow-zinc-500/40',     lineClass: 'bg-zinc-500/30'   },
  negative:           { label: 'Negative',    badgeClass: 'bg-rose-500/15   text-rose-400   border-rose-500/30',    dotClass: 'bg-rose-500   shadow-rose-500/40',     lineClass: 'bg-rose-500/30'   },
};

// ─── Timeline Meeting Node ────────────────────────────────────────────────────

function TimelineNode({ meeting, isLast }: { meeting: Meeting; isLast: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const s = SENTIMENT_CONFIG[meeting.sentiment];

  return (
    <div className="flex gap-4">
      {/* Left — dot + vertical line */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`relative flex h-8 w-8 items-center justify-center rounded-full ${s.dotClass} shadow-lg flex-shrink-0 z-10`}>
          <span className="text-white text-[9px] font-bold">M{meeting.meetingNumber}</span>
        </div>
        {!isLast && (
          <div className={`w-px flex-1 min-h-6 mt-1 ${s.lineClass}`} />
        )}
      </div>

      {/* Right — card */}
      <div className="flex-1 pb-6">
        <div className="rounded-xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md overflow-hidden transition-all duration-200 hover:border-[#c15f3c]/40 shadow-sm hover:shadow-[0_0_15px_rgba(193,95,60,0.05)]">
          <button
            className="w-full text-left p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
            onClick={() => setExpanded(e => !e)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-xs text-zinc-400 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 flex-shrink-0" />
                  {format(new Date(meeting.date), 'MMM d, yyyy')}
                </p>
                {meeting.hindsightMemoryId && (
                  <span className="text-[10px] font-medium text-[#c15f3c] bg-[#c15f3c]/10 px-2 py-0.5 rounded-full border border-[#c15f3c]/20 flex items-center gap-1">
                    <Database className="h-2.5 w-2.5" />
                    Stored in Hindsight ✓
                  </span>
                )}
                <Badge variant="outline" className={`text-[10px] font-medium border py-0 h-5 ${s.badgeClass}`}>
                  {s.label}
                </Badge>
              </div>

              <p className="font-semibold text-sm truncate mb-2 text-zinc-100">
                {meeting.title || `Meeting #${meeting.meetingNumber}`}
              </p>

              <div className="flex flex-wrap gap-1.5">
                {meeting.topicsDiscussed.map(t => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 text-[10px] border border-zinc-700">{t}</span>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0 text-zinc-500 mt-2 sm:mt-0">
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </button>

          {/* Expanded details */}
          {expanded && (
            <div className="px-5 pb-5 border-t border-[rgba(255,255,255,0.05)] pt-5 space-y-5">
              {meeting.concernsRaised.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertCircle className="h-3 w-3 text-rose-400" />Concerns Raised
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {meeting.concernsRaised.map(c => (
                      <span key={c} className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">{c}</span>
                    ))}
                  </div>
                </div>
              )}

              {meeting.actionItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckSquare2 className="h-3 w-3 text-[#c15f3c]" />Action Items
                  </p>
                  <ul className="space-y-1.5">
                    {meeting.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                        <span className="mt-0.5 flex-shrink-0 h-4 w-4 rounded border border-zinc-700 flex items-center justify-center">
                          <span className="h-1.5 w-1.5 rounded-full bg-[#c15f3c]" />
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {meeting.rawSummary && (
                <div>
                  <p className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Summary</p>
                  <blockquote className="border-l-2 border-[#c15f3c]/50 pl-3 text-sm text-zinc-400 leading-relaxed italic bg-[rgba(255,255,255,0.01)] py-1 pr-2 rounded-r-md">
                    {meeting.rawSummary}
                  </blockquote>
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
    <div className="rounded-xl border border-dashed border-[rgba(193,95,60,0.3)] bg-[rgba(193,95,60,0.02)] p-10 text-center space-y-4">
      <div className="h-14 w-14 rounded-2xl bg-[#c15f3c]/10 border border-[#c15f3c]/20 flex items-center justify-center mx-auto">
        <Database className="h-6 w-6 text-[#c15f3c]" />
      </div>
      <div>
        <h3 className="font-semibold text-lg text-zinc-200">No memories yet.</h3>
        <p className="text-sm text-zinc-400 max-w-md mx-auto mt-2 leading-relaxed">
          Record your first interaction and MeetMemory will start building a persistent semantic memory profile for {clientName}.
        </p>
      </div>
      <Button onClick={onAdd} className="bg-[#c15f3c] hover:bg-[#d97757] text-white shadow-[0_0_15px_rgba(193,95,60,0.3)]">
        <Plus className="h-4 w-4 mr-1.5" />
        Record First Meeting
      </Button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ClientDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [recorderOpen, setRecorderOpen] = useState(false);

  const handleDeleteClient = () => {
    if (window.confirm('Are you sure you want to delete this client? All their meetings will be lost.')) {
      deleteClient(params.id);
      router.push('/clients');
    }
  };

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pt-28 text-center">
        <p className="text-zinc-400">Client not found.</p>
        <Link href="/clients"><Button variant="outline" className="mt-4 border-zinc-700 text-zinc-300">Back to Clients</Button></Link>
      </div>
    );
  }

  const totalActionItems = meetings.reduce((sum, m) => sum + m.actionItems.length, 0);
  const lastMeeting = meetings[0];
  const memoriesInHindsight = meetings.filter(m => m.hindsightMemoryId).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">

      {/* ── Client Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#c15f3c] to-[#8a4229] flex items-center justify-center text-2xl font-bold text-white shadow-[0_0_20px_rgba(193,95,60,0.3)] flex-shrink-0">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white">{client.name}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
              <span className="flex items-center gap-1.5 text-sm text-zinc-400">
                <Building2 className="h-3.5 w-3.5" />{client.company}
              </span>
            </div>

            {/* Memory stats row */}
            <div className="flex flex-wrap items-center gap-3 mt-3">
              <Badge variant="outline" className="gap-1.5 text-xs border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-zinc-300">
                <Calendar className="h-3 w-3 text-[#c15f3c]" />
                {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
              </Badge>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-[#c15f3c]/30 bg-[#c15f3c]/10 text-xs font-medium text-[#c15f3c]">
                <Database className="h-3 w-3" />
                {memoriesInHindsight} Memories in Hindsight
              </div>
              {lastMeeting && (
                <span className="text-xs text-zinc-500 flex items-center gap-1.5">
                  <Clock className="h-3 w-3" />
                  Last interaction: {format(new Date(lastMeeting.date), 'MMM d, yyyy')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
          <DemoSeeder clientId={client.id} clientName={client.name} onSuccess={refresh} />
          <Link href={`/graph?highlight=${params.id}`}>
            <Button variant="outline" size="sm" className="border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300">
              <Network className="h-4 w-4 mr-1.5 text-[#c15f3c]" />View in Graph
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={() => setRecorderOpen(true)} className="border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.08)] text-zinc-300">
            <Plus className="h-4 w-4 mr-1.5" />Add Meeting
          </Button>
          <Link href={`/clients/${params.id}/prep`}>
            <Button size="sm" className="bg-[#c15f3c] hover:bg-[#d97757] text-white border-0 shadow-[0_0_15px_rgba(193,95,60,0.3)]">
              <Brain className="h-4 w-4 mr-1.5" />Prepare Brief
            </Button>
          </Link>
          <Button variant="outline" size="sm" onClick={handleDeleteClient} className="border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/30 text-zinc-300 transition-colors px-2.5">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Main Layout: 65/35 Grid ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
        
        {/* LEFT: Ask MeetMemory (65%) */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="rounded-2xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md overflow-hidden flex flex-col flex-1 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
            <div className="p-4 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.2)] flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
                <Brain className="h-4 w-4 text-[#c15f3c]" />
                Ask MeetMemory
              </h2>
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Powered by Groq & Hindsight</span>
            </div>
            <div className="flex-1 p-4">
              <MemoryChat clientId={client.id} clientName={client.name} />
            </div>
          </div>
        </div>

        {/* RIGHT: Supporting Cards (35%) */}
        <div className="lg:col-span-4 space-y-6">
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

          {/* Memory Profile Card */}
          {meetings.length > 0 && (
            <div className="rounded-2xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md p-5 space-y-4 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
              <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
                <Database className="h-4 w-4 text-[#c15f3c]" />
                Memory Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Memories Stored</span>
                  <span className="font-medium tabular-nums text-[#c15f3c]">{memoriesInHindsight}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Topics Learned</span>
                  <span className="font-medium tabular-nums text-zinc-200">
                    {new Set(meetings.flatMap(m => m.topicsDiscussed)).size}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Open Commitments</span>
                  <span className="font-medium tabular-nums text-zinc-200">{totalActionItems}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Last Added</span>
                  <span className="font-medium text-zinc-200">{lastMeeting ? format(new Date(lastMeeting.date), 'MMM d') : '-'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Timeline Section ────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto border-t border-[rgba(255,255,255,0.05)] pt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-zinc-100">
            <Clock className="h-5 w-5 text-zinc-500" />
            Memory Timeline
            {meetings.length > 0 && (
              <span className="text-zinc-500 text-sm font-normal">({meetings.length})</span>
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
