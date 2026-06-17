import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    getEmployeeProfile,
    updateMyProfile
} from '../controllers/employeeController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';
import { validateEmployee } from '../validators/employeeValidator.js';

const router = express.Router();

// Current logged in user's profile
router.route('/me')
    .get(verifyToken, getEmployeeProfile)
    .put(verifyToken, updateMyProfile);

router.route('/')
    .post(verifyToken, requirePermission('manage_users'), validateEmployee, createEmployee)
    .get(verifyToken, requirePermission('view_users'), getEmployees);

router.route('/:id')
    .get(verifyToken, requirePermission('view_users'), getEmployeeById)
    .put(verifyToken, requirePermission('manage_users'), validateEmployee, updateEmployee)
    .delete(verifyToken, requirePermission('manage_users'), deleteEmployee);

export default router;
