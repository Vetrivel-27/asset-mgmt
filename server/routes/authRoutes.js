import express from 'express';
import {verifyToken, requirePermission} from '../middleware/authMiddleware.js';
import { register, login, forgotPassword, verifyResetOtp, resetPasswordWithOtp, resetPassword, refreshUserToken, logout } from '../controllers/authController.js';

const router = express.Router();

router.post('/login', login);
router.post('/refresh', refreshUserToken);
router.post('/logout', logout);
router.post('/register', verifyToken, requirePermission('manage_users'), register);
router.post('/forgot-password',forgotPassword);
router.post('/verify-reset-otp', verifyResetOtp);
router.post('/reset-password-otp', resetPasswordWithOtp);
router.put('/reset-password/:token',resetPassword);
export default router;
