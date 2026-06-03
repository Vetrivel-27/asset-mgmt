import Asset from '../models/Asset.js';
import Employee from '../models/Employee.js';
import AssetReport from '../models/AssetReport.js';

export const getDashboardStats = async (req, res) => {
    try {
 //Asset statistics
        const totalAssets = await Asset.countDocuments();
        const availableAssets = await Asset.countDocuments({status: 'available' });
        const assignedAssets = await Asset.countDocuments({ status:'assigned'});    
        const maintenanceAssets = await Asset.countDocuments({ status:'maintenance'});
        //Other counts
        const totalEmployees = await Employee.countDocuments();
        const openDamageReports = await AssetReport.countDocuments({ type:'damage', status:'open' });

        res.status(200).json({
            assets: {total: totalAssets,
                available: availableAssets,
                assigned: assignedAssets,
                maintenance: maintenanceAssets
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
