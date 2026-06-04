import mongoose from 'mongoose';

const employeeSchema = new mongoose.Schema({
    name:{type:String, required:true, trim:true},
    department:{type:String, required:true, trim:true},
    userId:{type:mongoose.Schema.Types.ObjectId, ref:'User', required: true},
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, {timestamps: true});

employeeSchema.pre(/^find/, function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});
employeeSchema.pre('countDocuments', function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

export default mongoose.model("Employee", employeeSchema);