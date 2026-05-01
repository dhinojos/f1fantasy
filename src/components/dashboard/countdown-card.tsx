import { motion } from 'framer-motion';
import { TimerReset } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCountdown, formatDateTime } from '@/lib/format';
import { isRaceLocked, isSprintLocked } from '@/lib/domain';
import type { Race } from '@/types/domain';

export function CountdownCard({ race }: { race: Race | null }) {
  if (!race) {
    return (
      <Card eyebrow="Next Race" title="Awaiting calendar">
        <p className="text-sm text-muted">Create the next race round in the admin screen to open submissions.</p>
      </Card>
    );
  }

  const sprintLocked = race.hasSprint && isSprintLocked(race);
  const raceLocked = isRaceLocked(race.lockAt);
  const statusLabel = raceLocked ? 'Locked' : sprintLocked ? 'Race Only' : 'Open';

  return (
    <Card eyebrow={`Round ${race.roundNumber}`} title={race.grandPrixName} action={<Badge tone={raceLocked ? 'warning' : 'success'}>{statusLabel}</Badge>}>
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-accent"
        >
          <TimerReset className="h-8 w-8" />
        </motion.div>
        <div className="grid flex-1 gap-3 sm:grid-cols-2">
          {race.hasSprint ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs uppercase tracking-[0.2em] text-muted">Sprint lock</p>
                <Badge tone={sprintLocked ? 'warning' : 'success'}>{sprintLocked ? 'Closed' : 'Open'}</Badge>
              </div>
              <p className="mt-3 font-display text-3xl font-bold text-text">{formatCountdown(race.sprintLockAt ?? race.lockAt)}</p>
              <p className="mt-1 text-sm text-muted">{formatDateTime(race.sprintLockAt ?? race.lockAt)}</p>
            </div>
          ) : null}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.2em] text-muted">Race lock</p>
              <Badge tone={raceLocked ? 'warning' : 'success'}>{raceLocked ? 'Closed' : 'Open'}</Badge>
            </div>
            <p className="mt-3 font-display text-3xl font-bold text-text">{formatCountdown(race.lockAt)}</p>
            <p className="mt-1 text-sm text-muted">{formatDateTime(race.lockAt)}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}
