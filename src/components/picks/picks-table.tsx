import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { scoreRace } from '@/lib/domain';
import { formatRaceDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { PickSubmission, Profile, Race, RaceResult, RaceScore } from '@/types/domain';

function labelForDriver(race: Race, driverId: string): string {
  const driver = race.activeDrivers.find((item) => item.id === driverId);
  return driver ? `${driver.code} · ${driver.fullName}` : driverId;
}

export function PicksTable({
  race,
  races,
  selectedRaceId,
  onSelectRace,
  picks,
  players,
  scores,
  result,
}: {
  race: Race | null;
  races: Race[];
  selectedRaceId: string | null;
  onSelectRace: (raceId: string) => void;
  picks: PickSubmission[];
  players: Profile[];
  scores: RaceScore[];
  result: RaceResult | null;
}) {
  if (!race) {
    return <EmptyState title="No race available" body="Create a race round before opening the picks board." />;
  }

  const picksByUserId = new Map(picks.map((pick) => [pick.userId, pick]));
  const scoresByUserId = new Map(scores.map((score) => [score.userId, score]));
  const currentRaceIndex = races.findIndex((item) => item.id === selectedRaceId);
  const previousRace = currentRaceIndex > 0 ? races[currentRaceIndex - 1] : null;
  const nextRace = currentRaceIndex >= 0 && currentRaceIndex < races.length - 1 ? races[currentRaceIndex + 1] : null;
  const rows = players.map((player) => ({
    player,
    pick: picksByUserId.get(player.id) ?? null,
    score: scoresByUserId.get(player.id) ?? null,
  }));

  if (rows.length === 0) {
    return <EmptyState title="No entry submitted" body="Once users submit picks, they will appear here after the lock time." />;
  }

  function pickPill(label: string, value: string, points: number) {
    const scored = points > 0;

    return (
      <div
        className={cn(
          'min-w-0 rounded-2xl border px-3 py-2',
          scored ? 'border-accent2/30 bg-accent2/10' : 'border-white/10 bg-panel',
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className={cn('shrink-0 text-xs uppercase tracking-[0.2em]', scored ? 'text-accent2' : 'text-muted')}>{label}</span>
          {result ? (
            <span
              className={cn(
                'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em]',
                scored ? 'bg-accent2/20 text-accent2' : 'bg-white/5 text-muted',
              )}
            >
              {points} pts
            </span>
          ) : null}
        </div>
        <p className={cn('mt-2 truncate font-medium', scored ? 'text-accent2' : 'text-text')} title={value}>
          {value}
        </p>
      </div>
    );
  }

  return (
    <Card
      eyebrow={`Round ${race.roundNumber}`}
      title={race.grandPrixName}
      action={
        <div className="flex items-center gap-2">
          <Badge tone={race.status === 'scored' ? 'success' : race.status === 'locked' ? 'warning' : 'neutral'}>{race.status}</Badge>
          <Button type="button" variant="secondary" onClick={() => previousRace && onSelectRace(previousRace.id)} disabled={!previousRace}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button type="button" variant="secondary" onClick={() => nextRace && onSelectRace(nextRace.id)} disabled={!nextRace}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="mb-4 flex items-center justify-between gap-3 text-sm text-muted">
        <p>{formatRaceDate(race.raceDate)}</p>
        <p>
          {currentRaceIndex + 1} / {races.length}
        </p>
      </div>
      <div className="space-y-4">
        {rows.map(({ player, pick, score }) => {
          const breakdown = pick && result ? scoreRace(pick, result) : null;

          return (
          <div key={player.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-text">{player.displayName}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted">
                  {pick
                    ? `${race.hasSprint ? `Sprint: ${labelForDriver(race, pick.sprintWinnerDriverId ?? '')} / ${labelForDriver(race, pick.sprintSecondDriverId ?? '')} · ` : ''}Pole: ${labelForDriver(race, pick.poleDriverId)}`
                    : 'No entry submitted'}
                </p>
              </div>
              <div className="text-right">
                {score ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-accent2">
                    {score.racePoints} pts · {score.cumulativePoints} total
                  </p>
                ) : pick && race.status === 'scored' ? (
                  <p className="text-xs uppercase tracking-[0.2em] text-muted">0 pts</p>
                ) : null}
                {pick ? <p className="text-xs text-muted">Updated {new Date(pick.updatedAt).toLocaleString()}</p> : null}
              </div>
            </div>
            {pick ? (
              <div className="space-y-2">
                {race.hasSprint ? (
                  <div className="grid gap-2 md:grid-cols-3">
                    {pickPill(
                      'Sprint 1',
                      labelForDriver(race, pick.sprintWinnerDriverId ?? ''),
                      pick.sprintWinnerDriverId && result?.sprintWinnerDriverId === pick.sprintWinnerDriverId ? 2 : 0,
                    )}
                    {pickPill(
                      'Sprint 2',
                      labelForDriver(race, pick.sprintSecondDriverId ?? ''),
                      pick.sprintSecondDriverId && result?.sprintSecondDriverId === pick.sprintSecondDriverId ? 1 : 0,
                    )}
                    {pickPill('Pole', labelForDriver(race, pick.poleDriverId), pick.poleDriverId === result?.poleDriverId ? 2 : 0)}
                  </div>
                ) : (
                  <div className="grid gap-2 md:grid-cols-3">
                    {pickPill('Pole', labelForDriver(race, pick.poleDriverId), pick.poleDriverId === result?.poleDriverId ? 2 : 0)}
                  </div>
                )}

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {pick.top10DriverIds.map((driverId, index) => {
                    const exactPoints = index === 0 ? 5 : index === 1 ? 4 : index === 2 ? 3 : 0;
                    const points =
                      result?.top10DriverIds[index] === driverId
                        ? exactPoints + 1
                        : result?.top10DriverIds.includes(driverId)
                          ? 1
                          : 0;

                    return (
                      <div key={`${pick.id}-${driverId}-${index}`}>
                        {pickPill(`P${index + 1}`, labelForDriver(race, driverId), points)}
                      </div>
                    );
                  })}
                </div>
                {breakdown ? (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs uppercase tracking-[0.18em] text-muted">
                    <span>Sprint {breakdown.sprintPoints}</span>
                    <span>Pole {breakdown.polePoints}</span>
                    <span>Podium {breakdown.podiumPoints}</span>
                    <span>Top 10 {breakdown.top10Points}</span>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        )})}
      </div>
    </Card>
  );
}
