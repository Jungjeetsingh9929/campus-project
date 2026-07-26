import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import { useMemo } from 'react';
import { useCampusStore } from '../store/campusStore';

ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend);

export function ChartsPanel() {
  const analytics = useCampusStore((state) => state.analytics);
  const chartData = useMemo(
    () => ({
      labels: analytics.map((item) => item.label),
      datasets: [
        {
          label: 'Complaints',
          data: analytics.map((item) => item.complaints),
          borderColor: '#67e8f9',
          backgroundColor: 'rgba(103, 232, 249, 0.16)',
        },
        {
          label: 'Occupancy %',
          data: analytics.map((item) => item.occupancy),
          borderColor: '#9effa8',
          backgroundColor: 'rgba(158, 255, 168, 0.16)',
        },
      ],
    }),
    [analytics],
  );

  const energyData = {
    labels: analytics.map((item) => item.label),
    datasets: [
      {
        label: 'Energy Index',
        data: analytics.map((item) => item.energy),
        backgroundColor: 'rgba(255, 128, 92, 0.75)',
      },
    ],
  };

  const heatmap = analytics.flatMap((item, row) =>
    ['Library', 'Hostel', 'Canteen', 'Labs'].map((label, col) => ({
      key: `${row}-${col}`,
      label,
      value: Math.min(100, item.occupancy + col * 7 - row * 2),
    })),
  );

  return (
    <div className="grid gap-5 xl:grid-cols-[1.3fr_0.9fr]">
      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Complaint and occupancy trend</h3>
        <div className="mt-4 h-80">
          <Line
            data={chartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#cbd5e1' } } },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              },
            }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Energy trend</h3>
        <div className="mt-4 h-80">
          <Bar
            data={energyData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { labels: { color: '#cbd5e1' } } },
              scales: {
                x: { ticks: { color: '#94a3b8' }, grid: { display: false } },
                y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.05)' } },
              },
            }}
          />
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4 xl:col-span-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Occupancy heatmap</h3>
            <p className="mt-1 text-sm text-slate-300">Wi-Fi sensors, camera counts, and occupancy simulation.</p>
          </div>
          <div className="rounded-full border border-white/10 bg-slate-950/60 px-3 py-1 text-xs text-slate-300">
            Live campus density
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {heatmap.map((cell) => (
            <div
              key={cell.key}
              className="rounded-2xl border border-white/10 p-4"
              style={{
                background: `linear-gradient(180deg, rgba(7,17,31,0.9), rgba(${Math.max(30, 255 - cell.value * 2)}, ${Math.min(255, 70 + cell.value * 1.2)}, ${Math.max(80, 180 - cell.value * 0.8)}, 0.18))`,
              }}
            >
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">{cell.label}</div>
              <div className="mt-2 text-2xl font-semibold">{cell.value}%</div>
              <div className="mt-1 text-xs text-slate-400">Realtime density score</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
