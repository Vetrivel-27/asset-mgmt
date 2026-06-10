import AssetReport from '../models/AssetReport.js';
import Employee from '../models/Employee.js';
import Asset from '../models/Asset.js';

//employee damage/feedback reporting
export const createReport = async(req, res)=>{
    try{
        const {assetId, type, message} = req.body;

        const asset = await Asset.findById(assetId);
        if(!asset){
            return res.status(404).json({message:"Asset not found"});
        }
        const employee = await Employee.findOne({userId: req.user.id});
        if(!employee){
            return res.status(404).json({message:"Employee not found"});
        }
        const report = await AssetReport.create({
            assetId, employeeId: employee._id, type, message
        });

        // If it's damage/lost/stolen/maintenance, mark asset as damaged
        if (['damage', 'lost', 'stolen', 'maintenance'].includes(type)) {
            asset.status = 'damaged';
            await asset.save();
        }

        res.status(201).json({message:"Report submitted", report});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

//employee report history
export const getMyReport = async(req, res)=>{
    try{
        const employee = await Employee.findOne({userId: req.user.id});
        if(!employee){
            return res.status(404).json({message:"Employee not found"});
        }
        const reports = await AssetReport.find({employeeId: employee._id})
        .populate('assetId', 'name type assetId')
        .sort({createdAt:-1});
        res.status(200).json({reports});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

//view all reports - admin
export const getAllReports = async (req, res) =>{
    try{
        const reports = await AssetReport.find({})
        .populate({
            path: 'employeeId',
            select: 'name department',
            populate: { path: 'userId', select: 'userId email' }
        })
        .populate('assetId','assetId name')
        .sort({createdAt:-1});
        res.status(200).json(reports);
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

//update maintenance status- admin
export const updateReportStatus = async(req, res)=>{
    try{
        const {status} = req.body;
        const VALID_STATUSES = ['open', 'in_progress', 'resolved'];
        if (!VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
        }

        const report = await AssetReport.findById(req.params.id).populate('assetId');
        if(!report){
            return res.status(404).json({message:"Report not found"});
        }

        // Prevent changes once resolved/closed
        if (report.status === 'resolved') {
            return res.status(400).json({ message: 'This report is already closed and cannot be changed.' });
        }

        const asset = report.assetId; // already populated
        const Assignment = (await import('../models/Assignment.js')).default;

        if (status === 'in_progress') {
            // 'Under Repair' — asset is being worked on
            if (asset) {
                asset.status = 'repair';
                await asset.save();
            }

            // Return any active assignment for this asset
            const activeAssignment = await Assignment.findOne({
                assetId: report.assetId._id || report.assetId,
                returnedDate: null
            });
            if (activeAssignment) {
                activeAssignment.returnedDate = new Date();
                await activeAssignment.save();
            }
        }

        if (status === 'resolved') {
            // Mark asset as available again
            if (asset) {
                asset.status = 'available';
                await asset.save();
            }
        }

        // If going back to open (edge case), mark asset as damaged again
        if (status === 'open' && report.status === 'in_progress') {
            if (asset) {
                asset.status = 'damaged';
                await asset.save();
            }
        }

        report.status = status;
        await report.save();

        // Re-fetch fully populated report to return
        const updatedReport = await AssetReport.findById(report._id)
            .populate({ path: 'employeeId', select: 'name department', populate: { path: 'userId', select: 'userId email' }})
            .populate('assetId', 'assetId name status');

        res.status(200).json({message:`Report marked as ${status}`, report: updatedReport});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};