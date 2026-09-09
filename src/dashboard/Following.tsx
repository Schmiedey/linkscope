import { Link } from "react-router-dom";
import { identifyDomain } from "@/src/analysis/identity";
import { useAsync } from "@/src/lib/useAsync";
import { formatRelativeTime } from "@/src/lib/utils";
import { listSightingsForDomain } from "@/src/storage/domains";
import { listFollowedDomains, unfollowDomain } from "@/src/storage/follows";
import { Button } from "@/src/components/ui/button";

export function FollowingPage() {
  const followed = useAsync(() => listFollowedDomains(), []);
  const now = Date.now();

  return (
    <div className="px-10 py-10">
      <h1 className="font-display text-4xl">Following</h1>
      <p className="mt-2 max-w-xl text-[14px] text-mute">
        Domains you asked LinkScope to remember. See which of your sites they appear on.
      </p>
      {(followed.data ?? []).length === 0 ? (
        <p className="mt-8 text-[14px] text-mute">Right-click a node and choose Follow, or follow from a domain page.</p>
      ) : (
        <div className="mt-8 space-y-10">
          {(followed.data ?? []).map((domain) => (
            <FollowedDomain key={domain} domain={domain} now={now} onUnfollow={() => followed.reload()} />
          ))}
        </div>
      )}
    </div>
  );
}

function FollowedDomain({
  domain,
  now,
  onUnfollow,
}: {
  domain: string;
  now: number;
  onUnfollow: () => void;
}) {
  const identity = identifyDomain(domain);
  const sightings = useAsync(() => listSightingsForDomain(domain), [domain]);

  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <div>
          <Link to={`/domains/${encodeURIComponent(domain)}`} className="font-display text-2xl hover:underline">
            {identity.name}
          </Link>
          <p className="text-[12px] text-mute">
            {domain} · {identity.typeLabel}
            {identity.owner ? ` · ${identity.owner}` : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void unfollowDomain(domain).then(onUnfollow);
          }}
        >
          Unfollow
        </Button>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {(sightings.data ?? []).map((item) => (
          <li key={`${item.siteDomain}-${String(item.id)}`} className="flex items-center justify-between py-2.5">
            <div>
              <p className="text-[13px]">{item.siteDomain}</p>
              <p className="text-[12px] text-mute">{formatRelativeTime(item.lastSeen, now)}</p>
            </div>
            <Link to={`/graph/${String(item.lastScanId)}`} className="text-[13px] text-ink hover:underline">
              View graph
            </Link>
          </li>
        ))}
      </ul>
      {sightings.data?.length === 0 ? <p className="mt-2 text-[13px] text-mute">Not seen on a checked site yet.</p> : null}
    </section>
  );
}
