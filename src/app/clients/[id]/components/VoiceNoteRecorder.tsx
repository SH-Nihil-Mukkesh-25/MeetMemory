'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import {
  Mic, MicOff, Upload, Loader2, CheckCircle2, XCircle,
  Tag, AlertCircle, CheckSquare2, Save, Pencil, X, Square,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedMemory {
  title: string;
  topicsDiscussed: string[];
  concernsRaised: string[];
  actionItems: string[];
  sentiment: 'positive' | 'cautiously_positive' | 'neutral' | 'negative';
  dealStage: string;
  rawSummary: string;
}

type ProcessingStep = 'transcribing' | 'extracting' | 'done' | null;

interface VoiceNoteRecorderProps {
  clientId: string;
  clientName: string;
  meetingCount: number;
  onSuccess: () => void;
  onEditExtracted?: (extracted: ExtractedMemory) => void;
}

// ─── Timer util ───────────────────────────────────────────────────────────────

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const MAX_SECONDS = 3 * 60; // 3 minutes

// ─── Status Step Indicator ────────────────────────────────────────────────────

const STEPS: { id: ProcessingStep; label: string }[] = [
  { id: 'transcribing', label: 'Transcribing audio…' },
  { id: 'extracting',   label: 'Extracting meeting memory…' },
  { id: 'done',         label: 'Storing to Hindsight…' },
];

