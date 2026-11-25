import { RUNS, draw, seededRandom, type CapstoneProbe } from "@/lib/capstone-helpers";

/**
 * Challenge 5: the simulation behind your decision service and your report.
 * Step 4 of the build guide ("Build Your Capstone", end of Lane 5 in the
 * course book) explains every line. Everything here is complete EXCEPT
 * simulateRun(), which is yours to write for the domain you chose.
 */

// TODO(yours): Step 4b of the build guide. Run the problem's recipe
// (probe.dag) once and return both options' results for that run, keyed by
// option id, for example { "shop-1": 4210, "shop-2": 4388 }.
//   - Draw every "once" node one time.
//   - Draw every "daily" or "weekly" node once per day or week of the period
//     (probe.scenario.params.periodLength), using the "once" value it is
//     centered on.
//   - Work out each "result" node as its `compute` text says.
// draw(probe, rand, id, center) does one draw for you.
export function simulateRun(probe: CapstoneProbe, rand: () => number): Record<string, number> | null {
  const days = Number(probe.scenario.params.periodLength);

  // Each shop's average, with and without Patrick: drawn once per quarter.
  const avg1With = draw(probe, rand, "avg-shop-1-with");
  const avg1Without = draw(probe, rand, "avg-shop-1-without");
  const avg2With = draw(probe, rand, "avg-shop-2-with");
  const avg2Without = draw(probe, rand, "avg-shop-2-without");

  let total1 = 0;
  let total2 = 0;
  for (let d = 0; d < days; d++) {
    total1 += draw(probe, rand, "cars-shop-1-with", avg1With) + draw(probe, rand, "cars-shop-2-without", avg2Without);
    total2 += draw(probe, rand, "cars-shop-2-with", avg2With) + draw(probe, rand, "cars-shop-1-without", avg1Without);
  }

  return { "shop-1": total1, "shop-2": total2 };
}

/**
 * Runs the recipe RUNS times and returns every option's list of results.
 * Seeded with the probe id, so the same problem always gives the same lists
 * (your report and your decide route see identical numbers).
 * Returns null until simulateRun() is written.
 */
export function simulateAll(probe: CapstoneProbe): Record<string, number[]> | null {
  const rand = seededRandom(probe.probeId);
  const results: Record<string, number[]> = {};
  for (const c of probe.candidates) results[c.id] = [];
  for (let i = 0; i < RUNS; i++) {
    const run = simulateRun(probe, rand);
    if (run === null) return null;
    for (const c of probe.candidates) {
      const v = run[c.id];
      if (typeof v !== "number" || !Number.isFinite(v)) {
        throw new Error(`simulateRun() gave no number for ${c.id} (Step 4b of the build guide)`);
      }
      results[c.id].push(v);
    }
  }
  return results;
}
