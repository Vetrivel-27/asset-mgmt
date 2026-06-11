import xlsx from 'xlsx';
import Asset from '../models/Asset.js';
import User from '../models/User.js';
import Employee from '../models/Employee.js';
import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import sendEmail from '../utils/sendEmail.js';

export const bulkUpload = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded." });
    }

    try {
        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });

        const summary = {
            roles: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
            employees: { total: 0, created: 0, skipped: 0, errors: 0 },
            assets: { total: 0, created: 0, skipped: 0, errors: 0 }
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

                    const permNames = permsString.split(',').map(s => s.trim().toLowerCase());
                    const permIds = [];
                    for (const pName of permNames) {
                        if (permMap[pName]) {
                            permIds.push(permMap[pName]);
                        }
                    }

                    const existingRole = await Role.findOne({ name: roleName });
                    if (existingRole) {
                        existingRole.permissions = permIds;
                        await existingRole.save();
                        summary.roles.updated++;
                        details.roles.push({ row: rowNum, status: 'updated', name: roleName });
                    } else {
                        await Role.create({ name: roleName, permissions: permIds });
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

                    const userExists = await User.findOne({ $or: [{ userId: employeeId }, { email }] });
                    if (userExists) {
                        summary.employees.skipped++;
                        details.employees.push({ row: rowNum, status: 'skipped', name, message: 'User with this ID or email already exists.' });
                        continue;
                    }

                    const role = await Role.findOne({ name: roleName });
                    if (!role) {
                        throw new Error(`Role '${roleName}' not found. Please define it in the Roles sheet or create it first.`);
                    }

                    const resetToken = crypto.randomBytes(20).toString("hex");
                    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
                    const hashedPassword = await bcrypt.hash("pass123", 10);

                    const newUser = await User.create({
                        userId: employeeId,
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

                    if (!assetId) {
                        const prefix = type.slice(0, 3).toUpperCase();
                        const count = await Asset.countDocuments({ type });
                        let seq = count + 1;
                        assetId = `${prefix}-${String(seq).padStart(3, "0")}`;
                        let assetExists = await Asset.findOne({ assetId, isDeleted: false });
                        while (assetExists) {
                            seq++;
                            assetId = `${prefix}-${String(seq).padStart(3, "0")}`;
                            assetExists = await Asset.findOne({ assetId, isDeleted: false });
                        }
                    } else {
                        const assetExists = await Asset.findOne({ assetId, isDeleted: false });
                        if (assetExists) {
                            summary.assets.skipped++;
                            details.assets.push({ row: rowNum, status: 'skipped', name, message: `Asset with ID ${assetId} already exists.` });
                            continue;
                        }
                    }

                    await Asset.create({
                        name,
                        type,
                        assetId,
                        purchaseDate,
                        status: 'available',
                        createdBy: req.user.id,
                    });

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
