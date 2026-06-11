import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    type: {type: String, required: true, trim: true},
    assetId: {type: String, required: true, trim: true},
    purchaseDate: { type: Date, required: true },
    status: {type: String, enum: ['available', 'assigned', 'damaged', 'repair', 'found'], default: 'available' },
    createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    isDeleted: {type: Boolean, default: false},
    deletedAt: {type: Date, default: null},
    deletedBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null}
}, { timestamps: true });

assetSchema.index({ assetId: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
assetSchema.pre(/^find/, function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});
assetSchema.pre('countDocuments', function() {
    if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: false });
    }
});

export default mongoose.model('Asset', assetSchema);