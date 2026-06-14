'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Network, Search, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { KnowledgeGraph, GraphNode, GraphData } from './components/KnowledgeGraph';
import { HindsightBadge } from '@/components/hindsight-ui';
import { getAllMeetings, getClients } from '@/lib/store';

// ─── Build graph data from local store ───────────────────────────────────────

function buildGraphData(): GraphData {
  const clients = getClients();
  const meetings = getAllMeetings();

  const nodeMap = new Map<string, GraphNode>();
  const linkMap = new Map<string, { source: string; target: string; type: 'topic' | 'concern' | 'action' | 'meeting'; weight: number }>();

  // Client nodes
  clients.forEach(c => {
    nodeMap.set(`client:${c.id}`, {
      id: `client:${c.id}`,
      label: c.name,
      type: 'client',
      clientId: c.id,
      count: 1,
    });
  });

  const addLink = (source: string, target: string, type: 'topic' | 'concern' | 'action' | 'meeting') => {
    const key = `${source}→${target}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      linkMap.set(key, { source, target, type, weight: 1 });
    }
  };

  const addNode = (id: string, label: string, type: 'topic' | 'concern' | 'action' | 'meeting', date?: number) => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, type, count: 1, date });
    } else {
      nodeMap.get(id)!.count += 1;
    }
  };

  meetings.forEach(m => {
    const clientNodeId = `client:${m.clientId}`;
    if (!nodeMap.has(clientNodeId)) return;

    const meetingNodeId = `meeting:${m.id}`;
    addNode(meetingNodeId, `M${m.meetingNumber}`, 'meeting', new Date(m.date).getTime());

    let hasConnections = false;

    m.topicsDiscussed.forEach(t => {
      hasConnections = true;
      const id = `topic:${t.toLowerCase()}`;
      addNode(id, t, 'topic');
      addLink(clientNodeId, id, 'topic');
      addLink(id, meetingNodeId, 'meeting');
    });

    m.concernsRaised.forEach(c => {
      hasConnections = true;
      const id = `concern:${c.toLowerCase()}`;
      addNode(id, c, 'concern');
      addLink(clientNodeId, id, 'concern');
      addLink(id, meetingNodeId, 'meeting');
    });

    m.actionItems.forEach(a => {
      hasConnections = true;
      const short = a.length > 30 ? a.slice(0, 30) + '…' : a;
      const id = `action:${a.toLowerCase().slice(0, 40)}`;
      addNode(id, short, 'action');
      addLink(clientNodeId, id, 'action');
      addLink(id, meetingNodeId, 'meeting');
    });

    if (!hasConnections) {
      addLink(clientNodeId, meetingNodeId, 'meeting');
    }
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { key: 'client',  label: 'Clients',      color: 'bg-[#c15f3c]/20 text-[#c15f3c] border-[#c15f3c]/40' },
  { key: 'topic',   label: 'Topics',       color: 'bg-[#4ea8ff]/20 text-[#4ea8ff] border-[#4ea8ff]/40' },
  { key: 'concern', label: 'Concerns',     color: 'bg-[#ffb547]/20 text-[#ffb547] border-[#ffb547]/40' },
  { key: 'action',  label: 'Action Items', color: 'bg-[#27c498]/20 text-[#27c498] border-[#27c498]/40' },
  { key: 'meeting', label: 'Memory Nodes', color: 'bg-[#f4f3ee]/20 text-[#f4f3ee] border-[#f4f3ee]/40' },
] as const;

// ─── Side panel ───────────────────────────────────────────────────────────────

interface SidePanelProps {
  node: GraphNode;
  onClose: () => void;
}

function SidePanel({ node, onClose }: SidePanelProps) {
  const allMeetings = getAllMeetings();
  
  let meetings: any[] = [];
  if (node.type === 'meeting') {
    const meetingId = node.id.split(':')[1];
    const m = allMeetings.find(m => m.id === meetingId);
    if (m) meetings = [m];
  } else {
    meetings = allMeetings.filter(m =>
      (node.type === 'topic'   && m.topicsDiscussed.some(t => `topic:${t.toLowerCase()}`   === node.id)) ||
      (node.type === 'concern' && m.concernsRaised.some(c => `concern:${c.toLowerCase()}`  === node.id)) ||
      (node.type === 'action'  && m.actionItems.some(a => `action:${a.toLowerCase().slice(0, 40)}` === node.id))
    );
  }

  // Calculate First and Last Seen
  const sortedDates = meetings.map(m => new Date(m.date).getTime()).sort((a,b) => a - b);
  const firstSeen = sortedDates.length > 0 ? new Date(sortedDates[0]).toLocaleDateString() : 'N/A';
  const lastSeen = sortedDates.length > 0 ? new Date(sortedDates[sortedDates.length - 1]).toLocaleDateString() : 'N/A';

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute right-0 top-0 h-full w-[350px] bg-[#141414]/95 backdrop-blur-xl border-l border-[#232323] shadow-2xl flex flex-col z-20 overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-5 border-b border-[#232323] bg-[#0b0b0b]/50">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1.5 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: { client: '#c15f3c', topic: '#4ea8ff', concern: '#ffb547', action: '#27c498', meeting: '#f4f3ee' }[node.type] }} />
            {node.type} Node
          </p>
          <p className="font-bold text-lg text-[#f4f3ee] leading-tight">{node.label}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-white bg-[#232323]/50 hover:bg-[#232323] p-2 rounded-md transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        
        <div className="bg-[#232323]/30 border border-[#232323] rounded-xl p-4 flex flex-col items-center text-center">
          <HindsightBadge count={meetings.length} />
          <p className="text-[11px] text-muted-foreground mt-2 uppercase tracking-wider font-semibold">
            Retrieved From Hindsight
          </p>
        </div>

        {node.type !== 'meeting' && node.type !== 'client' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#141414] border border-[#232323] rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">First Seen</p>
              <p className="text-sm font-medium text-zinc-300">{firstSeen}</p>
            </div>
            <div className="bg-[#141414] border border-[#232323] rounded-xl p-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1">Last Seen</p>
              <p className="text-sm font-medium text-zinc-300">{lastSeen}</p>
            </div>
            <div className="bg-[#141414] border border-[#232323] rounded-xl p-3 col-span-2 flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Importance</p>
              <Badge variant="outline" className="border-[#c15f3c]/40 text-[#c15f3c] bg-[#c15f3c]/10 text-xs">
                {meetings.length > 2 ? 'High' : 'Normal'}
              </Badge>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {node.type === 'meeting' ? 'Memory Content' : 'Connected Memories'}
          </p>
          {meetings.map((m, i) => (
            <div key={m.id} className="rounded-xl border border-[#232323] bg-[#141414] p-4 hover:border-[#c15f3c]/50 transition-colors cursor-default relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#232323] group-hover:bg-[#c15f3c] transition-colors" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-zinc-400">{m.clientName}</span>
                <span className="text-[10px] font-mono text-[#c15f3c] bg-[#c15f3c]/10 px-2 py-0.5 rounded-full border border-[#c15f3c]/20">
                  ID: abc12{i}
                </span>
              </div>
              <p className="text-sm font-semibold text-[#f4f3ee] mb-1.5">{m.title}</p>
              <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed">
                {m.rawSummary || 'No summary available.'}
              </p>
            </div>
          ))}
          {meetings.length === 0 && (
            <div className="text-center py-8">
              <Network className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground italic">No specific memories found.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

interface TooltipState {
  node: GraphNode;
  x: number;
  y: number;
}

// ─── Main Page Content ────────────────────────────────────────────────────────

function GraphPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const highlightClientId = searchParams.get('highlight');

  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(['client', 'topic', 'concern', 'action', 'meeting']));
  const [layoutMode, setLayoutMode] = useState<'relationship' | 'timeline' | 'concern'>('relationship');
  const [searchQuery, setSearchQuery] = useState('');
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGraphData(buildGraphData());
  }, []);

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) { next.delete(type); } else { next.add(type); }
      return next;
    });
  };

  const handleNodeHover = useCallback((node: GraphNode | null, x: number, y: number) => {
    if (!node) { setTooltip(null); return; }
    const rect = containerRef.current?.getBoundingClientRect();
    setTooltip({ node, x: x - (rect?.left || 0), y: y - (rect?.top || 0) });
  }, []);

  const handleClientClick = useCallback((clientId: string) => {
    router.push(`/clients/${clientId}`);
  }, [router]);

  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node.type !== 'client' ? node : null);
  }, []);

  const visibleNodes = graphData.nodes.filter(n => visibleTypes.has(n.type));
  const visibleLinks = graphData.links.filter(l => {
    const sid = typeof l.source === 'string' ? l.source : (l.source as GraphNode).id;
    const tid = typeof l.target === 'string' ? l.target : (l.target as GraphNode).id;
    const sn = graphData.nodes.find(n => n.id === sid);
    const tn = graphData.nodes.find(n => n.id === tid);
    return sn && tn && visibleTypes.has(sn.type) && visibleTypes.has(tn.type);
  });

  const stats = {
    nodes: visibleNodes.length,
    topics: graphData.nodes.filter(n => n.type === 'topic').length,
    concerns: graphData.nodes.filter(n => n.type === 'concern').length,
    actions: graphData.nodes.filter(n => n.type === 'action').length,
    meetings: graphData.nodes.filter(n => n.type === 'meeting').length,
  };

  return (
    <div className="flex flex-col bg-[#0b0b0b] pt-20 h-screen overflow-hidden">
      {/* Graph Statistics Header */}
      <div className="bg-[#141414] border-b border-[#232323] px-6 py-2 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-6 text-xs font-medium text-zinc-400">
          <span className="text-zinc-200">{stats.nodes} Memory Nodes</span>
          <span>{stats.topics} Topics</span>
          <span>{stats.concerns} Concerns</span>
          <span>{stats.actions} Action Items</span>
          <span>{stats.meetings} Meetings</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-[#c15f3c] animate-pulse" />
          <span className="text-[10px] uppercase tracking-wider text-[#c15f3c] font-bold">Powered by Hindsight</span>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 px-6 py-3 border-b border-[#232323] bg-[#0b0b0b] flex-shrink-0 z-10 relative">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {/* Layout Modes */}
          <div className="flex items-center bg-[#141414] rounded-lg p-1 border border-[#232323]">
            <button onClick={() => setLayoutMode('relationship')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${layoutMode === 'relationship' ? 'bg-[#232323] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Relationship
            </button>
            <button onClick={() => setLayoutMode('timeline')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${layoutMode === 'timeline' ? 'bg-[#232323] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Timeline
            </button>
            <button onClick={() => setLayoutMode('concern')} className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${layoutMode === 'concern' ? 'bg-[#232323] text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}>
              Concerns
            </button>
          </div>
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap flex-1 justify-center">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.key}
              onClick={() => toggleType(f.key)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                visibleTypes.has(f.key) ? f.color : 'bg-transparent text-zinc-600 border-[#232323]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search memory..."
              className="h-9 pl-9 pr-8 rounded-lg border border-[#232323] bg-[#141414] text-xs text-white focus-visible:outline-none focus-visible:border-[#c15f3c] w-48 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button variant="outline" size="icon" className="h-9 w-9 border-[#232323] bg-[#141414] text-zinc-400 hover:text-white" onClick={() => setGraphData(buildGraphData())}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-6 py-2 border-b border-[#232323] bg-[#141414]/50 text-xs text-zinc-500 flex-shrink-0">
        {FILTER_OPTIONS.map(f => (
          <span key={f.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: { client: '#c15f3c', topic: '#4ea8ff', concern: '#ffb547', action: '#27c498', meeting: '#f4f3ee' }[f.key] }} />
            {f.label}
          </span>
        ))}
        <span className="ml-auto opacity-60">Drag to reposition · Scroll to zoom · Click node to explore</span>
      </div>

      {/* Graph canvas */}
      <div className="relative flex-1 overflow-hidden bg-[#0b0b0b]" ref={containerRef}>
        {graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 text-center px-4">
            <div className="h-20 w-20 rounded-full border border-[#232323] bg-[#141414] flex items-center justify-center mb-2 shadow-2xl">
              <Network className="h-10 w-10 text-zinc-700" />
            </div>
            <div>
              <p className="text-lg font-bold text-white mb-2">No memory graph yet.</p>
              <p className="text-sm text-zinc-400 max-w-md mx-auto leading-relaxed">
                Add meetings and watch Hindsight build a visual map of your relationship intelligence.
              </p>
            </div>
            <Button className="mt-4 bg-[#c15f3c] hover:bg-[#a34f31] text-white border-0" onClick={() => router.push('/clients')}>
              Start Recording Memories
            </Button>
          </div>
        ) : (
          <KnowledgeGraph
            data={graphData}
            visibleTypes={visibleTypes}
            searchQuery={searchQuery}
            highlightClientId={highlightClientId ? `client:${highlightClientId}` : null}
            layoutMode={layoutMode}
            onClientClick={handleClientClick}
            onNodeHover={handleNodeHover}
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Tooltip */}
        {tooltip && (
          <div
            className="absolute pointer-events-none z-30 px-2.5 py-1.5 rounded-lg bg-background/95 border border-border shadow-xl text-xs backdrop-blur-sm"
            style={{ left: tooltip.x + 12, top: tooltip.y - 32 }}
          >
            <p className="font-semibold">{tooltip.node.label}</p>
            <p className="text-muted-foreground capitalize">{tooltip.node.type} · referenced {tooltip.node.count}×</p>
          </div>
        )}

        {/* Side panel */}
        <AnimatePresence>
          {selectedNode && (
            <SidePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function GraphPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-[calc(100vh-3.5rem)] text-muted-foreground">Loading graph...</div>}>
      <GraphPageContent />
    </Suspense>
  );
}
