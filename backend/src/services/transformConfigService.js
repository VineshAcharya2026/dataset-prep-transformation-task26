import * as db from '../db/index.js';
import { AppError, ErrorCodes } from '../utils/errors.js';

const DEFAULT_CONFIGS = [
  { transformation_type: 'RENAME_COLUMN', display_name: 'Rename Column', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'REMOVE_COLUMN', display_name: 'Remove Column', allowed_roles: ['ADMIN', 'DATA_STEWARD'] },
  { transformation_type: 'CHANGE_DATA_TYPE', display_name: 'Change Data Type', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'REMOVE_NULL_ROWS', display_name: 'Remove Null Rows', allowed_roles: ['ADMIN', 'DATA_STEWARD'] },
  { transformation_type: 'REPLACE_NULL', display_name: 'Replace Null Values', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'TRIM_WHITESPACE', display_name: 'Trim Whitespace', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'UPPERCASE', display_name: 'Uppercase', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'LOWERCASE', display_name: 'Lowercase', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'ROUND_DECIMAL', display_name: 'Round Decimal', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'ADD_NUMERIC', display_name: 'Add Numeric Value', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'MULTIPLY_NUMERIC', display_name: 'Multiply Numeric Value', allowed_roles: ['ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'] },
  { transformation_type: 'REMOVE_DUPLICATES', display_name: 'Remove Duplicate Rows', allowed_roles: ['ADMIN', 'DATA_STEWARD'] },
  { transformation_type: 'FILTER_ROWS', display_name: 'Filter Rows', allowed_roles: ['ADMIN', 'DATA_STEWARD'] },
];

export async function ensureDefaultConfigs() {
  for (const cfg of DEFAULT_CONFIGS) {
    await db.upsertTransformConfig({
      transformation_type: cfg.transformation_type,
      display_name: cfg.display_name,
      allowed_roles: cfg.allowed_roles,
      enabled: 1,
    });
  }
}

export async function listConfigs() {
  const rows = await db.listTransformConfigs();
  return rows.map((r) => ({
    ...r,
    allowed_roles: typeof r.allowed_roles === 'string' ? JSON.parse(r.allowed_roles) : r.allowed_roles,
  }));
}

export async function assertTransformAllowed(userRole, transformationType) {
  const cfg = await db.getTransformConfigByType(transformationType);
  if (!cfg) {
    throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Unknown transformation: ${transformationType}`);
  }
  if (!cfg.enabled) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'This transformation type is disabled');
  }
  const roles = typeof cfg.allowed_roles === 'string' ? JSON.parse(cfg.allowed_roles) : cfg.allowed_roles;
  if (!roles.includes(userRole)) {
    throw new AppError(ErrorCodes.FORBIDDEN, 'Your role cannot apply this transformation');
  }
}

export async function updateConfig(id, { enabled, allowed_roles }) {
  await db.updateTransformConfig(id, { enabled: enabled ? 1 : 0, allowed_roles });
}
