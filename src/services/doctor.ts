import { getWellnessSummary } from '@/src/services/wellness';
import type { WellnessSummary } from '@/src/types/wellness';
import { apiFetch } from '@/src/services/apiClient';

export interface Doctor {
  id: string;
  displayName: string;
  specialty: string;
  bio: string | null;
  avatarUrl: string | null;
  isAvailable: boolean;
  sessionUrl: string | null;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string | null;
  scheduledAt: string;
  mode: 'video' | 'chat' | 'in_person';
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  note: string | null;
  createdAt: string;
}

export interface DoctorChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

// ─── Live doctors + appointments via the Neon-backed API ───
export async function getDoctors(): Promise<Doctor[]> {
  try {
    const data = await apiFetch<{ doctors: Doctor[] }>('/api/doctors', { auth: false });
    return data.doctors || [];
  } catch {
    return [];
  }
}

export async function getAppointments(userId: string): Promise<Appointment[]> {
  void userId;
  try {
    const data = await apiFetch<{ appointments: (Omit<Appointment, 'userId'>)[] }>('/api/appointments');
    return (data.appointments || []).map((a) => ({ ...a, userId }));
  } catch {
    return [];
  }
}

export async function bookAppointment(
  userId: string,
  input: { doctorId: string | null; scheduledAt: string; mode: Appointment['mode']; note?: string }
): Promise<Appointment | null> {
  try {
    const data = await apiFetch<{ appointment: Omit<Appointment, 'userId'> }>('/api/appointments', {
      method: 'POST',
      body: input,
    });
    return { ...data.appointment, userId };
  } catch (e) {
    console.error('bookAppointment failed:', e);
    return null;
  }
}

export async function cancelAppointment(userId: string, id: string): Promise<void> {
  void userId;
  try {
    await apiFetch(`/api/appointments/${id}`, { method: 'PATCH', body: { status: 'cancelled' } });
  } catch (e) {
    console.error('cancelAppointment failed:', e);
  }
}

// ─── AI Doctor: server-side triage with local fallback ───
function localTriage(userMessage: string, summary: WellnessSummary | null): string {
  const q = userMessage.toLowerCase();
  const crisis =
    q.includes('suicide') || q.includes('kill myself') || q.includes('self harm') || q.includes('hurt myself') || q.includes('end my life');
  if (crisis) {
    return (
      'I hear you and this sounds serious. Please reach out now — free & confidential:\n' +
      '• Call or Text 988 (US Suicide & Crisis Lifeline)\n• Text HOME to 741741 (US Crisis Text Line)\n' +
      '• India: AASRA 9820466726 (24x7) / iCall 9152987821\n\n' +
      'If you can, book a Live Doctor in the Counsellor tab or go to urgent care. You deserve immediate support.\n\nAI triage only — not a diagnosis.'
    );
  }
  const ctx = summary
    ? `Your latest real signals: mood ${summary.moodScore}, sleep ${summary.sleepHours}h, activity ${summary.activityLevel}, stress ${summary.stressIndex} (${summary.riskLevel} risk). `
    : 'No real history yet — my guidance is general until telemetry syncs. ';
  let action = 'Try a 3-minute physiological sigh (double inhale nose, long exhale mouth) and log how you feel in Journal.';
  if (summary && summary.sleepHours < 6) action = 'Prioritize a digital sunset 30 min before bed tonight and a fixed wake time. Log sleep in Journal.';
  else if (summary && summary.stressIndex >= 65) action = 'Do Box Breathing 4-4-4-4 for 4 minutes (Breath tab), then consider booking a Live Doctor.';
  else if (q.includes('sleep')) action = 'Keep a fixed wake time, dim lights 1h before bed, and avoid clock-watching. Track 3 nights in Journal.';
  return `${ctx}\n\n${action}\n\nSeek urgent care if: chest pain, trouble breathing, fainting, or thoughts of harming yourself.\n\nAI triage only — not a diagnosis.`;
}

export async function sendDoctorMessage(
  message: string,
  history: DoctorChatMessage[],
  userId?: string
): Promise<string> {
  let summary: WellnessSummary | null = null;
  if (userId) {
    try {
      summary = await getWellnessSummary(userId);
    } catch {}
  }

  // Server-side triage (OpenAI key never leaves the server). Any failure
  // falls back to the local triage engine below.
  try {
    const data = await apiFetch<{ reply: string }>('/api/doctor-chat', {
      method: 'POST',
      body: {
        message,
        history: history.map((m) => ({ sender: m.sender, text: m.text })),
      },
    });
    if (data.reply) return data.reply;
  } catch {}
  return localTriage(message, summary);
}

export interface CrisisResource {
  region: string;
  label: string;
  detail: string;
  url: string;
}

// Region-aware crisis directory (never US-only: India-first + international).
export const CRISIS_RESOURCES: CrisisResource[] = [
  { region: 'US', label: 'US: Call or Text 988', detail: 'Suicide & Crisis Lifeline', url: 'tel:988' },
  { region: 'US', label: 'US: Text HOME to 741741', detail: 'Crisis Text Line', url: 'sms:741741' },
  { region: 'India', label: 'India: AASRA 9820466726', detail: '24x7 helpline', url: 'tel:+919820466726' },
  { region: 'India', label: 'India: iCall 9152987821', detail: 'Mon–Sat, 10am–8pm IST', url: 'tel:+919152987821' },
  { region: 'India', label: 'India: Vandrevala 1860-2662-345', detail: '24x7 foundation helpline', url: 'tel:18602662345' },
  { region: 'International', label: 'More countries: findahelpline.com', detail: 'Global directory', url: 'https://findahelpline.com' },
];
