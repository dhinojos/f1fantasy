import { useEffect, useState } from 'react';
import { PicksTable } from '@/components/picks/picks-table';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { fetchProfiles, fetchRaceResults, fetchRaceScores, fetchVisiblePicks } from '@/services/supabase/data';
import type { PickSubmission, Profile, Race, RaceResult, RaceScore } from '@/types/domain';

export function AllPicksPage() {
  const { profile } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [picks, setPicks] = useState<PickSubmission[]>([]);
  const [scores, setScores] = useState<RaceScore[]>([]);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      return;
    }

    Promise.all([fetchRaceResults(), fetchProfiles()])
      .then(([raceData, profiles]) => {
        const availableRaces = raceData.races;
        const preferredRace =
          availableRaces.find((race) => race.status === 'upcoming' || race.status === 'locked') ??
          availableRaces[availableRaces.length - 1] ??
          null;

        setRaces(availableRaces);
        setResults(raceData.results);
        setSelectedRaceId(preferredRace?.id ?? null);
        setPlayers(profiles.filter((player) => player.role === 'player' || player.role === 'admin'));
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks board.');
      });
  }, [profile]);

  const selectedRace = races.find((race) => race.id === selectedRaceId) ?? null;
  const selectedResult = results.find((result) => result.raceId === selectedRaceId) ?? null;

  useEffect(() => {
    if (!profile || !selectedRace) {
      setPicks([]);
      setScores([]);
      return;
    }

    Promise.all([fetchVisiblePicks(selectedRace, profile.id), fetchRaceScores(selectedRace.id)])
      .then(([visiblePicks, raceScores]) => {
        setPicks(visiblePicks);
        setScores(raceScores);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks board.');
      });
  }, [profile, selectedRace]);

  if (error) {
    return <EmptyState title="Picks board unavailable" body={error} />;
  }

  return (
    <PicksTable
      race={selectedRace}
      races={races}
      selectedRaceId={selectedRaceId}
      onSelectRace={setSelectedRaceId}
      picks={picks}
      players={players}
      scores={scores}
      result={selectedResult}
    />
  );
}
