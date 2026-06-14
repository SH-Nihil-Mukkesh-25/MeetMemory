'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Plus, Users, Building2, Briefcase, Calendar, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getClients, createClient, getMeetings, deleteClient } from '@/lib/store';
import { Client } from '@/types';

interface NewClientFormData {
  name: string;
  company: string;
}

function NewClientDialog({ open, onOpenChange, onCreated }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NewClientFormData>({
    name: '', company: ''
  });

  const set = <K extends keyof NewClientFormData>(k: K, v: string) =>
    setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = () => {
    if (!form.name.trim() || !form.company.trim()) return;
    setLoading(true);
    try {
      createClient({
        name: form.name.trim(),
        company: form.company.trim()
      });
      onCreated();
      onOpenChange(false);
      setForm({ name: '', company: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>New Client</DialogTitle>
          <DialogDescription>Add a client to start tracking your meetings.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-name">Name <span className="text-rose-400">*</span></Label>
              <input
                id="client-name"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Sarah Chen"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="client-company">Company <span className="text-rose-400">*</span></Label>
              <input
                id="client-company"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder="Acme Corp"
                value={form.company}
                onChange={e => set('company', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!form.name.trim() || !form.company.trim() || loading}
          >
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Add Client
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ClientCard({ client, onDelete }: { client: Client; onDelete: () => void }) {
  const router = useRouter();
  const meetings = getMeetings(client.id);
  const lastMeeting = meetings.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this client? All their meetings will be lost.')) {
      deleteClient(client.id);
      onDelete();
    }
  };

  return (
    <div onClick={() => router.push(`/clients/${client.id}`)} className="block group cursor-pointer">
      <div className="rounded-xl border border-border bg-card p-5 hover:border-border/80 hover:bg-card/80 transition-all duration-200 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white flex-shrink-0 shadow-md shadow-violet-500/20">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground group-hover:text-white transition-colors truncate">{client.name}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{client.company}</span>
              </p>
            </div>
          </div>
          <div className="text-right flex-shrink-0 flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-secondary border-border">
              {meetings.length} meeting{meetings.length !== 1 ? 's' : ''}
            </Badge>
            <button 
              onClick={handleDelete}
              title="Delete client"
              className="p-1.5 text-zinc-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {lastMeeting && (
          <div className="mt-4 pt-3 border-t border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Last: {format(new Date(lastMeeting.date), 'MMM d, yyyy')}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const refresh = useCallback(() => setClients(getClients()), []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-28">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {clients.length > 0
              ? `${clients.length} client${clients.length !== 1 ? 's' : ''} tracked`
              : 'Manage your client relationships'}
          </p>
        </div>
        {clients.length > 0 && (
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />New Client
          </Button>
        )}
      </div>

      {/* Empty state */}
      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No clients yet</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm">
            Add your first client to start tracking meetings and building an AI memory of your relationships.
          </p>
          <Button className="mt-6" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />Add your first client
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => (
            <ClientCard key={client.id} client={client} onDelete={refresh} />
          ))}
        </div>
      )}

      <NewClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={refresh}
      />
    </div>
  );
}
