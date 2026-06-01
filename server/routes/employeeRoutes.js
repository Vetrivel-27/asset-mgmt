import express from 'express';
import {
    createEmployee,
    getEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} from '../controllers/employeeController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, admin, createEmployee)
    .get(protect, getEmployees);

router.route('/:id')
    .get(protect, getEmployeeById)
    .put(protect, admin, updateEmployee)
    .delete(protect, admin, deleteEmployee);

export default router;
