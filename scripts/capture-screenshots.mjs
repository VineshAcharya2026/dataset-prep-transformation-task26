import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, '../docs/screenshots');
const base = 'http://127.0.0.1:5173';

async function shot(page, name) {
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(outDir, name), fullPage: true });
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  await page.goto(`${base}/login`, { waitUntil: 'networkidle' });
  await shot(page, '01-login.png');

  await page.fill('input[type="text"], input:not([type="password"])', 'steward');
  await page.fill('input[type="password"]', 'Steward@123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 15000 });

  await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle' });
  await shot(page, '10-dashboard.png');

  await page.goto(`${base}/datasets`, { waitUntil: 'networkidle' });
  await shot(page, '02-dataset-list.png');

  const datasetLink = page.locator('a[href*="/datasets/"]').filter({ hasText: 'View' }).first();
  const href = await datasetLink.getAttribute('href');
  const datasetId = href?.match(/\/datasets\/(\d+)/)?.[1] || '1';

  await page.goto(`${base}/datasets/${datasetId}`, { waitUntil: 'networkidle' });
  await shot(page, '03-dataset-details.png');

  await page.goto(`${base}/datasets/${datasetId}/preview`, { waitUntil: 'networkidle' });
  await shot(page, '04-dataset-preview.png');

  await page.goto(`${base}/datasets/${datasetId}/prepare`, { waitUntil: 'networkidle' });
  await shot(page, '05-transformation-builder.png');

  await page.goto(`${base}/datasets/${datasetId}/transform-preview`, { waitUntil: 'networkidle' });
  await shot(page, '06-transformation-preview.png');

  await page.goto(`${base}/datasets/${datasetId}/validate`, { waitUntil: 'networkidle' });
  await shot(page, '07-validation-results.png');

  await page.goto(`${base}/datasets/${datasetId}/versions`, { waitUntil: 'networkidle' });
  await shot(page, '08-prepared-versions.png');

  await page.goto(`${base}/history`, { waitUntil: 'networkidle' });
  await shot(page, '09-transformation-history.png');

  await browser.close();
  console.log('Screenshots saved to', outDir);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
