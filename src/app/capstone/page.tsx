import { ComingSoon } from "@/components/ComingSoon";
import { loadLatest } from "@/lib/capstone-store";
import { simulateAll } from "@/lib/capstone-simulate";
import type { CapstoneProbe, Outcome } from "@/lib/capstone-helpers";

export const metadata = { title: "Capstone — Patrick's shops" };
export const dynamic = "force-dynamic";

function fmt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function shortLabel(chance: number): string {
  return `${Math.round(chance * 100)} in 100`;
}

function histogram(values: number[], bins: number, min: number, max: number): number[] {
  const counts = Array(bins).fill(0);
  const width = (max - min) / bins || 1;
  for (const v of values) {
    const i = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / width)));
    counts[i] += 1;
  }
  return counts;
}

function OutcomeChart({
  probe,
  results,
  outcomes,
}: {
  probe: CapstoneProbe;
  results: Record<string, number[]>;
  outcomes: Record<string, Outcome>;
}) {
  const [a, b] = probe.candidates;
  const all = [...results[a.id], ...results[b.id]];
  const min = Math.min(...all, probe.limit.atLeast) - 50;
  const max = Math.max(...all, probe.limit.atLeast) + 50;
  const bins = 40;
  const ha = histogram(results[a.id], bins, min, max);
  const hb = histogram(results[b.id], bins, min, max);
  const peak = Math.max(...ha, ...hb, 1);
  const W = 640;
  const rowH = 110;
  const padL = 36;
  const padR = 16;
  const padT = 18;
  const plotW = W - padL - padR;
  const limitX = padL + ((probe.limit.atLeast - min) / (max - min)) * plotW;

  function row(counts: number[], y0: number, fill: string, label: string, outcome: Outcome) {
    const barH = rowH - 36;
    const bars = counts.map((c, i) => {
      const x = padL + (i / bins) * plotW;
      const w = plotW / bins;
      const h = (c / peak) * barH;
      return <rect key={i} x={x} y={y0 + barH - h} width={Math.max(w - 0.5, 0.5)} height={h} fill={fill} opacity={0.85} />;
    });
    return (
      <g>
        <text x={padL} y={y0 - 4} fontSize="12" fill="currentColor">
          {label}: typical {fmt(outcome.typical)}, short {shortLabel(outcome.chanceShort)}
        </text>
        {bars}
      </g>
    );
  }

  return (
    <div data-capstone="outcome-chart" className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface p-3">
      <svg viewBox={`0 0 ${W} ${rowH * 2 + 56}`} className="w-full text-ink" role="img" aria-label="Outcome distributions for both shops">
        {row(ha, padT + 14, "#7c3aed", a.label, outcomes[a.id])}
        {row(hb, padT + rowH + 20, "#94a3b8", b.label, outcomes[b.id])}
        <line x1={limitX} y1={8} x2={limitX} y2={rowH * 2 + 28} stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />
        <text x={limitX + 4} y={14} fontSize="11" fill="#dc2626">
          limit {fmt(probe.limit.atLeast)} {String(probe.scenario.params.unit)}
        </text>
        <text x={padL} y={rowH * 2 + 48} fontSize="11" fill="#64748b">
          {fmt(min)}
        </text>
        <text x={W - padR} y={rowH * 2 + 48} fontSize="11" fill="#64748b" textAnchor="end">
          {fmt(max)}
        </text>
      </svg>
    </div>
  );
}

