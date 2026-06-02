import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name:{type:String, required:true,trim:true},
    department:{type:String, required:true,trim:true},
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required: true}
}, {timestamps: true});

export default mongoose.model("Employee", employeeSchema);