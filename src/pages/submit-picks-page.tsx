import { useEffect, useState } from 'react';
import { PickForm } from '@/components/picks/pick-form';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/hooks/use-auth';
import { fetchCurrentUserPick, fetchProfiles, fetchRaceResults, fetchUpcomingRace, savePick } from '@/services/supabase/data';
import type { PickFormValues, PickSubmission, Profile, Race } from '@/types/domain';

export function SubmitPicksPage() {
  const { profile } = useAuth();
  const [races, setRaces] = useState<Race[]>([]);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [selectedRaceId, setSelectedRaceId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [pick, setPick] = useState<PickSubmission | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const isAdmin = profile?.role === 'admin';
  const isAdminOverride = Boolean(
    isAdmin &&
      profile &&
      selectedUserId &&
      selectedUserId !== profile.id,
  );

  useEffect(() => {
    if (!profile) {
      return;
    }

    Promise.all([fetchUpcomingRace(), fetchRaceResults(), isAdmin ? fetchProfiles() : Promise.resolve([])])
      .then(([nextRace, raceData, profiles]) => {
        setRaces(raceData.races);
        setPlayers(profiles.filter((player) => player.role === 'player' || player.role === 'admin'));
        setSelectedRaceId((currentRaceId) => currentRaceId ?? nextRace?.id ?? raceData.races[raceData.races.length - 1]?.id ?? null);
        setSelectedUserId((currentUserId) => currentUserId ?? profile.id);
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks.');
      });
  }, [profile]);

  useEffect(() => {
    const selectedRace = races.find((item) => item.id === selectedRaceId) ?? null;
    setRace(selectedRace);
  }, [races, selectedRaceId]);

  useEffect(() => {
    if (!race || !selectedUserId) {
      setPick(null);
      return;
    }

    fetchCurrentUserPick(race.id, selectedUserId)
      .then(setPick)
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load picks.');
      });
  }, [race, selectedUserId]);

  async function handleSave(values: PickFormValues) {
    if (!race || !profile || !selectedUserId) {
      return;
    }

    setError(null);
    setNotice(null);

    try {
      await savePick(race, selectedUserId, values, {
        allowLockedOverride: isAdminOverride,
      });
      setPick(await fetchCurrentUserPick(race.id, selectedUserId));
      setNotice(isAdminOverride ? 'Picks saved for selected player.' : 'Picks saved.');
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

  const selectedPlayer = players.find((player) => player.id === selectedUserId) ?? profile;
  const availableRaces = isAdmin ? races : races.filter((item) => item.id === race.id);

  return (
    <div className="space-y-4">
      {notice ? <div className="rounded-2xl border border-accent2/20 bg-accent2/10 px-4 py-3 text-sm text-accent2">{notice}</div> : null}
      {isAdmin ? (
        <Card eyebrow="Admin tools" title="Submit picks on behalf of a player">
          <div className="grid gap-4 lg:grid-cols-2">
            <label className="grid gap-2 text-sm text-muted">
              Race
              <select
                value={selectedRaceId ?? ''}
                onChange={(event) => {
                  setNotice(null);
                  setSelectedRaceId(event.target.value || null);
                }}
                className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
              >
                {availableRaces.map((item) => (
                  <option key={item.id} value={item.id}>
                    Round {item.roundNumber} · {item.grandPrixName} · {item.status}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2 text-sm text-muted">
              Player
              <select
                value={selectedUserId ?? ''}
                onChange={(event) => {
                  setNotice(null);
                  setSelectedUserId(event.target.value || null);
                }}
                className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
              >
                <option value={profile?.id ?? ''}>{profile?.displayName ?? 'You'}</option>
                {players
                  .filter((player) => player.id !== profile?.id)
                  .map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.displayName}
                    </option>
                  ))}
              </select>
            </label>
          </div>
          {isAdminOverride ? (
            <p className="mt-4 text-sm text-accent2">Locked races stay editable here while you are submitting for another player.</p>
          ) : null}
        </Card>
      ) : null}
      <PickForm
        race={race}
        existingPick={pick}
        onSave={handleSave}
        allowLockedEditing={isAdminOverride}
        eyebrow={isAdminOverride ? `Admin entry for ${selectedPlayer?.displayName ?? 'player'}` : undefined}
      />
    </div>
  );
}
