import { formatAndValidateAssetId } from '../utils/assetUtils.js';

export const validateAsset = (req, res, next) => {
  const { name, type, purchaseDate, status, assetId } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim() === '') {
    errors.push('Name is required and must be a non-empty string');
  }

  if (!type || typeof type !== 'string' || type.trim() === '') {
    errors.push('Type is required and must be a non-empty string');
  }

  if (purchaseDate) {
    const purchaseDateVal = new Date(purchaseDate);
    if (isNaN(purchaseDateVal.getTime())) {
      errors.push('Purchase date must be a valid date');
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDateVal > today) {
        errors.push('Purchase date cannot be in the future');
      }
    }
  }

  if (status && !['available', 'assigned', 'damaged', 'repair'].includes(status)) {
    errors.push('Invalid status value');
  }

  if (assetId && typeof assetId !== 'string') {
    errors.push('Asset ID must be a string');
  } else if (assetId) {
    try {
      formatAndValidateAssetId(assetId, type);
    } catch (e) {
      errors.push(e.message);
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  next();
};
