import Role from '../models/Role.js';
import Permission from '../models/Permission.js';
import User from '../models/User.js';

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}).populate('permissions', 'name group');
        
        const rolesWithCounts = await Promise.all(roles.map(async (role) => {
            const employeeCount = await User.countDocuments({ role: role._id });
            return {
                ...role.toObject(),
                employeeCount
            };
        }));

        res.json(rolesWithCounts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getPermissions = async (req, res) => {
    try {
        // react frontend will use this to generate the checkbox list
        const permissions = await Permission.find({});
        res.json(permissions);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const createRole = async (req, res) => {
    try {
        const { name, permissions } = req.body;
        const roleName = name?.trim().toLowerCase();
        if (!roleName || !Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({ message: "Role name and permissions are required" });
        }

        const roleExists = await Role.findOne({ name: roleName });

        if (roleExists) {
            return res.status(400).json({ message: "Role already exists" });
        }

        const role = await Role.create({ name: roleName, permissions });
        const populatedRole = await Role.findById(role._id).populate('permissions', 'name group');
        res.status(201).json(populatedRole);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, permissions } = req.body;
        
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }
        
        const roleNameLower = role.name?.toLowerCase();
        if (roleNameLower === 'admin') {
            return res.status(403).json({ message: "Cannot edit default core roles" });
        }

        const roleName = name?.trim().toLowerCase();
        if (!roleName || !Array.isArray(permissions) || permissions.length === 0) {
            return res.status(400).json({ message: "Role name and permissions are required" });
        }

        // Check name clash
        if (roleName !== role.name) {
            const exists = await Role.findOne({ name: roleName });
            if (exists) return res.status(400).json({ message: "Role name already in use" });
        }

        role.name = roleName;
        role.permissions = permissions;
        await role.save();

        const populatedRole = await Role.findById(role._id).populate('permissions', 'name group');
        res.json(populatedRole);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteRole = async (req, res) => {
    try {
        const { id } = req.params;
        const role = await Role.findById(id);
        
        if (!role) {
            return res.status(404).json({ message: "Role not found" });
        }

        const roleNameLower = role.name?.toLowerCase();
        if (roleNameLower === 'admin') {
            return res.status(403).json({ message: "Cannot delete core roles" });
        }

        // check if users are assigned
        const usersCount = await User.countDocuments({ role: id });
        if (usersCount > 0) {
            return res.status(400).json({ message: "Cannot delete role because it is assigned to existing employees." });
        }

        await Role.findByIdAndDelete(id);
        res.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
