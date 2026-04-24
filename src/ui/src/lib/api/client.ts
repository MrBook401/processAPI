const API_BASE = 'http://localhost:3001';

export interface TimeWindow {
  start: string;
  end: string;
  enabled: boolean;
}

export interface ProcessEvent {
  id: string;
  name: string;
  test_window: TimeWindow;
  preprod_window: TimeWindow;
  prod_window: TimeWindow;
}

export async function fetchEvents(): Promise<ProcessEvent[]> {
  const res = await fetch(`${API_BASE}/events`);
  if (!res.ok) throw new Error('Failed to fetch events');
  return res.json();
}

export async function createEvent(data: Omit<ProcessEvent, 'id'>): Promise<ProcessEvent> {
  const res = await fetch(`${API_BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create event');
  return res.json();
}

export async function attachRelease(releaseId: string, eventId: string) {
  const res = await fetch(`${API_BASE}/release/attach`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ releaseId, eventId }),
  });
  if (!res.ok) throw new Error('Failed to attach release');
  return res.json();
}

export async function validateRelease(releaseId: string, eventId: string) {
  const res = await fetch(`${API_BASE}/release/validate/id?releaseId=${releaseId}&eventId=${eventId}`);
  if (!res.ok) throw new Error('Failed to validate release');
  return res.json();
}

export type Environment = 'dev' | 'test' | 'preprod' | 'prod';
export type Jurisdiction = 'APAC' | 'CH' | 'EMEA' | 'US' | 'GLOBAL';

export interface Application {
  id: string;
  name: string;
  environments: Record<Environment, Jurisdiction[]>;
  created_at: string;
}

export interface CreateApplicationData {
  name: string;
  environments: Record<Environment, Jurisdiction[]>;
}

export async function fetchApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/applications`);
  if (!res.ok) throw new Error('Failed to fetch applications');
  return res.json();
}

export async function createApplication(data: CreateApplicationData): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to create application');
  return res.json();
}
