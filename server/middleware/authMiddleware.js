import jwt from 'jsonwebtoken';
import User from '../models/User.js';

//Is logged in?
export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }
    try {
        token = token.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(401).json({ error: "Invalid or expired token." });
    }
};


export const requirePermission = (requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Find the user and populate their role's permissions
            const user = await User.findById(req.user.id).populate({
                path: 'role',
                populate: {
                    path: 'permissions',
                    model: 'Permission'
                }
            });
            if (!user) {
                return res.status(401).json({ error: "User not found." });
            }

            const permissionNames = user.role.permissions.map(perm => perm.name);
            // Check if the required permission is in their list
            if (!permissionNames.includes(requiredPermission)) {
                return res.status(403).json({ 
                    error: "Forbidden: You do not have permission to perform this action." 
                });
            }
            next();            
        }
        catch (error) {
            console.error("Permission Check Error:", error);
            res.status(500).json({ error: "Server error checking permissions" });
        }
    };
};
