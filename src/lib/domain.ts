import { isAfter } from 'date-fns';
import type {
  DashboardStats,
  Driver,
  PickFormValues,
  PickSubmission,
  Race,
  RaceResult,
  RaceScore,
} from '@/types/domain';

export interface ScoreBreakdown {
  sprintPoints: number;
  polePoints: number;
  podiumPoints: number;
  top10Points: number;
  racePoints: number;
}

export function isLockedAt(lockAt: string | null, now = new Date()): boolean {
  if (!lockAt) {
    return false;
  }

  return isAfter(now, new Date(lockAt)) || now.toISOString() === new Date(lockAt).toISOString();
}

export function isSprintLocked(race: Pick<Race, 'sprintLockAt'>, now = new Date()): boolean {
  return isLockedAt(race.sprintLockAt, now);
}

export function isRaceLocked(lockAt: string, now = new Date()): boolean {
  return isLockedAt(lockAt, now);
}

export function validateUniqueDrivers(values: PickFormValues): string[] {
  const selected = [...values.top10DriverIds].filter(Boolean);
  const duplicates = selected.filter((driverId, index) => selected.indexOf(driverId) !== index);
  return Array.from(new Set(duplicates));
}

export function scoreRace(pick: PickSubmission, result: RaceResult): ScoreBreakdown {
  const sprintPoints =
    (pick.sprintWinnerDriverId && pick.sprintWinnerDriverId === result.sprintWinnerDriverId ? 2 : 0) +
    (pick.sprintSecondDriverId && pick.sprintSecondDriverId === result.sprintSecondDriverId ? 1 : 0);
  const polePoints = pick.poleDriverId === result.poleDriverId ? 2 : 0;
  let podiumPoints = 0;
  let top10Points = 0;

  for (let index = 0; index < pick.top10DriverIds.length; index += 1) {
    const predictedDriver = pick.top10DriverIds[index];
    const actualDriver = result.top10DriverIds[index];

    if (!predictedDriver || !actualDriver) {
      continue;
    }

    if (result.top10DriverIds.includes(predictedDriver)) {
      top10Points += 1;

      if (index >= 3 && predictedDriver === actualDriver) {
        top10Points += 1;
      }
    }

    if (predictedDriver === actualDriver) {
      if (index === 0) {
        podiumPoints += 5;
      } else if (index === 1) {
        podiumPoints += 4;
      } else if (index === 2) {
        podiumPoints += 3;
      }
    }
  }

  return {
    sprintPoints,
    polePoints,
    podiumPoints,
    top10Points,
    racePoints: sprintPoints + polePoints + podiumPoints + top10Points,
  };
}

export function canViewPick(
  viewerUserId: string,
  pickUserId: string,
  lockAt: string,
  now = new Date(),
): boolean {
  if (!isRaceLocked(lockAt, now)) {
    return viewerUserId === pickUserId;
  }

  return true;
}

export function deriveInsightLabel(driverId: string | null, drivers: Driver[]): string | null {
  if (!driverId) {
    return null;
  }

  return drivers.find((driver) => driver.id === driverId)?.fullName ?? null;
}

function mostCommon(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? null;
}

function mostUnique(values: string[]): string | null {
  if (values.length === 0) {
    return null;
  }

  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts).sort((left, right) => left[1] - right[1])[0]?.[0] ?? null;
}

export function buildDashboardStats(args: {
  standings: RaceScore[];
  lastRaceScores: RaceScore[];
  nextRace: Race | null;
  currentUserSubmission: PickSubmission | null;
  allVisiblePicks: PickSubmission[];
  latestResult: RaceResult | null;
  drivers: Driver[];
}): DashboardStats {
  const poleSelections = args.allVisiblePicks.map((pick) => pick.poleDriverId);
  const winnerSelections = args.allVisiblePicks.map((pick) => pick.top10DriverIds[0]).filter(Boolean) as string[];
  const allTop10Selections = args.allVisiblePicks.flatMap((pick) => pick.top10DriverIds);

  const accuracyByUser = args.lastRaceScores.map((score) => ({
    userId: score.userId,
    displayName: score.user?.displayName ?? 'Player',
    podiumHitRate: Number(((score.podiumPoints / 12) * 100).toFixed(0)),
    top10HitRate: Number(((score.top10Points / 17) * 100).toFixed(0)),
  }));

  return {
    standings: args.standings,
    lastRaceScores: args.lastRaceScores,
    nextRace: args.nextRace,
    nextLockAt:
      args.nextRace && args.nextRace.hasSprint && !isSprintLocked(args.nextRace)
        ? args.nextRace.sprintLockAt
        : args.nextRace?.lockAt ?? null,
    currentUserSubmission: args.currentUserSubmission,
    allVisiblePicks: args.allVisiblePicks,
    latestResult: args.latestResult,
    playerAccuracy: accuracyByUser,
    insights: {
      mostPickedPole: deriveInsightLabel(mostCommon(poleSelections), args.drivers),
      mostPickedWinner: deriveInsightLabel(mostCommon(winnerSelections), args.drivers),
      mostPickedTop10Driver: deriveInsightLabel(mostCommon(allTop10Selections), args.drivers),
      biggestConsensusPick: deriveInsightLabel(mostCommon([...poleSelections, ...winnerSelections]), args.drivers),
      mostUniquePick: deriveInsightLabel(mostUnique(allTop10Selections), args.drivers),
    },
  };
}
