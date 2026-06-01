import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} from '../controllers/employeeController.js';
import { verifyToken, requirePermission } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(verifyToken, requirePermission('manage_users'), createEmployee)
    .get(verifyToken, getEmployees);

router.route('/:id')
    .get(verifyToken, getEmployeeById)
    .put(verifyToken, requirePermission('manage_users'), updateEmployee)
    .delete(verifyToken, requirePermission('manage_users'), deleteEmployee);

export default router;