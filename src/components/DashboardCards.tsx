import { CampusBuilding, Complaint, NotificationItem, WifiAccessPoint } from '../types';

function valueClass(level: string) {
  if (level === 'Critical' || level === 'Offline') return 'text-rose-300';
  if (level === 'Weak Signal' || level === 'Reserved') return 'text-amber-300';
  return 'text-emerald-300';
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="text-xs uppercase tracking-[0.35em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      <div className="mt-1 text-sm text-slate-400">{hint}</div>
    </div>
  );
}

export function BuildingCard({ building, selected, onClick }: { building: CampusBuilding; selected?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-4 text-left transition',
        selected ? 'border-cyan-300/40 bg-cyan-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-lg font-semibold">{building.block}</div>
          <div className="text-sm text-slate-400">{building.name}</div>
        </div>
        <span className={['text-sm font-semibold', valueClass(building.metadata.availability)].join(' ')}>{building.metadata.availability}</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-black/20 p-3">
          <div className="text-slate-400">Occupancy</div>
          <div className="font-semibold">{building.occupancy}%</div>
        </div>
        <div className="rounded-2xl bg-black/20 p-3">
          <div className="text-slate-400">Wi-Fi</div>
          <div className={['font-semibold', valueClass(building.wifiHealth)].join(' ')}>{building.wifiHealth}</div>
        </div>
      </div>
    </button>
  );
}

export function ComplaintCard({ complaint, selected, onClick }: { complaint: Complaint; selected?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-3xl border p-4 text-left transition',
        selected ? 'border-rose-300/40 bg-rose-400/10' : 'border-white/10 bg-white/5 hover:bg-white/10',
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{complaint.title}</div>
          <div className="text-sm text-slate-400">{complaint.category} · {complaint.roomNumber}</div>
        </div>
        <div className="text-right">
          <div className={['text-sm font-semibold', valueClass(complaint.priority)].join(' ')}>{complaint.priority}</div>
          <div className="text-xs text-slate-400">{complaint.status}</div>
        </div>
      </div>
    </button>
  );
}

export function WifiCard({ ap }: { ap: WifiAccessPoint }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-semibold">{ap.name}</div>
          <div className="text-sm text-slate-400">{ap.connectedUsers} users</div>
        </div>
        <div className={['text-sm font-semibold', valueClass(ap.status)].join(' ')}>{ap.status}</div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-400">
        <div className="rounded-2xl bg-black/20 p-3">BW {ap.bandwidthMbps} Mbps</div>
        <div className="rounded-2xl bg-black/20 p-3">LAT {ap.latencyMs} ms</div>
        <div className="rounded-2xl bg-black/20 p-3">LOSS {ap.packetLossPercent}%</div>
      </div>
    </div>
  );
}

export function NotificationCard({ item }: { item: NotificationItem }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-semibold">{item.title}</div>
        <div className={['text-xs font-semibold uppercase tracking-[0.3em]', valueClass(item.level)].join(' ')}>{item.level}</div>
      </div>
      <div className="mt-2 text-sm text-slate-300">{item.message}</div>
      <div className="mt-3 text-xs text-slate-500">{item.createdAt}</div>
    </div>
  );
}