function AllDataChart({ probe }: { probe: CapstoneProbe }) {
  const rows = probe.history;
  const shops = [1, 2];
  const cars = rows.map((r) => Number(r.cars));
  const yMax = Math.max(...cars, 1) + 5;
  const W = 640;
  const H = 280;
  const pad = { l: 44, r: 16, t: 24, b: 40 };
  const plotW = W - pad.l - pad.r;
  const plotH = H - pad.t - pad.b;

  return (
    <div
      data-capstone="all-data-chart"
      data-points={rows.length}
      className="mt-4 overflow-x-auto rounded-xl border border-line bg-surface p-3"
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full text-ink" role="img" aria-label="Every history day of cars fixed">
        <text x={pad.l} y={16} fontSize="12" fill="currentColor">
          Cars fixed each past day (purple = Patrick there, gray = away)
        </text>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = pad.t + (1 - t) * plotH;
          const v = t * yMax;
          return (
            <g key={t}>
              <line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="#e2e8f0" />
              <text x={pad.l - 6} y={y + 3} fontSize="10" fill="#64748b" textAnchor="end">
                {Math.round(v)}
              </text>
            </g>
          );
        })}
        {shops.map((shop, si) => {
          const cx = pad.l + ((si + 0.5) / shops.length) * plotW;
          const group = rows.filter((r) => Number(r.shop) === shop);
          return (
            <g key={shop}>
              <text x={cx} y={H - 12} fontSize="12" fill="currentColor" textAnchor="middle">
                Shop {shop}
              </text>
              {group.map((r, i) => {
                const there = Number(r.patrick) === 1;
                const jitter = ((i * 37) % 17) / 17 - 0.5;
                const x = cx + (there ? 18 : -18) + jitter * 10;
                const y = pad.t + (1 - Number(r.cars) / yMax) * plotH;
                return (
                  <circle
                    key={`${shop}-${i}`}
                    cx={x}
                    cy={y}
                    r={3.2}
                    fill={there ? "#7c3aed" : "#cbd5e1"}
                    opacity={0.9}
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default async function CapstonePage() {
  const latest = await loadLatest();
  if (!latest) {
    return (
      <ComingSoon
        lane={5}
        title="Capstone: Live Decision Service"
        description="Run npm run try-capstone once so this page can load your saved problem and answer."
      />
    );
  }

  const { probe, answer } = latest;
  const results = simulateAll(probe);
  if (!results) {
    return (
      <ComingSoon
        lane={5}
        title="Capstone: Live Decision Service"
        description="simulateRun() is not ready yet."
      />
    );
  }

  const chosen = probe.candidates.find((c) => c.id === answer.action)!;
  const other = probe.candidates.find((c) => c.id !== answer.action)!;
  const chosenOut = answer.outcomes[answer.action];
  const otherOut = answer.outcomes[other.id];
  const unit = String(probe.scenario.params.unit);
  const reader = String(probe.scenario.params.reader);

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">
        Lane 5 · capstone report
      </p>
      <h1 className="mt-3 text-4xl font-bold">Report for {reader}</h1>
      <p className="mt-4 max-w-prose text-muted">{probe.scenario.narrative}</p>

      {/* ── 1. What should I do? ─────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">What should I do?</h2>
        {/* TODO(yours): rewrite this recommendation in your own words. */}
        <p data-capstone="recommendation" className="mt-3 text-lg max-w-prose">
          Work at {chosen.label} next quarter: a typical quarter fixes about {fmt(chosenOut.typical)}{" "}
          {unit}, and you fall short of {fmt(probe.limit.atLeast)} only {shortLabel(chosenOut.chanceShort)}{" "}
          quarters.
        </p>
        <p className="mt-3 text-sm text-muted">
          Grader numbers: action{" "}
          <span data-capstone="action" className="font-mono text-ink">
            {answer.action}
          </span>
          , typical{" "}
          <span data-capstone="typical-result" className="font-mono text-ink">
            {Math.round(chosenOut.typical)}
          </span>
          , chance short{" "}
          <span data-capstone="chance-short" className="font-mono text-ink">
            {shortLabel(chosenOut.chanceShort)}
          </span>
          .
        </p>
      </section>

      {/* ── 2. Why not the other option? ─────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Why not the other option?</h2>
        {/* TODO(yours): one or two sentences comparing the two options. */}
        <p className="mt-3 max-w-prose text-muted">
          Choosing shop 1 is the best foot forward as it meets the  company&apos;s risk requirement. Although Shop 2 has a slightly higher average sales total approximately 5,574 cars, it has an 18% chance of failing to meet the sales target, which is above the company&apos;s acceptable limit 10%. Shop 1 has the better option as it has a lower risk of failing below the target
        </p>
        <OutcomeChart probe={probe} results={results} outcomes={answer.outcomes} />
      </section>

      {/* ── 3. How sure can I be? ────────────────────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">How sure can I be?</h2>
        {/* TODO(yours): rewrite this uncertainty paragraph in your own words. */}
        <p data-capstone="uncertainty" className="mt-3 max-w-prose">
          If you choose Shop 1, expect between {fmt(chosenOut.low)} and {fmt(chosenOut.high)} cars
          fixed in 90 of 100 quarters. If you choose Shop 2, expect between {fmt(otherOut.low)} and{" "}
          {fmt(otherOut.high)} cars fixed in 90 of 100 quarters. Shop 1 beats Shop 2 in{" "}
          {Math.round(answer.chanceActionBeatsOther * 100)} of 100 simulated quarters. Shop 2&apos;s
          average when you were there is based on only two days of previous data, which may not be
          enough to make a reliable comparison. Therefore, I would prefer to review the results again
          after the next quarter when more data is available. The recommendation could change if your
          limit were looser than 1 shortfall in 10, or if more days with you at Shop 2 showed that
          average is steadier than it looks now.
        </p>
      </section>

      {/* ── 4. Where do these numbers come from? ─────────────────────────── */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold">Where do these numbers come from?</h2>
        {/* TODO(yours): one sentence on what the history chart shows. */}
        <p className="mt-3 max-w-prose text-muted">
          Below is the chart which shows every psst day at shop1 and shop 2. The purple dots are the number of days you were there at the shop ; the gray dotes represents the days you were away. These results were used to calculate the averages.
        </p>
        <AllDataChart probe={probe} />

        <h3 className="mt-8 text-xl font-bold">The recipe, in plain words</h3>
        {/* TODO(yours): optional short intro before the node list. */}
        <ol
          data-capstone="dag"
          data-nodes={probe.dag.nodes.length}
          className="mt-3 list-decimal space-y-2 pl-5 max-w-prose"
        >
          {probe.dag.nodes.map((n) => (
            <li key={n.id}>
              <span className="font-medium">{n.id}</span>: {n.plain}
              {n.compute ? ` (${n.compute})` : ""}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
