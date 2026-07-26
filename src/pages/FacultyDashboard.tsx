import { useMemo, useState } from 'react';
import { CampusScene } from '../components/CampusScene';
import { StatCard } from '../components/DashboardCards';
import { useAuthStore } from '../store/authStore';
import { useCampusStore } from '../store/campusStore';
import { ComplaintStatus } from '../types';

const statuses: ComplaintStatus[] = ['Open', 'Assigned', 'In Progress', 'Resolved'];

export function FacultyDashboard() {
  const department = useAuthStore((state) => state.users.find((user) => user.id === state.userId)?.department ?? 'Computer Science');
  const actor = useAuthStore((state) => state.name);
  const buildings = useCampusStore((state) => state.buildings);
  const complaints = useCampusStore((state) => state.complaints);
  const updateComplaintWorkflow = useCampusStore((state) => state.updateComplaintWorkflow);
  const recordAuditLog = useCampusStore((state) => state.recordAuditLog);
  const [notice, setNotice] = useState('');
  const departmentRooms = buildings.flatMap((building) => building.classrooms).filter((room) => room.department === department || department === 'Computer Science');
  const departmentTickets = complaints.filter((complaint) => complaint.assignedDepartment.includes('IT') || complaint.assignedDepartment.includes('Lab') || complaint.category === 'Laboratory' || complaint.category === 'Internet');
  const availableRooms = departmentRooms.filter((room) => room.availability === 'Available').length;
  const averageOccupancy = useMemo(() => {
    if (!departmentRooms.length) {
      return 0;
    }
    return Math.round(departmentRooms.reduce((sum, room) => sum + room.occupancy / room.capacity, 0) / departmentRooms.length * 100);
  }, [departmentRooms]);

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Department" value={department} hint="Faculty workspace filtered to department context." />
        <StatCard label="Free rooms" value={availableRooms} hint="Available teaching spaces right now." />
        <StatCard label="Avg occupancy" value={`${averageOccupancy}%`} hint="Calculated from classroom utilization." />
        <StatCard label="Dept tickets" value={departmentTickets.length} hint="IT, lab, and classroom issues faculty can track." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <CampusScene />

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Room notice board</h3>
          <textarea value={notice} onChange={(event) => setNotice(event.target.value)} className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm outline-none" placeholder="Publish a maintenance or class relocation notice..." />
          <button
            type="button"
            onClick={() => {
              if (notice.trim()) {
                recordAuditLog(actor, 'Published faculty notice', notice.trim());
                setNotice('');
              }
            }}
            className="mt-3 rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950"
          >
            Publish notice
          </button>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Classroom availability</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {departmentRooms.map((room) => (
              <div key={room.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{room.roomNumber}</div>
                    <div className="text-sm text-slate-400">{room.currentLecture}</div>
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">{room.availability}</span>
                </div>
                <div className="mt-3 text-sm text-slate-300">{room.occupancy}/{room.capacity} seats · AC {room.acStatus} · Projector {room.projectorStatus}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Department ticket desk</h3>
          <div className="mt-4 grid gap-3">
            {departmentTickets.map((complaint) => (
              <div key={complaint.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
                <div className="font-semibold">{complaint.ticketNo} · {complaint.title}</div>
                <div className="mt-1 text-sm text-slate-400">{complaint.studentName} · {complaint.assignedDepartment}</div>
                <div className="mt-3 grid gap-2 md:grid-cols-[1fr_auto]">
                  <select
                    defaultValue={complaint.status}
                    onChange={(event) => updateComplaintWorkflow(complaint.id, {
                      status: event.target.value as ComplaintStatus,
                      assignedDepartment: complaint.assignedDepartment,
                      technician: complaint.technician || actor,
                      estimatedCompletion: complaint.estimatedCompletion,
                      adminRemarks: `Faculty desk updated ${complaint.ticketNo}.`,
                    }, actor)}
                    className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none"
                  >
                    {statuses.map((status) => <option key={status}>{status}</option>)}
                  </select>
                  <button type="button" onClick={() => recordAuditLog(actor, 'Contacted complainant', complaint.ticketNo ?? complaint.id)} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    Contact
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
