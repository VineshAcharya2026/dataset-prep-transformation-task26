/**
 * JSON file persistence layer (default when MySQL is unavailable).
 * Schema in sql/schema.sql mirrors these structures for MySQL deployments.
 */
import { loadStore, nextId, saveStore } from './store.js';

export async function getUserByUsername(username) {
  const store = await loadStore();
  return store.users.find((u) => u.username === username) || null;
}

export async function getUserById(id) {
  const store = await loadStore();
  return store.users.find((u) => u.id === Number(id)) || null;
}

export async function upsertUser(user) {
  const store = await loadStore();
  const existing = store.users.find((u) => u.username === user.username);
  if (existing) {
    Object.assign(existing, user);
  } else {
    const id = await nextId('users');
    store.users.push({ id, created_at: new Date().toISOString(), ...user });
  }
  await saveStore();
}

export async function updateUserProfile(id, { full_name, email }) {
  const store = await loadStore();
  const u = store.users.find((x) => x.id === Number(id));
  if (!u) return null;
  if (full_name != null) u.full_name = full_name;
  if (email != null) u.email = email;
  await saveStore();
  return u;
}

export async function countDatasets(where = {}) {
  const store = await loadStore();
  return filterDatasets(store.datasets, where).length;
}

function filterDatasets(list, { search, status, forTransform }) {
  return list.filter((d) => {
    if (forTransform && d.status !== 'PROCESSED') return false;
    if (status && d.status !== status) return false;
    if (search) {
      const s = search.replace(/%/g, '').toLowerCase();
      if (!d.name.toLowerCase().includes(s) && !d.file_name.toLowerCase().includes(s)) return false;
    }
    return true;
  });
}

export async function listDatasetsQuery({ search, status, page = 1, pageSize = 10, sort = 'updated_at', forTransform }) {
  const store = await loadStore();
  let items = filterDatasets(store.datasets, { search, status, forTransform });
  items = items.map((d) => ({
    ...d,
    creator_name: store.users.find((u) => u.id === d.created_by)?.full_name,
  }));
  items.sort((a, b) => new Date(b[sort] || b.updated_at) - new Date(a[sort] || a.updated_at));
  const total = items.length;
  const offset = (page - 1) * pageSize;
  items = items.slice(offset, offset + pageSize);
  return { items, total, page, pageSize };
}

export async function getDataset(id) {
  const store = await loadStore();
  const d = store.datasets.find((x) => x.id === Number(id));
  if (!d) return null;
  return { ...d, creator_name: store.users.find((u) => u.id === d.created_by)?.full_name };
}

export async function insertDataset(row) {
  const store = await loadStore();
  const id = await nextId('datasets');
  const now = new Date().toISOString();
  const record = { id, created_at: now, updated_at: now, ...row };
  store.datasets.push(record);
  await saveStore();
  return { insertId: id, record };
}

export async function countInTable(table) {
  const store = await loadStore();
  return store[table]?.length || 0;
}

export async function getVersionFilePath(versionId, datasetId) {
  const store = await loadStore();
  const v = store.dataset_versions.find((x) => x.id === Number(versionId) && x.dataset_id === Number(datasetId));
  return v?.data_file_path || null;
}

export async function listVersions(datasetId) {
  const store = await loadStore();
  return store.dataset_versions
    .filter((v) => v.dataset_id === Number(datasetId))
    .sort((a, b) => a.version_number - b.version_number)
    .map((v) => ({
      ...v,
      creator_name: store.users.find((u) => u.id === v.created_by)?.full_name,
    }));
}

export async function getVersion(datasetId, versionId) {
  const store = await loadStore();
  const v = store.dataset_versions.find((x) => x.id === Number(versionId) && x.dataset_id === Number(datasetId));
  if (!v) return null;
  return { ...v, creator_name: store.users.find((u) => u.id === v.created_by)?.full_name };
}

export async function maxVersionNumber(datasetId) {
  const store = await loadStore();
  const versions = store.dataset_versions.filter((v) => v.dataset_id === Number(datasetId));
  return versions.reduce((m, v) => Math.max(m, v.version_number), 0);
}

