import Asset from '../models/Asset.js';
import Employee from '../models/Employee.js';
import AssetReport from '../models/AssetReport.js';
import User from '../models/User.js';
import Role from '../models/Role.js';


export const getDashboardStats = async (req, res) => {
    try {
 //Asset statistics
        const totalAssets = await Asset.countDocuments();
        const availableAssets = await Asset.countDocuments({status: 'available' });
        const assignedAssets = await Asset.countDocuments({ status:'assigned'});    
        const damagedAssets = await Asset.countDocuments({ status:'damaged'});
        const repairAssets = await Asset.countDocuments({ status:'repair'});
        const unavailableAssets = await Asset.countDocuments({ status: { $in: ['damaged', 'repair'] } });
        const adminRole = await Role.findOne({ name: 'admin' });
        let adminUserIds = [];
        if (adminRole) {
            const adminUsers = await User.find({ role: adminRole._id }).select('_id');
            adminUserIds = adminUsers.map(u => u._id);
        }
        
        const totalEmployees = await Employee.countDocuments({ userId: { $nin: adminUserIds } });
        const openDamageReports = await AssetReport.countDocuments({ type:'damage', status:'open' });

        res.status(200).json({
            assets: {
                total: totalAssets,
                available: availableAssets,
                assigned: assignedAssets,
                unavailable: unavailableAssets,
                damaged: damagedAssets,
                repair: repairAssets
            },
            employees: {total: totalEmployees},
            reports: {openDamage: openDamageReports}
        });
    }
    catch (e) {
        console.error(e);
        res.status(500).json({ message: "Server error fetching stats" });
    }
};
