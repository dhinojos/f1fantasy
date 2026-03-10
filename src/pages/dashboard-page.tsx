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

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr,1fr]">
        <CountdownCard race={data.nextRace} />
        <Card eyebrow="Submission" title="Your status">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-display text-4xl font-bold text-text">{data.currentUserSubmission ? 'Ready' : 'Pending'}</p>
              <p className="mt-2 text-sm text-muted">
                {data.currentUserSubmission ? 'You have an active submission for the next race.' : 'No entry submitted yet.'}
              </p>
            </div>
            <Badge tone={data.currentUserSubmission ? 'success' : 'warning'}>{data.currentUserSubmission ? 'Submitted' : 'Missing'}</Badge>
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
