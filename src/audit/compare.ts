import type { AuditDomainRow, AuditRow } from "@/src/audit/types";

export type AuditDomainChange = {
  domain: string;
  kind: "new" | "removed" | "expanded" | "reduced";
  oldPageCount: number;
  newPageCount: number;
  oldCoverage: number;
  newCoverage: number;
  row?: AuditDomainRow;
};

export function compareAudits(
  oldAudit: AuditRow,
  newAudit: AuditRow,
  oldDomains: AuditDomainRow[],
  newDomains: AuditDomainRow[],
): AuditDomainChange[] {
  const oldMap = new Map(oldDomains.map((row) => [row.domain, row]));
  const newMap = new Map(newDomains.map((row) => [row.domain, row]));
  const names = new Set([...oldMap.keys(), ...newMap.keys()]);
  const changes: AuditDomainChange[] = [];
  for (const domain of names) {
    const before = oldMap.get(domain);
    const after = newMap.get(domain);
    const oldPageCount = before?.pageCount ?? 0;
    const newPageCount = after?.pageCount ?? 0;
    const oldCoverage = oldAudit.pagesScanned > 0 ? oldPageCount / oldAudit.pagesScanned : 0;
    const newCoverage = newAudit.pagesScanned > 0 ? newPageCount / newAudit.pagesScanned : 0;
    let kind: AuditDomainChange["kind"] | null = null;
    if (oldPageCount === 0 && newPageCount > 0) kind = "new";
    else if (oldPageCount > 0 && newPageCount === 0) kind = "removed";
    else if (newCoverage - oldCoverage >= 0.15) kind = "expanded";
    else if (oldCoverage - newCoverage >= 0.15) kind = "reduced";
    if (kind) changes.push({ domain, kind, oldPageCount, newPageCount, oldCoverage, newCoverage, row: after ?? before });
  }
  const order = { new: 0, expanded: 1, reduced: 2, removed: 3 } as const;
  return changes.sort((a, b) => order[a.kind] - order[b.kind] || b.newCoverage - a.newCoverage || a.domain.localeCompare(b.domain));
}
