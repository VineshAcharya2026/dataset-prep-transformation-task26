import { AppError, ErrorCodes } from '../utils/errors.js';

const OPERATORS = {
  eq: (a, b) => String(a) === String(b),
  ne: (a, b) => String(a) !== String(b),
  gt: (a, b) => Number(a) > Number(b),
  gte: (a, b) => Number(a) >= Number(b),
  lt: (a, b) => Number(a) < Number(b),
  lte: (a, b) => Number(a) <= Number(b),
  contains: (a, b) => String(a ?? '').toLowerCase().includes(String(b).toLowerCase()),
};

function isNullish(v) {
  return v === null || v === undefined || v === '';
}

function castValue(value, targetType) {
  if (isNullish(value)) return null;
  switch (targetType) {
    case 'String':
      return String(value);
    case 'Integer': {
      const n = parseInt(String(value).trim(), 10);
      if (Number.isNaN(n)) throw new AppError(ErrorCodes.TYPE_CONVERSION, `Cannot convert "${value}" to Integer`);
      return n;
    }
    case 'Decimal': {
      const n = parseFloat(String(value).trim());
      if (Number.isNaN(n)) throw new AppError(ErrorCodes.TYPE_CONVERSION, `Cannot convert "${value}" to Decimal`);
      return n;
    }
    case 'Boolean': {
      const s = String(value).toLowerCase().trim();
      if (['true', '1', 'yes'].includes(s)) return true;
      if (['false', '0', 'no'].includes(s)) return false;
      throw new AppError(ErrorCodes.TYPE_CONVERSION, `Cannot convert "${value}" to Boolean`);
    }
    case 'Date': {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) throw new AppError(ErrorCodes.TYPE_CONVERSION, `Cannot convert "${value}" to Date`);
      return d.toISOString().slice(0, 10);
    }
    default:
      throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Unknown target type: ${targetType}`);
  }
}

function inferType(values) {
  const sample = values.filter((v) => !isNullish(v)).slice(0, 50);
  if (sample.length === 0) return 'String';
  if (sample.every((v) => ['true', 'false', true, false, 0, 1].includes(v) || /^true|false$/i.test(String(v)))) {
    return 'Boolean';
  }
  if (sample.every((v) => !Number.isNaN(parseInt(String(v), 10)) && String(parseInt(String(v), 10)) === String(v).trim())) {
    return 'Integer';
  }
  if (sample.every((v) => !Number.isNaN(parseFloat(String(v))))) return 'Decimal';
  if (sample.every((v) => !Number.isNaN(new Date(v).getTime()) && String(v).includes('-'))) return 'Date';
  return 'String';
}

export function buildColumnStats(rows, columns) {
  return columns.map((col) => {
    const values = rows.map((r) => r[col]);
    const nullCount = values.filter((v) => isNullish(v)).length;
    const unique = new Set(values.filter((v) => !isNullish(v)).map(String));
    return {
      name: col,
      dataType: inferType(values),
      nullCount,
      uniqueCount: unique.size,
    };
  });
}

function applyStep(rows, columns, step, stats) {
  const type = step.transformation_type || step.type;
  const config = typeof step.configuration === 'string' ? JSON.parse(step.configuration) : step.configuration || {};
  const column = step.column_name || config.column;

  switch (type) {
    case 'RENAME_COLUMN': {
      const newName = config.newName;
      if (!column || !newName) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Rename requires column and newName');
      if (!columns.includes(column)) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Column not found: ${column}`);
      if (columns.includes(newName) && newName !== column) {
        throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Column already exists: ${newName}`);
      }
      rows.forEach((r) => {
        r[newName] = r[column];
        delete r[column];
      });
      const idx = columns.indexOf(column);
      columns[idx] = newName;
      break;
    }
    case 'REMOVE_COLUMN': {
      if (!column) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Remove column requires column name');
      if (!columns.includes(column)) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Column not found: ${column}`);
      rows.forEach((r) => delete r[column]);
      columns.splice(columns.indexOf(column), 1);
      break;
    }
    case 'CHANGE_DATA_TYPE': {
      const targetType = config.targetType;
      if (!column || !targetType) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Change type requires column and targetType');
      rows.forEach((r) => {
        const before = r[column];
        const after = castValue(before, targetType);
        if (String(before) !== String(after)) stats.modifiedValues += 1;
        r[column] = after;
      });
      break;
    }
    case 'REMOVE_NULL_ROWS': {
      const before = rows.length;
      const filtered = rows.filter((r) => !isNullish(r[column]));
      stats.removedRows += before - filtered.length;
      rows.length = 0;
      rows.push(...filtered);
      break;
    }
    case 'REPLACE_NULL': {
      const fillValue = config.fillValue ?? '';
      rows.forEach((r) => {
        if (isNullish(r[column])) {
          r[column] = fillValue;
          stats.modifiedValues += 1;
        }
      });
      break;
    }
    case 'TRIM_WHITESPACE':
      rows.forEach((r) => {
        if (typeof r[column] === 'string') {
          const t = r[column].trim();
          if (t !== r[column]) stats.modifiedValues += 1;
          r[column] = t;
        }
      });
      break;
    case 'UPPERCASE':
      rows.forEach((r) => {
        if (r[column] != null) {
          const u = String(r[column]).toUpperCase();
          if (u !== r[column]) stats.modifiedValues += 1;
          r[column] = u;
        }
      });
      break;
    case 'LOWERCASE':
      rows.forEach((r) => {
        if (r[column] != null) {
          const l = String(r[column]).toLowerCase();
          if (l !== r[column]) stats.modifiedValues += 1;
          r[column] = l;
        }
      });
      break;
    case 'ROUND_DECIMAL': {
      const decimals = config.decimals ?? 2;
      rows.forEach((r) => {
        const n = parseFloat(r[column]);
        if (!Number.isNaN(n)) {
          const rounded = parseFloat(n.toFixed(decimals));
          if (rounded !== n) stats.modifiedValues += 1;
          r[column] = rounded;
        }
      });
      break;
    }
    case 'ADD_NUMERIC': {
      const operand = Number(config.operand ?? 0);
      rows.forEach((r) => {
        const n = parseFloat(r[column]);
        if (!Number.isNaN(n)) {
          r[column] = n + operand;
          stats.modifiedValues += 1;
        }
      });
      break;
    }
    case 'MULTIPLY_NUMERIC': {
      const operand = Number(config.operand ?? 1);
      rows.forEach((r) => {
        const n = parseFloat(r[column]);
        if (!Number.isNaN(n)) {
          r[column] = n * operand;
          stats.modifiedValues += 1;
        }
      });
      break;
    }
    case 'REMOVE_DUPLICATES': {
      const seen = new Set();
      const unique = [];
      for (const row of rows) {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          unique.push(row);
        }
      }
      stats.removedRows += rows.length - unique.length;
      rows.length = 0;
      rows.push(...unique);
      break;
    }
    case 'FILTER_ROWS': {
      const { filterColumn, operator, value } = config;
      const col = filterColumn || column;
      const op = OPERATORS[operator];
      if (!col || !op) throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, 'Filter requires filterColumn and operator');
      const before = rows.length;
      const filtered = rows.filter((r) => op(r[col], value));
      if (filtered.length === 0) {
        throw new AppError(ErrorCodes.EMPTY_RESULT, 'Filter removed all rows');
      }
      stats.removedRows += before - filtered.length;
      rows.length = 0;
      rows.push(...filtered);
      break;
    }
    default:
      throw new AppError(ErrorCodes.INVALID_TRANSFORMATION, `Unknown transformation type: ${type}`);
  }
}

export function runPipeline(originalRows, originalColumns, steps) {
  const rows = originalRows.map((r) => ({ ...r }));
  const columns = [...originalColumns];
  const stats = { modifiedValues: 0, removedRows: 0 };
  const sorted = [...steps].sort((a, b) => (a.execution_order ?? 0) - (b.execution_order ?? 0));

  for (const step of sorted) {
    try {
      applyStep(rows, columns, step, stats);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError(ErrorCodes.TRANSFORMATION_FAILED, err.message || 'Transformation failed');
    }
  }

  return { rows, columns, stats };
}

export function samplePreview(beforeRows, afterRows, beforeCols, afterCols, limit = 20) {
  return {
    before: {
      columns: beforeCols,
      rows: beforeRows.slice(0, limit),
    },
    after: {
      columns: afterCols,
      rows: afterRows.slice(0, limit),
    },
  };
}
