import * as db from '../db/index.js';
import { readDatasetFile } from './dataStorage.js';
import { buildColumnStats } from './transformationEngine.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

export async function getDatasetById(id) {
  const dataset = await db.getDataset(id);
  if (!dataset) throw new AppError(ErrorCodes.NOT_FOUND, 'Dataset not found', 404);
  return dataset;
}

export function assertProcessed(dataset) {
  if (dataset.status !== 'PROCESSED') {
    throw new AppError(ErrorCodes.NOT_PROCESSED, 'Only processed datasets can be prepared for transformation', 400);
  }
}

export async function listDatasets(opts) {
  return db.listDatasetsQuery(opts);
}

export async function loadDatasetPayload(dataset, versionId = null) {
  let filePath = dataset.data_file_path;
  if (versionId) {
    filePath = await db.getVersionFilePath(versionId, dataset.id);
    if (!filePath) throw new AppError(ErrorCodes.NOT_FOUND, 'Version not found', 404);
  }
  return readDatasetFile(filePath);
}

export async function getPreview(datasetId, versionId = null) {
  const dataset = await getDatasetById(datasetId);
  const payload = await loadDatasetPayload(dataset, versionId);
  const rows = payload.rows || [];
  const columns = payload.columns || (rows[0] ? Object.keys(rows[0]) : []);
  const columnStats = buildColumnStats(rows, columns);
  return {
    dataset: {
      id: dataset.id,
      name: dataset.name,
      status: dataset.status,
      row_count: rows.length,
      column_count: columns.length,
    },
    columns: columnStats,
    records: rows.slice(0, 20),
  };
}
