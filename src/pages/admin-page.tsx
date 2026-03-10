import { useEffect, useState } from 'react';
import { RaceAdminForm } from '@/components/admin/race-admin-form';
import { ResultAdminForm } from '@/components/admin/result-admin-form';
import { EmptyState } from '@/components/ui/empty-state';
import { DRIVER_FIXTURES } from '@/lib/constants';
import { fetchRaceResults, saveRace, saveResult } from '@/services/supabase/data';
import type { Race } from '@/types/domain';

export function AdminPage() {
  const [races, setRaces] = useState<Race[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function reload() {
    const data = await fetchRaceResults();
    setRaces(data.races);
  }

  useEffect(() => {
    reload().catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load admin data.');
    });
  }, []);

  if (error) {
    return <EmptyState title="Admin unavailable" body={error} />;
  }

  return (
    <div className="space-y-6">
      {notice ? <div className="rounded-2xl border border-accent2/20 bg-accent2/10 px-4 py-3 text-sm text-accent2">{notice}</div> : null}
      <RaceAdminForm
        drivers={DRIVER_FIXTURES}
        onSave={async (values) => {
          setNotice(null);
          await saveRace(values);
          await reload();
          setNotice('Race round created.');
        }}
      />
      <ResultAdminForm
        races={races}
        onSave={async (values) => {
          setNotice(null);
          const race = races.find((item) => item.id === values.raceId);
          await saveResult({ ...values, hasSprint: race?.hasSprint ?? false });
          await reload();
          setNotice('Results published and scores recalculated.');
        }}
      />
    </div>
  );
}
