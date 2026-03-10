import { useEffect, useState } from 'react';
import { PickForm } from '@/components/picks/pick-form';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { fetchCurrentUserPick, fetchUpcomingRace, savePick } from '@/services/supabase/data';
import type { PickFormValues, PickSubmission, Race } from '@/types/domain';

export function SubmitPicksPage() {
  const { profile } = useAuth();
  const [race, setRace] = useState<Race | null>(null);
  const [pick, setPick] = useState<PickSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    fetchUpcomingRace()
      .then(async (nextRace) => {
        setRace(nextRace);
        if (nextRace) {
          setPick(await fetchCurrentUserPick(nextRace.id, profile.id));
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks.');
      });
  }, [profile]);

  async function handleSave(values: PickFormValues) {
    if (!race || !profile) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await savePick(race, profile.id, values);
      setPick(await fetchCurrentUserPick(race.id, profile.id));
      setNotice('Picks saved.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save picks.');
    }
  }

  if (error) {
    return <EmptyState title="Submit picks unavailable" body={error} />;
  }

  if (!race) {
    return <EmptyState title="No upcoming race" body="An admin needs to create the next race round before picks can open." />;
  }

  return (
    <div className="space-y-4">
      {notice ? <div className="rounded-2xl border border-accent2/20 bg-accent2/10 px-4 py-3 text-sm text-accent2">{notice}</div> : null}
      <PickForm race={race} existingPick={pick} onSave={handleSave} />
    </div>
  );
}
