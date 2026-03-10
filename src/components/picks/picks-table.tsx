import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { PickSubmission, Profile, Race } from '@/types/domain';

function labelForDriver(race: Race, driverId: string): string {
  const driver = race.activeDrivers.find((item) => item.id === driverId);
  return driver ? `${driver.code} · ${driver.fullName}` : driverId;
}

export function PicksTable({
  race,
  picks,
  players,
}: {
  race: Race | null;
  picks: PickSubmission[];
  players: Profile[];
}) {
  if (!race) {
    return <EmptyState title="No race available" body="Create the upcoming round before opening the picks board." />;
  }

  const picksByUserId = new Map(picks.map((pick) => [pick.userId, pick]));
  const rows = players.map((player) => ({
    player,
    pick: picksByUserId.get(player.id) ?? null,
  }));

  if (rows.length === 0) {
    return <EmptyState title="No entry submitted" body="Once users submit picks, they will appear here after the lock time." />;
  }

  return (
    <Card eyebrow={`Round ${race.roundNumber}`} title="Submitted picks">
      <div className="space-y-4">
        {rows.map(({ player, pick }) => (
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
              {pick ? <p className="text-xs text-muted">Updated {new Date(pick.updatedAt).toLocaleString()}</p> : null}
            </div>
            {pick ? (
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                {pick.top10DriverIds.map((driverId, index) => (
                  <div key={`${pick.id}-${driverId}-${index}`} className="rounded-2xl border border-white/10 bg-panel px-3 py-2">
                    <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted">P{index + 1}</span>
                    <span className="font-medium text-text">{labelForDriver(race, driverId)}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Card>
  );
}
