import { db } from "@/src/storage/database";

const FOLLOWS_KEY = "followedDomains";

async function readFollowed(): Promise<string[]> {
  const row = await db.settings.get(FOLLOWS_KEY);
  if (!row?.value) return [];
  try {
    const parsed: unknown = JSON.parse(row.value);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

async function writeFollowed(domains: string[]): Promise<void> {
  await db.settings.put({ key: FOLLOWS_KEY, value: JSON.stringify(domains) });
}

export async function listFollowedDomains(): Promise<string[]> {
  return (await readFollowed()).sort((a, b) => a.localeCompare(b));
}

export async function isFollowedDomain(domain: string): Promise<boolean> {
  const list = await readFollowed();
  return list.includes(domain.toLowerCase());
}

export async function followDomain(domain: string): Promise<void> {
  const normalized = domain.toLowerCase();
  const list = await readFollowed();
  if (list.includes(normalized)) return;
  await writeFollowed([...list, normalized]);
}

export async function unfollowDomain(domain: string): Promise<void> {
  const normalized = domain.toLowerCase();
  const list = await readFollowed();
  await writeFollowed(list.filter((item) => item !== normalized));
}

export async function toggleFollowDomain(domain: string): Promise<boolean> {
  const followed = await isFollowedDomain(domain);
  if (followed) await unfollowDomain(domain);
  else await followDomain(domain);
  return !followed;
}
