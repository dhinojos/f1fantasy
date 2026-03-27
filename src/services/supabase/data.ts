import { buildDashboardStats, canViewPick, isRaceLocked, isSprintLocked, validateUniqueDrivers } from '@/lib/domain';
import { requireSupabaseClient } from '@/services/supabase/client';
import { mapPick, mapProfile, mapRace, mapResult, mapScore } from '@/services/supabase/mappers';
import type { DashboardStats, PickFormValues, PickSubmission, Profile, Race, RaceResult, RaceScore } from '@/types/domain';

export async function fetchCurrentProfile(): Promise<Profile | null> {
  const client = requireSupabaseClient();
  const { data: authData, error: authError } = await client.auth.getUser();
  if (authError) {
    throw authError;
  }

  const userId = authData.user?.id;
  if (!userId) {
    return null;
  }

  const { data, error } = await client
    .from('profiles')
    .select('id,email,display_name,role')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return mapProfile(data);
}

export async function fetchUpcomingRace(): Promise<Race | null> {
  const { data, error } = await requireSupabaseClient()
    .from('races')
    .select(`
      id,
      grand_prix_name,
      round_number,
      race_date,
      sprint_lock_at,
      lock_at,
      has_sprint,
      status,
      race_drivers (
        drivers (
          id,
          code,
          full_name,
          team_name,
          team_color,
          car_number
        )
      )
    `)
    .in('status', ['upcoming', 'locked'])
    .order('round_number', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapRace(data) : null;
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await requireSupabaseClient()
    .from('profiles')
    .select('id,email,display_name,role')
    .order('display_name', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapProfile);
}

export async function fetchLatestResult(): Promise<RaceResult | null> {
  const { data, error } = await requireSupabaseClient()
    .from('results')
    .select('id,race_id,sprint_winner_driver_id,sprint_second_driver_id,pole_driver_id,top10_driver_ids,updated_at')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapResult(data) : null;
}

export async function fetchCurrentUserPick(raceId: string, userId: string): Promise<PickSubmission | null> {
  const { data, error } = await requireSupabaseClient()
    .from('picks')
    .select('id,race_id,user_id,sprint_winner_driver_id,sprint_second_driver_id,pole_driver_id,top10_driver_ids,submitted_at,updated_at')
    .eq('race_id', raceId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? mapPick(data) : null;
}

export async function fetchVisiblePicks(race: Race, viewerId: string): Promise<PickSubmission[]> {
  const { data, error } = await requireSupabaseClient()
    .from('picks')
    .select(`
      id,
      race_id,
      user_id,
      sprint_winner_driver_id,
      sprint_second_driver_id,
      pole_driver_id,
      top10_driver_ids,
      submitted_at,
      updated_at,
      profiles (
        id,
        email,
        display_name,
        role
      )
    `)
    .eq('race_id', race.id)
    .order('updated_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapPick).filter((pick) => canViewPick(viewerId, pick.userId, race.lockAt));
}

export async function fetchRaceScores(raceId: string): Promise<RaceScore[]> {
  const { data, error } = await requireSupabaseClient()
    .from('scores')
    .select('id,race_id,user_id,sprint_points,pole_points,podium_points,top10_points,race_points,cumulative_points')
    .eq('race_id', raceId);

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapScore);
}

export async function savePick(
  race: Race,
  userId: string,
  values: PickFormValues,
  options?: { allowLockedOverride?: boolean },
): Promise<void> {
  const allowLockedOverride = options?.allowLockedOverride ?? false;

  if (!allowLockedOverride && isRaceLocked(race.lockAt)) {
    throw new Error('This race is already locked.');
  }

  if (validateUniqueDrivers(values).length > 0) {
    throw new Error('Race finishing picks must be unique.');
  }

  const existingPick = await fetchCurrentUserPick(race.id, userId);
  const sprintLocked = !allowLockedOverride && race.hasSprint && isSprintLocked(race);

  const payload = {
    race_id: race.id,
    user_id: userId,
    sprint_winner_driver_id: race.hasSprint
      ? sprintLocked
        ? existingPick?.sprintWinnerDriverId ?? null
        : values.sprintWinnerDriverId
      : null,
    sprint_second_driver_id: race.hasSprint
      ? sprintLocked
        ? existingPick?.sprintSecondDriverId ?? null
        : values.sprintSecondDriverId
      : null,
    pole_driver_id: values.poleDriverId,
    top10_driver_ids: values.top10DriverIds,
  };

  const { error } = await requireSupabaseClient().from('picks').upsert(payload, {
    onConflict: 'race_id,user_id',
  });

  if (error) {
    throw error;
  }
}

export async function fetchStandings(): Promise<{
  standings: DashboardStats['standings'];
  lastRaceScores: DashboardStats['lastRaceScores'];
}> {
  const client = requireSupabaseClient();
  const { data: scoreRows, error: standingsError } = await client
    .from('scores')
    .select(`
      id,
      race_id,
      user_id,
      sprint_points,
      pole_points,
      podium_points,
      top10_points,
      race_points,
      cumulative_points,
      profiles (
        id,
        email,
        display_name,
        role
      ),
      races (
        round_number
      )
    `)
    .order('created_at', { ascending: false });

  if (standingsError) {
    throw standingsError;
  }

  const mappedScores = (scoreRows ?? []).map((row) => {
    const score = mapScore(row as unknown as Parameters<typeof mapScore>[0]);
    const roundNumber = Array.isArray(row.races) ? row.races[0]?.round_number ?? 0 : 0;
    return { score, roundNumber };
  });

  const latestStandingByUser = new Map<string, { score: RaceScore; roundNumber: number }>();
  for (const item of mappedScores) {
    const existing = latestStandingByUser.get(item.score.userId);
    if (!existing || item.roundNumber > existing.roundNumber) {
      latestStandingByUser.set(item.score.userId, item);
    }
  }

  const latestRound = mappedScores.reduce((max, item) => Math.max(max, item.roundNumber), 0);
  const standings = Array.from(latestStandingByUser.values())
    .map((item) => item.score)
    .sort((left, right) => right.cumulativePoints - left.cumulativePoints);
  const lastRaceScores = mappedScores
    .filter((item) => item.roundNumber === latestRound)
    .map((item) => item.score)
    .sort((left, right) => right.racePoints - left.racePoints);

  return {
    standings,
    lastRaceScores,
  };
}

export async function fetchDashboard(profile: Profile): Promise<DashboardStats> {
  const [upcomingRace, latestResult, standingData] = await Promise.all([
    fetchUpcomingRace(),
    fetchLatestResult(),
    fetchStandings(),
  ]);

  const [currentUserSubmission, allVisiblePicks] = upcomingRace
    ? await Promise.all([
        fetchCurrentUserPick(upcomingRace.id, profile.id),
        fetchVisiblePicks(upcomingRace, profile.id),
      ])
    : [null, []];

  const drivers = upcomingRace?.activeDrivers ?? [];

  return buildDashboardStats({
    standings: standingData.standings,
    lastRaceScores: standingData.lastRaceScores,
    nextRace: upcomingRace,
    currentUserSubmission,
    allVisiblePicks,
    latestResult,
    drivers,
  });
}

export async function fetchRaceResults(): Promise<{
  races: Race[];
  results: RaceResult[];
}> {
  const client = requireSupabaseClient();
  const [{ data: raceRows, error: racesError }, { data: resultRows, error: resultsError }] = await Promise.all([
    client
      .from('races')
      .select(`
        id,
        grand_prix_name,
        round_number,
        race_date,
        sprint_lock_at,
        lock_at,
        has_sprint,
        status,
        race_drivers (
          drivers (
            id,
            code,
            full_name,
            team_name,
            team_color,
            car_number
          )
        )
      `)
      .order('round_number', { ascending: true }),
    client.from('results').select('id,race_id,sprint_winner_driver_id,sprint_second_driver_id,pole_driver_id,top10_driver_ids,updated_at'),
  ]);

  if (racesError) {
    throw racesError;
  }

  if (resultsError) {
    throw resultsError;
  }

  return {
    races: (raceRows ?? []).map(mapRace),
    results: (resultRows ?? []).map(mapResult),
  };
}

export async function saveRace(values: {
  grandPrixName: string;
  roundNumber: number;
  raceDate: string;
  sprintLockAt: string;
  lockAt: string;
  hasSprint: boolean;
  driverIds: string[];
}): Promise<void> {
  const client = requireSupabaseClient();
  const { data: race, error: raceError } = await client
    .from('races')
    .insert({
      grand_prix_name: values.grandPrixName,
      round_number: values.roundNumber,
      race_date: values.raceDate,
      sprint_lock_at: values.hasSprint ? values.sprintLockAt : null,
      lock_at: values.lockAt,
      has_sprint: values.hasSprint,
      status: 'upcoming',
    })
    .select('id')
    .single();

  if (raceError) {
    throw raceError;
  }

  const { error: driverError } = await client.from('race_drivers').insert(
    values.driverIds.map((driverId) => ({
      race_id: race.id,
      driver_id: driverId,
    })),
  );

  if (driverError) {
    throw driverError;
  }
}

export async function saveResult(values: {
  raceId: string;
  sprintWinnerDriverId: string;
  sprintSecondDriverId: string;
  poleDriverId: string;
  top10DriverIds: string[];
  hasSprint: boolean;
}): Promise<void> {
  const { error } = await requireSupabaseClient()
    .from('results')
    .upsert(
      {
        race_id: values.raceId,
        sprint_winner_driver_id: values.hasSprint ? values.sprintWinnerDriverId : null,
        sprint_second_driver_id: values.hasSprint ? values.sprintSecondDriverId : null,
        pole_driver_id: values.poleDriverId,
        top10_driver_ids: values.top10DriverIds,
      },
      { onConflict: 'race_id' },
    );

  if (error) {
    throw error;
  }

  const { error: rpcError } = await requireSupabaseClient().rpc('recalculate_scores_for_race', {
    target_race_id: values.raceId,
  });

  if (rpcError) {
    throw rpcError;
  }
}
