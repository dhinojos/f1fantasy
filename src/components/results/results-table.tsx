import { Card } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { Race, RaceResult } from '@/types/domain';

function labelForDriver(race: Race, driverId: string): string {
  const driver = race.activeDrivers.find((item) => item.id === driverId);
  return driver ? `${driver.code} · ${driver.fullName}` : driverId;
}

export function ResultsTable({ races, results }: { races: Race[]; results: RaceResult[] }) {
  if (races.length === 0) {
    return <EmptyState title="No race history" body="Race results will appear here once rounds are created and scored." />;
  }

  return (
    <Card eyebrow="Race history" title="Official results">
      <div className="space-y-4">
        {races.map((race) => {
          const result = results.find((item) => item.raceId === race.id);
          return (
            <div key={race.id} className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
              <div className="mb-3">
                <p className="font-medium text-text">
                  Round {race.roundNumber} · {race.grandPrixName}
                </p>
                <p className="text-sm text-muted">{new Date(race.raceDate).toLocaleDateString()}</p>
              </div>
              {result ? (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {race.hasSprint ? (
                    <>
                      <div className="rounded-2xl border border-white/10 bg-panel px-3 py-2">
                        <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted">Sprint 1</span>
                        <span className="font-medium text-text">{labelForDriver(race, result.sprintWinnerDriverId ?? '')}</span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-panel px-3 py-2">
                        <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted">Sprint 2</span>
                        <span className="font-medium text-text">{labelForDriver(race, result.sprintSecondDriverId ?? '')}</span>
                      </div>
                    </>
                  ) : null}
                  <div className="rounded-2xl border border-white/10 bg-panel px-3 py-2">
                    <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted">Pole</span>
                    <span className="font-medium text-text">{labelForDriver(race, result.poleDriverId)}</span>
                  </div>
                  {result.top10DriverIds.map((driverId, index) => (
                    <div key={`${result.id}-${driverId}-${index}`} className="rounded-2xl border border-white/10 bg-panel px-3 py-2">
                      <span className="mr-2 text-xs uppercase tracking-[0.2em] text-muted">P{index + 1}</span>
                      <span className="font-medium text-text">{labelForDriver(race, driverId)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted">Official result not entered yet.</p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
