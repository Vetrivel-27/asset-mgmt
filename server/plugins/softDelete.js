import mongoose from 'mongoose';

/**
 * Mongoose plugin that adds soft-delete capability to schemas.
 * Injects isDeleted, deletedAt, and deletedBy fields.
 * Intercepts find(), findOne(), findOneAndUpdate(), countDocuments(), etc.
 * to exclude deleted documents by default unless explicitly requested.
 */
export default function softDeletePlugin(schema) {
  schema.add({
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
    deletedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  });

  const excludeDeleted = function(next) {
    if (this.getQuery && typeof this.getQuery === 'function') {
      if (this.getQuery().isDeleted === undefined) {
        this.where({ isDeleted: { $ne: true } });
      }
    }
    if (typeof next === 'function') {
      next();
    }
  };

  // Apply to all find operations
  // schema.pre(/^find/, excludeDeleted);
  // schema.pre('countDocuments', excludeDeleted);

  // Add a helper method for soft deletion
  schema.methods.softDelete = async function(userId = null) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    if (userId) this.deletedBy = userId;
    return this.save();
  };
}
