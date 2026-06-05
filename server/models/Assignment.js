import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema({
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true},
    employeeId: {type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true},
    assignedDate: {type: Date, default: Date.now},
    tentativeReturnDate: {type: Date, default: null},
    returnedDate: {type: Date, default: null},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Auto-filter soft-deleted documents from all find queries
assignmentSchema.pre(/^find/, function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});
assignmentSchema.pre('countDocuments', function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

export default mongoose.model('Assignment', assignmentSchema);