import express from "express";
import { createReport, getMyReport, getAllReports, updateReportStatus } from '../controllers/assetReportController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();
router.post('/', verifyToken, requirePermission('report_damage'), createReport);
router.get('/my-reports', verifyToken, requirePermission('view_damage'), getMyReport);

router.get('/', verifyToken, requirePermission('manage_maintenance'), getAllReports);
router.put('/:id/status', verifyToken, requirePermission('manage_maintenance'), updateReportStatus);

export default router;