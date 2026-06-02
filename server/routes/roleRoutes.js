import express from 'express';
import { getRoles, getPermissions, createRole } from '../controllers/roleController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Only Admins with 'manage_roles' can use these
router.get('/', verifyToken, requirePermission('manage_roles'), getRoles);
router.post('/', verifyToken, requirePermission('manage_roles'), createRole);

// Fetch the raw permission list for the role creation form
router.get('/permissions', verifyToken, requirePermission('manage_roles'), getPermissions);

export default router;
