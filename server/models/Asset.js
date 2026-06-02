import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim:true},
    assetId: {type: String, required: true, unique: true, trim: true},
    purchaseDate: { type: Date, required: true },
    status: {type: String, enum: ['available', 'assigned', 'maintenance'], default: 'available' }},
{ timestamps: true });

export default mongoose.model('Asset', assetSchema);