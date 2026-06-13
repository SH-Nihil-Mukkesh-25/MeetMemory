'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Loader2, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { TagInput } from '@/components/ui/tag-input';
import { createMeeting, getMeetings } from '@/lib/store';
import { Meeting, MeetingMemory } from '@/types';

const DEAL_STAGES = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'closed_won', label: 'Closed Won' },
  { value: 'closed_lost', label: 'Closed Lost' },
  { value: 'on_hold', label: 'On Hold' },
];

const SENTIMENTS = [
  { value: 'positive', label: 'Positive', color: 'text-emerald-400' },
  { value: 'cautiously_positive', label: 'Cautiously Positive', color: 'text-amber-400' },
  { value: 'neutral', label: 'Neutral', color: 'text-zinc-400' },
  { value: 'negative', label: 'Negative', color: 'text-rose-400' },
] as const;

interface FormData {
  title: string;
  date: string;
  dealStage: string;
  topicsDiscussed: string[];
  concernsRaised: string[];
  actionItems: string[];
  followUpDate: string;
  rawSummary: string;
  sentiment: Meeting['sentiment'];
}

interface MeetingRecorderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  onSuccess: () => void;
}

export function MeetingRecorder({ open, onOpenChange, clientId, clientName, onSuccess }: MeetingRecorderProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    title: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    dealStage: 'discovery',
    topicsDiscussed: [],
    concernsRaised: [],
    actionItems: [],
    followUpDate: '',
    rawSummary: '',
    sentiment: 'positive',
  });

  const set = <K extends keyof FormData>(key: K, value: FormData[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(1);
      setForm({
        title: '', date: format(new Date(), 'yyyy-MM-dd'), dealStage: 'discovery',
        topicsDiscussed: [], concernsRaised: [], actionItems: [],
        followUpDate: '', rawSummary: '', sentiment: 'positive',
      });
    }, 300);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const existingMeetings = getMeetings(clientId);
      const meetingNumber = existingMeetings.length + 1;

      const memory: MeetingMemory = {
        memoryType: 'meeting_record',
        clientId,
        clientName,
        meetingDate: new Date(form.date).toISOString(),
        meetingNumber,
        topicsDiscussed: form.topicsDiscussed,
        concernsRaised: form.concernsRaised,
        actionItems: form.actionItems,
        sentiment: form.sentiment,
        dealStage: form.dealStage,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
        rawSummary: form.rawSummary,
      };

      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(memory),
      });
      const { memoryId } = await res.json();

      createMeeting({
        clientId,
        clientName,
        title: form.title || `Meeting #${meetingNumber}`,
        date: new Date(form.date).toISOString(),
        meetingNumber,
        topicsDiscussed: form.topicsDiscussed,
        concernsRaised: form.concernsRaised,
        actionItems: form.actionItems,
        sentiment: form.sentiment,
        dealStage: form.dealStage,
        followUpDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : undefined,
        rawSummary: form.rawSummary,
        hindsightMemoryId: memoryId,
      });

      toast.success('Meeting saved to memory', {
        description: `${clientName} · Meeting #${meetingNumber}`,
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-400" />,
      });

      handleClose();
      onSuccess();
    } catch (err) {
      toast.error('Failed to save meeting');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const stepTitles = ['Meeting Basics', 'What Happened', 'Summary & Sentiment'];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] gap-0 p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle className="text-base font-semibold">Record Meeting</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {clientName} &mdash; Step {step} of 3: {stepTitles[step - 1]}
          </DialogDescription>
          {/* Progress */}
          <div className="flex gap-1 pt-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>
        </DialogHeader>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 min-h-[320px]">
          {step === 1 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="title">Meeting Title</Label>
                <input
                  id="title"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="e.g. Q3 proposal walkthrough"
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <input
                  id="date"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.date}
                  onChange={e => set('date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Deal Stage</Label>
                <Select value={form.dealStage} onValueChange={v => { if (v) set('dealStage', v); }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEAL_STAGES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-1.5">
                <Label>Topics Discussed</Label>
                <TagInput
                  value={form.topicsDiscussed}
                  onChange={v => set('topicsDiscussed', v)}
                  placeholder="Type topic, press Enter..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Concerns Raised</Label>
                <TagInput
                  value={form.concernsRaised}
                  onChange={v => set('concernsRaised', v)}
                  placeholder="Type concern, press Enter..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Action Items</Label>
                <TagInput
                  value={form.actionItems}
                  onChange={v => set('actionItems', v)}
                  placeholder="Type action item, press Enter..."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="followUp">Follow-up Date <span className="text-muted-foreground">(optional)</span></Label>
                <input
                  id="followUp"
                  type="date"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={form.followUpDate}
                  onChange={e => set('followUpDate', e.target.value)}
                />
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="summary">Raw Summary</Label>
                <Textarea
                  id="summary"
                  placeholder="Write a free-form summary of what was discussed..."
                  className="min-h-[120px] resize-none"
                  value={form.rawSummary}
                  onChange={e => set('rawSummary', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Overall Sentiment</Label>
                <RadioGroup
                  value={form.sentiment}
                  onValueChange={v => set('sentiment', v as Meeting['sentiment'])}
                  className="grid grid-cols-2 gap-2"
                >
                  {SENTIMENTS.map(({ value, label, color }) => (
                    <label
                      key={value}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors hover:bg-secondary ${form.sentiment === value ? 'border-primary bg-secondary' : 'border-border'}`}
                    >
                      <RadioGroupItem value={value} id={value} className="sr-only" />
                      <span className={`text-sm font-medium ${color}`}>{label}</span>
                    </label>
                  ))}
                </RadioGroup>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => step > 1 ? setStep(s => s - 1) : handleClose()}
          >
            {step > 1 ? <><ChevronLeft className="h-4 w-4 mr-1" />Back</> : 'Cancel'}
          </Button>

          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={loading}>
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : 'Save to Memory'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
