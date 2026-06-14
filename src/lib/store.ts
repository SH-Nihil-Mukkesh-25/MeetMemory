import { Client, Meeting } from '../types';
import { v4 as uuidv4 } from 'uuid';

const CLIENTS_KEY = 'meetmemory_clients';
const MEETINGS_KEY = 'meetmemory_meetings';

class LocalStore {
  private clients: Map<string, Client> = new Map();
  private meetings: Map<string, Meeting> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;
    try {
      const storedClients = localStorage.getItem(CLIENTS_KEY);
      if (storedClients) {
        const parsed: Client[] = JSON.parse(storedClients);
        parsed.forEach(c => this.clients.set(c.id, c));
      }

      const storedMeetings = localStorage.getItem(MEETINGS_KEY);
      if (storedMeetings) {
        const parsed: Meeting[] = JSON.parse(storedMeetings);
        parsed.forEach(m => this.meetings.set(m.id, m));
      }
    } catch (error) {
      console.error('Failed to load from localStorage', error);
    }
  }

  private saveClients() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(Array.from(this.clients.values())));
  }

  private saveMeetings() {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MEETINGS_KEY, JSON.stringify(Array.from(this.meetings.values())));
  }

  getClients(): Client[] {
    return Array.from(this.clients.values());
  }

  getClient(id: string): Client | null {
    return this.clients.get(id) || null;
  }

  createClient(data: Omit<Client, 'id' | 'createdAt'>): Client {
    const id = uuidv4();
    const newClient: Client = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    this.clients.set(id, newClient);
    this.saveClients();
    return newClient;
  }

  deleteClient(id: string) {
    if (this.clients.has(id)) {
      this.clients.delete(id);
      this.saveClients();
      
      let meetingsChanged = false;
      for (const [meetingId, meeting] of Array.from(this.meetings.entries())) {
        if (meeting.clientId === id) {
          this.meetings.delete(meetingId);
          meetingsChanged = true;
        }
      }
      if (meetingsChanged) {
        this.saveMeetings();
      }
    }
  }

  getMeetings(clientId: string): Meeting[] {
    return Array.from(this.meetings.values()).filter(m => m.clientId === clientId);
  }

  createMeeting(data: Omit<Meeting, 'id' | 'createdAt'>): Meeting {
    const id = uuidv4();
    const newMeeting: Meeting = {
      ...data,
      id,
      createdAt: new Date().toISOString()
    };
    this.meetings.set(id, newMeeting);
    this.saveMeetings();
    return newMeeting;
  }

  getAllMeetings(): Meeting[] {
    return Array.from(this.meetings.values());
  }
}

const store = new LocalStore();

export const getClients = () => store.getClients();
export const getClient = (id: string) => store.getClient(id);
export const createClient = (data: Omit<Client, 'id' | 'createdAt'>) => store.createClient(data);
export const deleteClient = (id: string) => store.deleteClient(id);
export const getMeetings = (clientId: string) => store.getMeetings(clientId);
export const createMeeting = (data: Omit<Meeting, 'id' | 'createdAt'>) => store.createMeeting(data);
export const getAllMeetings = () => store.getAllMeetings();
