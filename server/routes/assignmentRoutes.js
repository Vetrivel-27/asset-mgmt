import express from 'express';
import {
    assignAsset,
    returnAsset,
    getAllAssignments,
    getMyAssignments,
    borrowAsset
} from '../controllers/assignmentController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get current employee's assignments
router.get('/my-assignments', verifyToken, requirePermission('view_asset'), getMyAssignments);
// Get all assignments
router.get('/', verifyToken, requirePermission('view_assignments'), getAllAssignments);
// Assign an asset
router.post('/assign', verifyToken, requirePermission('assign_asset'), assignAsset);
// Return an asset (update assignment)
router.put('/return/:id', verifyToken, requirePermission('return_asset'), returnAsset);
// Borrow an asset
router.post('/borrow', verifyToken, requirePermission('borrow_asset'), borrowAsset);

export default router;
