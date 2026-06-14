'use client';

import { useState, useEffect, useCallback } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb, Brain, Loader2, RefreshCw, Zap, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { HindsightBadge } from '@/components/hindsight-ui';

export interface RelationshipHealthData {
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
  engagementLevel: 'high' | 'medium' | 'low';
  dealMomentum: 'strong' | 'moderate' | 'stalled' | 'lost';
  sentimentHistory: number[];
  topRisk: string;
  topOpportunity: string;
  reasoning: string;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

interface CachedHealth {
  data: RelationshipHealthData;
  meetingsAnalyzed: number;
  cachedAt: number;
}

function getCache(clientId: string): CachedHealth | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(`health_${clientId}`);
    if (!raw) return null;
    const parsed: CachedHealth = JSON.parse(raw);
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch { return null; }
}

function setCache(clientId: string, data: RelationshipHealthData, meetingsAnalyzed: number) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`health_${clientId}`, JSON.stringify({ data, meetingsAnalyzed, cachedAt: Date.now() }));
}

// ─── Sparkline SVG ─────────────────────────────────────────────────────────

function Sparkline({ values, trend }: { values: number[]; trend: string }) {
  if (values.length < 2) return null;

  const W = 160, H = 40, PAD = 4;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const pts = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2);
    const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
    return `${x},${y}`;
  });

  const strokeColor = trend === 'improving' ? '#10b981' : trend === 'declining' ? '#f43f5e' : '#60a5fa';

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={strokeColor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.9"
      />
      {/* Last point dot */}
      {(() => {
        const last = pts[pts.length - 1].split(',');
        return <circle cx={last[0]} cy={last[1]} r="3" fill={strokeColor} />;
      })()}
    </svg>
  );
}

// ─── Score Ring ─────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number; trend: string }) {
  const R = 30, CIRC = 2 * Math.PI * R;
  const fill = CIRC * (score / 100);
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e';

  return (
    <div className="relative flex items-center justify-center h-20 w-20">
      <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={R} fill="none" stroke="currentColor" strokeWidth="6" className="text-secondary" />
        <circle
          cx="40" cy="40" r={R}
          fill="none"
          stroke={color}
          strokeWidth="6"
          strokeDasharray={`${fill} ${CIRC}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.8s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold tabular-nums" style={{ color }}>{score}</span>
        <span className="text-[9px] text-muted-foreground uppercase tracking-widest leading-none">Score</span>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

const TREND_CONFIG = {
  improving: { icon: TrendingUp,   label: 'Improving', className: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  stable:    { icon: Minus,        label: 'Stable',    className: 'text-blue-400    border-blue-500/30    bg-blue-500/10'    },
  declining: { icon: TrendingDown, label: 'Declining', className: 'text-rose-400    border-rose-500/30    bg-rose-500/10'    },
};

const MOMENTUM_CONFIG: Record<string, string> = {
  strong:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  moderate: 'bg-blue-500/10    text-blue-400    border-blue-500/30',
  stalled:  'bg-amber-500/10   text-amber-400   border-amber-500/30',
  lost:     'bg-rose-500/10    text-rose-400    border-rose-500/30',
};

interface RelationshipHealthProps {
  clientId: string;
  clientName: string;
  meetingCount: number;
}

export function RelationshipHealth({ clientId, clientName, meetingCount }: RelationshipHealthProps) {
  const [health, setHealth] = useState<RelationshipHealthData | null>(null);
  const [meetingsAnalyzed, setMeetingsAnalyzed] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculated, setCalculated] = useState(false);

  // Load from cache on mount
  useEffect(() => {
    const cached = getCache(clientId);
    if (cached) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHealth(cached.data);
      setMeetingsAnalyzed(cached.meetingsAnalyzed);
      setCalculated(true);
    }
  }, [clientId]);

  const calculate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/relationship-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, clientName }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.message || 'Failed to calculate health');
      } else {
        setHealth(data.health);
        setMeetingsAnalyzed(data.meetingsAnalyzed);
        setCache(clientId, data.health, data.meetingsAnalyzed);
        setCalculated(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [clientId, clientName]);

  const trendCfg = health ? TREND_CONFIG[health.trend] : null;
  const TrendIcon = trendCfg?.icon || Minus;

  return (
    <div className="rounded-2xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.2)]">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-border">
        <h3 className="text-sm font-semibold flex items-center gap-2 text-zinc-100">
          <Activity className="h-4 w-4 text-[#c15f3c]" />
          Relationship Health
        </h3>
        {calculated && (
          <button
            onClick={calculate}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Recalculate"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      <div className="px-5 py-4">
        {/* Not yet calculated */}
        {!calculated && !loading && (
          <div className="text-center space-y-3 py-2">
            <p className="text-xs text-muted-foreground">
              AI-powered score based on {meetingCount} meeting{meetingCount !== 1 ? 's' : ''}
            </p>
            <Button
              size="sm"
              onClick={calculate}
              disabled={meetingCount === 0}
              className="w-full bg-[#c15f3c] hover:bg-[#d97757] text-white border-0 shadow-[0_0_15px_rgba(193,95,60,0.3)]"
            >
              <Brain className="h-3.5 w-3.5 mr-1.5" />Calculate Health
            </Button>
            {meetingCount === 0 && (
              <p className="text-xs text-muted-foreground italic">Add meetings first</p>
            )}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-[#c15f3c]" />
            <span>Analyzing {meetingCount} meetings...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-xs text-rose-400 text-center py-2">{error}</p>
        )}

        {/* Result */}
        {health && !loading && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, staggerChildren: 0.1 }}
            className="space-y-4"
          >
            {/* Score + sparkline row */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between gap-4"
            >
              <ScoreRing score={health.overallScore} trend={health.trend} />
              <div className="flex-1 space-y-2">
                {/* Trend badge */}
                {trendCfg && (
                  <Badge variant="outline" className={`text-xs gap-1 border ${trendCfg.className}`}>
                    <TrendIcon className="h-3 w-3" />{trendCfg.label}
                  </Badge>
                )}
                {/* Sparkline */}
                {health.sentimentHistory.length >= 2 && (
                  <Sparkline values={health.sentimentHistory} trend={health.trend} />
                )}
              </div>
            </motion.div>

            {/* Deal momentum */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">Deal Momentum</span>
              <Badge variant="outline" className={`capitalize text-xs border ${MOMENTUM_CONFIG[health.dealMomentum] || ''}`}>
                {health.dealMomentum}
              </Badge>
            </motion.div>

            {/* Engagement level */}
            <motion.div 
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className="flex items-center justify-between text-xs"
            >
              <span className="text-muted-foreground">Engagement</span>
              <span className="font-medium capitalize">{health.engagementLevel}</span>
            </motion.div>

            {/* Reasoning */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                {health.reasoning}
              </p>
            </motion.div>

            {/* Top risk */}
            {health.topRisk && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-rose-500/5 border border-rose-500/20 px-3 py-2 flex items-start gap-2"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-rose-300 leading-relaxed">{health.topRisk}</p>
              </motion.div>
            )}

            {/* Top opportunity */}
            {health.topOpportunity && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 flex items-start gap-2"
              >
                <Lightbulb className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-300 leading-relaxed">{health.topOpportunity}</p>
              </motion.div>
            )}

            {/* Footer */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="border-t border-border pt-3 flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Memory Confidence</span>
                <span className="font-medium text-zinc-300">High</span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Last Updated</span>
                <span className="font-medium text-zinc-300">Just now</span>
              </div>
              <HindsightBadge count={meetingsAnalyzed} />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
