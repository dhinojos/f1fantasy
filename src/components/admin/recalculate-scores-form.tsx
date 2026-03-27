import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Race } from '@/types/domain';

export function RecalculateScoresForm({
  races,
  onRecalculateRace,
  onRecalculateFromRace,
}: {
  races: Race[];
  onRecalculateRace: (raceId: string) => Promise<void>;
  onRecalculateFromRace: (raceId: string) => Promise<void>;
}) {
  const recalculableRaces = useMemo(
    () => races.filter((race) => race.status === 'scored'),
    [races],
  );
  const [selectedRaceId, setSelectedRaceId] = useState<string>(recalculableRaces[0]?.id ?? '');
  const [mode, setMode] = useState<'single' | 'cascade' | null>(null);

  useEffect(() => {
    setSelectedRaceId((currentRaceId) => {
      if (currentRaceId && recalculableRaces.some((race) => race.id === currentRaceId)) {
        return currentRaceId;
      }

      return recalculableRaces[0]?.id ?? '';
    });
  }, [recalculableRaces]);

  const selectedRace = recalculableRaces.find((race) => race.id === selectedRaceId) ?? null;

  return (
    <Card eyebrow="Admin" title="Recalculate scores">
      <div className="space-y-4">
        <label className="grid gap-2 text-sm text-muted">
          Race
          <select
            value={selectedRaceId}
            onChange={(event) => setSelectedRaceId(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text"
          >
            {recalculableRaces.length === 0 ? <option value="">No scored races</option> : null}
            {recalculableRaces.map((race) => (
              <option key={race.id} value={race.id}>
                Round {race.roundNumber} · {race.grandPrixName} · {race.status}
              </option>
            ))}
          </select>
        </label>

        <p className="text-sm text-muted">
          Recalculate one race after editing results. If you changed an older race after later rounds were already scored, use the cascade action to rebuild cumulative totals from that round forward.
        </p>

        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={!selectedRace || mode !== null}
            onClick={async () => {
              if (!selectedRace) {
                return;
              }

              setMode('single');
              try {
                await onRecalculateRace(selectedRace.id);
              } finally {
                setMode(null);
              }
            }}
          >
            {mode === 'single' ? 'Recalculating...' : 'Recalculate selected race'}
          </Button>
          <Button
            type="button"
            disabled={!selectedRace || mode !== null}
            onClick={async () => {
              if (!selectedRace) {
                return;
              }

              setMode('cascade');
              try {
                await onRecalculateFromRace(selectedRace.id);
              } finally {
                setMode(null);
              }
            }}
          >
            {mode === 'cascade' ? 'Recalculating...' : 'Recalculate selected + later races'}
          </Button>
        </div>
      </div>
    </Card>
  );
}
