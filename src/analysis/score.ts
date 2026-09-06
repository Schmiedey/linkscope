import { isTrackerCategory } from "@/src/analysis/categorizer";
import { enrichSnapshot } from "@/src/analysis/enrich";
import type { ScanGraphSnapshot, ScanRow } from "@/src/types/graph";

export type PrivacyGrade = "A" | "B" | "C" | "D" | "F";

export type PrivacyScore = {
  score: number;
  grade: PrivacyGrade;
  trackers: number;
  unknown: number;
  thirdParties: number;
  iframeCount: number;
  thirdPartyScripts: number;
  totalScripts: number;
  reasons: string[];
};

export function gradeFromScore(score: number): PrivacyGrade {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 50) return "C";
  if (score >= 30) return "D";
  return "F";
}

export function scoreTone(grade: PrivacyGrade): "lime" | "ink" | "amber" | "rose" {
  if (grade === "A") return "lime";
  if (grade === "B") return "ink";
  if (grade === "C" || grade === "D") return "amber";
  return "rose";
}

export function scoreSnapshot(snapshot: ScanGraphSnapshot): PrivacyScore {
  const graph = enrichSnapshot(snapshot);
  const third = graph.nodes.filter((node) => !node.isOrigin && !node.isFirstParty);
  const thirdSet = new Set(third.map((node) => node.domain));
  const trackers = third.filter((node) => isTrackerCategory(node.category)).length;
  const unknown = third.filter((node) => node.category === "unknown").length;
  const iframeCount = new Set(
    graph.edges.filter((edge) => edge.type === "iframe" && thirdSet.has(edge.target)).map((edge) => edge.target),
  ).size;
  const scriptEdges = graph.edges.filter((edge) => edge.type === "script");
  const thirdPartyScripts = scriptEdges.filter((edge) => thirdSet.has(edge.target)).length;
  const totalScripts = scriptEdges.length;
  const scriptRatio = totalScripts > 0 ? thirdPartyScripts / totalScripts : 0;

  let penalty = 0;
  penalty += Math.min(45, trackers * 5);
  penalty += Math.min(15, unknown * 2);
  penalty += Math.min(15, iframeCount * 3);
  penalty += Math.round(scriptRatio * 20);
  if (third.length > 20) penalty += Math.min(10, Math.floor((third.length - 20) / 5));

  const score = Math.max(0, Math.min(100, 100 - penalty));
  const reasons: string[] = [];
  if (trackers > 0) reasons.push(`${String(trackers)} tracker ${trackers === 1 ? "domain" : "domains"}`);
  if (unknown > 0) reasons.push(`${String(unknown)} unclassified third ${unknown === 1 ? "party" : "parties"}`);
  if (iframeCount > 0) reasons.push(`${String(iframeCount)} third-party ${iframeCount === 1 ? "iframe" : "iframes"}`);
  if (totalScripts > 0 && scriptRatio >= 0.4) {
    reasons.push(`${String(Math.round(scriptRatio * 100))}% of scripts are third-party`);
  }
  if (reasons.length === 0) reasons.push("Most of this page stays on first-party infrastructure.");

  return {
    score,
    grade: gradeFromScore(score),
    trackers,
    unknown,
    thirdParties: third.length,
    iframeCount,
    thirdPartyScripts,
    totalScripts,
    reasons,
  };
}

export function scoreFromScan(scan: ScanRow): { score: number; grade: PrivacyGrade } {
  if (scan.privacyScore !== undefined) {
    return { score: scan.privacyScore, grade: gradeFromScore(scan.privacyScore) };
  }
  let penalty = Math.min(45, scan.trackerCount * 5);
  penalty += Math.min(20, Math.max(0, scan.thirdPartyCount - scan.trackerCount));
  if (scan.thirdPartyCount > 20) penalty += Math.min(10, Math.floor((scan.thirdPartyCount - 20) / 5));
  const score = Math.max(0, Math.min(100, 100 - penalty));
  return { score, grade: gradeFromScore(score) };
}
