import fs from 'fs/promises';
import path from 'path';
import { env } from '../config/env.js';

const STORE_PATH = path.join(env.dataDir, 'store.json');

const defaultStore = () => ({
  users: [],
  datasets: [],
  dataset_versions: [],
  transformation_configs: [],
  transformations: [],
  transformation_history: [],
  validation_results: [],
  _counters: {
    users: 0,
    datasets: 0,
    dataset_versions: 0,
    transformation_configs: 0,
    transformations: 0,
    transformation_history: 0,
    validation_results: 0,
  },
});

let cache = null;

export async function loadStore() {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(STORE_PATH, 'utf-8');
    cache = JSON.parse(raw);
  } catch {
    cache = defaultStore();
    await saveStore();
  }
  return cache;
}

export async function saveStore() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(cache, null, 2), 'utf-8');
}

export async function nextId(table) {
  const store = await loadStore();
  store._counters[table] = (store._counters[table] || 0) + 1;
  return store._counters[table];
}

export function resetCacheForTests() {
  cache = null;
}
