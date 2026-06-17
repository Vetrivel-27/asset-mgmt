export const getCategoryPrefix = (category) => {
    if (!category) return 'UNK';
    return String(category).trim().substring(0, 3).toUpperCase();
};

export const formatAndValidateAssetId = (assetId, category) => {
    if (!assetId) return null;
    if (!category) throw new Error("Category is required to format Asset ID.");
    
    const defaultPrefix = getCategoryPrefix(category);
    let id = String(assetId).trim();
    
    // 1. Accepts numeric up to 4 digits (appends default category prefix)
    if (/^\d{1,4}$/.test(id)) {
        return `${defaultPrefix}-${id.padStart(4, '0')}`;
    }
    
    // 2. Accepts [3 chars]-[1 to 4 digits] (e.g., MON-1, ABC-123)
    const formatRegex = /^([a-zA-Z]{3})-(\d{1,4})$/;
    const match = id.match(formatRegex);
    if (match) {
        const customPrefix = match[1].toUpperCase();
        const numericPart = match[2].padStart(4, '0');
        return `${customPrefix}-${numericPart}`;
    }
    
    // If it is in an invalid format
    throw new Error(`Asset ID must be a 1-4 digit number or match the format XXX-1234 (3 letters followed by a hyphen and up to 4 digits).`);
};

export const generateNextAssetId = async (category, AssetModel, localProcessedSet = new Set()) => {
    const prefix = getCategoryPrefix(category);
    
    // Find highest sequence for this prefix in DB
    const highestAsset = await AssetModel.findOne({ assetId: new RegExp(`^${prefix}-\\d{4}$`) })
                                         .sort({ assetId: -1 }); // string sort is safe because length is fixed 8 chars
                                         
    let nextSeq = 1;
    if (highestAsset && highestAsset.assetId) {
        const parts = highestAsset.assetId.split('-');
        if (parts.length === 2 && !isNaN(parts[1])) {
            nextSeq = parseInt(parts[1], 10) + 1;
        }
    }
    
    let nextAssetId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
    let exists = await AssetModel.findOne({ assetId: nextAssetId, isDeleted: false });
    
    while (exists || localProcessedSet.has(nextAssetId)) {
        nextSeq++;
        nextAssetId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
        exists = await AssetModel.findOne({ assetId: nextAssetId, isDeleted: false });
    }
    
    return nextAssetId;
};
