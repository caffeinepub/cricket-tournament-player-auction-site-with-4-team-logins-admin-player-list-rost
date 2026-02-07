import type { InningBallByBall, BallOutcome } from '../backend';

export interface InningsContext {
  inningsNumber: number;
  striker: string | null;
  nonStriker: string | null;
  currentBowler: string | null;
  currentOver: number;
  ballsInCurrentOver: number;
  completedOvers: number;
  lastBall: BallOutcome | null;
}

export interface BallGroup {
  inningsNumber: number;
  overNumber: number;
  balls: BallOutcome[];
}

/**
 * Derives innings context from ball-by-ball data for a specific innings
 */
export function deriveInningsContext(
  ballByBallData: InningBallByBall[] | undefined,
  inningsNumber: number
): InningsContext | null {
  if (!ballByBallData || ballByBallData.length === 0) return null;

  const inningsData = ballByBallData.filter(
    (inning) => Number(inning.inningNumber) === inningsNumber
  );

  if (inningsData.length === 0) return null;

  // Find the latest over
  const latestOver = inningsData.reduce((max, inning) =>
    Number(inning.overNumber) > Number(max.overNumber) ? inning : max
  );

  const balls = latestOver.balls;
  if (balls.length === 0) {
    return {
      inningsNumber,
      striker: null,
      nonStriker: null,
      currentBowler: null,
      currentOver: Number(latestOver.overNumber),
      ballsInCurrentOver: 0,
      completedOvers: Number(latestOver.overNumber) - 1,
      lastBall: null,
    };
  }

  // Get last ball
  const lastBall = balls[balls.length - 1];

  // Get current bowler from last ball
  const currentBowler = lastBall.bowler;

  // Derive striker and non-striker from last few balls
  // Collect unique batsmen from the current over
  const batsmen = new Set<string>();
  balls.forEach((ball) => batsmen.add(ball.batsman));
  const batsmenArray = Array.from(batsmen);

  // The striker is the batsman from the last ball
  const striker = lastBall.batsman;
  // The non-striker is the other batsman (if exists)
  const nonStriker = batsmenArray.find((b) => b !== striker) || null;

  // Calculate completed overs
  const completedOvers = Number(latestOver.overNumber) - 1;
  const ballsInCurrentOver = balls.length;

  return {
    inningsNumber,
    striker,
    nonStriker,
    currentBowler,
    currentOver: Number(latestOver.overNumber),
    ballsInCurrentOver,
    completedOvers,
    lastBall,
  };
}

/**
 * Groups all balls by innings and over, sorted newest first
 */
export function groupBallsByInningsAndOver(
  ballByBallData: InningBallByBall[] | undefined
): BallGroup[] {
  if (!ballByBallData || ballByBallData.length === 0) return [];

  const groups: BallGroup[] = [];

  ballByBallData.forEach((inning) => {
    if (inning.balls.length > 0) {
      groups.push({
        inningsNumber: Number(inning.inningNumber),
        overNumber: Number(inning.overNumber),
        balls: inning.balls,
      });
    }
  });

  // Sort by innings (desc) then over (desc) to show newest first
  groups.sort((a, b) => {
    if (a.inningsNumber !== b.inningsNumber) {
      return b.inningsNumber - a.inningsNumber;
    }
    return b.overNumber - a.overNumber;
  });

  return groups;
}

/**
 * Finds the key of the latest ball for highlighting
 */
export function getLatestBallKey(
  ballByBallData: InningBallByBall[] | undefined
): string | null {
  if (!ballByBallData || ballByBallData.length === 0) return null;

  let latestInnings = 0;
  let latestOver = 0;
  let latestBallIndex = -1;

  ballByBallData.forEach((inning) => {
    const inningsNum = Number(inning.inningNumber);
    const overNum = Number(inning.overNumber);

    if (
      inningsNum > latestInnings ||
      (inningsNum === latestInnings && overNum > latestOver) ||
      (inningsNum === latestInnings &&
        overNum === latestOver &&
        inning.balls.length > latestBallIndex + 1)
    ) {
      latestInnings = inningsNum;
      latestOver = overNum;
      latestBallIndex = inning.balls.length - 1;
    }
  });

  if (latestBallIndex === -1) return null;

  return `${latestInnings}-${latestOver}-${latestBallIndex}`;
}

/**
 * Formats over progress as "Over X (Y/6)"
 */
export function formatOverProgress(overNumber: number, ballsInOver: number): string {
  return `Over ${overNumber} (${ballsInOver}/6)`;
}

/**
 * Formats completed overs display
 */
export function formatCompletedOvers(completedOvers: number, ballsInCurrentOver: number): string {
  if (ballsInCurrentOver === 0) {
    return `${completedOvers} overs`;
  }
  const fraction = ballsInCurrentOver / 6;
  return `${completedOvers}.${ballsInCurrentOver} overs`;
}
