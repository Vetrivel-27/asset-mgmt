import Employee from "../models/Employee.js";
import User from "../models/User.js";
import Role from "../models/Role.js";
import Assignment from "../models/Assignment.js";
import crypto from "crypto";
import sendEmail from "../utils/sendEmail.js";
import bcrypt from "bcrypt";

export const getEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id }).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, employeeId, department, email, roleId } = req.body;

    // Format and validate employee ID
    let formattedEmployeeId = String(employeeId || "").trim();
    if (/^\d{1,4}$/.test(formattedEmployeeId)) {
      formattedEmployeeId = formattedEmployeeId.padStart(4, "0");
    }

    if (!/^\d{4}$/.test(formattedEmployeeId)) {
      return res.status(400).json({ message: "Employee ID must be a number up to 4 digits." });
    }

    // Check if user with this email or employee ID already exists
    const userExists = await User.findOne({ email });
    const employeeExists = await Employee.findOne({ employeeId: formattedEmployeeId });
    if (userExists || employeeExists) {
      return res
        .status(400)
        .json({ message: "User with this ID or email already exists" });
    }
    // Create User account first
    const employeeRole = roleId
      ? await Role.findById(roleId)
      : await Role.findOne({ name: "employee" });
    if (!employeeRole) {
      return res.status(500).json({ message: "Employee role not found" });
    }
    const resetToken = crypto.randomBytes(20).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    const hashedPassword = await bcrypt.hash("pass123", 10);

    const newUser = await User.create({
      displayName: name,
      email,
      role: employeeRole._id,
      password: hashedPassword,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000,
    });

    // Create Employee linked to User, no duplication
    const employee = await Employee.create({
      name,
      department,
      employeeId: formattedEmployeeId,
      userId: newUser._id,
      createdBy: req.user.id,
    });

    // Send setup email
    const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
    const message = `
            <h1>Asset Management System</h1>
            <p>Welcome, ${name}! Your account has been created.</p>
            <p>Your User ID is: <strong>${formattedEmployeeId}</strong></p>
            <p>Please click the link below to set your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
            <p>This link will expire in 24 hours.</p>
        `;

    try {
      await sendEmail({
        email,
        subject: "Account Created - Asset Management System",
        html: message,
      });
      console.log(`Setup email sent to ${email}`);
    } catch (e) {
      console.error("Failed to send email:", e);
    }

    // Return employee with user info populated
    const populatedEmployee = await Employee.findById(employee._id).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });
    res.status(201).json(populatedEmployee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const adminRole = await Role.findOne({ name: "admin" });
    let adminUserIds = [];
    if (adminRole) {
      const adminUsers = await User.find({ role: adminRole._id }).select("_id");
      adminUserIds = adminUsers.map((u) => u._id);
    }

    const employees = await Employee.find({ userId: { $nin: adminUserIds } }).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });

    // Compute borrowed assets count for each employee
    const employeesWithCount = await Promise.all(
      employees.map(async (emp) => {
        const count = await Assignment.countDocuments({
          employeeId: emp._id,
          returnedDate: null,
        });
        return {
          ...emp.toObject(),
          assetsBorrowedCount: count,
        };
      }),
    );

    res.json(employeesWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: "Employee not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getMyEmployeeProfile = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id }).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });

    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }

    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Update Employee fields
    employee.name = req.body.name || employee.name;
    employee.department = req.body.department || employee.department;

    // Update User fields; the employee ID lives on Employee.
    if (req.body.email || req.body.employeeId || req.body.roleId) {
      const userUpdate = {};
      if (req.body.email) {
        const emailExists = await User.findOne({ email: req.body.email, _id: { $ne: employee.userId }, isDeleted: false });
        if (emailExists) {
          return res.status(400).json({ message: "An employee with this email already exists." });
        }
        userUpdate.email = req.body.email;
      }
      if (req.body.name) {
        userUpdate.displayName = req.body.name;
      }
      if (req.body.employeeId) {
        let formattedEmployeeId = String(req.body.employeeId).trim();
        if (/^\d{1,4}$/.test(formattedEmployeeId)) {
          formattedEmployeeId = formattedEmployeeId.padStart(4, "0");
        }
        if (!/^\d{4}$/.test(formattedEmployeeId)) {
          return res.status(400).json({ message: "Employee ID must be a number up to 4 digits." });
        }
        const empIdExists = await Employee.findOne({ employeeId: formattedEmployeeId, _id: { $ne: employee._id }, isDeleted: false });
        if (empIdExists) {
          return res.status(400).json({ message: "An employee with this ID already exists." });
        }
        employee.employeeId = formattedEmployeeId;
      }
      if (req.body.roleId) userUpdate.role = req.body.roleId;
      await User.findByIdAndUpdate(employee.userId, userUpdate, { runValidators: true });
    }

    const updatedEmployee = await employee.save();
    const populated = await Employee.findById(updatedEmployee._id).populate({
      path: "userId",
      select: "email displayName role",
      populate: { path: "role", select: "name" },
    });
    res.json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee)
      return res.status(404).json({ message: "Employee not found" });

    // Soft delete the User account so they can't log in anymore
    const user = await User.findById(employee.userId);
    if (user) {
      if (user.email === "admin@test.com") {
        return res
          .status(400)
          .json({ message: "Seeded admin account cannot be deleted." });
      }
      user.isDeleted = true;
      user.deletedAt = new Date();
      user.deletedBy = req.user.id;
      await user.save();
    }

    // Soft delete the Employee
    employee.isDeleted = true;
    employee.deletedAt = new Date();
    employee.deletedBy = req.user.id;
    await employee.save();

    res.json({ message: "Employee and User account removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
