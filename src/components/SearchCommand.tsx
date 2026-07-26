import { useMemo, useState } from 'react';
import { findBuilding, findClassroom, findComplaint, searchCampus } from '../data/campus';
import { useCampusStore } from '../store/campusStore';

export function SearchCommand() {
  const [value, setValue] = useState('');
  const complaints = useCampusStore((state) => state.complaints);
  const results = useMemo(() => searchCampus(value, complaints), [complaints, value]);
  const setSelectedSearchResult = useCampusStore((state) => state.setSelectedSearchResult);
  const setSelectedBuildingId = useCampusStore((state) => state.setSelectedBuildingId);
  const setSelectedComplaintId = useCampusStore((state) => state.setSelectedComplaintId);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Global search</h3>
          <p className="text-xs text-slate-500">Buildings, rooms, departments, complaints, students</p>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-100">
          Live
        </span>
      </div>

      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search Block C, A-101, internet outage..."
        className="w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-300/50"
      />

      {!!results.length && (
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto pr-1">
          {results.map((result) => (
            <button
              key={`${result.kind}-${result.id}`}
              type="button"
              onClick={() => {
                setSelectedSearchResult(result);
                if (result.kind === 'building' && findBuilding(result.id)) {
                  setSelectedBuildingId(result.id);
                }
                if (result.kind === 'classroom' && findClassroom(result.id)) {
                  const classroom = findClassroom(result.id);
                  if (classroom) {
                    setSelectedBuildingId(classroom.buildingId);
                  }
                }
                if (result.kind === 'complaint' && findComplaint(result.id)) {
                  const complaint = findComplaint(result.id);
                  if (complaint) {
                    setSelectedBuildingId(complaint.buildingId);
                    setSelectedComplaintId(complaint.id);
                  }
                }
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10"
            >
              <span>{result.label}</span>
              <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400">{result.kind}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
