'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'client' | 'topic' | 'concern' | 'action' | 'meeting';
  clientId?: string;
  count: number;
  date?: number; // Used for timeline sorting
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'topic' | 'concern' | 'action' | 'meeting';
  weight: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface KnowledgeGraphProps {
  data: GraphData;
  visibleTypes: Set<string>;
  searchQuery: string;
  highlightClientId?: string | null;
  layoutMode: 'relationship' | 'timeline' | 'concern';
  onClientClick: (clientId: string) => void;
  onNodeHover: (node: GraphNode | null, x: number, y: number) => void;
  onNodeClick: (node: GraphNode) => void;
}

// ─── Colors & Sizes ──────────────────────────────────────────────────────────

const NODE_COLORS: Record<GraphNode['type'], string> = {
  client:  '#c15f3c', // Orange
  topic:   '#4ea8ff', // Blue
  concern: '#ffb547', // Yellow-Orange
  action:  '#27c498', // Emerald
  meeting: '#f4f3ee', // Off-white
};

const NODE_RADII: Record<GraphNode['type'], number> = {
  client:  28,
  meeting: 16,
  topic:   10,
  concern: 12,
  action:  8,
};

const LINK_COLORS: Record<GraphLink['type'], string> = {
  topic:   'rgba(78, 168, 255, 0.25)',
  concern: 'rgba(255, 181, 71, 0.35)',
  action:  'rgba(39, 196, 152, 0.25)',
  meeting: 'rgba(244, 243, 238, 0.2)',
};

