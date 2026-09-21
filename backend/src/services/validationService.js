function isNullish(v) {
  return v === null || v === undefined || v === '';
}

function rowKey(row) {
  return JSON.stringify(row);
}

export function validateDataset(rows, columns, columnTypes = {}) {
  const duplicateKeys = new Map();
  let nullValues = 0;
  let invalidRecords = 0;
  const typeIssues = [];
  const requiredIssues = [];

  const requiredColumns = columns.filter((c) => c && c.trim().length > 0);

  rows.forEach((row, idx) => {
    let rowInvalid = false;

    for (const col of requiredColumns) {
      if (isNullish(row[col])) {
        nullValues += 1;
        rowInvalid = true;
        if (requiredIssues.length < 20) {
          requiredIssues.push({ row: idx + 1, column: col, issue: 'Required value missing' });
        }
      }
    }

    for (const col of columns) {
      const expected = columnTypes[col];
      const val = row[col];
      if (isNullish(val) || !expected) continue;
      let ok = true;
      switch (expected) {
        case 'Integer':
          ok = Number.isInteger(Number(val)) && !Number.isNaN(Number(val));
          break;
        case 'Decimal':
          ok = !Number.isNaN(parseFloat(val));
          break;
        case 'Boolean':
          ok = typeof val === 'boolean' || /^(true|false|0|1)$/i.test(String(val));
          break;
        case 'Date':
          ok = !Number.isNaN(new Date(val).getTime());
          break;
        default:
          ok = true;
      }
      if (!ok) {
        rowInvalid = true;
        if (typeIssues.length < 20) {
          typeIssues.push({ row: idx + 1, column: col, value: val, expectedType: expected });
        }
      }
    }

    const key = rowKey(row);
    duplicateKeys.set(key, (duplicateKeys.get(key) || 0) + 1);
    if (rowInvalid) invalidRecords += 1;
  });

  let duplicateRecords = 0;
  duplicateKeys.forEach((count) => {
    if (count > 1) duplicateRecords += count - 1;
  });

  let validationStatus = 'PASSED';
  if (typeIssues.length > 0 || requiredIssues.some((i) => i.issue.includes('Required'))) {
    validationStatus = 'FAILED';
  } else if (nullValues > 0 || duplicateRecords > 0) {
    validationStatus = 'WARNING';
  }

  const validRecords = rows.length - invalidRecords;

  return {
    total_records: rows.length,
    valid_records: validRecords,
    invalid_records: invalidRecords,
    null_values: nullValues,
    duplicate_records: duplicateRecords,
    validation_status: validationStatus,
    details: { typeIssues, requiredIssues },
  };
}
