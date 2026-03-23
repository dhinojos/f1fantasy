import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Driver } from '@/types/domain';

const raceSchema = z
  .object({
    grandPrixName: z.string().min(2, 'Grand Prix name is required'),
    roundNumber: z.coerce.number().int().positive(),
    raceDate: z.string().min(1, 'Race date is required'),
    sprintLockAt: z.string(),
    lockAt: z.string().min(1, 'Race lock datetime is required'),
    hasSprint: z.boolean(),
    driverIds: z.array(z.string()).min(10, 'Select at least 10 active drivers'),
  })
  .superRefine((value, ctx) => {
    if (value.hasSprint && !value.sprintLockAt) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sprintLockAt'], message: 'Sprint lock datetime is required' });
    }

    if (value.hasSprint && value.sprintLockAt && new Date(value.sprintLockAt) > new Date(value.lockAt)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['sprintLockAt'],
        message: 'Sprint lock must be before the race lock',
      });
    }
  });

type RaceValues = z.infer<typeof raceSchema>;

export function RaceAdminForm({
  drivers,
  onSave,
}: {
  drivers: Driver[];
  onSave: (values: RaceValues) => Promise<void>;
}) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RaceValues>({
    resolver: zodResolver(raceSchema),
    defaultValues: {
      hasSprint: false,
      sprintLockAt: '',
      driverIds: drivers.map((driver) => driver.id),
    },
  });
  const hasSprint = watch('hasSprint');

  return (
    <Card eyebrow="Admin" title="Create race round">
      <form className="grid gap-4" onSubmit={handleSubmit(onSave)}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm text-muted">
            Grand Prix
            <input {...register('grandPrixName')} className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text" />
            {errors.grandPrixName ? <span className="text-accent">{errors.grandPrixName.message}</span> : null}
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Round number
            <input type="number" {...register('roundNumber')} className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text" />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Race date
            <input type="date" {...register('raceDate')} className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text" />
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Sprint lock datetime
            <input
              type="datetime-local"
              {...register('sprintLockAt')}
              disabled={!hasSprint}
              className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text disabled:cursor-not-allowed disabled:opacity-60"
            />
            {errors.sprintLockAt ? <span className="text-accent">{errors.sprintLockAt.message}</span> : null}
          </label>
          <label className="grid gap-2 text-sm text-muted">
            Race lock datetime
            <input type="datetime-local" {...register('lockAt')} className="rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text" />
            {errors.lockAt ? <span className="text-accent">{errors.lockAt.message}</span> : null}
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text md:col-span-2">
            <input type="checkbox" {...register('hasSprint')} />
            <span>Include sprint picks for this race weekend</span>
          </label>
        </div>

        <div className="grid gap-2">
          <p className="text-sm text-muted">Active drivers</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {drivers.map((driver) => (
              <label key={driver.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-text">
                <input type="checkbox" value={driver.id} {...register('driverIds')} />
                <span>
                  {driver.code} · {driver.fullName}
                </span>
              </label>
            ))}
          </div>
          {errors.driverIds ? <p className="text-sm text-accent">{errors.driverIds.message}</p> : null}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Create race'}
        </Button>
      </form>
    </Card>
  );
}
