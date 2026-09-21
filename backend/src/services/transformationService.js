import * as db from '../db/index.js';
import { getDatasetById, assertProcessed, loadDatasetPayload } from './datasetService.js';
import { writeDatasetFile } from './dataStorage.js';
import { runPipeline, samplePreview, buildColumnStats } from './transformationEngine.js';
import { validateDataset } from './validationService.js';
import { assertTransformAllowed } from './transformConfigService.js';
import { AppError, ErrorCodes } from '../utils/errors.js';
import { v4 as uuidv4 } from 'uuid';

export async function listDraftTransformations(datasetId) {
  const rows = await db.listDraftTransformations(datasetId);
  return rows.map(parseTransformRow);
}

function parseTransformRow(r) {
  return {
    ...r,
    configuration: typeof r.configuration === 'string' ? JSON.parse(r.configuration) : r.configuration,
  };
}

export async function addTransformation(datasetId, userId, userRole, body) {
  const dataset = await getDatasetById(datasetId);
  assertProcessed(dataset);
  await assertTransformAllowed(userRole, body.transformation_type);

  const maxOrder = await db.maxTransformOrder(datasetId);
  const order = body.execution_order ?? maxOrder + 1;

  const { insertId } = await db.insertTransformation({
    dataset_id: Number(datasetId),
    version_id: null,
    transformation_type: body.transformation_type,
    column_name: body.column_name || body.configuration?.column || null,
    configuration: body.configuration || {},
    execution_order: order,
    created_by: userId,
  });
  const row = await db.getTransformation(insertId);
  return parseTransformRow(row);
}

export async function updateTransformation(id, userId, userRole, body) {
  const row = await db.getTransformation(id);
  if (!row) throw new AppError(ErrorCodes.NOT_FOUND, 'Transformation not found', 404);
  if (row.version_id) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Cannot edit saved version transformations');
  const type = body.transformation_type || row.transformation_type;
  await assertTransformAllowed(userRole, type);

  const updated = await db.updateTransformation(id, {
    transformation_type: type,
    column_name: body.column_name ?? row.column_name,
    configuration: body.configuration ?? (typeof row.configuration === 'string' ? JSON.parse(row.configuration) : row.configuration),
    execution_order: body.execution_order ?? row.execution_order,
  });
  return parseTransformRow(updated);
}

export async function deleteTransformation(id) {
  const row = await db.getTransformation(id);
  if (!row) throw new AppError(ErrorCodes.NOT_FOUND, 'Transformation not found', 404);
  if (row.version_id) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Cannot delete saved version transformations');
  await db.deleteTransformation(id);
}

export async function reorderTransformations(datasetId, orderedIds) {
  await db.reorderDraftTransformations(datasetId, orderedIds);
  return listDraftTransformations(datasetId);
}

async function getStepsForPreview(datasetId, inlineSteps) {
  if (inlineSteps?.length) return inlineSteps;
  return listDraftTransformations(datasetId);
}

export async function previewTransformations(datasetId, inlineSteps = null, baseVersionId = null) {
  const dataset = await getDatasetById(datasetId);
  assertProcessed(dataset);
  const payload = await loadDatasetPayload(dataset, baseVersionId);
  const beforeRows = payload.rows || [];
  const beforeCols = payload.columns || (beforeRows[0] ? Object.keys(beforeRows[0]) : []);
  const steps = await getStepsForPreview(datasetId, inlineSteps);

  const { rows: afterRows, columns: afterCols, stats } = runPipeline(beforeRows, beforeCols, steps);

  return {
    originalRecordCount: beforeRows.length,
    updatedRecordCount: afterRows.length,
    originalColumnCount: beforeCols.length,
    updatedColumnCount: afterCols.length,
    modifiedValues: stats.modifiedValues,
    removedRows: stats.removedRows,
    preview: samplePreview(beforeRows, afterRows, beforeCols, afterCols),
    columns: buildColumnStats(afterRows, afterCols),
    records: afterRows.slice(0, 20),
  };
}

