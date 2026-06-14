'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Send, Sparkles, Database, Network, MessageSquare, AlertTriangle, ExternalLink } from 'lucide-react';
import { MemoryTrace, getStandardMemoryTraceSteps } from '@/components/hindsight-ui';
import { MeetingMemory } from '@/types';
import { format } from 'date-fns';
import { getClients, getAllMeetings } from '@/lib/store';
import Link from 'next/link';

const SUGGESTED_PROMPTS = [
  { icon: <AlertTriangle className="h-4 w-4" />, text: "What risks exist across all clients?" },
  { icon: <Network className="h-4 w-4" />, text: "Which commitments are overdue?" },
  { icon: <MessageSquare className="h-4 w-4" />, text: "Who needs follow-up this week?" },
  { icon: <Sparkles className="h-4 w-4" />, text: "Summarize this week's meetings." }
];

export default function AskMeetMemoryPage() {
  const [stats, setStats] = useState({ clients: 0, meetings: 0, openCommitments: 0 });
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState<{ answer: string; memories: MeetingMemory[] } | null>(null);

  useEffect(() => {
    // Load stats
    const clients = getClients();
    const meetings = getAllMeetings();
    let openActions = 0;
    meetings.forEach(m => {
      openActions += m.actionItems.length;
    });

    setStats({
      clients: clients.length,
      meetings: meetings.length,
      openCommitments: openActions,
    });
  }, []);

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

      const res = await fetch('/api/ask-meetmemory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
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
    <div className="min-h-screen bg-[#0a0a0a] pt-28 pb-12 px-6 flex flex-col items-center">
      
      {/* Header & Stats */}
      <div className="w-full max-w-4xl mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100 flex items-center gap-3 mb-2">
            <Sparkles className="h-7 w-7 text-[#c15f3c]" />
            Ask MeetMemory
          </h1>
          <p className="text-zinc-500 max-w-lg leading-relaxed">
            Talk to your entire relationship memory system. Powered by Hindsight semantic retrieval and Groq reasoning.
          </p>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(193,95,60,0.12)] rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <span className="text-xl font-bold text-zinc-100">{stats.clients}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#c15f3c]">Clients</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(193,95,60,0.12)] rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <span className="text-xl font-bold text-zinc-100">{stats.meetings}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#c15f3c]">Meetings</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-[rgba(255,255,255,0.03)] border border-[rgba(193,95,60,0.12)] rounded-xl px-4 py-2 backdrop-blur-md shadow-[0_0_15px_rgba(0,0,0,0.2)]">
            <span className="text-xl font-bold text-zinc-100">{stats.openCommitments}</span>
            <span className="text-[10px] uppercase tracking-widest text-[#c15f3c]">Tasks</span>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="w-full max-w-4xl flex-1 flex flex-col relative rounded-2xl border border-[rgba(193,95,60,0.12)] bg-[rgba(255,255,255,0.02)] backdrop-blur-md overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.3)]">
        
        <div className="flex-1 overflow-y-auto p-6 min-h-[500px] pb-24 custom-scrollbar">
          {/* Chat History / Trace Area */}
          {isSearching || result ? (
            <div className="space-y-8">
              
              {/* User Query Bubble */}
              <div className="flex justify-end">
                <div className="bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] px-5 py-3 rounded-2xl rounded-tr-sm max-w-[85%] text-zinc-200 text-sm shadow-sm">
                  {query}
                </div>
              </div>

              {/* MeetMemory Response Area */}
              <div className="flex items-start gap-5">
                <div className="h-10 w-10 rounded-full bg-[#c15f3c]/20 border border-[#c15f3c]/30 flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(193,95,60,0.2)]">
                  <Sparkles className="h-5 w-5 text-[#c15f3c]" />
                </div>
                
                <div className="flex-1 space-y-5">
                  {/* Hindsight Trace Pipeline */}
                  {(isSearching || stepIndex > 0) && (
                    <div className="bg-[rgba(0,0,0,0.3)] rounded-xl p-5 border border-[rgba(255,255,255,0.05)] mb-4">
                      <MemoryTrace steps={getStandardMemoryTraceSteps(stepIndex, result?.memories.length || 0)} />
                    </div>
                  )}
                  
                  {/* Final Answer */}
                  {result && stepIndex === 3 && (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="text-zinc-200 leading-relaxed text-[15px]">
                        {result.answer}
                      </div>

                      {/* Cited Global Memories */}
                      {result.memories.length > 0 && (
                        <div className="mt-8 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                          <div className="flex items-center gap-2 mb-4">
                            <Database className="h-4 w-4 text-zinc-500" />
                            <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">Global Memory Sources</h4>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {result.memories.map((m, idx) => (
                              <Link 
                                href={`/clients/${m.clientId}`}
                                key={`${m.meetingNumber}-${idx}`} 
                                className="group block bg-[rgba(0,0,0,0.4)] border border-[rgba(255,255,255,0.05)] rounded-xl p-3 hover:bg-[rgba(255,255,255,0.03)] hover:border-[#c15f3c]/40 transition-colors"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <div className="h-5 w-5 rounded-md bg-[#c15f3c]/20 flex items-center justify-center text-[10px] text-[#c15f3c] font-bold">
                                      {idx + 1}
                                    </div>
                                    <span className="text-sm font-medium text-zinc-300 group-hover:text-zinc-100 transition-colors">
                                      {m.clientName}
                                    </span>
                                  </div>
                                  <ExternalLink className="h-3.5 w-3.5 text-zinc-600 group-hover:text-[#c15f3c]" />
                                </div>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-zinc-500">Meeting {m.meetingNumber}</span>
                                  <span className="text-xs text-zinc-500">{format(new Date(m.meetingDate), 'MMM d, yyyy')}</span>
                                </div>
                                <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-[#c15f3c]/20 bg-[#c15f3c]/10">
                                  <Database className="h-2.5 w-2.5 text-[#c15f3c]" />
                                  <span className="text-[9px] uppercase tracking-wider text-[#c15f3c] font-medium">Hindsight Match</span>
                                </div>
                              </Link>
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
            <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
              <div className="h-20 w-20 rounded-[2rem] bg-[rgba(193,95,60,0.1)] border border-[rgba(193,95,60,0.2)] flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(193,95,60,0.15)]">
                <Database className="h-10 w-10 text-[#c15f3c]" />
              </div>
              <h3 className="text-2xl font-bold text-zinc-100 mb-3">Global Memory Search</h3>
              <p className="text-[15px] text-zinc-500 mb-10 max-w-lg leading-relaxed">
                MeetMemory has access to every client, topic, and commitment across your entire relationship network. What would you like to know?
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                {SUGGESTED_PROMPTS.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAsk(p.text)}
                    className="flex items-center gap-4 text-left px-5 py-4 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.05)] hover:border-[#c15f3c]/40 transition-all text-zinc-400 hover:text-zinc-200 group"
                  >
                    <div className="h-10 w-10 rounded-lg bg-[rgba(0,0,0,0.3)] border border-[rgba(255,255,255,0.05)] flex items-center justify-center text-zinc-500 group-hover:text-[#c15f3c] group-hover:border-[#c15f3c]/20 transition-all shadow-inner">
                      {p.icon}
                    </div>
                    <span className="text-sm font-medium">{p.text}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Area - Fixed at bottom of the chat interface container */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pt-6 bg-gradient-to-t from-[rgba(10,10,10,1)] via-[rgba(10,10,10,0.9)] to-transparent">
          <form
            onSubmit={(e) => { e.preventDefault(); handleAsk(query); }}
            className="relative flex items-center max-w-3xl mx-auto"
          >
            <input
              type="text"
              placeholder="Ask anything across all clients..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={isSearching}
              className="flex h-14 w-full rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[rgba(0,0,0,0.4)] px-6 py-2 pr-16 text-[15px] text-zinc-100 shadow-xl placeholder:text-zinc-600 focus-visible:outline-none focus-visible:border-[#c15f3c]/50 focus-visible:bg-[rgba(20,20,20,0.6)] disabled:opacity-50 transition-all backdrop-blur-xl"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!query.trim() || isSearching}
              className="absolute right-2 h-10 w-10 bg-[#c15f3c] hover:bg-[#d97757] text-white rounded-xl shadow-[0_0_20px_rgba(193,95,60,0.3)] disabled:bg-zinc-800 disabled:text-zinc-600 disabled:shadow-none transition-all"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <div className="text-center mt-3">
            <span className="text-[10px] text-zinc-600">MeetMemory can make mistakes. Check important information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
