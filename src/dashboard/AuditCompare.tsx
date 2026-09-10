import { useParams } from "react-router-dom";
import { compareAudits } from "@/src/audit/compare";
import { formatShortDate } from "@/src/lib/utils";
import { useAsync } from "@/src/lib/useAsync";
import { getAudit, listAuditDomains } from "@/src/storage/audits";
import { CATEGORY_LABELS } from "@/src/types/graph";

export function AuditComparePage() {
  const oldId = Number(useParams().oldId);
  const newId = Number(useParams().newId);
  const data = useAsync(async () => {
    const [oldAudit, newAudit, oldDomains, newDomains] = await Promise.all([getAudit(oldId), getAudit(newId), listAuditDomains(oldId), listAuditDomains(newId)]);
    if (!oldAudit || !newAudit) return null;
    return { oldAudit, newAudit, changes: compareAudits(oldAudit, newAudit, oldDomains, newDomains) };
  }, [oldId, newId]);
  if (!data.data) return <p className="px-10 py-10 text-mute">Loading comparison…</p>;
  const { oldAudit, newAudit, changes } = data.data;
  return <div className="px-10 py-10"><p className="text-[12px] tracking-[0.14em] text-mute uppercase">Audit comparison</p><h1 className="font-display mt-2 text-4xl">{newAudit.domain}</h1><p className="mt-2 text-[13px] text-mute">{formatShortDate(oldAudit.startedAt)} → {formatShortDate(newAudit.startedAt)}</p><section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-line bg-line lg:grid-cols-4"><Delta label="Third parties" oldValue={oldAudit.thirdPartyCount} newValue={newAudit.thirdPartyCount} /><Delta label="Trackers" oldValue={oldAudit.trackerCount} newValue={newAudit.trackerCount} /><Delta label="Unknown" oldValue={oldAudit.unknownCount} newValue={newAudit.unknownCount} /><Delta label="Score" oldValue={oldAudit.score ?? 0} newValue={newAudit.score ?? 0} /></section><div className="mt-10 divide-y divide-line border-y border-line">{changes.map((change) => <div key={change.domain} className="flex items-start justify-between gap-6 py-4"><div><p className="text-[11px] uppercase text-mute">{change.kind}</p><p className="mt-1 font-mono text-[13px]">{change.domain}</p><p className="mt-1 text-[12px] text-mute">{change.row ? CATEGORY_LABELS[change.row.category] : "Third party"}</p></div><p className="text-[13px] tabular-nums">{change.oldPageCount} → {change.newPageCount} pages</p></div>)}</div></div>;
}

function Delta({ label, oldValue, newValue }: { label: string; oldValue: number; newValue: number }) {
  const delta = newValue - oldValue;
  return <div className="bg-canvas px-5 py-5"><p className="text-[12px] text-mute">{label}</p><p className="font-display mt-1 text-3xl">{oldValue} → {newValue}</p><p className={`mt-1 text-[12px] ${delta > 0 ? "text-rose" : delta < 0 ? "text-lime" : "text-mute"}`}>{delta > 0 ? "+" : ""}{delta}</p></div>;
}
