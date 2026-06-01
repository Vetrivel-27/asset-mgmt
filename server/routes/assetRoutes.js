import express from 'express';
import {createAsset,getAssets,getAssetById,updateAsset,deleteAsset} from '../controllers/assetController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, requirePermission('view_asset'), getAssets);
router.get('/:id', verifyToken, requirePermission('view_asset'), getAssetById);

router.post('/', verifyToken, requirePermission('manage_asset'), createAsset);
router.put('/:id', verifyToken, requirePermission('manage_asset'), updateAsset);
router.delete('/:id', verifyToken, requirePermission('manage_asset'), deleteAsset);

export default router;
