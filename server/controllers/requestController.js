import Request from "../models/Request.js";
import Employee from "../models/Employee.js";

//creation by employee
export const createRequest = async(req, res)=>{
    try{
        const {assetType, reason, tentativeReturnDate} = req.body;

        const employee = await Employee.findOne({
            userId: req.user.id
        });
        if(!employee){
            return res.status(404).json({
                message:"Employee profile not found for this user"
            });
        }
        const newRequest = await Request.create({
            employeeId: employee._id,
            assetType, reason,
            tentativeReturnDate: tentativeReturnDate ? new Date(tentativeReturnDate) : null
        });

        res.status(201).json({
            message: "Request submitted", request: newRequest
        });
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

//employee request history
export const getMyRequests = async (req, res) =>{
    try{
        const employee = await Employee.findOne({userId: req.user.id});
        if(!employee){
            return res.status(404).json({message: "Employee not found."});
        }
        const requests = await Request.find({employeeId:employee._id})
            .populate('assignedAssetId', 'name assetId')
            .sort({createdAt: -1});
        res.status(200).json({requests});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
}

//view all employee req
export const getAllRequests = async(req, res)=> {
    try{
        const requests = await Request.find({})
            .populate({
                path: 'employeeId',
                select: 'name department',
                populate: { path: 'userId', select: 'userId email' }
            })
            .populate('assignedAssetId', 'name assetId')
            .sort({createdAt:-1});
        res.status(200).json(requests);
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

//admin approval/rejection
export const updateRequestStatus = async (req, res) =>{
    try{
        const{status, assignedAssetId} = req.body;
        const request = await Request.findById(req.params.id);
        if(!request){
            return res.status(404).json({message: "Request not found."})
        }
        request.status = status;
        if(status === "approved" && assignedAssetId){
            request.assignedAssetId = assignedAssetId;
        }
        await request.save();
        res.status(200).json({message: `Request ${status}`, request});
    }
    catch(e){
        console.error(e);
        res.status(500).json({message: "Server error"});
    }
};