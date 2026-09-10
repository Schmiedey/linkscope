import { Link } from "react-router-dom";
import { gradeFromScore } from "@/src/analysis/score";
import { PrivacyScoreMark } from "@/src/components/PrivacyScoreMark";
import { formatCount, formatRelativeTime } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { listAudits } from "@/src/storage/audits";

export function AuditsPage() {
  const audits = useAsync(() => listAudits(), []);
  const now = Date.now();

  return (
    <div className="px-10 py-10">
      <header className="mb-8 flex items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-4xl">Site audits</h1>
          <p className="mt-2 max-w-xl text-[14px] text-mute">Crawl multiple pages and measure the site-wide third-party footprint.</p>
        </div>
        <Link to="/audits/new" className="inline-flex h-9 items-center rounded-md bg-ink px-3.5 text-[13px] font-medium text-canvas">
          New audit
        </Link>
      </header>
      {audits.data?.length ? (
        <div className="divide-y divide-line border-y border-line">
          {audits.data.map((audit) => (
            <Link
              key={audit.id}
              to={audit.status === "completed" ? `/audits/${String(audit.id)}` : `/audits/${String(audit.id)}/running`}
              className="flex items-center justify-between gap-6 py-4 hover:bg-raised/70"
            >
              <div>
                <p className="text-[15px] font-medium text-ink">{audit.domain}</p>
                <p className="mt-0.5 text-[12px] capitalize text-mute">{audit.mode} · {audit.status} · {formatRelativeTime(audit.startedAt, now)}</p>
              </div>
              <div className="flex items-center gap-6 text-right text-[12px] text-mute">
                <span>{formatCount(audit.pagesScanned)} pages</span>
                <span>{formatCount(audit.trackerCount)} trackers</span>
                {audit.score !== undefined ? <PrivacyScoreMark compact score={audit.score} grade={gradeFromScore(audit.score)} /> : null}
              </div>
            </Link>
          ))}
        </div>
      ) : audits.loading ? (
        <p className="text-mute">Loading audits…</p>
      ) : (
        <div className="border-y border-line py-10">
          <p className="font-display text-2xl">No site audits yet</p>
          <p className="mt-2 text-[13px] text-mute">Start with a Quick audit to sample up to ten pages.</p>
        </div>
      )}
    </div>
  );
}
