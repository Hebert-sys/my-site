import { NextResponse } from "next/server";
import { saveLatest, type CandidateSummary } from "@/lib/simulator-store";

/**
 * Challenge 3: simulate each candidate stake and recommend the one whose
 * typical (median) investor ends richest. The mean is the wrong target:
 * a few jackpot paths pull it up while most people lose.
 */
const N_PATHS = 100_000;

function simulate(
  buyIn: number,
  years: number,
  fraction: number,
  up: number,
  down: number
): Float64Array {
  const headsFactor = 1 + up * fraction;
  const tailsFactor = 1 - down * fraction;
  const finals = new Float64Array(N_PATHS);
  for (let i = 0; i < N_PATHS; i++) {
    let wealth = buyIn;
    for (let year = 0; year < years; year++) {
      wealth *= Math.random() < 0.5 ? headsFactor : tailsFactor;
    }
    finals[i] = wealth;
  }
  return finals;
}

function summarize(finals: Float64Array, buyIn: number, fraction: number): CandidateSummary {
  const sorted = Array.from(finals).sort((a, b) => a - b);
  const at = (p: number) => {
    const index = (sorted.length - 1) * p;
    const lo = Math.floor(index);
    const hi = Math.ceil(index);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (index - lo);
  };
  let losses = 0;
  for (const value of sorted) if (value < buyIn) losses += 1;
  return {
    fraction,
    p5: at(0.05),
    p25: at(0.25),
    median: at(0.5),
    p75: at(0.75),
    p95: at(0.95),
    probLoss: losses / sorted.length,
  };
}

export async function POST(req: Request) {
  const game = await req.json().catch(() => null);
  const fractions = game?.candidateFractions;
  if (
    !game ||
    game.type !== "investment-game" ||
    !Array.isArray(fractions) ||
    fractions.length === 0
  ) {
    return NextResponse.json(
      { error: "expected an investment-game with candidateFractions" },
      { status: 400 }
    );
  }

  const up = game.upPct / 100;
  const down = game.downPct / 100;
  const candidates = fractions.map((fraction: number) =>
    summarize(simulate(game.buyIn, game.horizonYears, fraction, up, down), game.buyIn, fraction)
  );
  const best = candidates.reduce((winner, candidate) =>
    candidate.median > winner.median ? candidate : winner
  );

  const answer = {
    recommendedFraction: best.fraction,
    medianFinalBalance: best.median,
    probLoss: best.probLoss,
    reasoning: `Of the ${candidates.length} stakes simulated, staking ${Math.round(best.fraction * 100)}% each year left the typical investor with the most: about $${Math.round(best.median).toLocaleString("en-US")}, from a $${Math.round(game.buyIn).toLocaleString("en-US")} buy-in. ${Math.round(best.probLoss * 100)}% of simulated investors still ended below the buy-in.`,
  };

  await saveLatest(game, answer, candidates);
  return NextResponse.json(answer);
}
