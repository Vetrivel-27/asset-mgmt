import mongoose from 'mongoose';
import softDeletePlugin from '../plugins/softDelete.js';

const assignmentSchema = new mongoose.Schema({
    assetId: {type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true},
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    assignedDate: {type: Date, default: Date.now},
    tentativeReturnDate: {type: Date, default: null},
    returnedDate: {type: Date, default: null},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

assignmentSchema.plugin(softDeletePlugin);

export default mongoose.model('Assignment', assignmentSchema);