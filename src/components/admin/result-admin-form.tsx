import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PICK_POSITIONS } from '@/lib/constants';
import { validateUniqueDrivers } from '@/lib/domain';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { Race } from '@/types/domain';

const baseResultSchema = z.object({
  raceId: z.string().min(1, 'Race is required'),
  sprintWinnerDriverId: z.string(),
  sprintSecondDriverId: z.string(),
  poleDriverId: z.string().min(1, 'Pole driver is required'),
  top10DriverIds: z.array(z.string().min(1)).length(10),
});

type ResultValues = z.infer<typeof baseResultSchema>;

export function ResultAdminForm({
  races,
  onSave,
}: {
  races: Race[];
  onSave: (values: ResultValues) => Promise<void>;
}) {
  const {
    control,
    watch,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResultValues>({
    resolver: zodResolver(
      baseResultSchema.superRefine((value, ctx) => {
        const currentRace = races.find((race) => race.id === value.raceId);
        if (currentRace?.hasSprint && !value.sprintWinnerDriverId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sprintWinnerDriverId'], message: 'Sprint 1st is required' });
        }
        if (currentRace?.hasSprint && !value.sprintSecondDriverId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['sprintSecondDriverId'], message: 'Sprint 2nd is required' });
        }
      }),
    ),
    defaultValues: {
      raceId: races[0]?.id ?? '',
      sprintWinnerDriverId: '',
      sprintSecondDriverId: '',
      poleDriverId: '',
      top10DriverIds: Array.from({ length: 10 }, () => ''),
    },
  });

  const selectedRaceId = watch('raceId');
  const selectedRace = races.find((race) => race.id === selectedRaceId);
  const duplicates = validateUniqueDrivers({
    sprintWinnerDriverId: watch('sprintWinnerDriverId'),
    sprintSecondDriverId: watch('sprintSecondDriverId'),
    poleDriverId: watch('poleDriverId'),
    top10DriverIds: watch('top10DriverIds'),
  });

  return (
    <Card eyebrow="Admin" title="Enter official results">
      <form className="space-y-4" onSubmit={handleSubmit(onSave)}>
        <Controller
          control={control}
          name="raceId"
          render={({ field }) => (
            <select {...field} className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text">
              <option value="">Select race</option>
              {races.map((race) => (
                <option key={race.id} value={race.id}>
                  Round {race.roundNumber} · {race.grandPrixName}
                </option>
              ))}
            </select>
          )}
        />
        {selectedRace ? (
          <>
            {selectedRace.hasSprint ? (
              <>
                <Controller
                  control={control}
                  name="sprintWinnerDriverId"
                  render={({ field }) => (
                    <select {...field} className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text">
                      <option value="">Select sprint 1st</option>
                      {selectedRace.activeDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.code} · {driver.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                />
                <Controller
                  control={control}
                  name="sprintSecondDriverId"
                  render={({ field }) => (
                    <select {...field} className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text">
                      <option value="">Select sprint 2nd</option>
                      {selectedRace.activeDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.code} · {driver.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                />
              </>
            ) : null}
            <Controller
              control={control}
              name="poleDriverId"
              render={({ field }) => (
                <select {...field} className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text">
                  <option value="">Select pole</option>
                  {selectedRace.activeDrivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.code} · {driver.fullName}
                    </option>
                  ))}
                </select>
              )}
            />
            <div className="grid gap-3">
              {PICK_POSITIONS.map((position, index) => (
                <Controller
                  key={position}
                  control={control}
                  name={`top10DriverIds.${index}`}
                  render={({ field }) => (
                    <select {...field} className="w-full rounded-2xl border border-white/10 bg-panel px-4 py-3 text-text">
                      <option value="">P{position}</option>
                      {selectedRace.activeDrivers.map((driver) => (
                        <option key={driver.id} value={driver.id}>
                          {driver.code} · {driver.fullName}
                        </option>
                      ))}
                    </select>
                  )}
                />
              ))}
            </div>
          </>
        ) : null}

        {duplicates.length > 0 ? <p className="text-sm text-accent">Duplicate race finish picks selected: {duplicates.join(', ')}</p> : null}
        {errors.raceId ? <p className="text-sm text-accent">{errors.raceId.message}</p> : null}
        {errors.sprintWinnerDriverId ? <p className="text-sm text-accent">{errors.sprintWinnerDriverId.message}</p> : null}
        {errors.sprintSecondDriverId ? <p className="text-sm text-accent">{errors.sprintSecondDriverId.message}</p> : null}

        <Button type="submit" disabled={isSubmitting || duplicates.length > 0}>
          {isSubmitting ? 'Saving...' : 'Publish result'}
        </Button>
      </form>
    </Card>
  );
}
