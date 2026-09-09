import type { LoadChain } from "@/src/analysis/why";
import { triggerLabel } from "@/src/analysis/why";

export function WhyChain({
  chain,
  onSelect,
}: {
  chain: LoadChain;
  onSelect?: (domain: string) => void;
}) {
  return (
    <section>
      <h3 className="mb-2 text-[12px] text-mute">Why is this here?</h3>
      <ol className="space-y-0">
        {chain.hops.map((hop, index) => {
          const last = index === chain.hops.length - 1;
          const next = chain.hops[index + 1];
          const via = next?.via ?? hop.via;
          const label = hop.resource && hop.name !== hop.resource ? hop.resource : hop.name;
          const sub =
            hop.name !== hop.domain ? hop.domain : hop.resource && hop.name === hop.domain ? hop.resource : undefined;
          return (
            <li key={`${hop.domain}-${String(index)}`}>
              {onSelect ? (
                <button
                  type="button"
                  className="text-left text-[13px] text-ink hover:underline"
                  onClick={() => onSelect(hop.domain)}
                >
                  {label}
                </button>
              ) : (
                <span className="text-[13px] text-ink">{label}</span>
              )}
              {sub ? <span className="text-[12px] text-mute"> · {sub}</span> : null}
              {!last ? (
                <div className="pl-1 text-[11px] leading-5 text-mute">↓ {via ? triggerLabel(via) : chain.triggeredBy}</div>
              ) : null}
            </li>
          );
        })}
      </ol>
      <p className="mt-3 text-[13px] text-ink">Used for: {chain.usedFor}</p>
      <p className="mt-1 text-[12px] text-mute">Triggered by: {chain.triggeredBy}</p>
    </section>
  );
}
