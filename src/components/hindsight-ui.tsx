'use client';

import { Sparkles, Database, Brain, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Hindsight Badge ────────────────────────────────────────────────────────
export function HindsightBadge({ count, className = '' }: { count?: number; className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#c15f3c]/10 border border-[#c15f3c]/20 text-[#c15f3c] text-[10px] font-medium tracking-wide uppercase shadow-sm ${className}`}>
      <Database className="h-3 w-3" />
      Powered by Hindsight {count !== undefined && `· ${count} ${count === 1 ? 'Memory' : 'Memories'}`}
    </div>
  );
}

// ─── Memory Trace ───────────────────────────────────────────────────────────
export interface TraceStep {
  id: string;
  status: 'pending' | 'active' | 'done';
  label: string;
  icon: React.ReactNode;
}

export function MemoryTrace({ steps }: { steps: TraceStep[] }) {
  return (
    <div className="flex flex-col gap-3 py-4">
      <AnimatePresence>
        {steps.map((step, idx) => {
          if (step.status === 'pending') return null;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              {/* Icon Container */}
              <div className="relative">
                <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                  step.status === 'active' 
                    ? 'bg-[#c15f3c]/10 border-[#c15f3c]/30 text-[#c15f3c]' 
                    : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                }`}>
                  {step.status === 'done' && step.id === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step.icon
                  )}
                </div>
                {/* Connecting Line (except last) */}
                {idx < steps.length - 1 && steps[idx + 1]?.status !== 'pending' && (
                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-px h-3 bg-zinc-800" />
                )}
              </div>

              {/* Label */}
              <span className={`text-sm font-medium ${
                step.status === 'active' ? 'text-[#c15f3c]' : 'text-zinc-400'
              }`}>
                {step.label}
              </span>

              {/* Active Pulse indicator */}
              {step.status === 'active' && (
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="h-1.5 w-1.5 rounded-full bg-[#c15f3c] ml-1 shadow-[0_0_8px_#c15f3c]"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// Helper to standard trace steps for typical operations
export function getStandardMemoryTraceSteps(stepIndex: number, memoriesCount: number = 0): TraceStep[] {
  return [
    {
      id: 'query',
      status: stepIndex === 0 ? 'active' : 'done',
      label: 'Querying Hindsight...',
      icon: <Database className="h-4 w-4" />
    },
    {
      id: 'retrieve',
      status: stepIndex < 1 ? 'pending' : stepIndex === 1 ? 'active' : 'done',
      label: `Retrieved ${memoriesCount} relevant memories`,
      icon: <Database className="h-4 w-4" />
    },
    {
      id: 'synthesize',
      status: stepIndex < 2 ? 'pending' : stepIndex === 2 ? 'active' : 'done',
      label: 'Groq Reasoning...',
      icon: <Brain className="h-4 w-4" />
    },
    {
      id: 'done',
      status: stepIndex < 3 ? 'pending' : 'done',
      label: 'Answer Ready',
      icon: <CheckCircle2 className="h-4 w-4" />
    }
  ];
}
