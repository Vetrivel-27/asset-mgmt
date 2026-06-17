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
      populate: {
        path: "role",
        select: "name permissions",
        populate: { path: "permissions", model: "Permission" },
      },
    });
    if (!employee) {
      // Fallback for System Admin who has no Employee record
      const user = await User.findById(req.user.id).populate({
        path: "role",
        select: "name permissions",
        populate: { path: "permissions", model: "Permission" },
      });
      if (!user) {
        return res.status(404).json({ message: "User profile not found" });
      }
      return res.json({
        name: user.displayName || "System Admin",
        employeeId: null,
        department: "Administration",
        userId: user,
      });
    }
    res.json(employee);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name, employeeId, department, email, roleId, isEmployee } = req.body;

    if (!roleId) {
      return res.status(400).json({ message: "Role is required." });
    }

    let formattedEmployeeId = "";
    if (isEmployee) {
      // Format and validate employee ID
      formattedEmployeeId = String(employeeId || "").trim();
      if (/^\d{1,4}$/.test(formattedEmployeeId)) {
        formattedEmployeeId = formattedEmployeeId.padStart(4, "0");
      }

      if (!/^\d{4}$/.test(formattedEmployeeId)) {
        return res.status(400).json({ message: "Employee ID must be a number up to 4 digits." });
      }

      const employeeExists = await Employee.findOne({ employeeId: formattedEmployeeId });
      if (employeeExists) {
        return res.status(400).json({ message: `Employee with ID ${formattedEmployeeId} already exists` });
      }
    }

    // Check if user with this email already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }
    // Create User account first
    const employeeRole = await Role.findById(roleId);
    if (!employeeRole) {
      return res.status(500).json({ message: "Role not found" });
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
    if (isEmployee) {
      await Employee.create({
        name,
        department,
        employeeId: formattedEmployeeId,
        userId: newUser._id,
        createdBy: req.user.id,
      });
    }

    // Send setup email
    const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
    const message = `
            <h1>Asset Management System</h1>
            <p>Welcome, ${name}! Your account has been created.</p>
            ${isEmployee ? `<p>Your Employee ID is: <strong>${formattedEmployeeId}</strong></p>` : ""}
            <p>Please click the link below to set your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
            <p>This link will expire in 24 hours.</p>
        `;

    try {
      const sendEmail = (await import("../utils/sendEmail.js")).default;
      await sendEmail({
        email,
        subject: "Account Created - Asset Management System",
        html: message,
      });
      console.log(`Setup email sent to ${email}`);
    } catch (e) {
      console.error("Failed to send email:", e);
    }

    // Return user with info populated
    const populatedUser = await User.findById(newUser._id)
      .populate("role")
      .lean();
    
    if (isEmployee) {
      const createdEmp = await Employee.findOne({ userId: newUser._id }).lean();
      populatedUser.employeeProfile = createdEmp;
    } else {
      populatedUser.employeeProfile = null;
    }
    res.status(201).json(populatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const users = await User.find({})
      .populate("role", "name")
      .populate("employeeProfile");

    // Compute borrowed assets count for each user
    const usersWithCount = await Promise.all(
      users.map(async (u) => {
        const count = await Assignment.countDocuments({
          userId: u._id,
          returnedDate: null,
        });
        return {
          ...u.toObject(),
          assetsBorrowedCount: count,
        };
      }),
    );

    res.json(usersWithCount);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate("role", "name")
      .populate("employeeProfile");
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: "User not found" });
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
      select: "userId email role",
      populate: {
        path: "role",
        select: "name permissions",
        populate: { path: "permissions", model: "Permission" },
      },
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
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    let isEmailChanged = false;
    let newEmail = "";
    let resetToken = "";

    if (req.body.email) {
      const targetEmail = req.body.email.trim().toLowerCase();
      if (user.email !== targetEmail) {
        const emailExists = await User.findOne({ email: targetEmail, _id: { $ne: user._id }, isDeleted: false });
        if (emailExists) {
          return res.status(400).json({ message: "An employee with this email already exists." });
        }
        user.email = targetEmail;
        isEmailChanged = true;
        newEmail = targetEmail;
      }
    }
    
    if (req.body.name) user.displayName = req.body.name;
    if (req.body.roleId) user.role = req.body.roleId;

    if (isEmailChanged) {
      resetToken = crypto.randomBytes(20).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
    }

    await user.save();

    let employee = await Employee.findOne({ userId: user._id });
    if (employee) {
      if (req.body.name) employee.name = req.body.name;
      if (req.body.department !== undefined) employee.department = req.body.department;
      
      if (req.body.employeeId) {
        let formattedEmployeeId = String(req.body.employeeId).trim();
        if (/^\d{1,4}$/.test(formattedEmployeeId)) {
          formattedEmployeeId = formattedEmployeeId.padStart(4, "0");
        }
        if (!/^\d{4}$/.test(formattedEmployeeId)) {
          return res.status(400).json({ message: "Employee ID must be a number up to 4 digits." });
        }
        const empIdExists = await Employee.findOne({ employeeId: formattedEmployeeId, _id: { $ne: employee._id }, isDeleted: false });
        if (empIdExists) return res.status(400).json({ message: "An employee with this ID already exists." });
        employee.employeeId = formattedEmployeeId;
      }
      await employee.save();
    } else if (req.body.department || req.body.employeeId) {
      let formattedEmployeeId = "";
      if (req.body.employeeId) {
        formattedEmployeeId = String(req.body.employeeId).trim();
        if (/^\d{1,4}$/.test(formattedEmployeeId)) {
          formattedEmployeeId = formattedEmployeeId.padStart(4, "0");
        }
        if (!/^\d{4}$/.test(formattedEmployeeId)) {
          return res.status(400).json({ message: "Employee ID must be a number up to 4 digits." });
        }
        const empIdExists = await Employee.findOne({ employeeId: formattedEmployeeId, isDeleted: false });
        if (empIdExists) return res.status(400).json({ message: "An employee with this ID already exists." });
      }
      await Employee.create({
        userId: user._id,
        name: user.displayName,
        department: req.body.department,
        employeeId: formattedEmployeeId,
        createdBy: req.user.id
      });
    }

    if (isEmailChanged && resetToken) {
      const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
      const message = `
              <h1>Asset Management System</h1>
              <p>Hello, ${user.displayName || "Employee"}! Your email address has been updated.</p>
              <p>Please click the link below to set your password for your updated account credentials:</p>
              <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Password</a>
              <p>This link will expire in 24 hours.</p>
          `;
      try {
        await sendEmail({ email: newEmail, subject: "Email Updated - Password Update Required", html: message });
      } catch (e) {
        console.error("Failed to send email:", e);
      }
    }

    const populatedUser = await User.findById(user._id).populate("role", "name").populate("employeeProfile");
    res.json(populatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.email === "admin@test.com") {
      return res.status(400).json({ message: "Seeded admin account cannot be deleted." });
    }

    user.isDeleted = true;
    user.deletedAt = new Date();
    user.deletedBy = req.user.id;
    await user.save();

    const employee = await Employee.findOne({ userId: user._id });
    if (employee) {
      employee.isDeleted = true;
      employee.deletedAt = new Date();
      employee.deletedBy = req.user.id;
      await employee.save();
    }

    res.json({ message: "User account removed" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const userUpdate = {};
    if (req.body.name) userUpdate.displayName = req.body.name;
    if (req.body.email) {
      const emailExists = await User.findOne({ 
        email: req.body.email.trim().toLowerCase(), 
        _id: { $ne: req.user.id }, 
        isDeleted: false 
      });
      if (emailExists) {
        return res.status(400).json({ message: "An employee with this email already exists." });
      }
      userUpdate.email = req.body.email.trim().toLowerCase();
    }

    if (req.body.password) {
      const saltRounds = 10;
      userUpdate.password = await bcrypt.hash(req.body.password, saltRounds);
    }

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(req.user.id, userUpdate, { runValidators: true });
    }

    const employee = await Employee.findOne({ userId: req.user.id });
    if (employee) {
      employee.name = req.body.name || employee.name;
      employee.department = req.body.department || employee.department;
      await employee.save();

      const populated = await Employee.findById(employee._id).populate({
        path: "userId",
        select: "email displayName role",
        populate: { path: "role", select: "name" },
      });
      return res.json(populated);
    } else {
      // Return System Admin mock employee profile
      const user = await User.findById(req.user.id).populate({
        path: "role",
        select: "name permissions",
      });
      return res.json({
        name: user.displayName || "System Admin",
        employeeId: null,
        department: "Administration",
        userId: user,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
