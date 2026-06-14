'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, MessageSquare, ExternalLink, Network, Database } from 'lucide-react';
import { MemoryTrace, getStandardMemoryTraceSteps } from '@/components/hindsight-ui';
import { MeetingMemory } from '@/types';
import { format } from 'date-fns';

const SUGGESTED_PROMPTS = [
  { icon: <Database className="h-4 w-4" />, text: "Summarize the latest meeting" },
  { icon: <Network className="h-4 w-4" />, text: "What are their main concerns?" },
  { icon: <MessageSquare className="h-4 w-4" />, text: "What commitments are still open?" },
  { icon: <Sparkles className="h-4 w-4" />, text: "What should I discuss tomorrow?" }
];

export function MemoryChat({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<{ answer: string; memories: MeetingMemory[] } | null>(null);

  const handleAsk = async (q: string) => {
    if (!q.trim() || isSearching) return;
    setQuery(q);
    setIsSearching(true);
    setResult(null);
    setStepIndex(0);

    try {
      // Step 0: Querying
      await new Promise(r => setTimeout(r, 600));
      setStepIndex(1); // Step 1: Retrieved

      const res = await fetch('/api/memory-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, clientId, clientName }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Search failed');

      setStepIndex(2); // Step 2: Synthesizing
      await new Promise(r => setTimeout(r, 800));
      setStepIndex(3); // Step 3: Done

      setResult({ answer: data.answer, memories: data.memories });
    } catch (err) {
      console.error(err);
      setResult({ answer: 'Failed to chat with memory.', memories: [] });
    } finally {
      setIsSearching(false);
      setQuery('');
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px] pr-2 pb-20 custom-scrollbar">
        
        {/* Chat History / Trace Area */}
        {isSearching || result ? (
          <div className="space-y-6">
            
            {/* User Query Bubble */}
            <div className="flex justify-end">
              <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[85%] text-zinc-200 text-sm">
                {query}
              </div>
            </div>

            {/* MeetMemory Response Area */}
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-[#c15f3c]/20 border border-[#c15f3c]/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_10px_rgba(193,95,60,0.2)]">
                <Sparkles className="h-4 w-4 text-[#c15f3c]" />
              </div>
              
              <div className="flex-1 space-y-4">
                {/* Hindsight Trace Pipeline */}
                {(isSearching || stepIndex > 0) && (
                  <div className="bg-[rgba(0,0,0,0.3)] rounded-xl p-4 border border-[rgba(255,255,255,0.05)] mb-4">
                    <MemoryTrace steps={getStandardMemoryTraceSteps(stepIndex, result?.memories.length || 0)} />
                  </div>
                )}
                
                {/* Final Answer */}
                {result && stepIndex === 3 && (
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="text-zinc-300 leading-relaxed text-[15px]">
                      {result.answer}
                    </div>

                    {/* Cited Memories (Perplexity Style Citations) */}
                    {result.memories.length > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Database className="h-4 w-4 text-zinc-500" />
                          <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Sources</h4>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {result.memories.map((m, idx) => (
                            <div key={`${m.meetingNumber}-${idx}`} className="group flex items-center gap-2 bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-md px-3 py-1.5 cursor-default hover:bg-[rgba(255,255,255,0.06)] hover:border-[#c15f3c]/40 transition-colors">
                              <div className="h-4 w-4 rounded-full bg-[#c15f3c]/20 flex items-center justify-center text-[9px] text-[#c15f3c] font-bold">
                                {idx + 1}
                              </div>
                              <span className="text-xs text-zinc-400 group-hover:text-zinc-200">
                                {format(new Date(m.meetingDate), 'MMM d, yyyy')}
                              </span>
                              <ExternalLink className="h-3 w-3 text-zinc-600 group-hover:text-[#c15f3c] ml-1" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Welcome State */
          <div className="flex flex-col items-center justify-center h-full text-center py-12 px-4">
            <div className="h-16 w-16 rounded-3xl bg-[rgba(193,95,60,0.1)] border border-[rgba(193,95,60,0.2)] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(193,95,60,0.15)]">
              <MessageSquare className="h-8 w-8 text-[#c15f3c]" />
            </div>
            <h3 className="text-xl font-bold text-zinc-100 mb-2">Ask about {clientName}</h3>
            <p className="text-sm text-zinc-500 mb-8 max-w-sm leading-relaxed">
              MeetMemory will search through all stored Hindsight memories and use Groq to synthesize an intelligent response.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {SUGGESTED_PROMPTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleAsk(p.text)}
                  className="flex items-center gap-3 text-left px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#c15f3c]/40 transition-all text-zinc-400 hover:text-zinc-200 group"
                >
                  <div className="text-zinc-500 group-hover:text-[#c15f3c] transition-colors">
                    {p.icon}
                  </div>
                  <span className="text-xs font-medium">{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input Area - Absolute positioned at bottom of container */}
      <div className="absolute bottom-0 left-0 right-0 pt-4 bg-gradient-to-t from-[rgba(15,15,15,1)] via-[rgba(15,15,15,0.9)] to-transparent">
        <form
          onSubmit={(e) => { e.preventDefault(); handleAsk(query); }}
          className="relative flex items-center"
        >
          <input
            type="text"
            placeholder={`Ask anything about ${clientName}...`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isSearching}
            className="flex h-14 w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-5 py-2 pr-14 text-sm text-zinc-200 shadow-lg placeholder:text-zinc-600 focus-visible:outline-none focus-visible:border-[#c15f3c]/50 focus-visible:bg-[rgba(255,255,255,0.05)] disabled:opacity-50 transition-all backdrop-blur-md"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!query.trim() || isSearching}
            className="absolute right-2 h-10 w-10 bg-[#c15f3c] hover:bg-[#d97757] text-white rounded-xl shadow-[0_0_15px_rgba(193,95,60,0.3)] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none transition-all"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
