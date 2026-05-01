import { useEffect, useState } from 'react';
import { CountdownCard } from '@/components/dashboard/countdown-card';
import { PodiumCard } from '@/components/dashboard/podium-card';
import { StandingsCard } from '@/components/dashboard/standings-card';
import { InsightsCard } from '@/components/dashboard/insights-card';
import { AccuracyChart } from '@/components/dashboard/accuracy-chart';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { hasRaceSubmission, hasSprintSubmission } from '@/lib/domain';
import { fetchDashboard } from '@/services/supabase/data';
import type { DashboardStats } from '@/types/domain';

export function DashboardPage() {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    fetchDashboard(profile)
      .then(setData)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load dashboard.');
      });
  }, [profile]);

  if (error) {
    return <EmptyState title="Dashboard unavailable" body={error} />;
  }

  if (!data) {
    return <div className="text-sm text-muted">Loading dashboard...</div>;
  }

  const sprintSubmitted = data.nextRace ? hasSprintSubmission(data.currentUserSubmission, data.nextRace) : false;
  const raceSubmitted = hasRaceSubmission(data.currentUserSubmission);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <CountdownCard race={data.nextRace} />
        <Card eyebrow="Submission" title="Your status">
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Sprint</p>
                <p className="mt-2 font-display text-3xl font-bold text-text">{sprintSubmitted ? 'Ready' : 'Pending'}</p>
              </div>
              <Badge tone={sprintSubmitted ? 'success' : 'warning'}>{sprintSubmitted ? 'Submitted' : 'Missing'}</Badge>
            </div>
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Race</p>
                <p className="mt-2 font-display text-3xl font-bold text-text">{raceSubmitted ? 'Ready' : 'Pending'}</p>
              </div>
              <Badge tone={raceSubmitted ? 'success' : 'warning'}>{raceSubmitted ? 'Submitted' : 'Missing'}</Badge>
            </div>
            <p className="text-sm text-muted">
              {data.currentUserSubmission
                ? 'Sprint and race picks are tracked separately for the next round.'
                : 'No picks submitted yet for the next round.'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr,0.9fr]">
        <StandingsCard standings={data.standings} />
        <PodiumCard standings={data.standings} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <InsightsCard insights={data.insights} />
        <AccuracyChart items={data.playerAccuracy} />
      </div>
    </div>
  );
}
