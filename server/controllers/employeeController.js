import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import bcrypt from 'bcrypt';

export const createEmployee = async (req, res) => {
    try {
        const { name, employeeId, department, email, roleId } = req.body;

        // Check if User with this email or username already exists
        const userExists = await User.findOne({ $or: [{ username: employeeId }, { email }] });
        if (userExists) {
            return res.status(400).json({ message: 'User with this ID or email already exists' });
        }

        // Create User account first
        const employeeRole = roleId
            ? await Role.findById(roleId)
            : await Role.findOne({ name: 'employee' });
        if (!employeeRole) {
            return res.status(500).json({ message: 'Employee role not found' });
        }
        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const hashedPassword = await bcrypt.hash("pass123", 10);

        const newUser = await User.create({
            username: employeeId,
            email,
            role: employeeRole._id,
            password: hashedPassword,
            resetPasswordToken: hashedToken,
            resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000
        });

        // Create Employee linked to User (no duplication!)
        const employee = await Employee.create({
            name,
            department,
            userId: newUser._id
        });

        // Send setup email
        const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
        const message = `
            <h1>Asset Management System</h1>
            <p>Welcome, ${name}! Your account has been created.</p>
            <p>Your username is: <strong>${employeeId}</strong></p>
            <p>Please click the link below to set your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
            <p>This link will expire in 24 hours.</p>
        `;

        try {
            await sendEmail({ email, subject: 'Account Created - Asset Management System', html: message });
            console.log(`Setup email sent to ${email}`);
        } catch (e) {
            console.error("Failed to send email:", e);
        }

        // Return employee with user info populated
        const populatedEmployee = await Employee.findById(employee._id).populate({
            path: 'userId',
            select: 'username email role',
            populate: { path: 'role', select: 'name' }
        });
        res.status(201).json(populatedEmployee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({}).populate({
            path: 'userId',
            select: 'username email role',
            populate: { path: 'role', select: 'name' }
        });
        res.json(employees);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id).populate({
            path: 'userId',
            select: 'username email role',
            populate: { path: 'role', select: 'name' }
        });
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyEmployeeProfile = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id }).populate({
            path: 'userId',
            select: 'username email role',
            populate: { path: 'role', select: 'name' }
        });

        if (!employee) {
            return res.status(404).json({ message: 'Employee profile not found' });
        }

        res.json(employee);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Update Employee fields
        employee.name = req.body.name || employee.name;
        employee.department = req.body.department || employee.department;

        // Update User fields (email and username live in User now!)
        if (req.body.email || req.body.employeeId) {
            const userUpdate = {};
            if (req.body.email) userUpdate.email = req.body.email;
            if (req.body.employeeId) userUpdate.username = req.body.employeeId;
            await User.findByIdAndUpdate(employee.userId, userUpdate);
        }

        const updatedEmployee = await employee.save();
        const populated = await Employee.findById(updatedEmployee._id).populate({
            path: 'userId',
            select: 'username email role',
            populate: { path: 'role', select: 'name' }
        });
        res.json(populated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Delete the User account first so they can't log in anymore
        await User.findByIdAndDelete(employee.userId);

        // Then delete the Employee
        await Employee.deleteOne({ _id: employee._id });
        res.json({ message: 'Employee and User account removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
