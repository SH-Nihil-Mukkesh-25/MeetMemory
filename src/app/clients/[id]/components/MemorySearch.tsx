'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, Loader2, Database, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchResult {
  answer: string;
  meetingsReferenced: number[];
  memoriesUsed: number;
}

interface MemorySearchProps {
  clientId: string;
  clientName: string;
}

export function MemorySearch({ clientId, clientName }: MemorySearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // CMD+K / CTRL+K focuses the search bar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleSearch = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/memory-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, clientId, clientName }),
      });
      const data = await res.json();

      if (data.error) {
        setError(data.message || 'Search failed');
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [query, clientId, clientName, loading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleClear = () => {
    setQuery('');
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Ask anything about your history with ${clientName}...`}
            className="flex h-10 w-full rounded-lg border border-input bg-secondary/30 pl-10 pr-10 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-violet-500/50 focus-visible:border-violet-500/50 transition-colors"
          />
          {query && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          size="sm"
          onClick={handleSearch}
          disabled={!query.trim() || loading}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-500 text-white border-0 flex-shrink-0"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        </Button>
        {/* Keyboard hint */}
        <span className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <kbd className="px-1.5 py-0.5 rounded border border-border bg-secondary text-xs font-mono">⌘K</kbd>
        </span>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 flex items-center gap-2.5">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400 flex-shrink-0" />
          <span className="text-sm text-violet-300">Searching Hindsight...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3 text-sm text-rose-400">
          {error}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Answer */}
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-2.5">
              <Database className="h-3.5 w-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-400 uppercase tracking-wider">Memory Answer</span>
            </div>
            <p className="text-sm leading-relaxed">{result.answer}</p>
          </div>

          {/* Footer — meetings referenced */}
          <div className="px-4 py-2.5 border-t border-border bg-secondary/20 flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">
              Based on {result.memoriesUsed} {result.memoriesUsed === 1 ? 'memory' : 'memories'}
            </span>
            {result.meetingsReferenced.length > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground">From:</span>
                {result.meetingsReferenced.map(n => (
                  <span key={n} className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 text-xs font-medium border border-violet-500/20">
                    Meeting {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
