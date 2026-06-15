'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Play, Database, Brain, Network, Mic, Sparkles, Activity, Search, ShieldCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";

// Helper for Animated Counters
function Counter({ from, to, duration = 2 }: { from: number; to: number; duration?: number }) {
  const nodeRef = useRef<HTMLSpanElement>(null);
  const inView = useInView(nodeRef, { once: true });
  
  useEffect(() => {
    if (!inView) return;
    const node = nodeRef.current;
    if (!node) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      node.innerHTML = Math.floor(progress * (to - from) + from).toLocaleString();
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [inView, from, to, duration]);

  return <span ref={nodeRef}>{from}</span>;
}

export default function Home() {
  const demoVideoUrl = "https://www.youtube.com/embed/XOnAli6LJTg?si=hTYSuDSVnEThvfi_";

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] text-white selection:bg-[#c15f3c]/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* ── Ambient Background Glows ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 h-[600px] w-[800px] rounded-full bg-[#c15f3c]/[0.03] blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] h-[400px] w-[400px] rounded-full bg-orange-500/[0.02] blur-[100px]" />
      </div>

      {/* ── Hero Section ── */}
      <section className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-40 pb-24 text-center z-10">
        <motion.a
          href="https://github.com/SH-Nihil-Mukkesh-25/MeetMemory.git"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer backdrop-blur-md text-zinc-300 hover:text-white text-sm font-semibold mb-8 tracking-wide"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.2c3-.3 6-1.5 6-6.5a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 5 3 6.2 6 6.5a4.8 4.8 0 0 0-1 3.2v4" />
          </svg>
          Check the Source-Code
        </motion.a>

        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-8 text-white"
        >
          Your AI colleague<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-500">that never forgets.</span>
        </motion.h1>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
          className="text-lg sm:text-xl text-[#a1a1aa] max-w-2xl mx-auto leading-relaxed mb-12 space-y-2 font-medium"
        >
          <p>Every conversation becomes memory.</p>
          <p>Every memory becomes insight.</p>
          <p>Every insight makes the next conversation smarter.</p>
          <p className="text-sm mt-4 text-[#c15f3c] font-semibold tracking-wide uppercase">Powered by Hindsight memory and Groq intelligence.</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="#demo" className="order-2 sm:order-1">
            <Button
              size="lg"
              variant="outline"
              className="border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.02)] hover:bg-[rgba(255,255,255,0.06)] text-zinc-300 hover:text-white h-12 px-6 rounded-full font-semibold transition-all backdrop-blur-md"
            >
              <Play className="h-4 w-4 mr-2 text-zinc-400" /> Watch Demo
            </Button>
          </Link>
          <Link href="/clients" className="order-1 sm:order-2">
            <Button
              size="lg"
              className="bg-[#c15f3c] hover:bg-[#a34f31] text-white border border-[#c15f3c]/50 shadow-[0_0_30px_rgba(193,95,60,0.4)] hover:shadow-[0_0_40px_rgba(193,95,60,0.6)] transition-all h-14 px-10 rounded-full font-bold text-lg"
            >
              Open MeetMemory
            </Button>
          </Link>
          <Link href="/use-cases" className="order-3 sm:order-3">
            <Button
              size="lg"
              variant="outline"
              className="border-[rgba(193,95,60,0.2)] bg-[rgba(193,95,60,0.05)] hover:bg-[rgba(193,95,60,0.1)] text-[#c15f3c] hover:text-[#d97757] h-12 px-6 rounded-full font-semibold transition-all backdrop-blur-md"
            >
              Example Use Cases
            </Button>
          </Link>
        </motion.div>
      </section>

      {/* ── Hindsight + Groq Showcase ── */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto px-4 pb-32 text-center relative z-10"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500 font-bold mb-8">Powered By</p>
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24 opacity-80 hover:opacity-100 transition-opacity duration-500">
          <div className="flex flex-col items-center gap-3 group">
            <span className="text-3xl font-bold tracking-tight text-white group-hover:text-[#c15f3c] transition-colors">Hindsight</span>
            <span className="text-sm font-medium text-zinc-400">Persistent semantic memory</span>
          </div>
          <div className="hidden md:block w-px h-12 bg-gradient-to-b from-transparent via-zinc-700 to-transparent" />
          <div className="flex flex-col items-center gap-3 group">
            <span className="text-3xl font-bold tracking-tight text-white">Groq</span>
            <span className="text-sm font-medium text-zinc-400">Ultra-fast AI reasoning</span>
          </div>
        </div>
      </motion.section>

      {/* ── Demo Video Section ── */}
      <motion.section 
        id="demo"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="max-w-5xl mx-auto px-4 pb-32 text-center relative z-10"
      >
        <h2 className="text-3xl md:text-4xl font-bold mb-4">See MeetMemory In Action</h2>
        <p className="text-[#a1a1aa] mb-12 text-lg">Watch how memory changes every future conversation.</p>
        
        <div className="relative aspect-video w-full rounded-[32px] overflow-hidden group cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.04)',
            backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5), 0 0 40px rgba(193,95,60,0.1)'
          }}
        >
          {demoVideoUrl ? (
            <iframe 
              src={demoVideoUrl} 
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="h-20 w-20 rounded-full bg-[#c15f3c] flex items-center justify-center text-white shadow-[0_0_30px_rgba(193,95,60,0.4)] group-hover:scale-110 group-hover:shadow-[0_0_50px_rgba(193,95,60,0.6)] transition-all duration-500 z-10">
                <Play className="h-8 w-8 ml-1" />
              </div>
              <p className="mt-6 text-zinc-500 font-mono text-sm">Demo Video URL Pending</p>
            </div>
          )}
          {/* Subtle reflection overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-white/[0.05] pointer-events-none" />
        </div>
      </motion.section>

      {/* ── Animated Memory Pipeline ── */}
      <section className="max-w-6xl mx-auto px-4 pb-32 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How Memory Works</h2>
          <p className="text-[#a1a1aa] text-lg">From raw conversation to actionable intelligence.</p>
        </div>

        <div className="relative">
          {/* Background connection line */}
          <div className="absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent -translate-y-1/2 hidden lg:block" />
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-4 relative z-10">
            {[
              { icon: Mic, title: "Meeting", desc: "Raw conversation", border: "border-zinc-700" },
              { icon: Database, title: "Hindsight", desc: "Stores memory", border: "border-[#c15f3c]/50", glow: true },
              { icon: Search, title: "Retrieval", desc: "Semantic lookup", border: "border-zinc-700" },
              { icon: Brain, title: "Groq", desc: "Reasons over memory", border: "border-indigo-500/50" },
              { icon: Activity, title: "Intelligence", desc: "Prep, Chat, Graph", border: "border-emerald-500/50" }
            ].map((step, idx) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: idx * 0.15 }}
                className={`relative flex flex-col items-center p-6 rounded-2xl bg-[rgba(255,255,255,0.03)] backdrop-blur-md border ${step.border} ${step.glow ? 'shadow-[0_0_30px_rgba(193,95,60,0.15)]' : ''}`}
              >
                <div className={`h-12 w-12 rounded-full mb-4 flex items-center justify-center bg-black/50 border ${step.border}`}>
                  <step.icon className={`h-5 w-5 ${step.glow ? 'text-[#c15f3c]' : 'text-zinc-300'}`} />
                </div>
                <h3 className="font-bold text-white mb-1 text-center">{step.title}</h3>
                <p className="text-xs text-zinc-400 text-center font-medium">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Cards ── */}
      <section className="max-w-6xl mx-auto px-4 pb-32 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Mic, title: "Memory Recorder", desc: "Every meeting becomes persistent memory automatically." },
            { icon: Search, title: "Ask MeetMemory", desc: "Ask questions about any client history and get instant answers." },
            { icon: Sparkles, title: "AI Prep Brief", desc: "Get fully prepared with synthesized context before every meeting." },
            { icon: Activity, title: "Relationship Health", desc: "Track momentum, sentiment, and risk signals over time." },
            { icon: Network, title: "Knowledge Graph", desc: "Visualize everything the AI remembers in a dynamic map." },
            { icon: Database, title: "Voice Notes", desc: "Turn quick spoken updates into permanent client memory." }
          ].map((feature, idx) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group p-8 rounded-[24px] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(193,95,60,0.08)]"
              style={{
                background: 'rgba(255,255,255,0.04)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <feature.icon className="h-8 w-8 text-[#c15f3c] mb-6 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
              <p className="text-[#a1a1aa] leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Memory Intelligence Graph Showcase ── */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-6xl mx-auto px-4 pb-32 relative z-10"
      >
        <div className="rounded-[32px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] p-8 md:p-16 text-center backdrop-blur-lg overflow-hidden relative">
          {/* Subtle graph background hint */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#c15f3c] via-transparent to-transparent" />
          
          <Network className="h-12 w-12 mx-auto text-[#c15f3c] mb-6" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4">See Memory Come To Life</h2>
          <p className="text-[#a1a1aa] text-lg max-w-2xl mx-auto mb-10">
            Topics, concerns, commitments and meetings become a living knowledge graph powered by Hindsight memory.
          </p>
          <Link href="/graph">
            <Button variant="outline" className="rounded-full border-[#c15f3c]/30 text-white bg-transparent hover:bg-[#c15f3c]/10 h-12 px-8">
              Explore The Graph
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* ── Why Hindsight ── */}
      <section className="max-w-5xl mx-auto px-4 pb-32 relative z-10">
        <h2 className="text-3xl font-bold mb-12 text-center">Why Hindsight?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { title: "Persistent Memory", desc: "The AI never forgets. Information spans across sessions securely." },
            { title: "Semantic Recall", desc: "Find relevant memories instantly without exact keyword matching." },
            { title: "Long-Term Context", desc: "Relationships improve over time as the AI builds deep contextual history." },
            { title: "Retrieval Intelligence", desc: "Every answer generated is explicitly grounded in memory traces." }
          ].map((item, idx) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex items-start gap-4 p-6 rounded-[20px] bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]"
            >
              <div className="mt-1 bg-[#c15f3c]/20 p-2 rounded-full">
                <ShieldCheck className="h-5 w-5 text-[#c15f3c]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                <p className="text-[#a1a1aa]">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Product Vision & Roadmap ── */}
      <section className="max-w-6xl mx-auto px-4 pb-32 relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-[#c15f3c] font-bold mb-4">Where MeetMemory Is Going</p>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight text-white">The Future of Relationship Intelligence</h2>
          <p className="text-xl text-[#a1a1aa] max-w-3xl mx-auto leading-relaxed">
            MeetMemory is not just a note-taking tool.<br />
            It is evolving into an autonomous memory agent that remembers every interaction, tracks every commitment, and prepares you for every future conversation.
          </p>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-[40%] left-0 w-full h-[2px] bg-gradient-to-r from-[#c15f3c]/10 via-[#c15f3c]/40 to-[#c15f3c]/10 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {/* Stage 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="bg-[#050505] rounded-[32px] border border-[rgba(255,255,255,0.08)] p-8 hover:shadow-[0_0_40px_rgba(193,95,60,0.15)] hover:border-[#c15f3c]/30 transition-all duration-300 relative group"
            >
              <div className="h-14 w-14 rounded-full bg-[#c15f3c]/10 border border-[#c15f3c]/30 flex items-center justify-center mb-6 text-[#c15f3c] group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mb-6">
                <ShieldCheck className="h-3.5 w-3.5" /> Available Today
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Stage 1 — Today</h3>
              <h4 className="text-[#c15f3c] font-semibold mb-6">Memory-Powered Meetings</h4>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium">
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Record meetings</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Upload voice notes</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Extract insights using Groq</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Store memories using Hindsight</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Ask questions about past interactions</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Generate prep briefs before meetings</li>
              </ul>
            </motion.div>

            {/* Stage 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-[#050505] rounded-[32px] border border-[rgba(255,255,255,0.08)] p-8 hover:shadow-[0_0_40px_rgba(193,95,60,0.15)] hover:border-[#c15f3c]/30 transition-all duration-300 relative group"
            >
              <div className="h-14 w-14 rounded-full bg-zinc-800/50 border border-zinc-700 flex items-center justify-center mb-6 text-zinc-400 group-hover:text-[#c15f3c] group-hover:scale-110 transition-all">
                <Activity className="h-6 w-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold mb-6">
                <Clock className="h-3.5 w-3.5" /> In Development
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Stage 2 — Next Release</h3>
              <h4 className="text-[#c15f3c] font-semibold mb-6">Automatic Intelligence</h4>
              <p className="text-zinc-300 text-sm mb-4">Instead of manually uploading notes:</p>
              <ul className="space-y-3 text-zinc-500 text-sm font-medium mb-6">
                <li className="flex items-start gap-2"><span className="text-zinc-600">•</span> Connect Zoom</li>
                <li className="flex items-start gap-2"><span className="text-zinc-600">•</span> Connect Google Meet</li>
                <li className="flex items-start gap-2"><span className="text-zinc-600">•</span> Connect Microsoft Teams</li>
              </ul>
              <p className="text-zinc-300 text-sm mb-4">MeetMemory automatically:</p>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium">
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Captures conversations</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Generates summaries</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Extracts action items</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Tracks concerns</li>
                <li className="flex items-start gap-2"><span className="text-[#c15f3c]">•</span> Updates relationship memory</li>
              </ul>
            </motion.div>

            {/* Stage 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-[#050505] rounded-[32px] border border-[rgba(255,255,255,0.08)] p-8 hover:shadow-[0_0_40px_rgba(193,95,60,0.15)] hover:border-[#c15f3c]/30 transition-all duration-300 relative group"
            >
              <div className="h-14 w-14 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform">
                <Brain className="h-6 w-6" />
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-bold mb-6">
                <Sparkles className="h-3.5 w-3.5" /> Future Vision
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Stage 3 — Future</h3>
              <h4 className="text-[#c15f3c] font-semibold mb-6">Autonomous Agent</h4>
              <p className="text-zinc-300 text-sm mb-4">Before your next meeting, MeetMemory proactively tells you:</p>
              <ul className="space-y-3 text-zinc-400 text-sm font-medium mb-6">
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> What was promised</li>
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Open commitments</li>
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Current concerns</li>
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Relationship momentum</li>
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Important follow-ups</li>
                <li className="flex items-start gap-2"><span className="text-purple-500">•</span> Risks and opportunities</li>
              </ul>
              <p className="text-zinc-500 text-sm italic border-t border-[rgba(255,255,255,0.05)] pt-4">
                Without you needing to search. The AI becomes a true second brain for professional relationships.
              </p>
            </motion.div>

          </div>
        </div>

        {/* Closing Statement */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-24 max-w-3xl mx-auto text-center"
        >
          <div className="p-10 rounded-3xl border border-[#c15f3c]/20 bg-[rgba(193,95,60,0.05)] backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Network className="h-32 w-32 text-[#c15f3c]" />
            </div>
            <p className="text-2xl font-medium text-zinc-300 mb-8 leading-relaxed relative z-10">
              Most AI tools answer questions.<br/>
              <strong className="text-white text-3xl block mt-2">MeetMemory remembers relationships.</strong>
            </p>
            <div className="space-y-3 text-[#a1a1aa] font-medium text-lg mb-10 relative z-10">
              <p>Every conversation becomes memory.</p>
              <p>Every memory becomes insight.</p>
              <p>Every insight makes the next conversation smarter.</p>
            </div>
            <p className="text-xs uppercase tracking-widest text-[#c15f3c] font-bold relative z-10">Powered by Hindsight Memory + Groq Intelligence</p>
          </div>
        </motion.div>
      </section>

      {/* ── Final CTA ── */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl mx-auto px-4 pb-40 text-center relative z-10"
      >
        <h2 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">Stop starting every conversation from zero.</h2>
        <p className="text-xl text-[#a1a1aa] mb-12">Build an AI colleague that remembers every interaction.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
          <Link href="/clients">
            <Button size="lg" className="bg-[#c15f3c] hover:bg-[#a34f31] text-white border-0 shadow-[0_0_30px_rgba(193,95,60,0.5)] h-14 px-10 rounded-full font-bold text-lg transition-all">
              Open MeetMemory
            </Button>
          </Link>
        </div>
      </motion.section>

      {/* ── Footer ── */}
      <footer className="border-t border-[rgba(255,255,255,0.08)] bg-[#050505] py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-md">
                <Image src="/logo.png" alt="Logo" fill className="object-cover" />
              </div>
              <span className="font-bold text-lg text-white">MeetMemory</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-medium pl-11">
              Built by{" "}
              <a 
                href="https://github.com/SH-Nihil-Mukkesh-25" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white transition-colors underline decoration-zinc-700 underline-offset-2"
              >
                SH-Nihil-Mukkesh-25
              </a>
            </span>
          </div>
          
          <div className="flex gap-8 text-sm font-medium text-zinc-500">
            <Link href="/clients" className="hover:text-white transition-colors">Clients</Link>
            <Link href="/graph" className="hover:text-white transition-colors">Graph</Link>
            <Link href="#demo" className="hover:text-white transition-colors">Demo</Link>
          </div>

          <div className="flex flex-col items-end gap-1 text-[10px] uppercase tracking-widest font-bold text-zinc-600">
            <span className="text-[#c15f3c]">Powered by Hindsight</span>
            <span>Powered by Groq</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
