import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import * as authController from '../controllers/authController.js';
import * as datasetController from '../controllers/datasetController.js';
import * as transformationController from '../controllers/transformationController.js';

const router = Router();

router.post('/auth/login', authController.login);
router.get('/auth/me', authenticate, authController.me);
router.put('/profile', authenticate, authController.updateProfile);

router.get('/datasets', authenticate, datasetController.list);
router.get('/datasets/:id', authenticate, datasetController.getById);
router.get('/datasets/:id/preview', authenticate, datasetController.preview);

router.get(
  '/datasets/:id/transformations',
  authenticate,
  transformationController.list
);
router.post(
  '/datasets/:id/transform',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'),
  transformationController.create
);
router.put(
  '/transformations/:id',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'),
  transformationController.update
);
router.delete(
  '/transformations/:id',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'),
  transformationController.remove
);
router.put(
  '/datasets/:id/transformations/reorder',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'),
  transformationController.reorder
);
router.post(
  '/datasets/:id/transformations/preview',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST'),
  transformationController.preview
);

router.post(
  '/datasets/:id/validate',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD'),
  transformationController.validate
);
router.get(
  '/datasets/:id/validation-results',
  authenticate,
  transformationController.validationResults
);

router.get('/datasets/:id/versions', authenticate, transformationController.listVersions);
router.post(
  '/datasets/:id/versions',
  authenticate,
  authorize('ADMIN', 'DATA_STEWARD'),
  transformationController.createVersion
);
router.get(
  '/datasets/:id/versions/:versionId',
  authenticate,
  transformationController.getVersion
);
router.delete(
  '/datasets/:id/versions/:versionId',
  authenticate,
  authorize('ADMIN'),
  transformationController.deleteVersion
);

router.get('/datasets/:id/history', authenticate, transformationController.history);
router.get('/history', authenticate, transformationController.globalHistory);

router.get(
  '/dashboard/data-preparation',
  authenticate,
  transformationController.dashboard
);

router.get(
  '/transformation-configs',
  authenticate,
  authorize('ADMIN'),
  transformationController.listConfigs
);
router.put(
  '/transformation-configs/:id',
  authenticate,
  authorize('ADMIN'),
  transformationController.updateConfig
);

export default router;
