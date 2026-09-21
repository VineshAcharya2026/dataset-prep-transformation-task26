import * as transformationService from '../services/transformationService.js';
import * as transformConfigService from '../services/transformConfigService.js';

export async function list(req, res, next) {
  try {
    const data = await transformationService.listDraftTransformations(req.params.id, req.user.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const data = await transformationService.addTransformation(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const data = await transformationService.updateTransformation(
      req.params.id,
      req.user.id,
      req.user.role,
      req.body
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    await transformationService.deleteTransformation(req.params.id);
    res.json({ success: true, message: 'Transformation deleted' });
  } catch (e) {
    next(e);
  }
}

export async function reorder(req, res, next) {
  try {
    const { orderedIds } = req.body;
    const data = await transformationService.reorderTransformations(req.params.id, orderedIds);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function preview(req, res, next) {
  try {
    const { steps, versionId } = req.body;
    const data = await transformationService.previewTransformations(req.params.id, steps, versionId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function validate(req, res, next) {
  try {
    const { steps, versionId } = req.body;
    const data = await transformationService.validateAfterTransform(
      req.params.id,
      req.user.id,
      steps,
      versionId
    );
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function validationResults(req, res, next) {
  try {
    const versionId = req.query.versionId || null;
    const data = await transformationService.getValidationResults(req.params.id, versionId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listVersions(req, res, next) {
  try {
    const data = await transformationService.listVersions(req.params.id);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function createVersion(req, res, next) {
  try {
    const data = await transformationService.savePreparedVersion(req.params.id, req.user.id, req.body);
    res.status(201).json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function getVersion(req, res, next) {
  try {
    const data = await transformationService.getVersion(req.params.id, req.params.versionId);
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function deleteVersion(req, res, next) {
  try {
    await transformationService.deleteVersion(req.params.versionId);
    res.json({ success: true, message: 'Version deleted' });
  } catch (e) {
    next(e);
  }
}

export async function history(req, res, next) {
  try {
    const data = await transformationService.getHistory(req.params.id, {
      search: req.query.search,
      status: req.query.status,
      type: req.query.type,
      from: req.query.from,
      to: req.query.to,
      page: parseInt(req.query.page || '1', 10),
      pageSize: parseInt(req.query.pageSize || '10', 10),
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function globalHistory(req, res, next) {
  try {
    const data = await transformationService.getGlobalHistory({
      search: req.query.search,
      status: req.query.status,
      type: req.query.type,
      from: req.query.from,
      to: req.query.to,
      page: parseInt(req.query.page || '1', 10),
      pageSize: parseInt(req.query.pageSize || '10', 10),
    });
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function dashboard(req, res, next) {
  try {
    const data = await transformationService.getDashboardStats();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function listConfigs(req, res, next) {
  try {
    const data = await transformConfigService.listConfigs();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}

export async function updateConfig(req, res, next) {
  try {
    await transformConfigService.updateConfig(req.params.id, req.body);
    const data = await transformConfigService.listConfigs();
    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
}
