import express from 'express';
import {
    assignAsset,
    returnAsset,
    getAllAssignments
} from '../controllers/assignmentController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all assignments
router.route('/').get(protect, getAllAssignments);

// Assign an asset
router.route('/assign').post(protect, admin, assignAsset);

// Return an asset (update assignment)
router.route('/return/:id').put(protect, admin, returnAsset);

export default router;
