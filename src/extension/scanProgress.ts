export type ScanProgressPhase =
  | "preparing"
  | "collecting"
  | "observing"
  | "analyzing"
  | "saving"
  | "complete";

export type ScanProgressUpdate = {
  phase: ScanProgressPhase;
  percent: number;
  label: string;
};

export type ScanProgressMessage = ScanProgressUpdate & {
  type: "SCAN_PROGRESS";
  requestId: string;
};

export function isScanProgressMessage(message: unknown): message is ScanProgressMessage {
  if (!message || typeof message !== "object") return false;
  const candidate = message as Partial<ScanProgressMessage>;
  return (
    candidate.type === "SCAN_PROGRESS" &&
    typeof candidate.requestId === "string" &&
    typeof candidate.phase === "string" &&
    typeof candidate.percent === "number" &&
    typeof candidate.label === "string"
  );
}
