'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Network, Search, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KnowledgeGraph, GraphNode, GraphData } from './components/KnowledgeGraph';
import { getAllMeetings, getClients } from '@/lib/store';

// ─── Build graph data from local store ───────────────────────────────────────

function buildGraphData(): GraphData {
  const clients = getClients();
  const meetings = getAllMeetings();

  const nodeMap = new Map<string, GraphNode>();
  const linkMap = new Map<string, { source: string; target: string; type: 'topic' | 'concern' | 'action'; weight: number }>();

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

  const addLink = (source: string, target: string, type: 'topic' | 'concern' | 'action') => {
    const key = `${source}→${target}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.weight += 1;
    } else {
      linkMap.set(key, { source, target, type, weight: 1 });
    }
  };

  const addNode = (id: string, label: string, type: 'topic' | 'concern' | 'action') => {
    if (!nodeMap.has(id)) {
      nodeMap.set(id, { id, label, type, count: 1 });
    } else {
      nodeMap.get(id)!.count += 1;
    }
  };

  meetings.forEach(m => {
    const clientNodeId = `client:${m.clientId}`;
    if (!nodeMap.has(clientNodeId)) return;

    m.topicsDiscussed.forEach(t => {
      const id = `topic:${t.toLowerCase()}`;
      addNode(id, t, 'topic');
      addLink(clientNodeId, id, 'topic');
    });

    m.concernsRaised.forEach(c => {
      const id = `concern:${c.toLowerCase()}`;
      addNode(id, c, 'concern');
      addLink(clientNodeId, id, 'concern');
    });

    m.actionItems.forEach(a => {
      const short = a.length > 30 ? a.slice(0, 30) + '…' : a;
      const id = `action:${a.toLowerCase().slice(0, 40)}`;
      addNode(id, short, 'action');
      addLink(clientNodeId, id, 'action');
    });
  });

  return {
    nodes: Array.from(nodeMap.values()),
    links: Array.from(linkMap.values()),
  };
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTER_OPTIONS = [
  { key: 'client',  label: 'Clients',      color: 'bg-[#7F77DD]/20 text-[#a5a0f0] border-[#7F77DD]/40' },
  { key: 'topic',   label: 'Topics',       color: 'bg-[#378ADD]/20 text-[#6db3f2] border-[#378ADD]/40' },
  { key: 'concern', label: 'Concerns',     color: 'bg-[#EF9F27]/20 text-[#f0b96a] border-[#EF9F27]/40' },
  { key: 'action',  label: 'Action Items', color: 'bg-[#1D9E75]/20 text-[#4ec9a3] border-[#1D9E75]/40' },
] as const;

// ─── Side panel ───────────────────────────────────────────────────────────────

interface SidePanelProps {
  node: GraphNode;
  onClose: () => void;
}

function SidePanel({ node, onClose }: SidePanelProps) {
  const meetings = getAllMeetings().filter(m =>
    (node.type === 'topic'   && m.topicsDiscussed.some(t => `topic:${t.toLowerCase()}`   === node.id)) ||
    (node.type === 'concern' && m.concernsRaised.some(c => `concern:${c.toLowerCase()}`  === node.id)) ||
    (node.type === 'action'  && m.actionItems.some(a => `action:${a.toLowerCase().slice(0, 40)}` === node.id))
  );

  return (
    <div className="absolute right-0 top-0 h-full w-72 bg-background/95 backdrop-blur-md border-l border-border shadow-2xl flex flex-col z-20 overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{node.type}</p>
          <p className="font-semibold text-sm">{node.label}</p>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-xs text-muted-foreground mb-3">
          Referenced in {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
        </p>
        <div className="space-y-2">
          {meetings.map(m => (
            <div key={m.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-xs font-medium">{m.clientName}</p>
              <p className="text-xs text-muted-foreground">Meeting #{m.meetingNumber} · {m.title}</p>
            </div>
          ))}
          {meetings.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No meetings found</p>
          )}
        </div>
      </div>
    </div>
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
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(['client', 'topic', 'concern', 'action']));
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

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      {/* Controls bar */}
      <div className="flex flex-wrap items-center gap-3 px-4 sm:px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <Network className="h-4 w-4 text-violet-400" />
          <span className="text-sm font-semibold">Memory Graph</span>
        </div>

        {/* Type filter chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTER_OPTIONS.map(f => (
            <button
              key={f.key}
              onClick={() => toggleType(f.key)}
              className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                visibleTypes.has(f.key) ? f.color : 'bg-transparent text-muted-foreground border-border opacity-40'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Filter nodes..."
            className="h-8 pl-8 pr-8 rounded-md border border-input bg-secondary/30 text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-40"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Reset */}
        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setGraphData(buildGraphData())}>
          <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset
        </Button>

        {/* Stats */}
        <div className="ml-auto flex-shrink-0">
          <Badge variant="outline" className="text-xs border-border">
            {visibleNodes.length} nodes · {visibleLinks.length} edges
          </Badge>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 sm:px-6 py-1.5 border-b border-border bg-background/60 text-xs text-muted-foreground flex-shrink-0">
        {FILTER_OPTIONS.map(f => (
          <span key={f.key} className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: { client: '#7F77DD', topic: '#378ADD', concern: '#EF9F27', action: '#1D9E75' }[f.key] }} />
            {f.label}
          </span>
        ))}
        <span className="ml-auto text-muted-foreground/70">Drag to reposition · Scroll to zoom · Click node to explore</span>
      </div>

      {/* Graph canvas */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>
        {graphData.nodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <Network className="h-16 w-16 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium">No data yet</p>
              <p className="text-xs text-muted-foreground mt-1">Add clients and meetings to see the memory graph.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/clients')}>
              Go to Clients
            </Button>
          </div>
        ) : (
          <KnowledgeGraph
            data={graphData}
            visibleTypes={visibleTypes}
            searchQuery={searchQuery}
            highlightClientId={highlightClientId ? `client:${highlightClientId}` : null}
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
        {selectedNode && (
          <SidePanel node={selectedNode} onClose={() => setSelectedNode(null)} />
        )}
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
