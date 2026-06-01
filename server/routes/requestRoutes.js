import express from 'express';
import { createRequest, getMyRequests, getAllRequests, updateRequestStatus } from '../controllers/requestController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

//Employee routes
router.post('/', verifyToken, requirePermission('borrow_asset'), createRequest);
router.get('/my-requests', verifyToken, requirePermission('borrow_asset'), getMyRequests);

//Admin routes
router.get('/', verifyToken, requirePermission('approve_borrow'), getAllRequests);
router.put('/:id/status', verifyToken, requirePermission('approve_borrow'), updateRequestStatus);

export default router;