import { useMemo, useState } from 'react';
import { CampusScene } from '../components/CampusScene';
import { StatCard, ComplaintCard } from '../components/DashboardCards';
import { useCampusStore } from '../store/campusStore';
import { getRoutePlan, speakDirections } from '../lib/navigation';
import { RouteMode } from '../lib/navigation';
import { answerCampusQuestion } from '../lib/campusAssistant';
import { campusBuildings, complaintCategories } from '../data/campus';
import { useAuthStore } from '../store/authStore';
import { ComplaintAttachment } from '../types';
import { createComplaint, uploadFile } from '../api/campusApi';

const initialComplaint = {
  title: '',
  description: '',
  category: 'Electrical',
  priority: 'Medium',
  buildingId: 'block-a',
  roomNumber: '',
  latitude: 28.545,
  longitude: 77.173,
  contact: '',
};

export function StudentDashboard() {
  const buildings = useCampusStore((state) => state.buildings);
  const allComplaints = useCampusStore((state) => state.complaints);
  const notifications = useCampusStore((state) => state.notifications);
  const createLocalComplaint = useCampusStore((state) => state.createLocalComplaint);
  const addComplaintFromApi = useCampusStore((state) => state.addComplaintFromApi);
  const setSelectedBuildingId = useCampusStore((state) => state.setSelectedBuildingId);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);
  const selectedBuildingId = useCampusStore((state) => state.selectedBuildingId);
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.name);
  const email = useAuthStore((state) => state.email);
  const users = useAuthStore((state) => state.users);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);
  const [fromId, setFromId] = useState('block-a');
  const [toId, setToId] = useState('block-c');
  const [mode, setMode] = useState<RouteMode>('Shortest path');
  const [form, setForm] = useState(initialComplaint);
  const [attachments, setAttachments] = useState<ComplaintAttachment[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordForm, setPasswordForm] = useState({ current: '', next: '' });
  const route = useMemo(() => getRoutePlan(fromId, toId, mode), [fromId, toId, mode]);
  const answer = answerCampusQuestion('Show nearest free classroom');
  const currentUser = users.find((user) => user.id === userId);
  const complaints = allComplaints.filter((complaint) => complaint.studentId === userId);
  const localDemoMode = import.meta.env.VITE_ENABLE_LOCAL_DEMO_MODE === 'true';

  const selectedBuilding = buildings.find((item) => item.id === selectedBuildingId) ?? buildings[0];

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Free rooms" value={campusBuildings.flatMap((b) => b.classrooms).filter((r) => r.availability === 'Available').length} hint="Realtime classroom availability." />
        <StatCard label="Today classes" value={11} hint="Personal timetable with occupancy awareness." />
        <StatCard label="Notifications" value={notifications.length} hint="Complaint, room, and emergency updates." />
        <StatCard label="AI helper" value="On" hint="Search campus data in natural language." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <CampusScene />

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Navigation</h3>
            <p className="mt-1 text-sm text-slate-300">Shortest, accessible, and voice-guided campus routes.</p>

            <div className="mt-4 grid gap-3">
              <label className="text-sm">
                From
                <select value={fromId} onChange={(event) => setFromId(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.block}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                To
                <select value={toId} onChange={(event) => setToId(event.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
                  {buildings.map((building) => (
                    <option key={building.id} value={building.id}>{building.block}</option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                Mode
                <select value={mode} onChange={(event) => setMode(event.target.value as RouteMode)} className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
                  <option>Shortest path</option>
                  <option>Accessible route</option>
                  <option>Emergency route</option>
                </select>
              </label>

              <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                <div className="text-lg font-semibold">{route.title}</div>
                <div className="mt-1 text-sm text-slate-400">{route.distanceMeters} meters · about {route.durationMinutes} minutes</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  {route.steps.map((step) => (
                    <li key={step} className="rounded-2xl bg-white/5 px-3 py-2">{step}</li>
                  ))}
                </ul>
                <button type="button" onClick={() => speakDirections(route.steps.join(' '))} className="mt-4 rounded-2xl bg-cyan-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300">
                  Voice navigation
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">AI answer</h3>
            <p className="mt-3 rounded-3xl border border-cyan-300/15 bg-cyan-400/10 p-4 text-sm text-cyan-50">{answer}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Live classroom availability</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {buildings.flatMap((building) =>
              building.classrooms.map((room) => (
                <div key={room.id} className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-semibold">{room.roomNumber}</div>
                      <div className="text-sm text-slate-400">{room.department}</div>
                    </div>
                    <div className={[
                      'rounded-full px-3 py-1 text-xs font-semibold',
                      room.availability === 'Available' ? 'bg-emerald-400/10 text-emerald-100' : room.availability === 'Reserved' ? 'bg-amber-400/10 text-amber-100' : 'bg-rose-400/10 text-rose-100',
                    ].join(' ')}>
                      {room.availability}
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-slate-300">
                    {room.occupancy}/{room.capacity} seats · {room.currentLecture}
                  </div>
                </div>
              )),
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Complaint registration</h3>
              <p className="text-sm text-slate-300">Submit with category, priority, building, room, image, and GPS context.</p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Title" />
            <select value={form.buildingId} onChange={(e) => {
              const building = buildings.find((item) => item.id === e.target.value) ?? buildings[0];
              setSelectedBuildingId(building.id);
              setForm((f) => ({ ...f, buildingId: building.id, roomNumber: building.classrooms[0]?.roomNumber ?? f.roomNumber, latitude: 28.545 + building.x / 100, longitude: 77.173 + building.z / 100 }));
            }} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
              {buildings.map((building) => <option key={building.id} value={building.id}>{building.block}</option>)}
            </select>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
              {complaintCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </select>
            <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none">
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
            <input value={form.roomNumber} onChange={(e) => setForm((f) => ({ ...f, roomNumber: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2" placeholder={`Room number, e.g. ${selectedBuilding.classrooms[0]?.roomNumber ?? 'A-101'}`} />
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="min-h-28 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2" placeholder="Describe the issue..." />
            <input value={form.latitude} onChange={(e) => setForm((f) => ({ ...f, latitude: Number(e.target.value) }))} type="number" step="0.0001" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Latitude" />
            <input value={form.longitude} onChange={(e) => setForm((f) => ({ ...f, longitude: Number(e.target.value) }))} type="number" step="0.0001" className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Longitude" />
            <input
              type="file"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                setFiles(files);
                setAttachments(files.map((file) => ({
                  id: `file-${crypto.randomUUID()}`,
                  name: file.name,
                  type: file.type || 'application/octet-stream',
                  size: file.size,
                  previewUrl: URL.createObjectURL(file),
                })));
              }}
              className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2"
            />
            <input value={form.contact} onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none md:col-span-2" placeholder="Phone or email for updates" />
            <button
              type="button"
              disabled={submitting}
              onClick={async () => {
                if (!form.title.trim() || !form.description.trim()) {
                  setMessage('Please fill in a title and description.');
                  return;
                }
                setSubmitting(true);
                setMessage(null);
                try {
                  if (!userId) {
                    setMessage('Please sign in again before submitting a complaint.');
                    return;
                  }

                  if (localDemoMode) {
                    const complaint = createLocalComplaint({
                      title: form.title,
                      description: form.description,
                      category: form.category as any,
                      priority: form.priority as any,
                      buildingId: form.buildingId,
                      roomNumber: form.roomNumber || selectedBuilding.classrooms[0]?.roomNumber || 'A-101',
                      gps: [form.latitude, form.longitude],
                      studentId: userId,
                      studentName: userName,
                      rollNumber: currentUser?.rollNumber,
                      contact: form.contact || email,
                      attachments,
                    });
                    setMessage(`${complaint.ticketNo} submitted in local demo mode.`);
                  } else {
                    const uploaded = await Promise.all(files.map(uploadFile));
                    const complaint = await createComplaint({
                      title: form.title,
                      description: form.description,
                      category: form.category,
                      priority: form.priority,
                      buildingId: form.buildingId,
                      roomNumber: form.roomNumber || selectedBuilding.classrooms[0]?.roomNumber || 'A-101',
                      latitude: form.latitude,
                      longitude: form.longitude,
                      contact: form.contact || email,
                      images: uploaded.map((file) => file.Url),
                    });
                    addComplaintFromApi(complaint);
                    setMessage(`${complaint.TicketNo} submitted and saved to the backend.`);
                  }
                  setForm(initialComplaint);
                  setAttachments([]);
                  setFiles([]);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : 'Complaint submission failed.');
                } finally {
                  setSubmitting(false);
                }
              }}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 md:col-span-2 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Register complaint'}
            </button>
            {message && <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200 md:col-span-2">{message}</div>}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">My complaint history</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {complaints.length ? complaints.map((item) => (
            <ComplaintCard key={item.id} complaint={item} onClick={() => setSelectedComplaintId(item.id)} selected={false} />
          )) : <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-300">No complaints filed from this account yet.</div>}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Profile management</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input defaultValue={currentUser?.name} onBlur={(event) => updateProfile({ name: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Name" />
            <input defaultValue={currentUser?.phone} onBlur={(event) => updateProfile({ phone: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Phone" />
            <input defaultValue={currentUser?.rollNumber} onBlur={(event) => updateProfile({ rollNumber: event.target.value })} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Roll number" />
            <input value={email} readOnly className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-400 outline-none" />
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Change password</h3>
          <div className="mt-4 grid gap-3">
            <input type="password" value={passwordForm.current} onChange={(event) => setPasswordForm((value) => ({ ...value, current: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Current password" />
            <input type="password" value={passwordForm.next} onChange={(event) => setPasswordForm((value) => ({ ...value, next: event.target.value }))} className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="New password" />
            <button
              type="button"
              onClick={async () => {
                try {
                  await changePassword(passwordForm.current, passwordForm.next);
                  setPasswordForm({ current: '', next: '' });
                  setProfileMessage('Password updated.');
                } catch (error) {
                  setProfileMessage(error instanceof Error ? error.message : 'Password update failed.');
                }
              }}
              className="rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
            >
              Save password
            </button>
            {profileMessage && <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-slate-200">{profileMessage}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
