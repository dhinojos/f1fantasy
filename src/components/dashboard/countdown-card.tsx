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
  const nextDeadline = race.hasSprint && !sprintLocked ? race.sprintLockAt : race.lockAt;
  const statusLabel = raceLocked ? 'Locked' : sprintLocked ? 'Race Only' : 'Open';
  const deadlineLabel = race.hasSprint && !sprintLocked ? 'Sprint lock' : 'Race lock';

  return (
    <Card eyebrow={`Round ${race.roundNumber}`} title={race.grandPrixName} action={<Badge tone={raceLocked ? 'warning' : 'success'}>{statusLabel}</Badge>}>
      <div className="flex items-center gap-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-accent/25 bg-accent/10 p-4 text-accent"
        >
          <TimerReset className="h-8 w-8" />
        </motion.div>
        <div>
          <p className="font-display text-4xl font-bold text-text">{formatCountdown(nextDeadline ?? race.lockAt)}</p>
          <p className="mt-1 text-sm text-muted">{deadlineLabel}: {formatDateTime(nextDeadline ?? race.lockAt)}</p>
        </div>
      </div>
    </Card>
  );
}
