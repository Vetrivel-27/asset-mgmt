import xlsx from 'xlsx';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';
import { formatAndValidateAssetId, generateNextAssetId } from '../utils/assetUtils.js';

export const bulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const toDateString = (d) => {
            if (!d) return '';
            const dateObj = new Date(d);
            if (isNaN(dateObj.getTime())) return '';
            return dateObj.toISOString().split('T')[0];
        };

        const summary = {
            roles: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
            employees: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
            assets: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 }
        };
        const details = {
            roles: [],
            employees: [],
            assets: []
        };

        // Process roles
        if (workbook.SheetNames.includes('Roles')) {
            const roleSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Roles']);
            summary.roles.total = roleSheet.length;

            const allPermissions = await Permission.find();
            const permMap = {};
            allPermissions.forEach(p => permMap[p.name.toLowerCase()] = p._id);

            for (let i = 0; i < roleSheet.length; i++) {
                const row = roleSheet[i];
                const rowNum = i + 2; // +1 for 0-index, +1 for header

                try {
                    const roleName = String(row['Role Name'] || '').trim().toLowerCase();
                    const permsString = String(row['Permissions'] || '').trim();

                    if (!roleName || !permsString) {
                        throw new Error("Role Name and Permissions are required.");
                    }

                    if (roleName === 'admin') {
                        throw new Error("Cannot modify core 'admin' role via bulk upload.");
                    }

                    const permNames = permsString
                        .split(',')
                        .map((s) => s.trim().toLowerCase())
                        .filter(Boolean);

                    const PERMISSION_DEPENDENCIES = {
                        borrow_asset: ["view_asset", "return_asset", "report_damage"],
                        return_asset: ["view_asset"],
                        report_damage: ["view_asset", "view_my_damage"],
                        view_my_damage: ["view_asset"],
                        manage_asset: ["view_asset"],
                        assign_asset: ["view_assignments"],
                        view_assignments: ["view_asset", "view_users"],
                        approve_borrow: ["view_asset", "view_users"],
                        manage_maintenance: ["view_my_damage"],
                        manage_users: ["view_users"],
                        manage_roles: ["view_users"],
                        view_dashboard: ["view_asset", "view_users", "view_assignments"],
                        view_report: ["view_asset"]
                    };

                    const expandedPermNames = new Set();
                    const collectDeps = (name) => {
                        expandedPermNames.add(name);
                        const deps = PERMISSION_DEPENDENCIES[name] || [];
                        deps.forEach((dep) => {
                            if (!expandedPermNames.has(dep)) {
                                collectDeps(dep);
                            }
                        });
                    };

                    permNames.forEach(name => collectDeps(name));

                    const permIds = [];
                    const unknownPerms = [];

                    for (const pName of expandedPermNames) {
                        if (permMap[pName]) {
                            permIds.push(permMap[pName]);
                        } else {
                            unknownPerms.push(pName);
                        }
                    }

                    if (unknownPerms.length > 0) {
                        throw new Error(
                            `Unknown permission name(s): ${unknownPerms.join(", ")}. ` +
                            `Please add them to permissions or correct the sheet.`
                        );
                    }

                    const uniquePermIds = [...new Set(permIds)];

                    const existingRole = await Role.findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
                    if (existingRole) {
                        const existingPermStrSet = new Set(existingRole.permissions.map(p => p.toString()));
                        const newPermStrSet = new Set(uniquePermIds.map(p => p.toString()));

                        let hasChanged = existingPermStrSet.size !== newPermStrSet.size;
                        if (!hasChanged) {
                            for (const id of newPermStrSet) {
                                if (!existingPermStrSet.has(id)) {
                                    hasChanged = true;
                                    break;
                                }
                            }
                        }

                        if (hasChanged) {
                            existingRole.permissions = uniquePermIds;
                            await existingRole.save();
                            summary.roles.updated++;
                            details.roles.push({ row: rowNum, status: 'updated', name: roleName });
                        } else {
                            summary.roles.skipped++;
                            details.roles.push({ row: rowNum, status: 'skipped', name: roleName, message: 'No changes detected for this role.' });
                        }
                    } else {
                        await Role.create({ name: roleName, permissions: uniquePermIds });
                        summary.roles.created++;
                        details.roles.push({ row: rowNum, status: 'created', name: roleName });
                    }
                } catch (error) {
                    summary.roles.errors++;
                    details.roles.push({ row: rowNum, status: 'error', name: row['Role Name'] || 'Unknown', message: error.message });
                }
            }
        }

        // Process employees
        if (workbook.SheetNames.includes('Employees')) {
            const empSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Employees']);
            summary.employees.total = empSheet.length;

            for (let i = 0; i < empSheet.length; i++) {
                const row = empSheet[i];
                const rowNum = i + 2;

                try {
                    const name = String(row['Name'] || '').trim();
                    const email = String(row['Email'] || '').trim();
                    let employeeId = String(row['Employee ID'] || '').trim();
                    const department = String(row['Department'] || '').trim();
                    const roleName = String(row['Role'] || '').trim().toLowerCase();

                    if (!name || !email || !employeeId || !department || !roleName) {
                        throw new Error("All fields (Name, Email, Employee ID, Department, Role) are required.");
                    }

                    if (/^\d{1,4}$/.test(employeeId)) {
                        employeeId = employeeId.padStart(4, "0");
                    }
                    if (!/^\d{4}$/.test(employeeId)) {
                        throw new Error("Employee ID must be a number up to 4 digits.");
                    }

                    const empById = await Employee.findOne({ employeeId });
                    const userById = empById ? await User.findById(empById.userId) : null;
                    const userByEmail = await User.findOne({ email });

                    if (userByEmail) {
                        const empByEmail = await Employee.findOne({ userId: userByEmail._id });
                        if (empByEmail && empByEmail.employeeId !== employeeId) {
                            throw new Error(`Email '${email}' is already in use by employee ID '${empByEmail.employeeId}'.`);
                        }
                    }

                    const existingUser = userById || userByEmail;
                    if (existingUser) {
                        let existingEmp = await Employee.findOne({ userId: existingUser._id });
                        if (!existingEmp) {
                            // If a User exists but an Employee profile doesn't, automatically create it and link them.
                            existingEmp = await Employee.create({
                                name,
                                department,
                                employeeId,
                                userId: existingUser._id,
                                createdBy: req.user.id
                            });
                        }

                        const targetRole = await Role.findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
                        if (!targetRole) {
                            throw new Error(`Role '${roleName}' not found. Please define it in the Roles sheet or create it first.`);
                        }

                        const hasNameChanged = existingEmp.name?.trim().toLowerCase() !== name.trim().toLowerCase();
                        const hasDeptChanged = existingEmp.department?.trim().toLowerCase() !== department.trim().toLowerCase();
                        const hasRoleChanged = existingUser.role?.toString() !== targetRole._id.toString();
                        const hasEmailChanged = existingUser.email?.trim().toLowerCase() !== email.trim().toLowerCase();

                        if (hasNameChanged || hasDeptChanged || hasRoleChanged || hasEmailChanged) {
                            if (hasNameChanged) existingEmp.name = name;
                            if (hasDeptChanged) existingEmp.department = department;
                            await existingEmp.save();

                            if (hasRoleChanged) {
                                existingUser.role = targetRole._id;
                            }
                            let resetToken = "";
                            if (hasEmailChanged) {
                                resetToken = crypto.randomBytes(20).toString("hex");
                                const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
                                existingUser.email = email;
                                existingUser.resetPasswordToken = hashedToken;
                                existingUser.resetPasswordExpires = Date.now() + 24 * 60 * 60 * 1000;
                            }
                            await existingUser.save();

                            if (hasEmailChanged && resetToken) {
                                try {
                                    const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
                                    const message = `
                                        <h1>Asset Management System</h1>
                                        <p>Hello, ${name}! Your email address has been updated to ${email}.</p>
                                        <p>Please click the link below to set your password for your updated account credentials:</p>
                                        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Update Password</a>
                                        <p>This link will expire in 24 hours.</p>
                                    `;

                                    sendEmail({
                                        email,
                                        subject: 'Email Updated - Password Update Required',
                                        html: message
                                    });
                                } catch (e) {
                                    console.error("Failed to send email update notification in bulk upload:", e);
                                }
                            }

                            summary.employees.updated++;
                            details.employees.push({ row: rowNum, status: 'updated', name, message: 'Employee updated successfully.' });
                        } else {
                            summary.employees.skipped++;
                            details.employees.push({ row: rowNum, status: 'skipped', name, message: 'No changes detected for this employee.' });
                        }
                        continue;
                    }

                    const role = await Role.findOne({ name: { $regex: new RegExp(`^${roleName}$`, 'i') } });
                    if (!role) {
                        throw new Error(`Role '${roleName}' not found. Please define it in the Roles sheet or create it first.`);
                    }

                    const resetToken = crypto.randomBytes(20).toString("hex");
                    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
                    const hashedPassword = await bcrypt.hash("pass123", 10);

                    const newUser = await User.create({
                        displayName: name,
                        email,
                        role: role._id,
                        password: hashedPassword,
                        resetPasswordToken: hashedToken,
                        resetPasswordExpires: Date.now() + 24 * 60 * 60 * 1000,
                    });

                    await Employee.create({
                        name,
                        department,
                        userId: newUser._id,
                        createdBy: req.user.id,
                    });

                    const resetUrl = `http://localhost:3000/forgot-password/${resetToken}`;
                    const message = `
                        <h1>Asset Management System</h1>
                        <p>Welcome, ${name}! Your account has been created via bulk upload.</p>
                        <p>Your User ID is: <strong>${employeeId}</strong></p>
                        <p>Please click the link below to set your password:</p>
                        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Set Password</a>
                        <p>This link will expire in 24 hours.</p>
                    `;

                    sendEmail({
                        email,
                        subject: "Account Created - Asset Management System",
                        html: message,
                    }).catch(e => console.error("Failed to send bulk email to", email, e));

                    summary.employees.created++;
                    details.employees.push({ row: rowNum, status: 'created', name });
                } catch (error) {
                    summary.employees.errors++;
                    details.employees.push({ row: rowNum, status: 'error', name: row['Name'] || 'Unknown', message: error.message });
                }
            }
        }

        // Process assets
        if (workbook.SheetNames.includes('Assets')) {
            const assetSheet = xlsx.utils.sheet_to_json(workbook.Sheets['Assets']);
            summary.assets.total = assetSheet.length;
            const processedAssetsInFile = {};

            for (let i = 0; i < assetSheet.length; i++) {
                const row = assetSheet[i];
                const rowNum = i + 2;

                try {
                    const name = String(row['Name'] || '').trim();
                    const type = String(row['Type'] || '').trim();
                    let assetId = String(row['Asset ID'] || '').trim();
                    const purchaseDateRaw = row['Purchase Date'];

                    if (!name || !type || !purchaseDateRaw) {
                        throw new Error("Name, Type, and Purchase Date are required.");
                    }

                    // Handle Excel dates or string dates
                    let purchaseDate;
                    if (typeof purchaseDateRaw === 'number') {
                        purchaseDate = new Date((purchaseDateRaw - (25567 + 2)) * 86400 * 1000); // Excel date to JS date
                    } else {
                        purchaseDate = new Date(purchaseDateRaw);
                    }

                    if (isNaN(purchaseDate.getTime())) {
                        throw new Error("Invalid Purchase Date format.");
                    }

                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    if (purchaseDate > today) {
                        throw new Error("Purchase date cannot be in the future.");
                    }

                    if (assetId) {
                        try {
                            assetId = formatAndValidateAssetId(assetId, type);
                        } catch (e) {
                            throw new Error(e.message);
                        }

                        // Check duplicate in the currently processed batch in this file
                        const localExisting = processedAssetsInFile[assetId];
                        if (localExisting) {
                            throw new Error(`Asset with ID ${assetId} already exists in the file.`);
                        }

                        // Check duplicate in DB
                        const dbAsset = await Asset.findOne({ assetId, isDeleted: false });
                        if (dbAsset) {
                            throw new Error(`Asset with ID ${assetId} already exists.`);
                        }
                    } else {
                        const existingLocalSet = new Set(Object.keys(processedAssetsInFile));
                        assetId = await generateNextAssetId(type, Asset, existingLocalSet);
                    }

                    const newAsset = await Asset.create({
                        name,
                        type,
                        assetId,
                        purchaseDate,
                        status: 'available',
                        createdBy: req.user.id,
                    });

                    processedAssetsInFile[assetId] = { name, type, purchaseDate, doc: newAsset };
                    summary.assets.created++;
                    details.assets.push({ row: rowNum, status: 'created', name });
                } catch (error) {
                    summary.assets.errors++;
                    details.assets.push({ row: rowNum, status: 'error', name: row['Name'] || 'Unknown', message: error.message });
                }
            }
        }

        res.json({ summary, details });

    } catch (error) {
        console.error("Bulk upload error:", error);
        res.status(500).json({ message: "Failed to process the uploaded file." });
    }
};
