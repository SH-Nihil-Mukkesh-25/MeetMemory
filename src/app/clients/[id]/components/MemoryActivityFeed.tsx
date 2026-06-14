'use client';

import { formatDistanceToNow } from 'date-fns';
import { Database, Search, Upload, Edit, Zap } from 'lucide-react';

export interface MemoryEvent {
  id: string;
  type: 'store' | 'retrieve' | 'update' | 'insight';
  description: string;
  timestamp: string;
  hindsightId?: string;
}

export function MemoryActivityFeed({ events }: { events: MemoryEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-card p-5 text-center">
        <Database className="h-6 w-6 text-zinc-700 mx-auto mb-2" />
        <p className="text-sm text-zinc-500">No memory activity yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md p-5 shadow-[0_0_30px_rgba(0,0,0,0.2)]">
      <h3 className="text-sm font-semibold mb-4 text-zinc-200">Memory Activity</h3>
      <div className="space-y-4">
        {events.slice(0, 5).map((event, idx) => (
          <div key={event.id} className="relative flex gap-3">
            {/* Timeline connector */}
            {idx !== events.length - 1 && idx !== 4 && (
              <div className="absolute top-6 left-3 bottom-0 w-px -translate-x-1/2 bg-zinc-800" />
            )}
            
            {/* Icon */}
            <div className={`h-6 w-6 rounded-full flex items-center justify-center border z-10 shrink-0 ${
              event.type === 'store' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
              event.type === 'retrieve' ? 'bg-[#c15f3c]/10 border-[#c15f3c]/20 text-[#c15f3c]' :
              event.type === 'insight' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
              'bg-blue-500/10 border-blue-500/20 text-blue-400'
            }`}>
              {event.type === 'store' && <Upload className="h-3 w-3" />}
              {event.type === 'retrieve' && <Search className="h-3 w-3" />}
              {event.type === 'update' && <Edit className="h-3 w-3" />}
              {event.type === 'insight' && <Zap className="h-3 w-3" />}
            </div>

            {/* Content */}
            <div className="flex-1 pb-1">
              <p className="text-xs text-zinc-300 leading-snug">{event.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-zinc-500">
                  {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
                </span>
                {event.hindsightId && (
                  <span className="text-[10px] font-mono text-zinc-500 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] px-1 py-0.5 rounded">
                    {event.hindsightId.slice(0, 8)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
