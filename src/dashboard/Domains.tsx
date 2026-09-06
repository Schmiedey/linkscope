import { Link, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { describeDomain, isTrackerCategory } from "@/src/analysis/categorizer";
import { Badge } from "@/src/components/ui/badge";
import { FilterChip, SearchInput } from "@/src/components/SearchControls";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getDomain, listDomains, listSightingsForDomain } from "@/src/storage/domains";
import { CATEGORY_LABELS, type DomainCategory } from "@/src/types/graph";

type Bucket = "all" | "trackers" | "unknown" | DomainCategory;
type DomainSort = "seen" | "name";

const FILTERS: { id: Bucket; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trackers", label: "Trackers" },
  { id: "unknown", label: "Unknown" },
  { id: "analytics", label: "Analytics" },
  { id: "advertising", label: "Ads" },
  { id: "cdn", label: "CDN" },
  { id: "social", label: "Social" },
];

export function DomainsPage() {
  const domains = useAsync(() => listDomains(), []);
  const [query, setQuery] = useState("");
  const [bucket, setBucket] = useState<Bucket>("all");
  const [sort, setSort] = useState<DomainSort>("seen");

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let list = [...(domains.data ?? [])];
    if (needle) {
      list = list.filter((row) => {
        const owner = describeDomain(row.domain).owner?.toLowerCase() ?? "";
        return row.domain.toLowerCase().includes(needle) || owner.includes(needle);
      });
    }
    if (bucket === "trackers") list = list.filter((row) => isTrackerCategory(row.category));
    else if (bucket === "unknown") list = list.filter((row) => row.category === "unknown");
    else if (bucket !== "all") list = list.filter((row) => row.category === bucket);
    list.sort((a, b) => {
      if (sort === "name") return a.domain.localeCompare(b.domain);
      return b.seenOnCount - a.seenOnCount || a.domain.localeCompare(b.domain);
    });
    return list;
  }, [domains.data, query, bucket, sort]);

  return (
    <div className="px-10 py-10">
      <header className="mb-6">
        <h1 className="font-display text-4xl">Domains</h1>
      </header>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <SearchInput
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search domain or owner"
          aria-label="Search domains"
        />
        {FILTERS.map((item) => (
          <FilterChip key={item.id} on={bucket === item.id} onClick={() => setBucket(item.id)}>
            {item.label}
          </FilterChip>
        ))}
        <span className="mx-1 text-line">·</span>
        <FilterChip on={sort === "seen"} onClick={() => setSort("seen")}>
          Seen on most
        </FilterChip>
        <FilterChip on={sort === "name"} onClick={() => setSort("name")}>
          Name
        </FilterChip>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead className="text-[12px] text-mute">
          <tr>
            <th className="pb-2 font-normal">Domain</th>
            <th className="pb-2 font-normal">Owner</th>
            <th className="pb-2 font-normal">Seen on</th>
            <th className="pb-2 font-normal">Category</th>
            <th className="pb-2 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const owner = describeDomain(row.domain).owner;
            return (
              <tr key={row.domain} className="border-t border-line">
                <td className="py-3">
                  <Link to={`/domains/${encodeURIComponent(row.domain)}`} className="hover:underline">
                    {row.domain}
                  </Link>
                </td>
                <td className="py-3 text-mute">{owner ?? "—"}</td>
                <td className="py-3">{formatCount(row.seenOnCount)}</td>
                <td className="py-3">{CATEGORY_LABELS[row.category]}</td>
                <td className="py-3">
                  <Badge
                    tone={
                      row.category === "unknown" ? "amber" : isTrackerCategory(row.category) ? "rose" : "mute"
                    }
                  >
                    {row.category === "unknown"
                      ? "Unknown"
                      : isTrackerCategory(row.category)
                        ? "Tracker"
                        : CATEGORY_LABELS[row.category]}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!domains.data?.length ? (
        <p className="mt-4 text-mute">No domains discovered yet.</p>
      ) : !rows.length ? (
        <p className="mt-4 text-mute">No domains match that filter.</p>
      ) : null}
    </div>
  );
}

export function DomainDetailPage() {
  const params = useParams();
  const domain = params.domain ? decodeURIComponent(params.domain) : "";
  const row = useAsync(() => getDomain(domain), [domain]);
  const sightings = useAsync(() => listSightingsForDomain(domain), [domain]);
  const now = Date.now();
  const listed = describeDomain(domain);

  if (!row.loading && !row.data) {
    return (
      <div className="px-10 py-10">
        <p className="text-mute">Domain not found.</p>
        <Link to="/domains" className="text-ink underline">
          Back
        </Link>
      </div>
    );
  }

  const data = row.data;

  return (
    <div className="px-10 py-10">
      <Link to="/domains" className="text-[13px] text-mute hover:text-ink">
        Domains
      </Link>
      <h1 className="font-display mt-2 text-4xl">{domain}</h1>
      {data ? (
        <div className="mt-6 grid max-w-xl grid-cols-2 gap-4">
          <Meta label="Seen on" value={`${formatCount(data.seenOnCount)} websites`} />
          <Meta label="Category" value={CATEGORY_LABELS[data.category]} />
          <Meta label="Owner" value={listed.owner ?? "Unlisted"} />
          <Meta label="First seen" value={formatRelativeTime(data.firstSeen, now)} />
        </div>
      ) : null}
      <h2 className="font-display mt-10 mb-3 text-2xl">Sites containing this domain</h2>
      <div className="divide-y divide-line border-y border-line">
        {sightings.data?.map((item) => (
          <div key={`${item.siteDomain}-${String(item.id)}`} className="flex items-center justify-between py-3">
            <div>
              <div>{item.siteDomain}</div>
              <div className="text-[12px] text-mute">{item.types.join(" · ")}</div>
            </div>
            <Link to={`/graph/${String(item.lastScanId)}`} className="text-[13px] text-ink hover:underline">
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
    <div>
      <div className="text-[12px] text-mute">{label}</div>
      <div className="mt-0.5 text-[14px]">{value}</div>
    </div>
  );
}
