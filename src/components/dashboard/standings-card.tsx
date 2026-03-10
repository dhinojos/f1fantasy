import { ArrowDown, ArrowRight, ArrowUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { RaceScore } from '@/types/domain';

function movementIcon(index: number) {
  if (index === 0) return <ArrowUp className="h-4 w-4 text-accent2" />;
  if (index === 1) return <ArrowRight className="h-4 w-4 text-muted" />;
  return <ArrowDown className="h-4 w-4 text-accent" />;
}

export function StandingsCard({ standings }: { standings: RaceScore[] }) {
  return (
    <Card eyebrow="Standings" title="Championship table">
      <div className="space-y-3">
        {standings.slice(0, 8).map((score, index) => (
          <div key={score.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 font-display text-lg font-bold text-text">
                {index + 1}
              </div>
              <div>
                <p className="font-medium text-text">{score.user?.displayName ?? 'Player'}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Last race {score.racePoints} pts</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {movementIcon(index)}
              <span className="font-display text-2xl font-bold text-text">{score.cumulativePoints}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
