import Asset from "../models/Asset.js";
import Assignment from "../models/Assignment.js";

export const createAsset = async (req, res) => {
  try {
    const { name, type, purchaseDate, status } = req.body;
    let { assetId } = req.body;

    if (purchaseDate) {
      const purchaseDateVal = new Date(purchaseDate);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (purchaseDateVal > today) {
        return res
          .status(400)
          .json({ message: "Purchase date cannot be in the future" });
      }
    }

    if (!assetId || assetId.trim() === "") {
      const prefix = (type || "GEN").slice(0, 3).toUpperCase();
      const count = await Asset.countDocuments({ type });
      let seq = count + 1;
      assetId = `${prefix}-${String(seq).padStart(3, "0")}`;
      // Double check uniqueness
      let assetExists = await Asset.findOne({ assetId, isDeleted: false });
      while (assetExists) {
        seq++;
        assetId = `${prefix}-${String(seq).padStart(3, "0")}`;
        assetExists = await Asset.findOne({ assetId, isDeleted: false });
      }
    } else {
      const assetExists = await Asset.findOne({ assetId, isDeleted: false });
      if (assetExists) {
        return res
          .status(400)
          .json({ message: "Asset with this ID already exists" });
      }
    }

    const asset = await Asset.create({
      name,
      type,
      assetId,
      purchaseDate,
      status,
      createdBy: req.user.id,
    });
    res.status(201).json(asset);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssets = async (req, res) => {
  try {
    const { status, type, search, page, limit } = req.query;
    let query = {};
    //filter by status
    if (status) query.status = status;
    //filetr by type
    if (type) query.type = type;
    //search by name or assetID case insensitive
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { assetId: { $regex: search, $options: "i" } },
      ];
    }

    let assets;
    let total = 0;
    let pageNum = 1;
    let limitNum = 10;

    if (page || limit) {
      pageNum = parseInt(page) || 1;
      limitNum = parseInt(limit) || 10;
      const skip = (pageNum - 1) * limitNum;
      total = await Asset.countDocuments(query);
      assets = await Asset.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    } else {
      assets = await Asset.find(query).sort({ createdAt: -1 });
    }

    // Find active assignments for these assets
    const assetIds = assets.map((a) => a._id);
    const activeAssignments = await Assignment.find({
      assetId: { $in: assetIds },
      returnedDate: null,
      isDeleted: false,
    }).populate({
      path: "employeeId",
      select: "name department userId",
      populate: {
        path: "userId",
        select: "userId email",
      },
    });

    const assignmentMap = {};
    activeAssignments.forEach((assign) => {
      if (assign.assetId && assign.employeeId) {
        assignmentMap[assign.assetId.toString()] = assign.employeeId;
      }
    });

    const assetsWithAssignments = assets.map((asset) => {
      const assetObj = asset.toObject();
      assetObj.assignedTo = assignmentMap[asset._id.toString()] || null;
      return assetObj;
    });

    if (page || limit) {
      res.json({
        assets: assetsWithAssignments,
        pagination: {
          total,
          pages: Math.ceil(total / limitNum),
          currentPage: pageNum,
          limit: limitNum,
        },
      });
    } else {
      res.json(assetsWithAssignments);
    }
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (asset) {
      const activeAssignment = await Assignment.findOne({
        assetId: asset._id,
        returnedDate: null,
        isDeleted: false,
      }).populate({
        path: "employeeId",
        select: "name department userId",
        populate: {
          path: "userId",
          select: "userId email",
        },
      });
      const assetObj = asset.toObject();
      assetObj.assignedTo = activeAssignment
        ? activeAssignment.employeeId
        : null;
      res.json(assetObj);
    } else {
      res.status(404).json({ message: "Asset not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (asset) {
      asset.name = req.body.name || asset.name;
      asset.type = req.body.type || asset.type;
      asset.assetId = req.body.assetId || asset.assetId;
      if (req.body.purchaseDate) {
        const purchaseDateVal = new Date(req.body.purchaseDate);
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        if (purchaseDateVal > today) {
          return res
            .status(400)
            .json({ message: "Purchase date cannot be in the future" });
        }
        asset.purchaseDate = req.body.purchaseDate;
      }
      asset.status = req.body.status || asset.status;

      const updatedAsset = await asset.save();

      const activeAssignment = await Assignment.findOne({
        assetId: updatedAsset._id,
        returnedDate: null,
        isDeleted: false,
      }).populate({
        path: "employeeId",
        select: "name department userId",
        populate: {
          path: "userId",
          select: "userId email",
        },
      });
      const assetObj = updatedAsset.toObject();
      assetObj.assignedTo = activeAssignment
        ? activeAssignment.employeeId
        : null;
      res.json(assetObj);
    } else {
      res.status(404).json({ message: "Asset not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
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
      res.json({ message: "Asset removed" });
    } else {
      res.status(404).json({ message: "Asset not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAssetCategories = async (req, res) => {
  try {
    const categories = await Asset.distinct("type");
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};
