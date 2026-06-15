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
      select: "userId email role",
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

    // Check if user with this email or userId already exists
    const userExists = await User.findOne({
      $or: [{ userId: employeeId }, { email }],
    });
    if (userExists) {
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
      userId: employeeId,
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
      userId: newUser._id,
      createdBy: req.user.id,
    });

    // Send setup email
    const resetUrl = `https://ams-frontend-djc3.onrender.com/forgot-password/${resetToken}`;
    const message = `
            <h1>Asset Management System</h1>
            <p>Welcome, ${name}! Your account has been created.</p>
            <p>Your User ID is: <strong>${employeeId}</strong></p>
            <p>Please click the link below to set your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
            <p>This link will expire in 24 hours.</p>
        `;

    // Send setup email in the background to avoid blocking the client request
    sendEmail({
      email,
      subject: "Account Created - Asset Management System",
      html: message,
    }).then(() => {
      console.log(`Setup email sent to ${email}`);
    }).catch((e) => {
      console.error("Failed to send setup email:", e);
    });

    // Return employee with user info populated
    const populatedEmployee = await Employee.findById(employee._id).populate({
      path: "userId",
      select: "userId email role",
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
    const employees = await Employee.find({}).populate({
      path: "userId",
      select: "userId email role",
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
      select: "userId email role",
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
      select: "userId email role",
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

    const user = await User.findById(employee.userId);

    // --- Duplicate email guard ---
    if (req.body.email && user && req.body.email !== user.email) {
      const emailTaken = await User.findOne({
        email: req.body.email,
        _id: { $ne: user._id },
      });
      if (emailTaken) {
        return res.status(400).json({ message: "Email address is already in use by another account." });
      }
    }

    employee.name = req.body.name || employee.name;
    employee.department = req.body.department || employee.department;

    if (req.body.email || req.body.employeeId || req.body.roleId) {
      const userUpdate = {};

      if (req.body.email && user.email !== req.body.email) {
        userUpdate.email = req.body.email;
        
        const resetToken = crypto.randomBytes(20).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");
          
        userUpdate.resetPasswordToken = hashedToken;
        userUpdate.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
        
        const resetUrl = `https://ams-frontend-djc3.onrender.com/forgot-password/${resetToken}`;
        const message = `
            <h1>Asset Management System</h1>
            <p>Hello ${employee.name},</p>
            <p>Your email address for your Asset Management account has been updated.</p>
            <p>Please click the link below to verify your new email and set/update your password:</p>
            <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Password</a>
            <p>This link will expire in 24 hours.</p>
        `;

        // Send update email in the background to avoid blocking the client request
        sendEmail({
          email: req.body.email,
          subject: "Email Updated - Asset Management System",
          html: message,
        }).then(() => {
          console.log(`Password reset email sent to updated address: ${req.body.email}`);
        }).catch((e) => {
          console.error("Failed to send email on update:", e);
        });
      } else if (req.body.email) {
        userUpdate.email = req.body.email;
      }

      if (req.body.employeeId) userUpdate.userId = req.body.employeeId;
      if (req.body.roleId) userUpdate.role = req.body.roleId;
      await User.findByIdAndUpdate(employee.userId, userUpdate);
    }

    const updatedEmployee = await employee.save();
    const populated = await Employee.findById(updatedEmployee._id).populate({
      path: "userId",
      select: "userId email role",
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

export const createEmployeesBulk = async (req, res) => {
  try {
    const employeesData = req.body;
    if (!Array.isArray(employeesData)) {
      return res.status(400).json({ message: "Invalid payload: expected an array of employees" });
    }

    const createdEmployees = [];
    const errors = [];

    const employeeRole = await Role.findOne({ name: "employee" });
    if (!employeeRole) {
      return res.status(500).json({ message: "Employee role not found" });
    }

    const defaultPasswordHash = await bcrypt.hash("pass123", 10);

    for (let i = 0; i < employeesData.length; i++) {
      const { name, employeeId, department, email } = employeesData[i];

      if (!name || !employeeId || !email || !department) {
        errors.push(`Row ${i + 1}: Name, Employee ID, Department, and Email are required.`);
        continue;
      }

      const userExists = await User.findOne({
        $or: [{ userId: employeeId }, { email }],
      });
      if (userExists) {
        errors.push(`Row ${i + 1}: User with ID ${employeeId} or email ${email} already exists.`);
        continue;
      }

      const duplicateInRun = createdEmployees.some(
        (emp) => emp.tempUserId === employeeId || emp.tempEmail === email
      );
      if (duplicateInRun) {
        errors.push(`Row ${i + 1}: Duplicate Employee ID ${employeeId} or email ${email} in list.`);
        continue;
      }

      try {
        const resetToken = crypto.randomBytes(20).toString("hex");
        const hashedToken = crypto
          .createHash("sha256")
          .update(resetToken)
          .digest("hex");

        const newUser = await User.create({
          userId: employeeId,
          email,
          role: employeeRole._id,
          password: defaultPasswordHash,
          resetPasswordToken: hashedToken,
          resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000,
        });

        const newEmployee = await Employee.create({
          name,
          department,
          userId: newUser._id,
          createdBy: req.user.id,
        });

        const resetUrl = `https://ams-frontend-djc3.onrender.com/forgot-password/${resetToken}`;
        const message = `
          <h1>Asset Management System</h1>
          <p>Welcome, ${name}! Your account has been created.</p>
          <p>Your User ID is: <strong>${employeeId}</strong></p>
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
        } catch (e) {
          console.error("Failed to send email inside bulk upload:", e);
        }

        createdEmployees.push({
          tempUserId: employeeId,
          tempEmail: email,
          _id: newEmployee._id,
        });
      } catch (err) {
        errors.push(`Row ${i + 1}: DB Error (${err.message}).`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        message: "Some errors occurred during bulk upload",
        errors,
        uploadedCount: createdEmployees.length
      });
    }

    res.status(201).json({
      message: `Successfully uploaded ${createdEmployees.length} employees`,
      uploadedCount: createdEmployees.length
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during bulk employee upload" });
  }
};

export const updateMyProfile = async (req, res) => {
  try {
    const { name, email } = req.body;

    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) return res.status(404).json({ message: "Employee profile not found" });

    if (name) employee.name = name;
    await employee.save();

    if (email) {
      await User.findByIdAndUpdate(req.user.id, { email });
    }

    const populated = await Employee.findById(employee._id).populate({
      path: "userId",
      select: "userId email role",
      populate: { path: "role", select: "name" },
    });

    res.json({ message: "Profile updated successfully", employee: populated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateMyPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ message: "Current and new password are required" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ message: "Current password is incorrect" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
