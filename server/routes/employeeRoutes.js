import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    getMyEmployeeProfile,
    updateEmployee,
    deleteEmployee
} from '../controllers/employeeController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(verifyToken, requirePermission('manage_users'), createEmployee)
    .get(verifyToken, requirePermission('view_users'), getEmployees);

router.get('/me', verifyToken, getMyEmployeeProfile);

router.route('/:id')
    .get(verifyToken, requirePermission('view_users'), getEmployeeById)
    .put(verifyToken, requirePermission('manage_users'), updateEmployee)
    .delete(verifyToken, requirePermission('manage_users'), deleteEmployee);

export default router;
