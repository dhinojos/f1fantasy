export type UserRole = 'admin' | 'player';

export interface Profile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}

export interface AllowedEmail {
  id: string;
  email: string;
  displayName: string;
  isAdmin: boolean;
}

export interface Driver {
  id: string;
  code: string;
  fullName: string;
  teamName: string;
  teamColor: string;
  carNumber: number;
}

export type RaceStatus = 'upcoming' | 'locked' | 'scored';

export interface Race {
  id: string;
  grandPrixName: string;
  roundNumber: number;
  raceDate: string;
  sprintLockAt: string | null;
  lockAt: string;
  hasSprint: boolean;
  status: RaceStatus;
  activeDrivers: Driver[];
}

export interface PickSubmission {
  id: string;
  raceId: string;
  userId: string;
  sprintWinnerDriverId: string | null;
  sprintSecondDriverId: string | null;
  poleDriverId: string;
  top10DriverIds: string[];
  submittedAt: string;
  updatedAt: string;
  user?: Profile;
}

export interface RaceResult {
  id: string;
  raceId: string;
  sprintWinnerDriverId: string | null;
  sprintSecondDriverId: string | null;
  poleDriverId: string;
  top10DriverIds: string[];
  updatedAt: string;
}

export interface RaceScore {
  id: string;
  raceId: string;
  userId: string;
  sprintPoints: number;
  polePoints: number;
  podiumPoints: number;
  top10Points: number;
  racePoints: number;
  cumulativePoints: number;
  user?: Profile;
}

export interface PickFormValues {
  sprintWinnerDriverId: string;
  sprintSecondDriverId: string;
  poleDriverId: string;
  top10DriverIds: string[];
}

export interface DashboardStats {
  standings: RaceScore[];
  lastRaceScores: RaceScore[];
  nextRace: Race | null;
  nextLockAt: string | null;
  currentUserSubmission: PickSubmission | null;
  allVisiblePicks: PickSubmission[];
  latestResult: RaceResult | null;
  playerAccuracy: Array<{
    userId: string;
    displayName: string;
    podiumHitRate: number;
    top10HitRate: number;
  }>;
  insights: {
    mostPickedPole: string | null;
    mostPickedWinner: string | null;
    mostPickedTop10Driver: string | null;
    biggestConsensusPick: string | null;
    mostUniquePick: string | null;
  };
}
