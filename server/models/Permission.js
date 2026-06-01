import mongoose from 'mongoose';

const permissionSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true, lowercase: true },
    group: { type: String, required: true, trim: true}
}, { timestamps: true });

export default mongoose.model('Permission', permissionSchema);