import mongoose from 'mongoose';

const assetReportSchema = new mongoose.Schema({
    assetId:{type: mongoose.Schema.Types.ObjectId, ref:"Asset", required: true},
    employeeId:{type: mongoose.Schema.Types.ObjectId, ref:'Employee', required:true},
    type:{type:String, enum:['damage', 'feedback', 'lost', 'maintenance', 'stolen', 'other'], required: true},
    message:{type:String, required: true, trim:true},
    status:{type:String, enum:['open', 'in_progress', 'resolved'], default: 'open'}
}, {timestamps:true});

export default mongoose.model('AssetReport', assetReportSchema);