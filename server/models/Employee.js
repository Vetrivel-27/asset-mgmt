import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name:{type:String, required:true,trim:true},
    employeeId:{type:String, required:true,unique:true,trim:true},
    department:{type:String, required:true,trim:true},
    email:{type:String, required:true,trim:true, lowercase: true}
});

export default mongoose.model("Employee", employeeSchema);