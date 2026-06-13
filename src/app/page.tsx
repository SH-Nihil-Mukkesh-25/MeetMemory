import Link from "next/link";
import { Brain, ArrowRight, Zap, Shield, Network, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Brain,
    title: "Semantic Memory",
    desc: "Every meeting is stored as a searchable memory. Ask anything about your history with a client and get an instant, cited answer.",
    color: "from-violet-500 to-purple-600",
  },
  {
    icon: Sparkles,
    title: "AI Intelligence",
    desc: "Walk into every meeting fully prepared. MeetMemory synthesizes your full relationship history into a sharp, actionable brief.",
    color: "from-blue-500 to-cyan-600",
  },
  {
    icon: Network,
    title: "Relationship Graph",
    desc: "See the network of clients, topics, concerns, and commitments as a live knowledge graph — built automatically from your meetings.",
    color: "from-emerald-500 to-teal-600",
  },
  {
    icon: Shield,
    title: "Health Scoring",
    desc: "AI-powered relationship health scores with trend sparklines, risk flags, and opportunity signals — always up to date.",
    color: "from-amber-500 to-orange-600",
  },
  {
    icon: Zap,
    title: "Instant Recall",
    desc: "Use ⌘K to search your entire relationship history. Get direct answers sourced from real meeting memories, not guesses.",
    color: "from-rose-500 to-pink-600",
  },
];

export default function Home() {
  return (
    <div className="relative overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-60 left-1/2 -translate-x-1/2 h-[700px] w-[700px] rounded-full bg-violet-600/8 blur-3xl" />
        <div className="absolute top-1/2 -right-40 h-[500px] w-[500px] rounded-full bg-indigo-600/6 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-medium mb-8 shadow-lg shadow-violet-500/10">
          <Brain className="h-3.5 w-3.5" />
          AI-powered meeting intelligence
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tighter leading-[1.05] mb-6">
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-zinc-400">
            Every meeting<br />makes it smarter.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed mb-10">
          MeetMemory remembers every client interaction and generates sharper briefings over time — so you walk in prepared and close deals faster.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/clients">
            <Button
              size="lg"
              className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0 shadow-xl shadow-violet-500/30 text-sm h-11 px-6"
            >
              View Clients <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
          <Link href="/graph">
            <Button
              size="lg"
              variant="outline"
              className="border-border/60 text-sm h-11 px-6 hover:bg-secondary/60"
            >
              <Network className="h-4 w-4 mr-1.5 text-violet-400" />
              See the Memory Graph
            </Button>
          </Link>
        </div>

        {/* Subtle "how it works" pill row */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-14 text-xs text-zinc-500">
          {['Record meetings', 'Ask questions', 'Generate prep briefs', 'View the graph'].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="h-5 w-5 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center text-zinc-400 font-bold text-[10px]">{i + 1}</span>
              {step}
              {i < 3 && <span className="text-zinc-700">→</span>}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features grid ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(({ icon: Icon, title, desc, color }) => (
            <div
              key={title}
              className="relative rounded-xl border border-border bg-card p-6 hover:border-violet-500/30 hover:bg-violet-500/5 transition-all duration-300 group overflow-hidden"
            >
              {/* Gradient accent */}
              <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${color} opacity-0 group-hover:opacity-60 transition-opacity`} />

              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4 shadow-lg`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="font-semibold text-sm mb-2">{title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}

          {/* CTA card */}
          <div className="rounded-xl border border-violet-500/30 bg-gradient-to-br from-violet-600/10 to-indigo-600/10 p-6 flex flex-col items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-sm mb-2">Ready to start?</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add your first client and record a meeting. The AI memory layer starts working immediately.
              </p>
            </div>
            <Link href="/clients" className="w-full">
              <Button size="sm" className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-0">
                Get started <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
