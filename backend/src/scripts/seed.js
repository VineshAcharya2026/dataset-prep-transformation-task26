import bcrypt from 'bcryptjs';
import * as db from '../db/index.js';
import { writeDatasetFile, ensureDataDirs } from '../services/dataStorage.js';
import { ensureDefaultConfigs } from '../services/transformConfigService.js';

const users = [
  { username: 'admin', email: 'admin@example.com', password: 'Admin@123', full_name: 'System Administrator', role: 'ADMIN' },
  { username: 'steward', email: 'steward@example.com', password: 'Steward@123', full_name: 'Data Steward', role: 'DATA_STEWARD' },
  { username: 'analyst', email: 'analyst@example.com', password: 'Analyst@123', full_name: 'Data Analyst', role: 'DATA_ANALYST' },
];

const datasets = [
  {
    name: 'Customer Transactions',
    description: 'Retail transaction records',
    file_name: 'customer_transactions.csv',
    file_type: 'CSV',
    status: 'PROCESSED',
    quality_score: 92.5,
    rows: [
      { customer_name: ' John Smith ', city: 'Boston', amount: '100.456', active: 'true', order_date: '2024-01-15' },
      { customer_name: 'Jane Doe', city: null, amount: '250.00', active: 'true', order_date: '2024-02-20' },
      { customer_name: 'John Smith', city: 'Boston', amount: '100.456', active: 'true', order_date: '2024-01-15' },
      { customer_name: 'Bob Lee', city: 'Chicago', amount: '75.5', active: 'false', order_date: '2024-03-01' },
      { customer_name: 'Alice Wu', city: 'Seattle', amount: '320.789', active: 'true', order_date: '2024-03-10' },
    ],
  },
  {
    name: 'Customer Master',
    description: 'Customer demographic data',
    file_name: 'customers.csv',
    file_type: 'CSV',
    status: 'PROCESSED',
    quality_score: 88.0,
    rows: [
      { id: '1', name: 'John Smith', email: 'john@mail.com', segment: 'Premium' },
      { id: '2', name: 'Jane Doe', email: 'jane@mail.com', segment: 'Standard' },
      { id: '3', name: 'Bob Lee', email: null, segment: 'Standard' },
    ],
  },
  {
    name: 'Product Catalog',
    description: 'Product listing',
    file_name: 'products.csv',
    file_type: 'CSV',
    status: 'PROCESSED',
    quality_score: 95.2,
    rows: [
      { sku: 'P001', product_name: 'Widget A', price: '19.99', in_stock: 'true' },
      { sku: 'P002', product_name: 'Widget B', price: '29.50', in_stock: 'true' },
      { sku: 'P003', product_name: 'Gadget C', price: '99.00', in_stock: 'false' },
    ],
  },
  {
    name: 'Inventory Snapshot',
    description: 'Warehouse inventory levels',
    file_name: 'inventory.csv',
    file_type: 'CSV',
    status: 'PROCESSED',
    quality_score: 90.0,
    rows: [
      { warehouse: 'WH1', sku: 'P001', quantity: '500' },
      { warehouse: 'WH1', sku: 'P002', quantity: '120' },
      { warehouse: 'WH2', sku: 'P001', quantity: '80' },
    ],
  },
  {
    name: 'Sales Pipeline',
    description: 'CRM pipeline export — still processing',
    file_name: 'pipeline.csv',
    file_type: 'CSV',
    status: 'PROCESSING',
    quality_score: null,
    rows: [{ deal: 'Acme Corp', stage: 'Proposal', value: '50000' }],
  },
];

async function seed() {
  await ensureDataDirs();
  await ensureDefaultConfigs();

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.upsertUser({
      username: u.username,
      email: u.email,
      password_hash: hash,
      full_name: u.full_name,
      role: u.role,
    });
  }

  const admin = await db.getUserByUsername('admin');
  const count = await db.countInTable('datasets');
  if (count > 0) {
    console.log('Datasets already seeded, skipping.');
    process.exit(0);
  }

  for (let i = 0; i < datasets.length; i++) {
    const ds = datasets[i];
    const columns = Object.keys(ds.rows[0] || {});
    const filePath = `datasets/dataset-${i + 1}.json`;
    await writeDatasetFile(filePath, { columns, rows: ds.rows });

    const { insertId: datasetId } = await db.insertDataset({
      name: ds.name,
      description: ds.description,
      file_name: ds.file_name,
      file_type: ds.file_type,
      row_count: ds.rows.length,
      column_count: columns.length,
      status: ds.status,
      quality_score: ds.quality_score,
      data_file_path: filePath,
      created_by: admin.id,
    });

    if (ds.status === 'PROCESSED') {
      const vPath = `versions/${datasetId}-v1.json`;
      await writeDatasetFile(vPath, { columns, rows: ds.rows });
      await db.insertVersion({
        dataset_id: datasetId,
        version_number: 1,
        version_name: 'Version 1 – Original',
        description: 'Baseline imported dataset',
        row_count: ds.rows.length,
        column_count: columns.length,
        data_file_path: vPath,
        created_by: admin.id,
        status: 'ACTIVE',
      });
    }
  }

  console.log('Seed completed.');
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
