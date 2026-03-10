import { Card } from '@/components/ui/card';
import type { DashboardStats } from '@/types/domain';

export function InsightsCard({ insights }: { insights: DashboardStats['insights'] }) {
  const items = [
    ['Most-picked pole', insights.mostPickedPole],
    ['Most-picked winner', insights.mostPickedWinner],
    ['Most-picked top 10', insights.mostPickedTop10Driver],
    ['Consensus pick', insights.biggestConsensusPick],
    ['Unique pick', insights.mostUniquePick],
  ];

  return (
    <Card eyebrow="Trends" title="Pick insights">
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted">{label}</p>
            <p className="mt-2 font-medium text-text">{value ?? 'No picks yet'}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
