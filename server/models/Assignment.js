import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true},
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true},
    assignedDate: {type: Date, default: Date.now},
    tentativeReturnDate: {type: Date, default: null},
    returnedDate: {type: Date, default: null}
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for backward compatibility with frontend code accessing 'returnDate'
assignmentSchema.virtual('returnDate').get(function() {
    return this.returnedDate;
});

export default mongoose.model('Assignment', assignmentSchema);