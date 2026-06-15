import Request from "../models/Request.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";

//creation by employee
export const createRequest = async (req, res) => {
  try {
    const { requestedAssetId, reason, tentativeReturnDate } = req.body;
    if (tentativeReturnDate) {
      const dateVal = new Date(tentativeReturnDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dateVal < today) {
        return res
          .status(400)
          .json({ message: "Return date cannot be in the past" });
      }
    }

    const user = await User.findById(req.user.id).populate("role");
    if (user && user.role && user.role.name.toLowerCase() === "admin") {
      return res.status(403).json({ message: "Users with Admin roles cannot request to borrow assets." });
    }

    const employee = await Employee.findOne({
      userId: req.user.id,
    });
    if (!employee) {
      return res.status(404).json({
        message: "Employee profile not found for this user",
      });
    }

    let assetType = req.body.assetType || "General";
    let assetName = "";
    if (requestedAssetId) {
      const Asset = (await import("../models/Asset.js")).default;
      const asset = await Asset.findById(requestedAssetId);
      if (asset) {
        assetType = asset.type;
        assetName = asset.name;
      }
    }

    const newRequest = await Request.create({
      employeeId: employee._id,
      assetType,
      requestedAssetId: requestedAssetId || null,
      reason: reason || `Requested to borrow ${assetName || assetType}`,
      tentativeReturnDate: tentativeReturnDate
        ? new Date(tentativeReturnDate)
        : null,
    });

    // Send Email to all users who have the 'approve_borrow' permission
    try {
      const Permission = (await import("../models/Permission.js")).default;
      const Role = (await import("../models/Role.js")).default;
      const User = (await import("../models/User.js")).default;
      const sendEmail = (await import("../utils/sendEmail.js")).default;

      const permission = await Permission.findOne({ name: "approve_borrow" });
      if (permission) {
        const roles = await Role.find({ permissions: permission._id });
        const roleIds = roles.map((r) => r._id);
        const approvers = await User.find({
          role: { $in: roleIds },
          isDeleted: { $ne: true },
        });

        const emailPromises = approvers.map((approver) => {
          if (approver.email) {
            return sendEmail({
              email: approver.email,
              subject: `New Borrow Request: ${assetName || assetType}`,
              text:
                `Hello ${approver.userId || "Approver"},\n\n` +
                `Employee ${employee.name} has requested to borrow the asset "${assetName || assetType}" (Reason: ${reason || "Not specified"}).\n\n` +
                `Please log in to the Asset Management System to approve or reject this request.\n\n` +
                `Regards,\nAsset Management System`,
              html:
                `<p>Hello ${approver.userId || "Approver"},</p>` +
                `<p>Employee <strong>${employee.name}</strong> has requested to borrow the asset <strong>"${assetName || assetType}"</strong>.</p>` +
                `<p><strong>Reason:</strong> ${reason || "Not specified"}</p>` +
                `<p>Please log in to the Asset Management System to approve or reject this request.</p>` +
                `<p>Regards,<br>Asset Management System</p>`,
            }).catch((err) =>
              console.error(`Failed to send email to ${approver.email}:`, err),
            );
          }
        });
        await Promise.all(emailPromises);
      }
    } catch (mailError) {
      console.error(
        "Failed to send notification emails to approvers:",
        mailError,
      );
    }

    res.status(201).json({
      message: "Request submitted",
      request: newRequest,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

//employee request history
export const getMyRequests = async (req, res) => {
  try {
    const employee = await Employee.findOne({ userId: req.user.id });
    if (!employee) {
      return res.status(404).json({ message: "Employee not found." });
    }
    const requests = await Request.find({ employeeId: employee._id })
      .populate("assignedAssetId", "name assetId")
      .populate("requestedAssetId", "name assetId type")
      .sort({ createdAt: -1 });
    res.status(200).json({ requests });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

//view all employee req
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find({})
      .populate({
        path: "employeeId",
        select: "name department",
        populate: { path: "userId", select: "userId email" },
      })
      .populate("assignedAssetId", "name assetId")
      .populate("requestedAssetId", "name assetId type")
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};

//admin approval/rejection
export const updateRequestStatus = async (req, res) => {
  try {
    const { status, assignedAssetId } = req.body;
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }
    request.status = status;
    if (status === "approved" && assignedAssetId) {
      const employee = await Employee.findById(request.employeeId).populate({
        path: "userId",
        populate: { path: "role" }
      });
      if (employee && employee.userId && employee.userId.role && employee.userId.role.name.toLowerCase() === "admin") {
        return res.status(400).json({ message: "Assets cannot be assigned to users with Admin roles." });
      }

      const Assignment = (await import("../models/Assignment.js")).default;
      const Asset = (await import("../models/Asset.js")).default;

      const asset = await Asset.findById(assignedAssetId);
      if (!asset) {
        return res.status(404).json({ message: "Selected asset not found." });
      }
      if (asset.status !== "available") {
        return res
          .status(400)
          .json({
            message:
              "Asset is no longer available. It may have been assigned to someone else.",
          });
      }

      request.assignedAssetId = assignedAssetId;

      // Automatically create assignment when approved
      await Assignment.create({
        assetId: assignedAssetId,
        employeeId: request.employeeId,
        assignedDate: new Date(),
        tentativeReturnDate: request.tentativeReturnDate,
        createdBy: req.user.id,
      });

      // Update asset status to 'assigned'
      asset.status = "assigned";
      await asset.save();

      // Automatically reject other pending requests for this same specific asset
      await Request.updateMany(
        {
          _id: { $ne: request._id },
          requestedAssetId: assignedAssetId,
          status: "pending",
        },
        {
          $set: { status: "rejected" },
        },
      );
    }
    await request.save();
    res.status(200).json({ message: `Request ${status}`, request });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
