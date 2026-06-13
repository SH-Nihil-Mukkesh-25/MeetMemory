'use client';

import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: 'client' | 'topic' | 'concern' | 'action';
  clientId?: string;
  count: number;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'topic' | 'concern' | 'action';
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
  onClientClick: (clientId: string) => void;
  onNodeHover: (node: GraphNode | null, x: number, y: number) => void;
  onNodeClick: (node: GraphNode) => void;
}

// ─── Colors & Sizes ──────────────────────────────────────────────────────────

const NODE_COLORS: Record<GraphNode['type'], string> = {
  client:  '#7F77DD',
  topic:   '#378ADD',
  concern: '#EF9F27',
  action:  '#1D9E75',
};

const NODE_RADII: Record<GraphNode['type'], number> = {
  client:  22,
  topic:   13,
  concern: 13,
  action:  9,
};

const LINK_COLORS: Record<GraphLink['type'], string> = {
  topic:   '#60a5fa44',
  concern: '#f97316aa',
  action:  '#1D9E7588',
};

export function KnowledgeGraph({
  data, visibleTypes, searchQuery, highlightClientId,
  onClientClick, onNodeHover, onNodeClick,
}: KnowledgeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const simRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const build = useCallback(() => {
    const svg = d3.select(svgRef.current!);
    svg.selectAll('*').remove();

    const container = svgRef.current!.parentElement!;
    const W = container.clientWidth || 800;
    const H = container.clientHeight || 600;

    svg.attr('width', W).attr('height', H);

    // Filter nodes by visible types + search
    const query = searchQuery.toLowerCase();
    const filteredNodes = data.nodes.filter(n =>
      visibleTypes.has(n.type) &&
      (query === '' || n.label.toLowerCase().includes(query))
    );
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
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.2, 4])
        .on('zoom', e => zoomG.attr('transform', e.transform))
    );

    // Simulation
    const sim = d3.forceSimulation<GraphNode>(nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(links).id(d => d.id).distance(d => {
        const w = (d as GraphLink).weight || 1;
        return 100 - Math.min(w * 5, 50);
      }))
      .force('charge', d3.forceManyBody().strength(-250))
      .force('center', d3.forceCenter(W / 2, H / 2))
      .force('collision', d3.forceCollide<GraphNode>().radius(d => NODE_RADII[d.type] + 8));

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
      .attr('filter', d => d.id === highlightClientId ? 'drop-shadow(0 0 8px #7F77DD)' : 'none');

    // Labels
    node.append('text')
      .text(d => d.label.length > 14 ? d.label.slice(0, 13) + '…' : d.label)
      .attr('text-anchor', 'middle')
      .attr('dy', d => d.type === 'client' ? '0.35em' : NODE_RADII[d.type] + 13)
      .attr('font-size', d => d.type === 'client' ? '10px' : '9px')
      .attr('font-weight', d => d.type === 'client' ? '700' : '400')
      .attr('fill', d => d.type === 'client' ? '#fff' : 'rgba(255,255,255,0.75)')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

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
        if (d.type === 'client' && d.clientId) {
          onClientClick(d.clientId);
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
  }, [data, visibleTypes, searchQuery, highlightClientId, onClientClick, onNodeHover, onNodeClick]);

  useEffect(() => {
    if (!svgRef.current) return;
    build();

    const ro = new ResizeObserver(() => build());
    if (svgRef.current.parentElement) ro.observe(svgRef.current.parentElement);
    return () => { ro.disconnect(); simRef.current?.stop(); };
  }, [build]);

  return <svg ref={svgRef} className="w-full h-full" />;
}
