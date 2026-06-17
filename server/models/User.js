import mongoose from 'mongoose';
import softDeletePlugin from '../plugins/softDelete.js';
const userSchema = new mongoose.Schema({
    displayName: { type: String, default: "" },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref:'Role', required: true},
    resetPasswordToken:String ,
    resetPasswordExpires: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    refreshToken: { type: String, default: null }
}, { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

userSchema.virtual('employeeProfile', {
    ref: 'Employee',
    localField: '_id',
    foreignField: 'userId',
    justOne: true
});

userSchema.plugin(softDeletePlugin);

userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });



export default mongoose.model('User', userSchema);
