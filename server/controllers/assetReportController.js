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

        // If it's damage, automatically set asset status to damage
        if (type === 'damage') {
            asset.status = 'damage';
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
        const report = await AssetReport.findById(req.params.id);
        if(!report){
            return res.status(404).json({message:"Report not found"});
        }
        report.status = status;
        await report.save();

        // If resolved, set asset back to available
        if(status==='resolved'){
            const asset = await Asset.findById(report.assetId);
            if(asset && (asset.status ==="maintenance" || asset.status === "damage" || asset.status === "repair")){
                asset.status = "available";
                await asset.save();
            }
        }
        res.status(200).json({message:`Report marked as ${status}`, report});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};