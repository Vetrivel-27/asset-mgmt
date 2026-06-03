import Assignment from '../models/Assignment.js';
import Asset from '../models/Asset.js';
import Employee from '../models/Employee.js';

export const assignAsset = async (req, res) => {
    try {
        const { assetId, employeeId, tentativeReturnDate } = req.body;

        // Check if asset and employee exist
        const asset = await Asset.findById(assetId);
        const employee = await Employee.findById(employeeId);

        if (!asset) return res.status(404).json({ message: 'Asset not found' });
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        // Check if asset is already assigned
        if (asset.status !== 'available') {
            return res.status(400).json({ message: 'Asset is not available for assignment' });
        }

        const assignment = await Assignment.create({
            assetId,
            employeeId,
            assignedDate: new Date(),
            tentativeReturnDate: tentativeReturnDate ? new Date(tentativeReturnDate) : null
        });

        // Update asset status
        asset.status = 'assigned';
        await asset.save();

        res.status(201).json(assignment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const returnAsset = async (req, res) => {
    try {
        const assignment = await Assignment.findById(req.params.id);

        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        if (assignment.returnedDate) {
            return res.status(400).json({ message: 'Asset is already returned' });
        }
        assignment.returnedDate = new Date();
        await assignment.save();

        // Update asset status back to available
        const asset = await Asset.findById(assignment.assetId);
        if (asset) {
            asset.status = 'available';
            await asset.save();
        }
        res.json({ message: 'Asset returned successfully', assignment });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAllAssignments = async (req, res) => {
    try {
        const assignments = await Assignment.find({})
            .populate('assetId', 'name type assetId status')
            .populate({
                path: 'employeeId',
                select: 'name department',
                populate: { path: 'userId', select: 'username email' }
            });
        res.json(assignments);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getMyAssignments = async (req, res) => {
    try {
        const employee = await Employee.findOne({ userId: req.user.id });
        if (!employee) {
            return res.status(404).json({ message: "Employee profile not found" });
        }
        const assignments = await Assignment.find({ employeeId: employee._id })
            .populate('assetId', 'name type assetId status')
            .sort({ createdAt: -1 });
        res.json(assignments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
