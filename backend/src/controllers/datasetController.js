import * as datasetService from '../services/datasetService.js';

export async function list(req, res, next) {
  try {
    const { search, status, page, pageSize, sort, forTransform } = req.query;
    const data = await datasetService.listDatasets({
      search,
      status,
      page: parseInt(page || '1', 10),
      pageSize: parseInt(pageSize || '10', 10),
      sort: sort || 'updated_at',
      forTransform: forTransform === 'true',
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getById(req, res, next) {
  try {
    const dataset = await datasetService.getDatasetById(req.params.id);
    res.json({ success: true, data: dataset });
  } catch (e) {
    next(e);
  }
}

export async function preview(req, res, next) {
  try {
    const versionId = req.query.versionId || null;
    const data = await datasetService.getPreview(req.params.id, versionId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}
