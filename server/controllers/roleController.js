import Role from '../models/Role.js';
import Permission from '../models/Permission.js';

export const getRoles = async (req, res) => {
    try {
        const roles = await Role.find({}).populate('permissions', 'name group');
        res.json(roles);
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
        const roleExists = await Role.findOne({ name });

        if (roleExists) {
            return res.status(400).json({ message: "Role already exists" });
        }

        const role = await Role.create({ name, permissions });
        res.status(201).json(role);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error" });
    }
};
