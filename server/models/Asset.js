import mongoose from 'mongoose';
import softDeletePlugin from '../plugins/softDelete.js';

const assetSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true},
    assetId: {type: String, required: true, trim: true},
    purchaseDate: { type: Date, required: true },
    status: {type: String, enum: ['available', 'assigned', 'damaged', 'repair'], default: 'available' },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, { timestamps: true });

assetSchema.plugin(softDeletePlugin);

assetSchema.index({ assetId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });


export default mongoose.model('Asset', assetSchema);