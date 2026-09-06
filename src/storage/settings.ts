import { db } from "@/src/storage/database";

const NOTIFICATIONS_KEY = "notifications";

export async function notificationsEnabled(): Promise<boolean> {
  const row = await db.settings.get(NOTIFICATIONS_KEY);
  if (!row) return true;
  return row.value === "true";
}

export async function setNotificationsEnabled(enabled: boolean): Promise<void> {
  await db.settings.put({ key: NOTIFICATIONS_KEY, value: enabled ? "true" : "false" });
}
