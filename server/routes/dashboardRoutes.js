import express from 'express';
import { getDashboardStats } from '../controllers/dashboardController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', verifyToken, requirePermission('view_damage'), getDashboardStats);

export default router;
