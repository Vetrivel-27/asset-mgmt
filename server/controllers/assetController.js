import Asset from '../models/Asset.js';

export const createAsset = async (req, res) => {
    try {
        const { name, type, assetId, purchaseDate, status } = req.body;
        const assetExists = await Asset.findOne({ assetId });
        if (assetExists) {
            return res.status(400).json({ message: 'Asset with this ID already exists' });
        }

        const asset = await Asset.create({name, type, assetId, purchaseDate, status, createdBy: req.user.id});
        res.status(201).json(asset);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getAssets = async (req, res) => {
    try{
        const{status, type, search, page, limit} = req.query;
        let query={};
        //filter by status
        if(status) query.status = status;
        //filetr by type
        if(type) query.type = type;
        //search by name or assetID case insensitive
        if(search){
            query.$or = [
                {name: {$regex:search, $options:'i'}},
                {assetId:{$regex: search, $options:'i'}},
            ];
        }
        //pagination
        if (page || limit) {
            const pageNum = parseInt(page) || 1;
            const limitNum = parseInt(limit) || 10;
            const skip = (pageNum - 1) * limitNum;
            const total = await Asset.countDocuments(query);
            const assets = await Asset.find(query)
                .sort({createdAt:-1})
                .skip(skip)
                .limit(limitNum);
            res.json({
                assets,
                pagination: {total, pages: Math.ceil(total / limitNum),
                    currentPage: pageNum,limit: limitNum
                }
            });
        } else {
            const assets = await Asset.find(query).sort({createdAt:-1});
            res.json(assets);
        }
    }
    catch(e){
        console.error(e);
        res.status(500).json({message:"Server error"});
    }
};

export const getAssetById = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (asset) {
            res.json(asset);
        } else {
            res.status(404).json({ message: 'Asset not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const updateAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (asset) {
            asset.name = req.body.name || asset.name;
            asset.type = req.body.type || asset.type;
            asset.assetId = req.body.assetId || asset.assetId;
            asset.purchaseDate = req.body.purchaseDate || asset.purchaseDate;
            asset.status = req.body.status || asset.status;

            const updatedAsset = await asset.save();
            res.json(updatedAsset);
        } else {
            res.status(404).json({ message: 'Asset not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const deleteAsset = async (req, res) => {
    try {
        const asset = await Asset.findById(req.params.id);

        if (asset) {
            asset.isDeleted = true;
            asset.deletedAt = new Date();
            asset.deletedBy = req.user.id;
            await asset.save();
            res.json({ message: 'Asset removed' });
        } else {
            res.status(404).json({ message: 'Asset not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};
