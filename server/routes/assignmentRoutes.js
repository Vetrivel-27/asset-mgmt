import express from 'express';
import {
    assignAsset,
    returnAsset,
    getAllAssignments
} from '../controllers/assignmentController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all assignments
router.get('/', verifyToken, requirePermission('view_asset'), getAllAssignments);
// Assign an asset
router.post('/assign', verifyToken, requirePermission('manage_asset'), assignAsset);
// Return an asset (update assignment)
router.put('/return/:id', verifyToken, requirePermission('manage_asset'), returnAsset);

export default router;
