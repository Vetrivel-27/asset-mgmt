import bcrypt from "bcrypt";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import User from "../models/User.js";

export const seedDatabase = async () => {
    try {
        // Seed Permissions
        const permissionCount = await Permission.countDocuments();
        if (permissionCount === 0) {
            const permissionsToCreate = [
                
                { name: "view_asset", group: "Asset" },
                { name: "manage_asset", group: "Asset" },
                
                { name: "borrow_asset", group: "Workflow" },
                { name: "approve_borrow", group: "Workflow" },
                { name: "return_asset", group: "Workflow" },
                { name: "assign_asset", group: "Workflow" },
                
                { name: "view_inventory", group: "Inventory" },
                { name: "manage_inventory", group: "Inventory" },

                { name: "report_damage", group: "Maintenance" },
                { name: "view_damage", group: "Maintenance" },
                { name: "manage_maintenance", group: "Maintenance" },
                { name: "manage_repair", group: "Maintenance" },
                
                { name: "view_report", group: "Report" },
                { name: "manage_report", group: "Report" },
                
                // { name: "send_notification", group: "Notification" },
                // { name: "view_notification", group: "Notification" },
                
                { name: "manage_users", group: "Administration" },
                { name: "view_users", group: "Administration" },
                { name: "manage_roles", group: "Administration" },
                { name: "manage_settings", group: "Administration" },
                
                { name: "view_audit", group: "Audit" }
            ];
            const permissions = await Permission.insertMany(
                permissionsToCreate
            );
            console.log(`Seeded ${permissions.length} permissions`);
        }

        // Seed Roles
        const roleCount = await Role.countDocuments();
        if (roleCount === 0) {
            const allPermissions = await Permission.find();
            // Admin Role
            await Role.create({
                name: "Admin",
                permissions: allPermissions.map(p => p._id)
            });
            // Employee Role
            const employeePerms = allPermissions.filter(p =>
                ["view_asset","borrow_asset","return_asset","view_inventory","report_damage","view_damage"].includes(p.name)
            );
            await Role.create({
                name: "Employee",
                permissions: employeePerms.map(p => p._id)
            });
            console.log("Default roles created");
        }

        // Seed Default Admin User
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            const adminRole = await Role.findOne({ name: "Admin" });
            const hashedPassword = await bcrypt.hash("admin123",10);
            await User.create({
                username: "System Admin",
                email: "admin@test.com",
                password: hashedPassword,
                role: adminRole._id
            });
            console.log("Default admin user created");
        }
    }
    catch (err) {
        console.error("Database seeding failed:", err);
    }
};