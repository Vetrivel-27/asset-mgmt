import express from 'express';
import multer from 'multer';
import { bulkUpload } from '../controllers/bulkUploadController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

// Configure multer to store file in memory
const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Using manage_users as the primary gatekeeper for bulk uploads, 
// as it requires creating users, which is the most sensitive operation.
router.post('/', verifyToken, requirePermission('manage_users'), upload.single('file'), bulkUpload);

export default router;
