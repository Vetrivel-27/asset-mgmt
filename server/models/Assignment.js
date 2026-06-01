import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true},
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true},
    assignedDate: {type: Date, default: Date.now},
    returnDate: {type: Date, default: null}
}, { timestamps: true });

export default mongoose.model('Assignment', assignmentSchema);