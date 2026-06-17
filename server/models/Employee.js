import mongoose from 'mongoose';
import softDeletePlugin from '../plugins/softDelete.js';

const employeeSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    department:{type:String, required:true, trim:true},
    employeeId: { type: String, required: true, trim: true },
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, {timestamps: true});

employeeSchema.plugin(softDeletePlugin);

employeeSchema.index({ employeeId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });



export default mongoose.model("Employee", employeeSchema);