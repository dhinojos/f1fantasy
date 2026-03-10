import type {
  Driver,
  PickSubmission,
  Profile,
  Race,
  RaceResult,
  RaceScore,
} from '@/types/domain';

interface DriverRow {
  id: string;
  code: string;
  full_name: string;
  team_name: string;
  team_color: string;
  car_number: number;
}

interface ProfileRow {
  id: string;
  email: string;
  display_name: string;
  role: 'admin' | 'player';
}

interface RaceRow {
  id: string;
  grand_prix_name: string;
  round_number: number;
  race_date: string;
  lock_at: string;
  has_sprint: boolean;
  status: 'upcoming' | 'locked' | 'scored';
  race_drivers?: Array<{ drivers: DriverRow | DriverRow[] | null }>;
}

interface PickRow {
  id: string;
  race_id: string;
  user_id: string;
  sprint_winner_driver_id: string | null;
  sprint_second_driver_id: string | null;
  pole_driver_id: string;
  top10_driver_ids: string[];
  submitted_at: string;
  updated_at: string;
  profiles?: ProfileRow | ProfileRow[] | null;
}

interface ResultRow {
  id: string;
  race_id: string;
  sprint_winner_driver_id: string | null;
  sprint_second_driver_id: string | null;
  pole_driver_id: string;
  top10_driver_ids: string[];
  updated_at: string;
}

interface ScoreRow {
  id: string;
  race_id: string;
  user_id: string;
  sprint_points: number;
  pole_points: number;
  podium_points: number;
  top10_points: number;
  race_points: number;
  cumulative_points: number;
  profiles?: ProfileRow | ProfileRow[] | null;
}

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
}

export function mapDriver(row: DriverRow): Driver {
  return {
    id: row.id,
    code: row.code,
    fullName: row.full_name,
    teamName: row.team_name,
    teamColor: row.team_color,
    carNumber: row.car_number,
  };
}

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
  };
}

export function mapRace(row: RaceRow): Race {
  return {
    id: row.id,
    grandPrixName: row.grand_prix_name,
    roundNumber: row.round_number,
    raceDate: row.race_date,
    lockAt: row.lock_at,
    hasSprint: row.has_sprint,
    status: row.status,
    activeDrivers: (row.race_drivers ?? [])
      .map((entry) => firstRelation(entry.drivers))
      .filter((driver): driver is DriverRow => Boolean(driver))
      .map(mapDriver),
  };
}

export function mapPick(row: PickRow): PickSubmission {
  return {
    id: row.id,
    raceId: row.race_id,
    userId: row.user_id,
    sprintWinnerDriverId: row.sprint_winner_driver_id,
    sprintSecondDriverId: row.sprint_second_driver_id,
    poleDriverId: row.pole_driver_id,
    top10DriverIds: row.top10_driver_ids,
    submittedAt: row.submitted_at,
    updatedAt: row.updated_at,
    user: firstRelation(row.profiles) ? mapProfile(firstRelation(row.profiles)!) : undefined,
  };
}

export function mapResult(row: ResultRow): RaceResult {
  return {
    id: row.id,
    raceId: row.race_id,
    sprintWinnerDriverId: row.sprint_winner_driver_id,
    sprintSecondDriverId: row.sprint_second_driver_id,
    poleDriverId: row.pole_driver_id,
    top10DriverIds: row.top10_driver_ids,
    updatedAt: row.updated_at,
  };
}

export function mapScore(row: ScoreRow): RaceScore {
  return {
    id: row.id,
    raceId: row.race_id,
    userId: row.user_id,
    sprintPoints: row.sprint_points,
    polePoints: row.pole_points,
    podiumPoints: row.podium_points,
    top10Points: row.top10_points,
    racePoints: row.race_points,
    cumulativePoints: row.cumulative_points,
    user: firstRelation(row.profiles) ? mapProfile(firstRelation(row.profiles)!) : undefined,
  };
}
