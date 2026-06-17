import jwt from 'jsonwebtoken';
import User from '../models/User.js';

//Is logged in?
export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token || !token.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }
    try {
        token = token.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (e) {
        return res.status(401).json({ message: "Invalid or expired token." });
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
                return res.status(401).json({ message: "User not found." });
            }

            const permissionNames = user.role.permissions.map(perm => perm.name);
            const requiredPerms = Array.isArray(requiredPermission) ? requiredPermission : [requiredPermission];
            
            // Check if the user has at least one of the required permissions
            const hasAccess = requiredPerms.some(perm => permissionNames.includes(perm));
            
            if (!hasAccess) {
                return res.status(403).json({ 
                    message: "Forbidden: You do not have permission to perform this action." 
                });
            }
            next();            
        }
        catch (error) {
            console.error("Permission Check Error:", error);
            res.status(500).json({ message: "Server error checking permissions" });
        }
    };
};
