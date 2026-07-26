import { useMemo, useState } from 'react';
import { CampusScene } from '../components/CampusScene';
import { ChartsPanel } from '../components/ChartsPanel';
import { StatCard, WifiCard } from '../components/DashboardCards';
import { useCampusStore } from '../store/campusStore';
import { useAuthStore } from '../store/authStore';
import { ComplaintAttachment, ComplaintStatus, Role } from '../types';
import { updateComplaint, uploadFile } from '../api/campusApi';

const statuses: ComplaintStatus[] = ['Open', 'Assigned', 'In Progress', 'Resolved'];
const roles: Role[] = ['Student', 'Faculty', 'Admin', 'Security'];

export function AdminDashboard() {
  const localDemoMode = import.meta.env.VITE_ENABLE_LOCAL_DEMO_MODE === 'true';
  const buildings = useCampusStore((state) => state.buildings);
  const complaints = useCampusStore((state) => state.complaints);
  const wifiAccessPoints = useCampusStore((state) => state.wifiAccessPoints);
  const auditLogs = useCampusStore((state) => state.auditLogs);
  const updateComplaintWorkflow = useCampusStore((state) => state.updateComplaintWorkflow);
  const recordAuditLog = useCampusStore((state) => state.recordAuditLog);
  const users = useAuthStore((state) => state.users);
  const updateUser = useAuthStore((state) => state.updateUser);
  const actor = useAuthStore((state) => state.name);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ComplaintStatus>('All');
  const [selectedId, setSelectedId] = useState(complaints[0]?.id ?? '');
  const [resolutionEvidence, setResolutionEvidence] = useState<ComplaintAttachment[]>([]);
  const [resolutionFiles, setResolutionFiles] = useState<File[]>([]);
  const selected = complaints.find((complaint) => complaint.id === selectedId) ?? complaints[0];

  const filteredComplaints = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return complaints.filter((complaint) => {
      const matchesStatus = statusFilter === 'All' || complaint.status === statusFilter;
      const haystack = [
        complaint.ticketNo,
        complaint.title,
        complaint.studentName,
        complaint.rollNumber,
        complaint.category,
        complaint.assignedDepartment,
        complaint.technician,
        complaint.status,
      ].join(' ').toLowerCase();
      return matchesStatus && (!normalized || haystack.includes(normalized));
    });
  }, [complaints, query, statusFilter]);

  const resolvedCount = complaints.filter((item) => item.status === 'Resolved').length;
  const urgentCount = complaints.filter((item) => item.priority === 'Critical' || item.priority === 'High').length;
  const resolutionRate = complaints.length ? Math.round((resolvedCount / complaints.length) * 100) : 0;
  const utilization = Math.round(buildings.reduce((sum, building) => sum + building.occupancy, 0) / buildings.length);
  const avgNetwork = Math.round(wifiAccessPoints.reduce((sum, ap) => sum + ap.bandwidthMbps, 0) / wifiAccessPoints.length);

  function exportCsv() {
    const header = ['Ticket', 'Student', 'Category', 'Priority', 'Status', 'Department', 'Technician', 'Updated'];
    const rows = filteredComplaints.map((complaint) => [
      complaint.ticketNo,
      complaint.studentName,
      complaint.category,
      complaint.priority,
      complaint.status,
      complaint.assignedDepartment,
      complaint.technician,
      complaint.updatedAt,
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'campus-complaints.csv';
    link.click();
    URL.revokeObjectURL(url);
    recordAuditLog(actor, 'Exported CSV report', `${filteredComplaints.length} complaints`);
  }

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Resolution rate" value={`${resolutionRate}%`} hint={`${resolvedCount} of ${complaints.length} complaints resolved.`} />
        <StatCard label="Urgent queue" value={urgentCount} hint="High and critical complaints needing attention." />
        <StatCard label="Network capacity" value={`${avgNetwork} Mbps`} hint="Average live access-point throughput." />
        <StatCard label="Utilization" value={`${utilization}%`} hint="Calculated from building occupancy data." />
      </div>

      <ChartsPanel />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Complaint management</h3>
              <p className="text-sm text-slate-300">Assign departments, technicians, remarks, and resolution evidence.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={exportCsv} className="rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950">CSV</button>
              <button type="button" onClick={() => window.print()} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold">PDF</button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Search tickets, students, department..." />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
              <option>All</option>
              {statuses.map((status) => <option key={status}>{status}</option>)}
            </select>
          </div>

          <div className="mt-4 grid max-h-[520px] gap-3 overflow-auto pr-1">
            {filteredComplaints.map((complaint) => (
              <button
                key={complaint.id}
                type="button"
                onClick={() => setSelectedId(complaint.id)}
                className={[
                  'rounded-2xl border p-4 text-left transition',
                  selected?.id === complaint.id ? 'border-cyan-300/50 bg-cyan-400/10' : 'border-white/10 bg-slate-950/70 hover:bg-slate-900',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{complaint.ticketNo} · {complaint.title}</div>
                    <div className="mt-1 text-sm text-slate-400">{complaint.studentName} · {complaint.category} · {complaint.assignedDepartment}</div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{complaint.status}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        {selected && (
          <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Ticket detail</h3>
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-xl font-semibold">{selected.title}</div>
              <div className="mt-1 text-sm text-slate-400">{selected.ticketNo} · {selected.studentName} · {selected.roomNumber}</div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{selected.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {(selected.attachments ?? []).map((file) => (
                  <a key={file.id} href={file.previewUrl} target="_blank" className="rounded-full border border-white/10 bg-white/5 px-3 py-1" rel="noreferrer">{file.name}</a>
                ))}
              </div>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <select id="admin-status" defaultValue={selected.status} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
                {statuses.map((status) => <option key={status}>{status}</option>)}
              </select>
              <input id="admin-tech" defaultValue={selected.technician} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Technician" />
              <input id="admin-dept" defaultValue={selected.assignedDepartment} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Department" />
              <input id="admin-eta" defaultValue={selected.estimatedCompletion} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Expected completion" />
              <textarea id="admin-note" defaultValue={selected.adminRemarks} className="min-h-24 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2" placeholder="Admin remarks or resolution note" />
              <input
                type="file"
                multiple
                onChange={(event) => {
                  const files = Array.from(event.target.files ?? []);
                  setResolutionFiles(files);
                  setResolutionEvidence(files.map((file) => ({
                    id: `evidence-${crypto.randomUUID()}`,
                    name: file.name,
                    type: file.type || 'application/octet-stream',
                    size: file.size,
                    previewUrl: URL.createObjectURL(file),
                  })));
                }}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2"
              />
              <button
                type="button"
                onClick={async () => {
                  const status = (document.getElementById('admin-status') as HTMLSelectElement).value as ComplaintStatus;
                  const technician = (document.getElementById('admin-tech') as HTMLInputElement).value;
                  const assignedDepartment = (document.getElementById('admin-dept') as HTMLInputElement).value;
                  const estimatedCompletion = (document.getElementById('admin-eta') as HTMLInputElement).value;
                  const adminRemarks = (document.getElementById('admin-note') as HTMLTextAreaElement).value;
                  if (!localDemoMode) {
                    const uploaded = await Promise.all(resolutionFiles.map(uploadFile));
                    await updateComplaint(selected.id, {
                      status,
                      technician,
                      assignedDepartment,
                      estimatedCompletion,
                      adminRemarks,
                      resolutionEvidence: uploaded.map((file) => file.Url),
                    });
                  }
                  updateComplaintWorkflow(selected.id, {
                    status,
                    technician,
                    assignedDepartment,
                    estimatedCompletion,
                    adminRemarks,
                    resolutionEvidence,
                  }, actor);
                }}
                className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 md:col-span-2"
              >
                Save ticket update
              </button>
            </div>

            <div className="mt-4 grid gap-2">
              {selected.timeline.map((item) => (
                <div key={`${item.at}-${item.label}`} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-300">{item.at}: {item.label}</div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">User and role management</h3>
          <div className="mt-4 grid gap-3">
            {users.map((user) => (
              <div key={user.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4 md:grid-cols-[1fr_150px_120px]">
                <div>
                  <div className="font-semibold">{user.name}</div>
                  <div className="text-sm text-slate-400">{user.email} · {user.department}</div>
                </div>
                <select value={user.role} onChange={(event) => updateUser(user.id, { role: event.target.value as Role })} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none">
                  {roles.map((role) => <option key={role}>{role}</option>)}
                </select>
                <button type="button" onClick={() => updateUser(user.id, { active: !user.active })} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                  {user.active ? 'Disable' : 'Enable'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Audit logs</h3>
          <div className="mt-4 grid max-h-[420px] gap-3 overflow-auto pr-1">
            {auditLogs.map((item) => (
              <div key={item.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm">
                <div className="font-semibold">{item.action}</div>
                <div className="mt-1 text-slate-400">{item.actor} · {item.target} · {item.createdAt}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Wi-Fi monitoring</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {wifiAccessPoints.map((ap) => <WifiCard key={ap.id} ap={ap} />)}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Digital twin controls</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {['Refresh live IoT sync', 'Publish maintenance notice', 'Approve escalation', 'Capture audit snapshot'].map((item) => (
              <button key={item} type="button" onClick={() => recordAuditLog(actor, item, 'Campus operations')} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-left text-sm transition hover:bg-slate-900">
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>

      <CampusScene />
    </div>
  );
}
