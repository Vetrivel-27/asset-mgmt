import express from 'express';
import {createAsset,getAssets,getAssetById,updateAsset,deleteAsset,getAssetCategories} from '../controllers/assetController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';
import { validateAsset } from '../validators/assetValidator.js';

const router = express.Router();

router.get('/categories', verifyToken, requirePermission('view_asset'), getAssetCategories);
router.get('/', verifyToken, requirePermission('view_asset'), getAssets);
router.get('/:id', verifyToken, requirePermission('view_asset'), getAssetById);

router.post('/', verifyToken, requirePermission('manage_asset'), validateAsset, createAsset);
router.put('/:id', verifyToken, requirePermission('manage_asset'), validateAsset, updateAsset);
router.delete('/:id', verifyToken, requirePermission('manage_asset'), deleteAsset);

export default router;
