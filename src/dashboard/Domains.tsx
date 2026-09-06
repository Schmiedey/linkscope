import { Link, useParams } from "react-router-dom";
import { Badge } from "@/src/components/ui/badge";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getDomain, listDomains, listSightingsForDomain } from "@/src/storage/domains";
import { CATEGORY_LABELS } from "@/src/types/graph";
import { CATEGORY_COLORS } from "@/src/graph/colors";

export function DomainsPage() {
  const domains = useAsync(() => listDomains(), []);

  return (
    <div className="px-8 py-8">
      <header className="mb-8">
        <p className="text-[10px] tracking-[0.32em] text-cyan uppercase">Catalog</p>
        <h1 className="font-display mt-1 text-4xl">Domain database</h1>
      </header>
      <div className="overflow-hidden border border-line">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-panel text-[10px] tracking-[0.16em] text-mute uppercase">
            <tr>
              <th className="px-4 py-3 font-normal">Domain</th>
              <th className="px-4 py-3 font-normal">Seen on</th>
              <th className="px-4 py-3 font-normal">Category</th>
              <th className="px-4 py-3 font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {domains.data?.map((row) => (
              <tr key={row.domain} className="border-t border-line hover:bg-raised/70">
                <td className="px-4 py-3">
                  <Link to={`/domains/${encodeURIComponent(row.domain)}`} className="hover:text-cyan">
                    {row.domain}
                  </Link>
                </td>
                <td className="px-4 py-3">{formatCount(row.seenOnCount)}</td>
                <td className="px-4 py-3">
                  <span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[row.category] }} />
                  {CATEGORY_LABELS[row.category]}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={row.category === "unknown" ? "amber" : "cyan"}>
                    {row.category === "unknown" ? "Unknown" : "Clean"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!domains.data?.length ? <p className="mt-4 text-mute">No domains discovered yet.</p> : null}
    </div>
  );
}

export function DomainDetailPage() {
  const params = useParams();
  const domain = params.domain ? decodeURIComponent(params.domain) : "";
  const row = useAsync(() => getDomain(domain), [domain]);
  const sightings = useAsync(() => listSightingsForDomain(domain), [domain]);
  const now = Date.now();

  if (!row.loading && !row.data) {
    return (
      <div className="px-8 py-8">
        <p className="text-mute">Domain not found.</p>
        <Link to="/domains" className="text-cyan">
          Back to catalog
        </Link>
      </div>
    );
  }

  const data = row.data;

  return (
    <div className="px-8 py-8">
      <Link to="/domains" className="text-[10px] tracking-[0.18em] text-mute uppercase hover:text-cyan">
        Catalog
      </Link>
      <h1 className="font-display mt-2 text-4xl">{domain}</h1>
      {data ? (
        <div className="mt-6 grid max-w-xl grid-cols-2 gap-3">
          <Meta label="Seen on" value={`${formatCount(data.seenOnCount)} websites`} />
          <Meta label="Category" value={CATEGORY_LABELS[data.category]} />
          <Meta label="First seen" value={formatRelativeTime(data.firstSeen, now)} />
          <Meta label="Last seen" value={formatRelativeTime(data.lastSeen, now)} />
        </div>
      ) : null}
      <h2 className="font-display mt-10 mb-3 text-2xl">Sites containing this domain</h2>
      <div className="divide-y divide-line border border-line">
        {sightings.data?.map((item) => (
          <div key={`${item.siteDomain}-${String(item.id)}`} className="flex items-center justify-between px-4 py-3">
            <div>
              <div>{item.siteDomain}</div>
              <div className="text-[11px] text-mute">{item.types.join(" · ")}</div>
            </div>
            <Link to={`/graph/${String(item.lastScanId)}`} className="text-[10px] tracking-[0.16em] text-cyan uppercase">
              View graph
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line px-3 py-3">
      <div className="text-[10px] tracking-[0.16em] text-mute uppercase">{label}</div>
      <div className="mt-1 text-[13px]">{value}</div>
    </div>
  );
}
