import bcrypt from "bcrypt";
import Permission from "../models/Permission.js";
import Role from "../models/Role.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";

export const seedDatabase = async () => {
  try {
    // Seed / sync Permissions — always upsert so new permissions are added
    const permissionsToCreate = [
      { name: "view_asset", group: "Asset" },
      { name: "manage_asset", group: "Asset" },

      { name: "borrow_asset", group: "Workflow" },
      { name: "approve_borrow", group: "Workflow" },
      { name: "return_asset", group: "Workflow" },
      { name: "assign_asset", group: "Workflow" },

      // { name: "view_inventory", group: "Inventory" },
      // { name: "manage_inventory", group: "Inventory" },
      { name: "view_assignments", group: "Workflow" },

      { name: "report_damage", group: "Maintenance" },
      { name: "view_my_damage", group: "Maintenance" },
      { name: "manage_maintenance", group: "Maintenance" },

      { name: "view_report", group: "Report" },
      // { name: "manage_report", group: "Report" },
      { name: "view_dashboard", group: "Report" },

      // { name: "send_notification", group: "Notification" },
      // { name: "view_notification", group: "Notification" },

      { name: "manage_users", group: "Administration" },
      { name: "view_users", group: "Administration" },
      { name: "manage_roles", group: "Administration" },
      // { name: "manage_settings", group: "Administration" },

      // { name: "view_audit", group: "Audit" }
    ];

    for (const perm of permissionsToCreate) {
      await Permission.findOneAndUpdate(
        { name: perm.name },
        { $setOnInsert: perm },
        { upsert: true }
      );
    }
    console.log("Permissions seeded/synced successfully");

    // Always sync Admin role with all current permissions
    const allPermissions = await Permission.find();
    let adminRole = await Role.findOne({ name: "Admin" });
    if (adminRole) {
      adminRole.permissions = allPermissions.map((p) => p._id);
      await adminRole.save();
      console.log("Admin role permissions synced");
    } else {
      adminRole = await Role.create({
        name: "Admin",
        permissions: allPermissions.map((p) => p._id),
      });
      console.log("Default Admin role created");
    }

    // Seed Default Admin User
    const existingAdmin = await User.findOne({ email: "admin@test.com" });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 10);
      await User.create({
        userId: "0000",
        email: "admin@test.com",
        password: hashedPassword,
        role: adminRole._id,
      });
      console.log("Default admin user created");
    }
  } catch (err) {
    console.error("Database seeding failed:", err);
  }
};