export function KnowledgeGraph({
  data, visibleTypes, searchQuery, highlightClientId, layoutMode,
  onClientClick, onNodeHover, onNodeClick,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const build = useCallback(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();

    const container = svgRef.current?.parentElement;
    if (!container) return;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    svg.attr('width', W).attr('height', H);

    // Add glow filters
    const defs = svg.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'glow-selected')
      .attr('x', '-50%')
      .attr('y', '-50%')
      .attr('width', '200%')
      .attr('height', '200%');
    filter.append('feGaussianBlur')
      .attr('stdDeviation', '6')
      .attr('result', 'coloredBlur');
    const feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // Filter nodes by visible types + search
    const query = searchQuery.toLowerCase();
    const filteredNodes = data.nodes.filter(n => {
      if (layoutMode === 'concern' && n.type !== 'client' && n.type !== 'meeting' && n.type !== 'concern') return false;
      return visibleTypes.has(n.type) && (query === '' || n.label.toLowerCase().includes(query));
    });
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));

    const filteredLinks = data.links.filter(l => {
      const sid = typeof l.source === 'object' ? (l.source as GraphNode).id : l.source;
      const tid = typeof l.target === 'object' ? (l.target as GraphNode).id : l.target;
      return filteredNodeIds.has(sid) && filteredNodeIds.has(tid);
    });

    // Deep-clone for D3 mutation
    const nodes: GraphNode[] = filteredNodes.map(n => ({ ...n }));
    const links: GraphLink[] = filteredLinks.map(l => ({ ...l }));

    // Zoom
    const zoomG = svg.append('g');
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', e => {
        zoomG.attr('transform', e.transform);
        // Smart Labels: show full labels when zoomed in > 1.2x
        svg.selectAll('.node-label')
          .style('opacity', (d: any) => e.transform.k > 0.8 || d.type === 'client' || d.type === 'meeting' ? 1 : 0)
          .text((d: any) => {
            if (e.transform.k > 1.2 || d.type === 'client' || d.type === 'meeting') return d.label;
            return d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label;
          });
      });
    svg.call(zoomBehavior);

    // Search focus
    if (query) {
      const match = nodes.find(n => n.label.toLowerCase().includes(query));
      if (match && match.x && match.y) {
         // Smooth zoom to matched node if possible
         svg.transition().duration(750).call(
           zoomBehavior.transform as any, 
           d3.zoomIdentity.translate(W/2, H/2).scale(1.5).translate(-match.x, -match.y)
         );
      }
    }

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes);
    const linkForce = d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id);

    if (layoutMode === 'timeline') {
      const meetings = nodes.filter(n => n.type === 'meeting').sort((a, b) => (a.date || 0) - (b.date || 0));
      const meetingXMap = new Map();
      meetings.forEach((m, i) => meetingXMap.set(m.id, (W / (meetings.length + 1)) * (i + 1)));

      sim
        .force('x', d3.forceX<GraphNode>(d => {
          if (d.type === 'meeting') return meetingXMap.get(d.id) || W / 2;
          return W / 2;
        }).strength(d => (d.type === 'meeting' ? 1 : 0.05)))
        .force('y', d3.forceY<GraphNode>(H / 2).strength(0.05))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('collision', d3.forceCollide<GraphNode>().radius(d => NODE_RADII[d.type] + 15));
      
      linkForce.distance(60);
    } else if (layoutMode === 'concern') {
      sim
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('charge', d3.forceManyBody().strength(-600))
        .force('collision', d3.forceCollide<GraphNode>().radius(d => NODE_RADII[d.type] + 30));
      
      linkForce.distance(150);
    } else {
      // Relationship view (edge-to-edge spread)
      sim
        .force('center', d3.forceCenter(W / 2, H / 2))
        .force('charge', d3.forceManyBody().strength(-1000))
        .force('collision', d3.forceCollide<GraphNode>().radius(d => NODE_RADII[d.type] + 25));
      
      linkForce.distance(d => d.type === 'meeting' ? 180 : 120);
    }

    sim.force('link', linkForce);

    simRef.current = sim;

    // Links
    const link = zoomG.append('g').selectAll('line')
      .data(links)
      .join('line')
      .attr('stroke', d => LINK_COLORS[d.type])
      .attr('stroke-width', d => Math.max(1, Math.min((d.weight || 1) * 1.2, 4)))
      .attr('stroke-dasharray', d => d.type === 'concern' ? '5,4' : 'none');

    // Node groups
    const node = zoomG.append('g').selectAll<SVGGElement, GraphNode>('g')
      .data(nodes)
      .join('g')
      .attr('cursor', 'pointer')
      .call(
        d3.drag<SVGGElement, GraphNode>()
          .on('start', (e, d) => { if (!e.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag',  (e, d) => { d.fx = e.x; d.fy = e.y; })
          .on('end',   (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Circles
    node.append('circle')
      .attr('r', d => NODE_RADII[d.type])
      .attr('fill', d => {
        const color = NODE_COLORS[d.type];
        return d.id === highlightClientId ? '#ffffff' : color;
      })
      .attr('stroke', d => d.id === highlightClientId ? NODE_COLORS.client : 'rgba(255,255,255,0.15)')
      .attr('stroke-width', d => d.id === highlightClientId ? 3 : 1.5)
      .attr('filter', d => d.id === highlightClientId ? 'url(#glow-selected)' : 'none')
      .attr('class', 'transition-all duration-300')
      .on('mouseover', function(e, d) {
        d3.select(this).attr('transform', 'scale(1.1)').attr('filter', 'url(#glow-selected)');
      })
      .on('mouseout', function(e, d) {
        d3.select(this).attr('transform', 'scale(1)').attr('filter', d.id === highlightClientId ? 'url(#glow-selected)' : 'none');
      });

    // Labels
    node.append('text')
      .attr('class', 'node-label')
      .text(d => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'client' || d.type === 'meeting' ? '0.35em' : NODE_RADII[d.type] + 13)
      .attr('font-size', d => d.type === 'client' || d.type === 'meeting' ? '10px' : '9px')
      .attr('font-weight', d => d.type === 'client' || d.type === 'meeting' ? '700' : '500')
      .attr('fill', d => d.type === 'client' || d.type === 'meeting' ? '#000' : 'rgba(255,255,255,0.85)')
      .style('pointer-events', 'none')
      .style('user-select', 'none')
      .style('text-shadow', d => d.type === 'client' || d.type === 'meeting' ? 'none' : '0px 2px 4px rgba(0,0,0,0.8)');

    // Count badge for non-client nodes with count > 1
    node.filter(d => d.type !== 'client' && d.count > 1)
      .append('text')
      .text(d => `×${d.count}`)
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .attr('font-size', '8px')
      .attr('font-weight', '600')
      .attr('fill', 'rgba(255,255,255,0.9)')
      .style('pointer-events', 'none');

    // Interactions
    node
      .on('mouseover', (e, d) => onNodeHover(d, e.pageX, e.pageY))
      .on('mousemove', (e, d) => onNodeHover(d, e.pageX, e.pageY))
      .on('mouseout',  ()    => onNodeHover(null, 0, 0))
      .on('click', (e, d) => {
        e.stopPropagation();
        if (d.type === 'client') {
          onClientClick(d.id);
        } else {
          onNodeClick(d);
        }
      });

    // Tick
    sim.on('tick', () => {
      link
        .attr('x1', d => (d.source as GraphNode).x!)
        .attr('y1', d => (d.source as GraphNode).y!)
        .attr('x2', d => (d.target as GraphNode).x!)
        .attr('y2', d => (d.target as GraphNode).y!);
      node.attr('transform', d => `translate(${d.x!},${d.y!})`);
    });
  }, [data, visibleTypes, searchQuery, highlightClientId, layoutMode, onClientClick, onNodeHover, onNodeClick]);

  useEffect(() => {
    if (!svgRef.current) return;
    build();

    const ro = new ResizeObserver(() => build());
    if (svgRef.current.parentElement) ro.observe(svgRef.current.parentElement);
    return () => { ro.disconnect(); simRef.current?.stop(); };
  }, [build]);

  return <svg ref={svgRef} className="w-full h-full" />;
}
