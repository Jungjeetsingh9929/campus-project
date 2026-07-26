import { useMemo, useState } from 'react';
import { CampusScene } from '../components/CampusScene';
import { StatCard } from '../components/DashboardCards';
import { getRoutePlan, speakDirections } from '../lib/navigation';
import { useAuthStore } from '../store/authStore';
import { useCampusStore } from '../store/campusStore';
import { createEmergency } from '../api/campusApi';

const actionNotes: Record<string, string> = {
  'Alert all users': 'Notification request recorded. External broadcast provider is not configured.',
  'Lock lab access': 'Lab-access lockdown request recorded. Door-lock integration is not configured.',
  'Trigger sirens': 'Siren request recorded. Siren hardware integration is not configured.',
  'Send SMS fallback': 'SMS request recorded. SMS provider is not configured.',
  'Update dashboard': 'Emergency dashboard refreshed from local event stream.',
  'Record audit log': 'Manual security checkpoint record saved.',
};

export function EmergencyDashboard() {
  const localDemoMode = import.meta.env.VITE_ENABLE_LOCAL_DEMO_MODE === 'true';
  const route = useMemo(() => getRoutePlan('block-f', 'block-e', 'Emergency route'), []);
  const actor = useAuthStore((state) => state.name);
  const emergencyEvents = useCampusStore((state) => state.emergencyEvents);
  const auditLogs = useCampusStore((state) => state.auditLogs);
  const addEmergencyEvent = useCampusStore((state) => state.addEmergencyEvent);
  const recordAuditLog = useCampusStore((state) => state.recordAuditLog);
  const [kind, setKind] = useState('SOS button');
  const [location, setLocation] = useState('Engineering Lab Complex');
  const [notes, setNotes] = useState('Immediate response requested.');
  const [message, setMessage] = useState<string | null>(null);

  const activeEvents = emergencyEvents.filter((event) => event.status === 'Active').length;
  const criticalEvents = emergencyEvents.filter((event) => event.severity === 'Critical').length;

  async function triggerEmergency(eventKind = kind) {
    const payload = {
      kind: eventKind,
      location,
      notes,
      severity: eventKind === 'SOS button' || eventKind === 'Trigger sirens' ? 'Critical' : 'High',
      assignedTeam: eventKind.includes('Medical') ? 'Clinic Response Team' : 'Security Response Team',
    };
    const response = localDemoMode ? null : await createEmergency(payload);
    addEmergencyEvent({
      kind: payload.kind,
      location: payload.location,
      notes: payload.notes,
      status: 'NotConfigured',
      severity: payload.severity as any,
      assignedTeam: payload.assignedTeam,
    }, actor);
    setMessage((response?.data as { message?: string } | undefined)?.message ?? 'Action recorded in frontend demo mode. External integration is not configured.');
  }

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="rounded-[28px] border border-rose-300/20 bg-rose-400/10 p-5">
        <div className="text-xs uppercase tracking-[0.35em] text-rose-100/80">Emergency operations</div>
        <h2 className="mt-3 text-3xl font-semibold text-white">Safety actions now create alerts, notifications, and audit records.</h2>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-rose-100/80">
          Emergency actions are recorded and audited inside this system. It does not contact public emergency services, send SMS, trigger sirens, or lock doors unless those external integrations are explicitly configured.
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-[180px_1fr_1fr_auto]">
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
            <option>SOS button</option>
            <option>Medical emergency</option>
            <option>Fire response</option>
            <option>Evacuation support</option>
          </select>
          <input value={location} onChange={(event) => setLocation(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Location" />
          <input value={notes} onChange={(event) => setNotes(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Notes" />
          <button type="button" onClick={() => void triggerEmergency()} className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-rose-950">
            Trigger
          </button>
        </div>
        {message && <div className="mt-4 rounded-2xl border border-amber-200/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">{message}</div>}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Active alerts" value={activeEvents} hint="Events currently needing security attention." />
        <StatCard label="Critical alerts" value={criticalEvents} hint="Events marked critical in the event stream." />
        <StatCard label="Medical rooms" value={2} hint="Clinic and hostel infirmary available." />
        <StatCard label="Audit records" value={auditLogs.length} hint="Logged safety and admin operations." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Safe evacuation route</h3>
          <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
            <div className="text-lg font-semibold">{route.title}</div>
            <div className="mt-1 text-sm text-slate-400">{route.distanceMeters} meters · {route.durationMinutes} minutes</div>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              {route.steps.map((step) => <li key={step} className="rounded-2xl bg-white/5 px-3 py-2">{step}</li>)}
            </ul>
            <button type="button" onClick={() => speakDirections(route.steps.join(' '))} className="mt-4 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">
              Voice route
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Security actions</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.keys(actionNotes).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => {
                  if (item === 'Alert all users' || item === 'Trigger sirens') {
                    void triggerEmergency(item);
                  }
                  recordAuditLog(actor, item, actionNotes[item]);
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-left text-sm transition hover:bg-slate-900"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>

      <CampusScene />

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Live emergency events</h3>
          <div className="mt-4 grid gap-3">
            {emergencyEvents.map((event) => (
              <div key={event.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{event.kind}</div>
                    <div className="mt-1 text-slate-400">{event.location} · {event.assignedTeam}</div>
                  </div>
                  <span className="rounded-full bg-rose-400/10 px-3 py-1 text-xs font-semibold text-rose-100">{event.severity}</span>
                </div>
                <p className="mt-3 text-slate-300">{event.notes}</p>
                <div className="mt-3 text-xs text-slate-500">{event.createdAt}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Recent safety audit</h3>
          <div className="mt-4 grid gap-3">
            {auditLogs.slice(0, 8).map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                <div className="font-semibold">{item.action}</div>
                <div className="mt-1 text-slate-400">{item.target} · {item.createdAt}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
