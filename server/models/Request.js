import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    assetType:{type: String, required: true},
    requestedAssetId:{type: mongoose.Schema.Types.ObjectId, ref:'Asset', default:null},
    reason:{type: String, required: true, trim:true},
    tentativeReturnDate:{type: Date, default:null},
    status:{type:String, enum:["pending", "approved", "rejected"], default:"pending"},
    assignedAssetId:{type: mongoose.Schema.Types.ObjectId, ref:'Asset', default:null},
    statusChangedBy:{type: mongoose.Schema.Types.ObjectId, ref:'User', default:null}
}, {timestamps:true});

export default mongoose.model('Request', requestSchema);