function ProcessingSteps({ current }: { current: ProcessingStep }) {
  return (
    <div className="space-y-2">
      {STEPS.map((step, i) => {
        const stepIndex = STEPS.findIndex(s => s.id === current);
        const isDone    = i < stepIndex || current === 'done';
        const isActive  = step.id === current;

        return (
          <div key={step.id} className={`flex items-center gap-2.5 text-xs transition-all ${
            isActive ? 'text-violet-300' : isDone ? 'text-emerald-400' : 'text-muted-foreground/40'
          }`}>
            {isDone
              ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              : isActive
                ? <Loader2 className="h-3.5 w-3.5 flex-shrink-0 animate-spin" />
                : <div className="h-3.5 w-3.5 flex-shrink-0 rounded-full border border-current opacity-30" />
            }
            {step.label}
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function VoiceNoteRecorder({
  clientId, clientName, meetingCount, onSuccess, onEditExtracted,
}: VoiceNoteRecorderProps) {
  const [mode, setMode]               = useState<'idle' | 'recording' | 'recorded' | 'uploading' | 'processing' | 'preview'>('idle');
  const [processingStep, setStep]     = useState<ProcessingStep>(null);
  const [elapsed, setElapsed]         = useState(0);
  const [audioBlob, setAudioBlob]     = useState<Blob | null>(null);
  const [extracted, setExtracted]     = useState<ExtractedMemory | null>(null);
  const [transcript, setTranscript]   = useState('');
  const [saving, setSaving]           = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const mediaRecRef  = useRef<MediaRecorder | null>(null);
  const chunksRef    = useRef<Blob[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stopRecording = useCallback(() => {
    mediaRecRef.current?.stop();
    mediaRecRef.current = null;
  }, []);

  // Timer tick
  useEffect(() => {
    if (mode === 'recording') {
      timerRef.current = setInterval(() => {
        setElapsed(e => {
          if (e >= MAX_SECONDS - 1) { stopRecording(); return e; }
          return e + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [mode, stopRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      rec.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setMode('recorded');
      };
      rec.start(250);
      mediaRecRef.current = rec;
      setElapsed(0);
      setMode('recording');
      setError(null);
    } catch {
      setError('Microphone access denied. Please allow microphone permissions.');
    }
  };

  const processAudio = useCallback(async (blob: Blob, filename: string) => {
    setMode('processing');
    setError(null);
    setStep('transcribing');

    const fd = new FormData();
    fd.append('audio', new File([blob], filename, { type: blob.type }));
    fd.append('clientId',   clientId);
    fd.append('clientName', clientName);

    try {
      // Small artificial delay so "Extracting" step is visible
      const res = await fetch('/api/voice-ingest', { method: 'POST', body: fd });
      setStep('extracting');
      await new Promise(r => setTimeout(r, 600));

      const data = await res.json();
      setStep('done');
      await new Promise(r => setTimeout(r, 400));

      if (data.error) {
        setError(data.message || 'Processing failed');
        setMode('idle');
        return;
      }

      setTranscript(data.transcript);
      setExtracted(data.extracted);
      setMode('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
      setMode('idle');
    } finally {
      setStep(null);
    }
  }, [clientId, clientName]);

  const handleRecordedProcess = () => {
    if (!audioBlob) return;
    processAudio(audioBlob, `recording-${Date.now()}.webm`);
  };

  const handleFileUpload = (file: File) => {
    processAudio(file, file.name);
    setMode('uploading');
  };

  const handleSave = async () => {
    if (!extracted) return;
    setSaving(true);
    try {
      const body = {
        clientId,
        clientName,
        title:           extracted.title,
        date:            new Date().toISOString(),
        topicsDiscussed: extracted.topicsDiscussed,
        concernsRaised:  extracted.concernsRaised,
        actionItems:     extracted.actionItems,
        sentiment:       extracted.sentiment,
        dealStage:       extracted.dealStage,
        rawSummary:      extracted.rawSummary,
        meetingNumber:   meetingCount + 1,
      };
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.message);
      toast.success('✓ Voice note transcribed and stored', {
        description: `${extracted.topicsDiscussed.length} topics · ${extracted.actionItems.length} actions saved to Hindsight`,
      });
      onSuccess();
      reset();
    } catch (err) {
      toast.error('✗ Failed to save memory', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setMode('idle');
    setAudioBlob(null);
    setExtracted(null);
    setTranscript('');
    setError(null);
    setElapsed(0);
  };

  // ── Idle ────────────────────────────────────────────────────────────────────
  if (mode === 'idle' || mode === 'uploading') {
    return (
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
          <Mic className="h-3.5 w-3.5" />Voice Note
        </p>
        {error && (
          <p className="text-xs text-rose-400 mb-2 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" />{error}
          </p>
        )}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={startRecording}
            className="bg-rose-600 hover:bg-rose-500 text-white border-0 flex-1"
          >
            <Mic className="h-3.5 w-3.5 mr-1.5" />Record
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1"
          >
            <Upload className="h-3.5 w-3.5 mr-1.5" />Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".mp3,.wav,.m4a,.webm,audio/*"
            onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">
          Supports .mp3 .wav .m4a .webm · Max 3 min
        </p>
      </div>
    );
  }

  // ── Recording ────────────────────────────────────────────────────────────────
  if (mode === 'recording') {
    const progress = (elapsed / MAX_SECONDS) * 100;
    return (
      <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-medium text-rose-400">Recording</span>
          </div>
          <span className="text-sm tabular-nums font-mono text-rose-300">{formatTime(elapsed)}</span>
        </div>
        {/* Progress bar */}
        <div className="h-1 rounded-full bg-rose-500/20 overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={stopRecording} className="bg-rose-600 hover:bg-rose-500 text-white border-0 flex-1">
            <Square className="h-3.5 w-3.5 mr-1.5" />Stop
          </Button>
          <Button size="sm" variant="ghost" onClick={reset} className="text-muted-foreground">
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Recorded — awaiting process ──────────────────────────────────────────────
  if (mode === 'recorded') {
    return (
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <MicOff className="h-4 w-4 text-emerald-400" />
          <span className="text-sm font-medium">Recorded {formatTime(elapsed)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleRecordedProcess} className="bg-violet-600 hover:bg-violet-500 text-white border-0 flex-1">
            <Loader2 className="h-3.5 w-3.5 mr-1.5" />Process with AI
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    );
  }

  // ── Processing ────────────────────────────────────────────────────────────────
  if (mode === 'processing') {
    return (
      <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4">
        <p className="text-xs font-medium text-violet-300 mb-3">Processing voice note…</p>
        <ProcessingSteps current={processingStep} />
      </div>
    );
  }

  // ── Preview — confirm extracted data ─────────────────────────────────────────
  if (mode === 'preview' && extracted) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-300">Memory extracted</span>
          </div>
          <button onClick={reset} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Extracted preview */}
        <div className="space-y-2">
          <p className="text-xs font-semibold">{extracted.title}</p>

          {extracted.topicsDiscussed.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <Tag className="h-3 w-3 text-muted-foreground mt-0.5" />
              {extracted.topicsDiscussed.map(t => (
                <span key={t} className="px-1.5 py-0.5 rounded bg-secondary text-xs">{t}</span>
              ))}
            </div>
          )}
          {extracted.concernsRaised.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <AlertCircle className="h-3 w-3 text-rose-400 mt-0.5" />
              {extracted.concernsRaised.map(c => (
                <span key={c} className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 text-xs border border-rose-500/20">{c}</span>
              ))}
            </div>
          )}
          {extracted.actionItems.length > 0 && (
            <div className="space-y-0.5">
              {extracted.actionItems.map((a, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckSquare2 className="h-3 w-3 flex-shrink-0" />{a}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Badge variant="outline" className="text-xs capitalize">{extracted.sentiment.replace('_', ' ')}</Badge>
            <Badge variant="outline" className="text-xs capitalize">{extracted.dealStage.replace('_', ' ')}</Badge>
          </div>
        </div>

        {/* Transcript accordion */}
        {transcript && (
          <details className="text-xs">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">View transcript</summary>
            <p className="mt-2 text-muted-foreground leading-relaxed border-l-2 border-border pl-2">{transcript}</p>
          </details>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white border-0 flex-1"
          >
            {saving
              ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              : <Save className="h-3.5 w-3.5 mr-1.5" />
            }
            Save this memory
          </Button>
          {onEditExtracted && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEditExtracted(extracted)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return null;
}
