import Employee from '../models/Employee.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import bcrypt from 'bcrypt';

export const createEmployee = async (req, res) => {
    try {
        const { name, employeeId, department, email } = req.body;
        const employeeExists = await Employee.findOne({ $or: [{employeeId}, {email}] });

        if (employeeExists) {
            return res.status(400).json({ message: 'Employee with this ID or email already exists' });
        }

        const employeeRole = await Role.findOne({name:'Employee'});
        const resetToken = crypto.randomBytes(20).toString('hex');
        const hashedToken  = crypto.createHash('sha256').update(resetToken).digest('hex');
        const hashedPassword = await bcrypt.hash("pass123", 10);//for satisfying password field
        const newUser = await User.create({
            username:employeeId, email,role:employeeRole._id,password: hashedPassword,resetPasswordToken: hashedToken,resetPasswordExpires: Date.now()+24*60*60*1000
        });
        
        const employee = await Employee.create({name, employeeId,department, email, userId:newUser._id});
        const resetUrl = `http://localhost:3000/reset-password/${resetToken}`;
        const message = `
            <h1>Asset Management System</h1>
            <p>Welcome, ${name}! Your account has been created.</p>
            <p>Your username is: <strong>${employeeId}</strong></p>
            <p>Please click the link below to set your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 24 hours.</p>
            <p>Regards,<br>Asset Management Team</p>
        `;

        try {
            await sendEmail({
                email: newUser.email,
                subject: 'Account Created - Asset Management System',
                html: message
            });
            console.log(`Password reset email sent to ${newUser.email}`);
        }
        catch (e) {
            console.error("Failed to send email:", e);
        }

        res.status(201).json(employee);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployees = async (req, res) => {
    try {
        const employees = await Employee.find({});
        res.json(employees);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getEmployeeById = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            res.json(employee);
        } else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (employee) {
            employee.name = req.body.name || employee.name;
            employee.employeeId = req.body.employeeId || employee.employeeId;
            employee.department = req.body.department || employee.department;
            employee.email = req.body.email || employee.email;
            const updatedEmployee = await employee.save();
            res.json(updatedEmployee);
        }
        else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);

        if (employee) {
            await Employee.deleteOne({ _id: employee._id });
            res.json({ message: 'Employee removed' });
        }
        else {
            res.status(404).json({ message: 'Employee not found' });
        }
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};