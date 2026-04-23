import { describe, expect, it } from 'vitest';
import { buildDashboardStats, canViewPick, isRaceLocked, isSprintLocked, scoreRace, validateUniqueDrivers } from '@/lib/domain';
import type { PickSubmission, Race, RaceResult, RaceScore } from '@/types/domain';
import { DRIVER_FIXTURES } from '@/lib/constants';

const basePick: PickSubmission = {
  id: 'pick-1',
  raceId: 'race-1',
  userId: 'user-1',
  sprintWinnerDriverId: 'norris',
  sprintSecondDriverId: 'piastri',
  poleDriverId: 'verstappen',
  top10DriverIds: ['verstappen', 'norris', 'leclerc', 'piastri', 'russell', 'hamilton', 'sainz', 'alonso', 'gasly', 'albon'],
  submittedAt: '2026-03-01T12:00:00.000Z',
  updatedAt: '2026-03-01T12:00:00.000Z',
};

const baseResult: RaceResult = {
  id: 'result-1',
  raceId: 'race-1',
  sprintWinnerDriverId: 'norris',
  sprintSecondDriverId: 'leclerc',
  poleDriverId: 'verstappen',
  top10DriverIds: ['verstappen', 'leclerc', 'norris', 'piastri', 'hamilton', 'russell', 'sainz', 'alonso', 'gasly', 'albon'],
  updatedAt: '2026-03-02T12:00:00.000Z',
};

const sprintRace: Race = {
  id: 'race-1',
  grandPrixName: 'Australian Grand Prix',
  roundNumber: 1,
  raceDate: '2026-12-09',
  sprintLockAt: '2026-12-08T12:00:00.000Z',
  lockAt: '2026-12-09T12:00:00.000Z',
  hasSprint: true,
  status: 'upcoming',
  activeDrivers: DRIVER_FIXTURES,
};

describe('lock deadline behavior', () => {
  it('locks when current time reaches the deadline', () => {
    expect(isRaceLocked('2026-03-09T12:00:00.000Z', new Date('2026-03-09T12:00:00.000Z'))).toBe(true);
  });

  it('remains editable before the deadline', () => {
    expect(isRaceLocked('2026-03-09T12:00:00.000Z', new Date('2026-03-09T11:59:59.000Z'))).toBe(false);
  });

  it('locks sprint picks at the sprint deadline', () => {
    expect(isSprintLocked(sprintRace, new Date('2026-12-08T12:00:00.000Z'))).toBe(true);
  });
});

describe('duplicate driver prevention', () => {
  it('flags duplicate picks inside the race finishing order', () => {
    const duplicates = validateUniqueDrivers({
      sprintWinnerDriverId: 'verstappen',
      sprintSecondDriverId: 'norris',
      poleDriverId: 'verstappen',
      top10DriverIds: ['verstappen', 'norris', 'leclerc', 'norris', 'russell', 'hamilton', 'sainz', 'alonso', 'gasly', 'albon'],
    });

    expect(duplicates).toEqual(['norris']);
  });
});

describe('scoring logic', () => {
  it('awards sprint, top 10, P4-P10 exact-position, pole, and podium points correctly', () => {
    expect(scoreRace(basePick, baseResult)).toEqual({
      sprintPoints: 2,
      polePoints: 2,
      podiumPoints: 5,
      top10Points: 15,
      racePoints: 24,
    });
  });
});

describe('visibility rules after lock', () => {
  it('shows only own picks before lock', () => {
    expect(canViewPick('user-1', 'user-2', '2026-03-09T12:00:00.000Z', new Date('2026-03-09T10:00:00.000Z'))).toBe(false);
    expect(canViewPick('user-1', 'user-1', '2026-03-09T12:00:00.000Z', new Date('2026-03-09T10:00:00.000Z'))).toBe(true);
  });

  it('shows all picks after lock', () => {
    expect(canViewPick('user-1', 'user-2', '2026-03-09T12:00:00.000Z', new Date('2026-03-09T12:00:01.000Z'))).toBe(true);
  });
});

describe('dashboard aggregation', () => {
  it('derives dashboard insights from visible picks', () => {
    const stats = buildDashboardStats({
      standings: [],
      lastRaceScores: [
        {
          id: 'score-1',
          raceId: 'race-1',
          userId: 'user-1',
          sprintPoints: 2,
          polePoints: 2,
          podiumPoints: 6,
          top10Points: 5,
          racePoints: 15,
          cumulativePoints: 100,
          user: { id: 'user-1', email: 'a@test.com', displayName: 'Ana', role: 'player' },
        } satisfies RaceScore,
      ],
      nextRace: null,
      currentUserSubmission: null,
      allVisiblePicks: [basePick],
      latestResult: baseResult,
      drivers: DRIVER_FIXTURES,
    });

    expect(stats.insights.mostPickedPole).toBe('Max Verstappen');
    expect(stats.playerAccuracy[0]?.podiumHitRate).toBe(50);
    expect(stats.playerAccuracy[0]?.top10HitRate).toBe(29);
  });

  it('uses the sprint cutoff as the next dashboard deadline when sprint picks are still open', () => {
    const stats = buildDashboardStats({
      standings: [],
      lastRaceScores: [],
      nextRace: sprintRace,
      currentUserSubmission: null,
      allVisiblePicks: [],
      latestResult: null,
      drivers: DRIVER_FIXTURES,
    });

    expect(stats.nextLockAt).toBe('2026-12-08T12:00:00.000Z');
  });
});
