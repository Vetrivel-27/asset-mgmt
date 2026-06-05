import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    employeeId:{type: mongoose.Schema.Types.ObjectId, ref:'Employee', required: true},
    assetType:{type: String, required: true},
    requestedAssetId:{type: mongoose.Schema.Types.ObjectId, ref:'Asset', default:null},
    reason:{type: String, required: true, trim:true},
    tentativeReturnDate:{type: Date, default:null},
    status:{type:String, enum:["pending", "approved", "rejected"], default:"pending"},
    assignedAssetId:{type: mongoose.Schema.Types.ObjectId, ref:'Asset', default:null}
}, {timestamps:true});

export default mongoose.model('Request', requestSchema);