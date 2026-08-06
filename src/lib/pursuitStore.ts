import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Pursuit } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "pursuits.json");

async function readAll(): Promise<Pursuit[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as Pursuit[];
  } catch {
    return [];
  }
}

async function writeAll(pursuits: Pursuit[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(pursuits, null, 2), {
    encoding: "utf8",
    mode: 0o600,
  });
}

export async function listPursuits(): Promise<Pursuit[]> {
  return readAll();
}

export async function getPursuit(id: string): Promise<Pursuit | null> {
  return (await readAll()).find((pursuit) => pursuit.id === id) ?? null;
}

export async function savePursuit(pursuit: Pursuit): Promise<void> {
  const pursuits = await readAll();
  const index = pursuits.findIndex((item) => item.id === pursuit.id);
  if (index < 0) pursuits.unshift(pursuit);
  else pursuits[index] = pursuit;
  await writeAll(pursuits.slice(0, 25));
}

export async function clearPursuits(): Promise<void> {
  await writeAll([]);
}

export async function patchPursuit(
  id: string,
  patch: Partial<Pursuit>,
): Promise<Pursuit | null> {
  const pursuits = await readAll();
  const index = pursuits.findIndex((item) => item.id === id);
  if (index < 0) return null;
  pursuits[index] = {
    ...pursuits[index],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await writeAll(pursuits);
  return pursuits[index];
}

export async function saveMonitorSecret(
  monitorId: string,
  secret: string,
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `monitor-${monitorId}.secret`),
    secret,
    { encoding: "utf8", mode: 0o600 },
  );
}

export async function getMonitorSecret(
  monitorId: string,
): Promise<string | null> {
  try {
    return await fs.readFile(
      path.join(DATA_DIR, `monitor-${monitorId}.secret`),
      "utf8",
    );
  } catch {
    return null;
  }
}
