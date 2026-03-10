import { useEffect, useState } from 'react';
import { PicksTable } from '@/components/picks/picks-table';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { fetchProfiles, fetchUpcomingRace, fetchVisiblePicks } from '@/services/supabase/data';
import type { PickSubmission, Profile, Race } from '@/types/domain';

export function AllPicksPage() {
  const { profile } = useAuth();
  const [race, setRace] = useState<Race | null>(null);
  const [picks, setPicks] = useState<PickSubmission[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    Promise.all([fetchUpcomingRace(), fetchProfiles()])
      .then(async ([nextRace, profiles]) => {
        setRace(nextRace);
        setPlayers(profiles.filter((player) => player.role === 'player' || player.role === 'admin'));
        if (nextRace) {
          setPicks(await fetchVisiblePicks(nextRace, profile.id));
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks board.');
      });
  }, [profile]);

  if (error) {
    return <EmptyState title="Picks board unavailable" body={error} />;
  }

  return <PicksTable race={race} picks={picks} players={players} />;
}
