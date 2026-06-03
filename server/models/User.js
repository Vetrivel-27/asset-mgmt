import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref:'Role', required: true},
    resetPasswordToken:String ,
    resetPasswordExpires: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date
}, { timestamps: true });

export default mongoose.model('User', userSchema);
