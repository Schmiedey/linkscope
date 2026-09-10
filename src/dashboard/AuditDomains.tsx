import { Link, useParams } from "react-router-dom";
import { formatCount } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getAudit, listAuditDomains } from "@/src/storage/audits";
import { CATEGORY_LABELS } from "@/src/types/graph";

export function AuditDomainsPage() {
  const auditId = Number(useParams().auditId);
  const audit = useAsync(() => getAudit(auditId), [auditId]);
  const domains = useAsync(() => listAuditDomains(auditId), [auditId]);
  const rows = (domains.data ?? []).filter((row) => !row.isFirstParty).sort((a, b) => b.pageCount - a.pageCount || a.domain.localeCompare(b.domain));
  return <div className="px-10 py-10"><Link to={`/audits/${String(auditId)}`} className="text-[13px] text-mute hover:text-ink">Audit report</Link><h1 className="font-display mt-2 text-4xl">Domains · {audit.data?.domain ?? "Audit"}</h1><table className="mt-8 w-full text-left text-[13px]"><thead className="text-[12px] text-mute"><tr><th className="pb-2 font-normal">Domain</th><th className="pb-2 font-normal">Category</th><th className="pb-2 font-normal">Owner</th><th className="pb-2 font-normal">Coverage</th><th className="pb-2 font-normal">References</th><th className="pb-2 font-normal">Types</th></tr></thead><tbody>{rows.map((domain) => <tr key={domain.domain} className="border-t border-line"><td className="py-3 font-mono">{domain.domain}</td><td>{CATEGORY_LABELS[domain.category]}</td><td className="text-mute">{domain.owner ?? "Unknown"}</td><td>{domain.pageCount} / {audit.data?.pagesScanned ?? 0}</td><td>{formatCount(domain.referenceCount)}</td><td className="text-mute">{domain.types.join(", ")}</td></tr>)}</tbody></table></div>;
}
