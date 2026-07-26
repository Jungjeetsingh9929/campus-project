import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CampusScene } from '../components/CampusScene';
import { AIAssistantPanel } from '../components/AIAssistantPanel';
import { ChartsPanel } from '../components/ChartsPanel';
import {
  BuildingCard,
  ComplaintCard,
  NotificationCard,
  StatCard,
} from '../components/DashboardCards';
import { SearchCommand } from '../components/SearchCommand';
import { useCampusStore } from '../store/campusStore';
import { useAuthStore } from '../store/authStore';
import { energySnapshots } from '../data/campus';

export function OverviewPage() {
  const navigate = useNavigate();
  const buildings = useCampusStore((state) => state.buildings);
  const complaints = useCampusStore((state) => state.complaints);
  const selectedBuildingId = useCampusStore((state) => state.selectedBuildingId);
  const selectedComplaintId = useCampusStore((state) => state.selectedComplaintId);
  const selectedSearchResult = useCampusStore((state) => state.selectedSearchResult);
  const notifications = useCampusStore((state) => state.notifications);
  const setSelectedBuildingId = useCampusStore((state) => state.setSelectedBuildingId);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);
  const role = useAuthStore((state) => state.role);

  const selectedBuilding = buildings.find((item) => item.id === selectedBuildingId) ?? buildings[0];
  const selectedComplaint = complaints.find((item) => item.id === selectedComplaintId) ?? complaints[0];
  const latestNotification = notifications[0];

  const stats = useMemo(
    () => [
      { label: 'Buildings live', value: buildings.length, hint: 'Every building carries metadata and route context.' },
      { label: 'Active complaints', value: complaints.filter((item) => item.status !== 'Resolved').length, hint: 'Visible on the map and in the workflow queue.' },
      { label: 'Energy alerts', value: energySnapshots.filter((item) => item.electricityKwh > 900).length, hint: 'AI scans for waste and spikes.' },
      { label: 'Signal health', value: '94%', hint: 'Real-time campus services sync through SignalR.' },
    ],
    [buildings.length, complaints.length],
  );

  return (
    <div className="grid gap-6 p-4 sm:p-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={stat.value} hint={stat.hint} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <CampusScene />

        <div className="grid gap-6">
          <SearchCommand />
          <AIAssistantPanel />

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Selected building</h3>
                <p className="text-sm text-slate-300">Click buildings or search results to focus the twin.</p>
              </div>
              <button
                type="button"
                onClick={() => navigate(role === 'Student' ? '/student' : role === 'Admin' ? '/admin' : '/emergency')}
                className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-100"
              >
                Role tools
              </button>
            </div>

            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-lg font-semibold">{selectedBuilding.block}</div>
              <div className="text-sm text-slate-400">{selectedBuilding.name}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 p-3">Purpose: {selectedBuilding.purpose}</div>
                <div className="rounded-2xl bg-white/5 p-3">Department: {selectedBuilding.department}</div>
                <div className="rounded-2xl bg-white/5 p-3">Current lecture: {selectedBuilding.metadata.currentLecture}</div>
                <div className="rounded-2xl bg-white/5 p-3">Next lecture: {selectedBuilding.metadata.nextLecture}</div>
                <div className="rounded-2xl bg-white/5 p-3">Projector: {selectedBuilding.metadata.projectorStatus}</div>
                <div className="rounded-2xl bg-white/5 p-3">AC: {selectedBuilding.metadata.acStatus}</div>
              </div>
              {selectedSearchResult && (
                <div className="mt-4 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-sm">
                  Search focus: <span className="font-semibold">{selectedSearchResult.label}</span>
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {selectedBuilding.classrooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setSelectedComplaintId(selectedComplaint?.id ?? null)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200"
                  >
                    {room.roomNumber} · {room.availability}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <NotificationCard item={latestNotification} />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Campus buildings</h3>
              <p className="text-sm text-slate-300">Metadata-rich digital twin inventory.</p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
              Click to focus
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {buildings.map((building) => (
              <BuildingCard
                key={building.id}
                building={building}
                selected={building.id === selectedBuildingId}
                onClick={() => setSelectedBuildingId(building.id)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Complaint detail</h3>
                <p className="text-sm text-slate-300">Every complaint is mapped onto the twin.</p>
              </div>
            </div>
            <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-lg font-semibold">{selectedComplaint.title}</div>
              <div className="mt-1 text-sm text-slate-400">
                {selectedComplaint.category} · {selectedComplaint.priority} · {selectedComplaint.status}
              </div>
              <div className="mt-4 text-sm leading-6 text-slate-300">{selectedComplaint.description}</div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl bg-white/5 p-3">Dept: {selectedComplaint.assignedDepartment}</div>
                <div className="rounded-2xl bg-white/5 p-3">Technician: {selectedComplaint.technician}</div>
                <div className="rounded-2xl bg-white/5 p-3">ETA: {selectedComplaint.estimatedCompletion}</div>
                <div className="rounded-2xl bg-white/5 p-3">Room: {selectedComplaint.roomNumber}</div>
              </div>
            </div>
          </div>

          <ChartsPanel />
        </div>
      </div>
    </div>
  );
}
