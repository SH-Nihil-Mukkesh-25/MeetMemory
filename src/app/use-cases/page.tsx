'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, Brain, CheckCircle2, Briefcase, Zap, 
  Users, Building2, Search, Target, ChevronRight, Play, Sparkles, MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const USE_CASES = [
  {
    icon: <Target className="h-6 w-6 text-[#c15f3c]" />,
    title: "Close More Deals (Sales)",
    scenario: "You spoke with a customer 4 weeks ago. They mentioned budget concerns, mobile app requirements, and procurement delays. Before your next meeting, MeetMemory automatically reminds you.",
    without: "You forget key details and ask redundant questions.",
    with: "You walk in perfectly prepared, instantly building trust."
  },
  {
    icon: <Zap className="h-6 w-6 text-[#c15f3c]" />,
    title: "Remember Investors (Founders)",
    scenario: "You pitch to 20 investors in a month. Weeks later: Who wanted traction numbers? Who asked about revenue? Who wanted a follow-up deck? MeetMemory remembers every detail.",
    without: "You mix up investors and send the wrong follow-ups.",
    with: "You deliver exactly what each investor requested."
  },
  {
    icon: <Building2 className="h-6 w-6 text-[#c15f3c]" />,
    title: "Track Client Requests (Agencies)",
    scenario: "Clients constantly ask for changes across multiple meetings. MeetMemory tracks every request, concern, commitment, and deadline automatically.",
    without: "Scope creep happens because nothing was tracked.",
    with: "You hold clients accountable to exactly what was said."
  },
  {
    icon: <Users className="h-6 w-6 text-[#c15f3c]" />,
    title: "Track Candidates (Recruiters)",
    scenario: "Remember salary expectations, relocation preferences, concerns, and next steps for dozens of candidates without frantically digging through old notes.",
    without: "You lose top talent due to poor candidate experience.",
    with: "Candidates feel valued because you remember their needs."
  },
  {
    icon: <Briefcase className="h-6 w-6 text-[#c15f3c]" />,
    title: "Retain Context (Consultants)",
    scenario: "Consulting engagements span months or years. Every meeting becomes a searchable semantic memory, creating an unshakeable knowledge base for the project.",
    without: "Knowledge is lost when team members leave.",
    with: "Context is preserved forever in Hindsight."
  },
  {
    icon: <Brain className="h-6 w-6 text-[#c15f3c]" />,
    title: "Personal Life",
    scenario: "Birthdays, goals, plans, important family discussions, and promises made to friends. MeetMemory acts as your personal secondary brain.",
    without: "Important dates and promises slip your mind.",
    with: "You become the most thoughtful person in the room."
  }
];

const SIMULATOR_DATA = [
  {
    id: 'sales',
    label: 'Sales',
    question: 'What should I discuss with Steve tomorrow?',
    memories: 4,
    items: [
      'Mobile roadmap still unresolved',
      'Procurement adds 3 weeks',
      'Pricing already approved',
      'Security whitepaper still pending'
    ],
    recommendation: 'Focus on roadmap commitment and procurement timeline.'
  },
  {
    id: 'founder',
    label: 'Founder',
    question: 'Which investor asked about our Q3 revenue?',
    memories: 2,
    items: [
      'Sequoia partner requested Q3 revenue breakdown',
      'A16Z asked for updated CAC metrics'
    ],
    recommendation: 'Send the Q3 revenue spreadsheet to the Sequoia partner.'
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    question: 'What were Sarah\'s relocation constraints?',
    memories: 3,
    items: [
      'Must stay near Austin, TX for family',
      'Needs $15k relocation bonus',
      'Spouse needs 2 months to transition jobs'
    ],
    recommendation: 'Ensure the Austin office offer includes the $15k relocation package.'
  },
  {
    id: 'consultant',
    label: 'Consultant',
    question: 'Did we ever commit to a security audit?',
    memories: 1,
    items: [
      'During the kick-off meeting on Jan 14th, we committed to a Phase 1 security audit.'
    ],
    recommendation: 'Yes, a Phase 1 audit was committed to on Jan 14th. It should be scheduled immediately.'
  },
  {
    id: 'agency',
    label: 'Agency',
    question: 'What did the client say about the new logo?',
    memories: 2,
    items: [
      'Client hates the purple color scheme',
      'Client wants the font to be more playful'
    ],
    recommendation: 'Revise the logo to remove purple and introduce a playful font.'
  }
];