export async function insertVersion(row) {
  const store = await loadStore();
  const id = await nextId('dataset_versions');
  const record = { id, created_at: new Date().toISOString(), status: 'ACTIVE', ...row };
  store.dataset_versions.push(record);
  await saveStore();
  return { insertId: id, record };
}

export async function deleteVersionById(id) {
  const store = await loadStore();
  store.dataset_versions = store.dataset_versions.filter((v) => v.id !== Number(id));
  store.transformations = store.transformations.filter((t) => t.version_id !== Number(id));
  await saveStore();
}

export async function getVersionById(id) {
  const store = await loadStore();
  return store.dataset_versions.find((v) => v.id === Number(id)) || null;
}

export async function listDraftTransformations(datasetId) {
  const store = await loadStore();
  return store.transformations
    .filter((t) => t.dataset_id === Number(datasetId) && t.version_id == null)
    .sort((a, b) => a.execution_order - b.execution_order || a.id - b.id);
}

export async function maxTransformOrder(datasetId) {
  const store = await loadStore();
  const drafts = store.transformations.filter((t) => t.dataset_id === Number(datasetId) && t.version_id == null);
  return drafts.reduce((m, t) => Math.max(m, t.execution_order), 0);
}

export async function insertTransformation(row) {
  const store = await loadStore();
  const id = await nextId('transformations');
  const record = { id, created_at: new Date().toISOString(), ...row };
  store.transformations.push(record);
  await saveStore();
  return { insertId: id, record };
}

export async function getTransformation(id) {
  const store = await loadStore();
  return store.transformations.find((t) => t.id === Number(id)) || null;
}

export async function updateTransformation(id, patch) {
  const store = await loadStore();
  const t = store.transformations.find((x) => x.id === Number(id));
  if (!t) return null;
  Object.assign(t, patch);
  await saveStore();
  return t;
}

export async function deleteTransformation(id) {
  const store = await loadStore();
  store.transformations = store.transformations.filter((t) => t.id !== Number(id));
  await saveStore();
}

export async function reorderDraftTransformations(datasetId, orderedIds) {
  const store = await loadStore();
  orderedIds.forEach((tid, i) => {
    const t = store.transformations.find((x) => x.id === Number(tid) && x.dataset_id === Number(datasetId));
    if (t) t.execution_order = i + 1;
  });
  await saveStore();
}

export async function deleteDraftTransformations(datasetId) {
  const store = await loadStore();
  store.transformations = store.transformations.filter(
    (t) => !(t.dataset_id === Number(datasetId) && t.version_id == null)
  );
  await saveStore();
}

export async function listVersionTransformations(versionId) {
  const store = await loadStore();
  return store.transformations
    .filter((t) => t.version_id === Number(versionId))
    .sort((a, b) => a.execution_order - b.execution_order);
}

export async function insertHistory(row) {
  const store = await loadStore();
  const id = await nextId('transformation_history');
  const record = { id, executed_at: new Date().toISOString(), ...row };
  store.transformation_history.push(record);
  await saveStore();
  return { insertId: id };
}

export async function insertValidation(row) {
  const store = await loadStore();
  const id = await nextId('validation_results');
  const record = { id, created_at: new Date().toISOString(), ...row };
  store.validation_results.push(record);
  await saveStore();
  return { insertId: id, record };
}