export async function validateAfterTransform(datasetId, userId, inlineSteps = null, baseVersionId = null) {
  const dataset = await getDatasetById(datasetId);
  assertProcessed(dataset);
  const payload = await loadDatasetPayload(dataset, baseVersionId);
  const beforeRows = payload.rows || [];
  const beforeCols = payload.columns || (beforeRows[0] ? Object.keys(beforeRows[0]) : []);
  const steps = await getStepsForPreview(datasetId, inlineSteps);
  const { rows, columns } = runPipeline(beforeRows, beforeCols, steps);
  const columnTypes = Object.fromEntries(buildColumnStats(rows, columns).map((c) => [c.name, c.dataType]));
  const result = validateDataset(rows, columns, columnTypes);

  const { insertId } = await db.insertValidation({
    dataset_id: Number(datasetId),
    version_id: null,
    total_records: result.total_records,
    valid_records: result.valid_records,
    invalid_records: result.invalid_records,
    null_values: result.null_values,
    duplicate_records: result.duplicate_records,
    validation_status: result.validation_status,
    details: result.details,
  });

  return { id: insertId, ...result };
}

export async function savePreparedVersion(datasetId, userId, { version_name, description }) {
  const dataset = await getDatasetById(datasetId);
  assertProcessed(dataset);
  const steps = await listDraftTransformations(datasetId);
  if (!steps.length) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Add at least one transformation before saving');

  const payload = await loadDatasetPayload(dataset);
  const beforeRows = payload.rows || [];
  const beforeCols = payload.columns || (beforeRows[0] ? Object.keys(beforeRows[0]) : []);
  const { rows, columns, stats } = runPipeline(beforeRows, beforeCols, steps);
  const columnTypes = Object.fromEntries(buildColumnStats(rows, columns).map((c) => [c.name, c.dataType]));
  const validation = validateDataset(rows, columns, columnTypes);

  const fileName = `versions/${datasetId}-${uuidv4()}.json`;
  await writeDatasetFile(fileName, { columns, rows });

  const versionNumber = (await db.maxVersionNumber(datasetId)) + 1;
  const { insertId: versionId, record: version } = await db.insertVersion({
    dataset_id: Number(datasetId),
    version_number: versionNumber,
    version_name: version_name || `Version ${versionNumber}`,
    description: description || '',
    row_count: rows.length,
    column_count: columns.length,
    data_file_path: fileName,
    created_by: userId,
    status: 'ACTIVE',
  });

  for (const step of steps) {
    const { insertId: tid } = await db.insertTransformation({
      dataset_id: Number(datasetId),
      version_id: versionId,
      transformation_type: step.transformation_type,
      column_name: step.column_name,
      configuration: step.configuration,
      execution_order: step.execution_order,
      created_by: userId,
    });
    await db.insertHistory({
      dataset_id: Number(datasetId),
      version_id: versionId,
      transformation_id: tid,
      transformation_type: step.transformation_type,
      performed_by: userId,
      status: 'SUCCESS',
      records_affected: stats.modifiedValues + stats.removedRows,
    });
  }

  await db.insertValidation({
    dataset_id: Number(datasetId),
    version_id: versionId,
    total_records: validation.total_records,
    valid_records: validation.valid_records,
    invalid_records: validation.invalid_records,
    null_values: validation.null_values,
    duplicate_records: validation.duplicate_records,
    validation_status: validation.validation_status,
    details: validation.details,
  });

  await db.deleteDraftTransformations(datasetId);

  return { version, validation };
}

export async function listVersions(datasetId) {
  return db.listVersions(datasetId);
}

export async function getVersion(datasetId, versionId) {
  const version = await db.getVersion(datasetId, versionId);
  if (!version) throw new AppError(ErrorCodes.NOT_FOUND, 'Version not found', 404);
  const transforms = await db.listVersionTransformations(versionId);
  const validation = await db.getLatestValidationForVersion(versionId);
  return {
    version,
    transformations: transforms.map(parseTransformRow),
    validation: validation
      ? {
          ...validation,
          details: typeof validation.details === 'string' ? JSON.parse(validation.details) : validation.details,
        }
      : null,
  };
}

export async function deleteVersion(versionId) {
  const row = await db.getVersionById(versionId);
  if (!row) throw new AppError(ErrorCodes.NOT_FOUND, 'Version not found', 404);
  if (row.version_number === 1) {
    throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Cannot delete the original baseline version');
  }
  await db.deleteVersionById(versionId);
}

export async function getHistory(datasetId, filters = {}) {
  return db.queryHistory({ ...filters, datasetId }, filters);
}

export async function getGlobalHistory(filters = {}) {
  return db.queryHistory(filters, filters);
}

export async function getValidationResults(datasetId, versionId = null) {
  const rows = await db.listValidationResults(datasetId, versionId);
  return rows.map((r) => ({
    ...r,
    details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details,
  }));
}

export async function getDashboardStats() {
  return db.dashboardStats();
}
