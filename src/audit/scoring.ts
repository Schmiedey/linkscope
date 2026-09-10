import { scoreSnapshot } from "@/src/analysis/score";
import { mergeAuditGraphs } from "@/src/audit/aggregate";
import type { AuditPageGraphRow, AuditPageRow } from "@/src/audit/types";

export function scoreAudit(
  pages: AuditPageRow[],
  graphs: AuditPageGraphRow[],
  originDomain: string,
): { averagePageScore: number; footprintScore: number; score: number } {
  const scoredPages = pages.map((page) => page.score).filter((score): score is number => score !== undefined);
  const averagePageScore = scoredPages.length
    ? Math.round(scoredPages.reduce((sum, score) => sum + score, 0) / scoredPages.length)
    : 100;
  const footprint = scoreSnapshot(mergeAuditGraphs(graphs, originDomain)).score;
  return {
    averagePageScore,
    footprintScore: footprint,
    score: Math.round(averagePageScore * 0.7 + footprint * 0.3),
  };
}