export async function listValidationResults(datasetId, versionId = null) {
  const store = await loadStore();
  return store.validation_results
    .filter((v) => {
      if (v.dataset_id !== Number(datasetId)) return false;
      if (versionId != null && v.version_id !== Number(versionId)) return false;
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 10);
}

export async function getLatestValidationForVersion(versionId) {
  const store = await loadStore();
  const list = store.validation_results
    .filter((v) => v.version_id === Number(versionId))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return list[0] || null;
}

function filterHistory(list, store, filters) {
  const { datasetId, search, status, type, from, to } = filters;
  return list.filter((h) => {
    if (datasetId != null && h.dataset_id !== Number(datasetId)) return false;
    if (status && h.status !== status) return false;
    if (type && h.transformation_type !== type) return false;
    if (from && new Date(h.executed_at) < new Date(from)) return false;
    if (to && new Date(h.executed_at) > new Date(to)) return false;
    if (search) {
      const s = search.replace(/%/g, '').toLowerCase();
      const dname = store.datasets.find((d) => d.id === h.dataset_id)?.name?.toLowerCase() || '';
      const performer = store.users.find((u) => u.id === h.performed_by)?.full_name?.toLowerCase() || '';
      if (!h.transformation_type.toLowerCase().includes(s) && !dname.includes(s) && !performer.includes(s)) return false;
    }
    return true;
  });
}

export async function queryHistory(filters, { page = 1, pageSize = 10 } = {}) {
  const store = await loadStore();
  let items = filterHistory(store.transformation_history, store, filters);
  items = items.map((h) => ({
    ...h,
    performer_name: store.users.find((u) => u.id === h.performed_by)?.full_name,
    dataset_name: store.datasets.find((d) => d.id === h.dataset_id)?.name,
    version_name: store.dataset_versions.find((v) => v.id === h.version_id)?.version_name,
    version_number: store.dataset_versions.find((v) => v.id === h.version_id)?.version_number,
  }));
  items.sort((a, b) => new Date(b.executed_at) - new Date(a.executed_at));
  const total = items.length;
  items = items.slice((page - 1) * pageSize, page * pageSize);
  return { items, total, page, pageSize };
}

export async function listTransformConfigs() {
  const store = await loadStore();
  return [...store.transformation_configs].sort((a, b) => a.display_name.localeCompare(b.display_name));
}

export async function upsertTransformConfig(cfg) {
  const store = await loadStore();
  const existing = store.transformation_configs.find((c) => c.transformation_type === cfg.transformation_type);
  if (existing) return existing;
  const id = await nextId('transformation_configs');
  const record = { id, enabled: 1, updated_at: new Date().toISOString(), ...cfg };
  store.transformation_configs.push(record);
  await saveStore();
  return record;
}

export async function updateTransformConfig(id, { enabled, allowed_roles }) {
  const store = await loadStore();
  const c = store.transformation_configs.find((x) => x.id === Number(id));
  if (!c) return null;
  if (enabled != null) c.enabled = enabled ? 1 : 0;
  if (allowed_roles) c.allowed_roles = allowed_roles;
  c.updated_at = new Date().toISOString();
  await saveStore();
  return c;
}

export async function getTransformConfigByType(type) {
  const store = await loadStore();
  return store.transformation_configs.find((c) => c.transformation_type === type) || null;
}

export async function dashboardStats() {
  const store = await loadStore();
  const history = store.transformation_history;
  const byType = {};
  history.forEach((h) => {
    byType[h.transformation_type] = (byType[h.transformation_type] || 0) + 1;
  });
  const activityMap = {};
  history.forEach((h) => {
    const day = h.executed_at.slice(0, 10);
    activityMap[day] = (activityMap[day] || 0) + 1;
  });
  const success = history.filter((h) => h.status === 'SUCCESS').length;
  const failed = history.filter((h) => h.status === 'FAILED').length;
  const prepared = store.dataset_versions.filter((v) => v.version_number > 1).length;
  const records = history.reduce((s, h) => s + (h.records_affected || 0), 0);
  return {
    summary: {
      totalDatasets: store.datasets.length,
      preparedDatasets: prepared,
      transformationRuns: history.length,
      successfulTransformations: success,
      failedTransformations: failed,
      recordsProcessed: records,
    },
    charts: {
      transformationsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
      successVsFailed: [
        { name: 'Success', value: success },
        { name: 'Failed', value: failed },
      ],
      activity: Object.entries(activityMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([day, runs]) => ({ day, runs })),
      recordsProcessed: records,
    },
  };
}

export async function withTransaction(fn) {
  return fn();
}
