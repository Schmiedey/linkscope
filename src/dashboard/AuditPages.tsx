import { Link, useParams } from "react-router-dom";
import { gradeFromScore } from "@/src/analysis/score";
import { formatCount } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getAudit, listAuditPages } from "@/src/storage/audits";

export function AuditPagesPage() {
  const auditId = Number(useParams().auditId);
  const audit = useAsync(() => getAudit(auditId), [auditId]);
  const pages = useAsync(() => listAuditPages(auditId), [auditId]);
  const rows = [...(pages.data ?? [])].sort((a, b) => b.trackerCount - a.trackerCount || a.path.localeCompare(b.path));
  return <div className="px-10 py-10"><Link to={`/audits/${String(auditId)}`} className="text-[13px] text-mute hover:text-ink">Audit report</Link><h1 className="font-display mt-2 text-4xl">Pages · {audit.data?.domain ?? "Audit"}</h1><table className="mt-8 w-full text-left text-[13px]"><thead className="text-[12px] text-mute"><tr><th className="pb-2 font-normal">Page</th><th className="pb-2 font-normal">Third parties</th><th className="pb-2 font-normal">Trackers</th><th className="pb-2 font-normal">Unknown</th><th className="pb-2 font-normal">Score</th><th className="pb-2 font-normal">Status</th></tr></thead><tbody>{rows.map((page) => <tr key={page.url} className="border-t border-line"><td className="max-w-xl py-3"><p className="truncate font-mono">{page.path}</p><p className="truncate text-[11px] text-mute">{page.title}</p></td><td>{formatCount(page.thirdPartyCount)}</td><td>{formatCount(page.trackerCount)}</td><td>{formatCount(page.unknownCount)}</td><td>{page.score !== undefined ? `${page.score} / ${gradeFromScore(page.score)}` : "—"}</td><td className="capitalize text-mute">{page.status}</td></tr>)}</tbody></table></div>;
}