export default function UseCasesPage() {
  const [activeTab, setActiveTab] = useState(SIMULATOR_DATA[0].id);
  const [simStep, setSimStep] = useState(0);

  // Trigger the simulation animation when the tab changes
  useEffect(() => {
    setSimStep(0);
    let isMounted = true;

    const runSim = async () => {
      if (!isMounted) return;
      await new Promise(r => setTimeout(r, 600)); // Querying
      if (!isMounted) return;
      setSimStep(1);
      await new Promise(r => setTimeout(r, 600)); // Retrieving
      if (!isMounted) return;
      setSimStep(2);
      await new Promise(r => setTimeout(r, 800)); // Reasoning
      if (!isMounted) return;
      setSimStep(3); // Done
    };

    runSim();
    return () => { isMounted = false; };
  }, [activeTab]);

  const currentSim = SIMULATOR_DATA.find(d => d.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pt-32 pb-24 px-4 overflow-x-hidden">
      
      {/* ── 1. Hero Section ── */}
      <section className="max-w-4xl mx-auto text-center mb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#c15f3c]/20 bg-[#c15f3c]/10 text-[#c15f3c] text-xs font-bold uppercase tracking-widest mb-8"
        >
          <Brain className="h-4 w-4" /> Why Memory Matters
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-6xl font-bold tracking-tight text-white mb-8 leading-[1.1]"
        >
          What if your conversations <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c15f3c] to-[#d97757]">never disappeared?</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium"
        >
          MeetMemory remembers everything you discuss, so future conversations become smarter, more informed, and more meaningful.
        </motion.p>
      </section>

      {/* ── 2. Before vs After ── */}
      <section className="max-w-5xl mx-auto mb-32">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Without */}
          <div className="rounded-3xl border border-zinc-800 bg-[rgba(255,255,255,0.02)] p-10 backdrop-blur-md">
            <h3 className="text-xl font-bold text-zinc-500 mb-8 pb-4 border-b border-zinc-800">Without MeetMemory</h3>
            <div className="space-y-6 text-zinc-500 italic text-lg font-medium opacity-60">
              <p>"I think they mentioned budget concerns..."</p>
              <p>"I don't remember what we decided."</p>
              <p>"Let me check my old scattered notes."</p>
            </div>
          </div>
          {/* With */}
          <div className="rounded-3xl border border-[#c15f3c]/30 bg-[rgba(193,95,60,0.05)] p-10 backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Database className="h-32 w-32 text-[#c15f3c]" />
            </div>
            <h3 className="text-xl font-bold text-[#c15f3c] mb-8 pb-4 border-b border-[#c15f3c]/20 relative z-10">With MeetMemory</h3>
            <div className="space-y-6 relative z-10">
              <div className="bg-[#c15f3c]/10 border border-[#c15f3c]/20 rounded-xl p-4">
                <span className="text-xs font-bold text-[#c15f3c] uppercase tracking-wider block mb-1">March 12</span>
                <p className="text-zinc-200">Budget is strictly capped at $50k.</p>
              </div>
              <div className="bg-[#c15f3c]/10 border border-[#c15f3c]/20 rounded-xl p-4">
                <span className="text-xs font-bold text-[#c15f3c] uppercase tracking-wider block mb-1">March 25</span>
                <p className="text-zinc-200">Procurement process will add 3 weeks delay.</p>
              </div>
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block mb-1">Action Required</span>
                <p className="text-emerald-100">Send updated security compliance document.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. How It Works (Simple Flow) ── */}
      <section className="max-w-5xl mx-auto mb-32 text-center">
        <h2 className="text-3xl font-bold text-white mb-16">How It Works</h2>
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-4 z-10 shadow-lg">
              <MessageSquare className="h-6 w-6 text-zinc-400" />
            </div>
            <p className="font-semibold text-zinc-300">Conversation</p>
          </div>
          <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-zinc-800 via-[#c15f3c] to-zinc-800 mx-4" />
          <div className="md:hidden w-px h-8 bg-zinc-800 my-2" />
          
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-[#c15f3c]/10 border border-[#c15f3c]/30 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(193,95,60,0.2)]">
              <Database className="h-6 w-6 text-[#c15f3c]" />
            </div>
            <p className="font-semibold text-[#c15f3c]">Stored In Memory</p>
          </div>
          <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-[#c15f3c] to-[#c15f3c] mx-4" />
          <div className="md:hidden w-px h-8 bg-[#c15f3c] opacity-50 my-2" />

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-[#c15f3c]/10 border border-[#c15f3c]/30 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(193,95,60,0.2)]">
              <Search className="h-6 w-6 text-[#c15f3c]" />
            </div>
            <p className="font-semibold text-[#c15f3c]">Retrieved Later</p>
          </div>
          <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-[#c15f3c] via-emerald-500 to-emerald-500 mx-4" />
          <div className="md:hidden w-px h-8 bg-gradient-to-b from-[#c15f3c] to-emerald-500 my-2" />

          <div className="flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4 z-10 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <Brain className="h-6 w-6 text-emerald-400" />
            </div>
            <p className="font-semibold text-emerald-400">AI Understands</p>
          </div>
        </div>
      </section>

      {/* ── 4. Interactive Scenario Simulator ── */}
      <section className="max-w-5xl mx-auto mb-32">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-white mb-4">Interactive Scenario Simulator</h2>
          <p className="text-zinc-400">Select a role to see how Hindsight semantic memory instantly answers questions.</p>
        </div>

        <div className="rounded-3xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] backdrop-blur-xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          {/* Tabs */}
          <div className="flex overflow-x-auto border-b border-[rgba(255,255,255,0.08)] custom-scrollbar">
            {SIMULATOR_DATA.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-8 py-5 text-sm font-bold tracking-wide whitespace-nowrap transition-colors ${
                  activeTab === tab.id 
                    ? 'text-[#c15f3c] border-b-2 border-[#c15f3c] bg-[rgba(193,95,60,0.05)]' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-[rgba(255,255,255,0.02)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Simulator Content */}
          <div className="p-8 md:p-12 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                {/* Simulated Query */}
                <div className="flex justify-end">
                  <div className="bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)] px-6 py-4 rounded-2xl rounded-tr-sm text-zinc-100 font-medium shadow-md">
                    {currentSim.question}
                  </div>
                </div>

                {/* MeetMemory Response */}
                <div className="flex items-start gap-5">
                  <div className="h-12 w-12 rounded-2xl bg-[#c15f3c]/20 border border-[#c15f3c]/30 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(193,95,60,0.2)]">
                    <Sparkles className="h-6 w-6 text-[#c15f3c]" />
                  </div>
                  
                  <div className="flex-1 space-y-6 pt-1">
                    
                    {/* Trace Pipeline */}
                    <div className="bg-[rgba(0,0,0,0.4)] rounded-2xl p-6 border border-[rgba(255,255,255,0.05)]">
                      <div className="flex flex-col gap-4 py-2">
                        {/* Step 1: Query */}
                        <div className="flex items-center gap-4">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                            simStep === 0 ? 'bg-[#c15f3c]/10 border-[#c15f3c]/30 text-[#c15f3c]' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}>
                            <Database className="h-4 w-4" />
                          </div>
                          <span className={`text-sm font-medium ${simStep === 0 ? 'text-[#c15f3c]' : 'text-zinc-400'}`}>Querying Hindsight...</span>
                          {simStep === 0 && <div className="h-2 w-2 rounded-full bg-[#c15f3c] ml-2 animate-pulse" />}
                        </div>

                        {/* Step 2: Retrieve */}
                        {(simStep > 0) && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                              simStep === 1 ? 'bg-[#c15f3c]/10 border-[#c15f3c]/30 text-[#c15f3c]' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              <Database className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-medium ${simStep === 1 ? 'text-[#c15f3c]' : 'text-zinc-400'}`}>
                              Retrieved {currentSim.memories} memories
                            </span>
                            {simStep === 1 && <div className="h-2 w-2 rounded-full bg-[#c15f3c] ml-2 animate-pulse" />}
                          </motion.div>
                        )}

                        {/* Step 3: Reasoning */}
                        {(simStep > 1) && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center border ${
                              simStep === 2 ? 'bg-[#c15f3c]/10 border-[#c15f3c]/30 text-[#c15f3c]' : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            }`}>
                              <Brain className="h-4 w-4" />
                            </div>
                            <span className={`text-sm font-medium ${simStep === 2 ? 'text-[#c15f3c]' : 'text-zinc-400'}`}>
                              Groq Reasoning...
                            </span>
                            {simStep === 2 && <div className="h-2 w-2 rounded-full bg-[#c15f3c] ml-2 animate-pulse" />}
                          </motion.div>
                        )}

                        {/* Step 4: Done */}
                        {(simStep > 2) && (
                          <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-full flex items-center justify-center border bg-zinc-800 border-zinc-700 text-zinc-400">
                              <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <span className="text-sm font-medium text-zinc-400">Answer Ready</span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    {/* Result Content */}
                    {simStep === 3 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6"
                      >
                        <div className="mb-6 space-y-3">
                          {currentSim.items.map((item, i) => (
                            <div key={i} className="flex items-start gap-3">
                              <div className="h-5 w-5 rounded-md bg-[#c15f3c]/20 flex items-center justify-center text-[#c15f3c] shrink-0 mt-0.5 shadow-sm">
                                <Database className="h-3 w-3" />
                              </div>
                              <span className="text-zinc-300">{item}</span>
                            </div>
                          ))}
                        </div>
                        <div className="p-4 rounded-xl bg-[#c15f3c]/10 border border-[#c15f3c]/20">
                          <p className="text-[#c15f3c] font-semibold mb-1">Recommendation:</p>
                          <p className="text-zinc-100">{currentSim.recommendation}</p>
                        </div>
                      </motion.div>
                    )}

                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── 5. Use Case Grid ── */}
      <section className="max-w-6xl mx-auto mb-32">
        <h2 className="text-3xl font-bold text-center text-white mb-16">Universal Applications</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {USE_CASES.map((uc, idx) => (
            <div key={idx} className="bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded-3xl p-8 backdrop-blur-md hover:border-[#c15f3c]/30 hover:bg-[rgba(255,255,255,0.04)] transition-all">
              <div className="h-12 w-12 rounded-xl bg-[#c15f3c]/10 border border-[#c15f3c]/20 flex items-center justify-center mb-6">
                {uc.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-4">{uc.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                {uc.scenario}
              </p>
              <div className="space-y-3 pt-6 border-t border-[rgba(255,255,255,0.05)]">
                <div className="flex items-start gap-2 text-sm text-zinc-500">
                  <span className="text-rose-500 font-bold mt-0.5">✕</span>
                  <span>{uc.without}</span>
                </div>
                <div className="flex items-start gap-2 text-sm text-emerald-400">
                  <span className="font-bold mt-0.5">✓</span>
                  <span>{uc.with}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Explanation Section ── */}
      <section className="max-w-3xl mx-auto mb-32 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">Why This Matters</h2>
        <div className="text-lg text-zinc-400 space-y-6 leading-relaxed">
          <p>Most professionals constantly lose context. Meetings happen. Details disappear. Promises get forgotten. Relationships weaken over time.</p>
          <p>MeetMemory fundamentally changes that dynamic. It acts like a second brain that seamlessly remembers every important interaction you've ever had.</p>
        </div>
        
        <div className="mt-16 p-10 rounded-3xl border border-[#c15f3c]/20 bg-[rgba(193,95,60,0.05)] backdrop-blur-md">
          <h2 className="text-2xl font-bold text-[#c15f3c] mb-6">Powered By Hindsight Memory</h2>
          <p className="text-zinc-300 leading-relaxed mb-8">
            Hindsight is the cutting-edge memory system behind MeetMemory. Instead of storing conversations as forgotten text documents, it stores them as <strong className="text-white">living memory</strong>.
            When you ask a question, MeetMemory instantly retrieves the most relevant historical context and feeds it to Groq's lightning-fast AI to synthesize a perfect answer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm font-semibold text-zinc-400">
            <span className="text-zinc-200">Memory Stored</span>
            <ChevronRight className="h-4 w-4 text-[#c15f3c] hidden sm:block" />
            <span className="text-zinc-200">Memory Retrieved</span>
            <ChevronRight className="h-4 w-4 text-[#c15f3c] hidden sm:block" />
            <span className="text-[#c15f3c]">AI Reasons</span>
            <ChevronRight className="h-4 w-4 text-[#c15f3c] hidden sm:block" />
            <span className="text-emerald-400">Answer Generated</span>
          </div>
        </div>
      </section>

      {/* ── 7. Final CTA ── */}
      <section className="max-w-4xl mx-auto text-center border-t border-[rgba(255,255,255,0.05)] pt-24">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Stop Starting Every Conversation From Zero.</h2>
        <p className="text-xl text-zinc-400 mb-12">Build a memory system that grows smarter after every interaction.</p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/clients">
            <Button size="lg" className="bg-[#c15f3c] hover:bg-[#d97757] text-white border-0 h-14 px-10 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(193,95,60,0.4)]">
              Open MeetMemory
            </Button>
          </Link>
          <Link href="/#demo">
            <Button size="lg" variant="outline" className="h-14 px-8 rounded-full font-bold text-zinc-300 bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.1)] hover:text-white transition-colors">
              <Play className="h-4 w-4 mr-2" /> Watch Demo
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
}
