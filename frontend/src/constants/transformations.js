export const TRANSFORM_TYPES = [
  { value: 'RENAME_COLUMN', label: 'Rename Column', needsColumn: true, fields: ['newName'] },
  { value: 'REMOVE_COLUMN', label: 'Remove Column', needsColumn: true },
  { value: 'CHANGE_DATA_TYPE', label: 'Change Data Type', needsColumn: true, fields: ['targetType'] },
  { value: 'REMOVE_NULL_ROWS', label: 'Remove Null Rows', needsColumn: true },
  { value: 'REPLACE_NULL', label: 'Replace Null Values', needsColumn: true, fields: ['fillValue'] },
  { value: 'TRIM_WHITESPACE', label: 'Trim Whitespace', needsColumn: true },
  { value: 'UPPERCASE', label: 'Uppercase', needsColumn: true },
  { value: 'LOWERCASE', label: 'Lowercase', needsColumn: true },
  { value: 'ROUND_DECIMAL', label: 'Round Decimal', needsColumn: true, fields: ['decimals'] },
  { value: 'ADD_NUMERIC', label: 'Add Numeric Value', needsColumn: true, fields: ['operand'] },
  { value: 'MULTIPLY_NUMERIC', label: 'Multiply Numeric Value', needsColumn: true, fields: ['operand'] },
  { value: 'REMOVE_DUPLICATES', label: 'Remove Duplicate Rows' },
  { value: 'FILTER_ROWS', label: 'Filter Rows', fields: ['filterColumn', 'operator', 'value'] },
];

export const DATA_TYPES = ['String', 'Integer', 'Decimal', 'Boolean', 'Date'];
export const FILTER_OPS = [
  { value: 'eq', label: 'Equals' },
  { value: 'ne', label: 'Not equals' },
  { value: 'gt', label: 'Greater than' },
  { value: 'gte', label: 'Greater or equal' },
  { value: 'lt', label: 'Less than' },
  { value: 'lte', label: 'Less or equal' },
  { value: 'contains', label: 'Contains' },
];
