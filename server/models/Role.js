import mongoose from 'mongoose';
import Permission from './Permission.js';

const roleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { timestamps: true });

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
  manage_report: ["view_report"],
  view_dashboard: ["view_asset", "view_users", "view_assignments"],
  view_report: ["view_asset"]
};

roleSchema.pre('save', async function () {
    if (!this.isModified('permissions')) return;

    const allPermissions = await Permission.find({});
    const permMap = {};
    const idMap = {};

    allPermissions.forEach((p) => {
        permMap[p.name.toLowerCase()] = p._id.toString();
        idMap[p._id.toString()] = p.name.toLowerCase();
    });

    const resolvedIds = new Set();
    const invalidIds = [];

    const collectDeps = (permName) => {
        const deps = PERMISSION_DEPENDENCIES[permName] || [];
        deps.forEach((depName) => {
            const depId = permMap[depName];
            if (depId && !resolvedIds.has(depId)) {
                resolvedIds.add(depId);
                collectDeps(depName);
            }
        });
    };

    this.permissions.forEach((idObj) => {
        if (!idObj) return;
        const idStr = idObj.toString();
        if (!idMap[idStr]) {
            invalidIds.push(idStr);
            return;
        }
        resolvedIds.add(idStr);
        collectDeps(idMap[idStr]);
    });

    if (invalidIds.length > 0) {
        throw new Error(`Invalid permission ID(s): ${invalidIds.join(", ")}`);
    }

    this.permissions = Array.from(resolvedIds).map((idStr) => new mongoose.Types.ObjectId(idStr));
});

export default mongoose.model('Role', roleSchema);