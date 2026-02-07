export interface RoundRobinFixture {
  homeTeamId: bigint;
  awayTeamId: bigint;
  homeTeamName: string;
  awayTeamName: string;
  round: number;
}

export interface Team {
  id: bigint;
  name: string;
}

export function generateRoundRobinFixtures(teams: Team[]): RoundRobinFixture[] {
  if (teams.length < 2) {
    return [];
  }

  const fixtures: RoundRobinFixture[] = [];
  let round = 1;

  // Generate all unique pairings
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      fixtures.push({
        homeTeamId: teams[i].id,
        awayTeamId: teams[j].id,
        homeTeamName: teams[i].name,
        awayTeamName: teams[j].name,
        round: round,
      });
      round++;
    }
  }

  return fixtures;
}
