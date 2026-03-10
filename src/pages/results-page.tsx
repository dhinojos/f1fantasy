import { useEffect, useState } from 'react';
import { ResultsTable } from '@/components/results/results-table';
import { AccuracyChart } from '@/components/dashboard/accuracy-chart';
import { EmptyState } from '@/components/ui/empty-state';
import { fetchDashboard, fetchRaceResults } from '@/services/supabase/data';
import { useAuth } from '@/hooks/use-auth';
import type { DashboardStats, Race, RaceResult } from '@/types/domain';

export function ResultsPage() {
  const { profile } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [dashboard, setDashboard] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    Promise.all([fetchRaceResults(), fetchDashboard(profile)])
      .then(([resultData, dashboardData]) => {
        setRaces(resultData.races);
        setResults(resultData.results);
        setDashboard(dashboardData);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load results.');
      });
  }, [profile]);

  if (error) {
    return <EmptyState title="Results unavailable" body={error} />;
  }

  return (
    <div className="space-y-6">
      <ResultsTable races={races} results={results} />
      {dashboard ? <AccuracyChart items={dashboard.playerAccuracy} /> : null}
    </div>
  );
}
