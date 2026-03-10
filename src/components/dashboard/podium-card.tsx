import { Crown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { RaceScore } from '@/types/domain';

const podiumHeights = ['h-28', 'h-20', 'h-16'];

export function PodiumCard({ standings }: { standings: RaceScore[] }) {
  const topThree = standings.slice(0, 3);

  return (
    <Card eyebrow="Leaders" title="Podium">
      <div className="grid grid-cols-3 items-end gap-3">
        {topThree.map((score, index) => (
          <div key={score.id} className="text-center">
            <p className="mb-2 text-sm text-muted">{score.user?.displayName ?? 'Player'}</p>
            <div className={`flex ${podiumHeights[index]} items-center justify-center rounded-t-3xl border border-white/10 bg-white/[0.04]`}>
              <div className="flex flex-col items-center">
                {index === 0 ? <Crown className="mb-1 h-5 w-5 text-accent" /> : null}
                <span className="font-display text-4xl font-bold text-text">{index + 1}</span>
                <span className="text-sm text-muted">{score.cumulativePoints} pts</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
