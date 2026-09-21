import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

export async function ensureDataDirs() {
  await fs.mkdir(path.join(env.dataDir, 'datasets'), { recursive: true });
  await fs.mkdir(path.join(env.dataDir, 'versions'), { recursive: true });
}

export async function readDatasetFile(relativePath) {
  const full = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(env.dataDir, relativePath);
  const raw = await fs.readFile(full, 'utf-8');
  return JSON.parse(raw);
}

export async function writeDatasetFile(relativePath, data) {
  const full = path.join(env.dataDir, relativePath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, JSON.stringify(data, null, 2), 'utf-8');
  return relativePath;
}

export async function copyDatasetSnapshot(sourceRelative, destRelative) {
  const data = await readDatasetFile(sourceRelative);
  await writeDatasetFile(destRelative, data);
  return data;
}

export function cloneRows(rows) {
  return rows.map((r) => ({ ...r }));
}
