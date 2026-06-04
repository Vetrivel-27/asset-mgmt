import mongoose from 'mongoose';
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref:'Role', required: true},
    resetPasswordToken:String ,
    resetPasswordExpires: Date,
    resetPasswordOtp: String,
    resetPasswordOtpExpires: Date,
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, { timestamps: true });

userSchema.index({ userId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
userSchema.index({ email: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

userSchema.pre(/^find/, function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});
userSchema.pre('countDocuments', function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

export default mongoose.model('User', userSchema);
