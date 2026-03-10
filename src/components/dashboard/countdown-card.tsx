import { motion } from 'framer-motion';
import { TimerReset } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCountdown, formatDateTime } from '@/lib/format';
import { isRaceLocked } from '@/lib/domain';
import type { Race } from '@/types/domain';

export function CountdownCard({ race }: { race: Race | null }) {
  if (!race) {
    return (
      <Card eyebrow="Next Race" title="Awaiting calendar">
        <p className="text-sm text-muted">Create the next race round in the admin screen to open submissions.</p>
      </Card>
    );
  }

  const locked = isRaceLocked(race.lockAt);

  return (
    <Card eyebrow={`Round ${race.roundNumber}`} title={race.grandPrixName} action={<Badge tone={locked ? 'warning' : 'success'}>{locked ? 'Locked' : 'Open'}</Badge>}>
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
          <p className="font-display text-4xl font-bold text-text">{formatCountdown(race.lockAt)}</p>
          <p className="mt-1 text-sm text-muted">Lock deadline: {formatDateTime(race.lockAt)}</p>
        </div>
      </div>
    </Card>
  );
}
