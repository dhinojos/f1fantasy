import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle } from 'lucide-react';
import { PICK_POSITIONS } from '@/lib/constants';
import { validateUniqueDrivers, isRaceLocked, isSprintLocked } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PickFormValues, PickSubmission, Race } from '@/types/domain';

export function PickForm({
  race,
  existingPick,
  onSave,
}: {
  race: Race;
  existingPick: PickSubmission | null;
  onSave: (values: PickFormValues) => Promise<void>;
}) {
  const defaultTop10 = existingPick?.top10DriverIds ?? Array.from({ length: 10 }, () => '');
  const sprintLocked = race.hasSprint && isSprintLocked(race);
  const raceLocked = isRaceLocked(race.lockAt);

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PickFormValues>({
    resolver: zodResolver(
      z
        .object({
          sprintWinnerDriverId: z.string(),
          sprintSecondDriverId: z.string(),
          poleDriverId: z.string().min(1, 'Pole pick is required'),
          top10DriverIds: z.array(z.string().min(1, 'Driver is required')).length(10, 'All finishing slots are required'),
        })
        .superRefine((value, ctx) => {
          if (race.hasSprint && !sprintLocked && !value.sprintWinnerDriverId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sprintWinnerDriverId'], message: 'Sprint 1st pick is required' });
          }
          if (race.hasSprint && !sprintLocked && !value.sprintSecondDriverId) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sprintSecondDriverId'], message: 'Sprint 2nd pick is required' });
          }
        }),
    ),
    defaultValues: {
      sprintWinnerDriverId: existingPick?.sprintWinnerDriverId ?? '',
      sprintSecondDriverId: existingPick?.sprintSecondDriverId ?? '',
      poleDriverId: existingPick?.poleDriverId ?? '',
      top10DriverIds: defaultTop10,
    },
  });

  const values = watch();
  const duplicates = useMemo(() => validateUniqueDrivers(values), [values]);

  return (
    <Card eyebrow={`Round ${race.roundNumber}`} title={`${race.grandPrixName} picks`}>
      <form className="space-y-5" onSubmit={handleSubmit(onSave)}>
        {raceLocked ? (
          <div className="flex items-start gap-3 rounded-2xl border border-accent/20 bg-accent/10 px-4 py-4 text-sm text-accent">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>Submissions are locked. Picks are read-only and visible to all players.</span>
          </div>
        ) : sprintLocked ? (
          <div className="flex items-start gap-3 rounded-2xl border border-accent2/20 bg-accent2/10 px-4 py-4 text-sm text-accent2">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>Sprint picks are locked. You can still update pole and race finishing positions until the race lock.</span>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[1.1fr,1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <div className="grid gap-4">
              {race.hasSprint ? (
                <>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-muted">Sprint 1st</label>
                    <Controller
                      control={control}
                      name="sprintWinnerDriverId"
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={sprintLocked}
                          className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
                        >
                          <option value="">Select driver</option>
                          {race.activeDrivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.code} · {driver.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.sprintWinnerDriverId ? <p className="mt-2 text-sm text-accent">{errors.sprintWinnerDriverId.message}</p> : null}
                  </div>
                  <div>
                    <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-muted">Sprint 2nd</label>
                    <Controller
                      control={control}
                      name="sprintSecondDriverId"
                      render={({ field }) => (
                        <select
                          {...field}
                          disabled={sprintLocked}
                          className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
                        >
                          <option value="">Select driver</option>
                          {race.activeDrivers.map((driver) => (
                            <option key={driver.id} value={driver.id}>
                              {driver.code} · {driver.fullName}
                            </option>
                          ))}
                        </select>
                      )}
                    />
                    {errors.sprintSecondDriverId ? <p className="mt-2 text-sm text-accent">{errors.sprintSecondDriverId.message}</p> : null}
                  </div>
                </>
              ) : null}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.3em] text-muted">Pole position</label>
                <Controller
                  control={control}
                  name="poleDriverId"
                  render={({ field }) => (
                    <select
                      {...field}
                      disabled={raceLocked}
                      className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
                    >
                      <option value="">Select driver</option>
                      {race.activeDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.code} · {driver.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.poleDriverId ? <p className="mt-2 text-sm text-accent">{errors.poleDriverId.message}</p> : null}
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-muted">Submission status</p>
            <p className="mt-3 font-display text-4xl font-bold text-text">{`${values.top10DriverIds.filter(Boolean).length + Number(Boolean(values.poleDriverId)) + (race.hasSprint ? Number(Boolean(values.sprintWinnerDriverId)) + Number(Boolean(values.sprintSecondDriverId)) : 0)}/${race.hasSprint ? 13 : 11}`}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${((values.top10DriverIds.filter(Boolean).length + Number(Boolean(values.poleDriverId)) + (race.hasSprint ? Number(Boolean(values.sprintWinnerDriverId)) + Number(Boolean(values.sprintSecondDriverId)) : 0)) / (race.hasSprint ? 13 : 11)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3">
          {PICK_POSITIONS.map((position, index) => (
            <div key={position} className="grid grid-cols-[72px,1fr] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="font-display text-2xl font-bold text-text">P{position}</div>
              <Controller
                control={control}
                name={`top10DriverIds.${index}`}
                render={({ field }) => (
                  <select
                    {...field}
                    disabled={raceLocked}
                    className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text outline-none transition focus:border-accent"
                  >
                    <option value="">Select driver</option>
                    {race.activeDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.code} · {driver.fullName}
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          ))}
        </div>

        {duplicates.length > 0 ? <p className="text-sm text-accent">Duplicate race finish picks selected: {duplicates.join(', ')}</p> : null}
        {errors.top10DriverIds ? <p className="text-sm text-accent">{errors.top10DriverIds.message}</p> : null}

        <Button type="submit" disabled={raceLocked || duplicates.length > 0 || isSubmitting}>
          {isSubmitting ? 'Saving...' : existingPick ? 'Update picks' : 'Save picks'}
        </Button>
      </form>
    </Card>
  );
}
