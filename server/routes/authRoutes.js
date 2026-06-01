import express from 'express';
import { register, login } from '../controllers/authController.js';
import {verifyToken, requirePermission} from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/login', login);
router.post('/register', verifyToken, requirePermission('manage_users'), register);

export default router;