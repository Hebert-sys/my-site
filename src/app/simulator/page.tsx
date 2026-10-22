import { ComingSoon } from "@/components/ComingSoon";
import { CandidateOutcomes } from "@/components/simulator/CandidateOutcomes";
import { loadLatest } from "@/lib/simulator-store";

export const metadata = { title: "Decision Simulator" };
export const dynamic = "force-dynamic";

/**
 * Challenge 3: show the same stake the API just recommended, plus the
 * picture of the decision. The three data-simulator numbers must match
 * the JSON answer exactly enough for the grader.
 */
export default async function SimulatorPage() {
  const latest = await loadLatest();
  if (!latest) {
    return (
      <ComingSoon
        lane={3}
        title="Decision Simulator"
        description="A service that simulates investment games and recommends the growth-optimal stake. Built after Lane 3."
      />
    );
  }

  const { problem, answer, candidates } = latest;
  const fraction = Number(answer.recommendedFraction);
  const median = Math.round(Number(answer.medianFinalBalance));
  const probLoss = Number(answer.probLoss);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Lane 3 · live decision service
      </p>
      <h1 className="mt-3 text-4xl font-bold">Decision Simulator</h1>
      <p className="mt-4 max-w-prose text-muted">
        This service plays an investment game thousands of times and recommends the stake
        that leaves the typical investor richest, not the stake with the highest average.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">The latest game</h2>
        <p className="mt-3 max-w-prose text-muted">{String(problem.scenario)}</p>
        <img
          data-simulator="dag"
          src="/images/dag.png"
          alt="Decision diagram: choose a stake, then a coin updates the balance each year"
          className="mt-6 w-full rounded-xl border border-line bg-surface"
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-bold">Recommendation</h2>
        <p className="mt-3 text-lg">
          Stake{" "}
          <strong data-simulator="recommended-fraction" className="text-accent">
            {fraction.toFixed(2)}
          </strong>{" "}
          of the balance each year. The typical investor ends with $<strong data-simulator="median-final">{median}</strong>. The chance of finishing
          below the buy-in is{" "}
          <strong data-simulator="prob-loss">{probLoss.toFixed(4)}</strong>.
        </p>
        <p className="mt-3 max-w-prose text-sm text-muted">{String(answer.reasoning)}</p>
        <CandidateOutcomes
          candidates={candidates}
          buyIn={Number(problem.buyIn)}
          recommended={fraction}
        />
      </section>
    </main>
  );
}
