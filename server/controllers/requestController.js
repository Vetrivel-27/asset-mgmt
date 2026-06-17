import Request from "../models/Request.js";
import Employee from "../models/Employee.js";
import User from "../models/User.js";
import sendEmail from "../utils/sendEmail.js";

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

    if (requestedAssetId) {
      const pendingRequest = await Request.findOne({
        userId: req.user.id,
        requestedAssetId,
        status: "pending"
      });
      if (pendingRequest) {
        return res.status(400).json({
          message: "You already have a pending request for this asset."
        });
      }

      const latestRequest = await Request.findOne({
        userId: req.user.id,
        requestedAssetId
      }).sort({ createdAt: -1 });

      if (latestRequest && latestRequest.status === "rejected") {
        const T_reject = latestRequest.updatedAt || latestRequest.createdAt;
        const Assignment = (await import("../models/Assignment.js")).default;
        const assignedToSomeoneElse = await Assignment.findOne({
          assetId: requestedAssetId,
          userId: { $ne: req.user.id },
          assignedDate: { $gt: T_reject }
        });

        if (!assignedToSomeoneElse) {
          return res.status(400).json({
            message: "You cannot request this asset again until it has been assigned to and returned by another user."
          });
        }
      }
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
      userId: req.user.id,
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
                `Hello ${approver.displayName || "Approver"},\n\n` +
                `User ${user.displayName} has requested to borrow the asset "${assetName || assetType}" (Reason: ${reason || "Not specified"}).\n\n` +
                `Please log in to the Asset Management System to approve or reject this request.\n\n` +
                `Regards,\nAsset Management System`,
              html:
                `<p>Hello ${approver.displayName || "Approver"},</p>` +
                `<p>User <strong>${user.displayName}</strong> has requested to borrow the asset <strong>"${assetName || assetType}"</strong>.</p>` +
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
    const requests = await Request.find({ userId: req.user.id })
      .populate("assignedAssetId", "name assetId")
      .populate("requestedAssetId", "name assetId type")
      .populate({
        path: "statusChangedBy",
        select: "displayName email",
        populate: { path: "employeeProfile", select: "employeeId department" }
      })
      .sort({ createdAt: -1 })
      .lean();

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
        path: "userId",
        select: "displayName email",
        populate: { path: "employeeProfile", select: "employeeId department" },
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
    request.statusChangedBy = req.user.id;
    
    // Fetch the user to get their email address for notification
    const userReq = await User.findById(request.userId).populate("role");
    if (!userReq) {
        return res.status(404).json({ message: "Request user not found." });
    }

    let assetName = "the requested asset";
    if (status === "approved" && assignedAssetId) {
      if (userReq.role && userReq.role.name.toLowerCase() === "admin") {
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
      
      assetName = asset.name || "the requested asset";

      request.assignedAssetId = assignedAssetId;

      // Automatically create assignment when approved
      await Assignment.create({
        assetId: assignedAssetId,
        userId: request.userId,
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
          $set: { status: "rejected", statusChangedBy: req.user.id },
        },
      );
    }
    await request.save();

    // Send email notification to the borrower
    if (status === "approved" || status === "rejected") {
      try {
        const subject = status === "approved" 
          ? `Your Asset Request has been Approved` 
          : `Your Asset Request has been Rejected`;
          
        const text = status === "approved"
          ? `Hello ${userReq.displayName || 'User'},\n\nYour request for ${assetName} has been approved. The asset has been assigned to you.\n\nThank you,\nAsset Management Team`
          : `Hello ${userReq.displayName || 'User'},\n\nUnfortunately, your request for ${assetName} has been rejected.\n\nThank you,\nAsset Management Team`;

        await sendEmail({
          email: userReq.email,
          subject,
          text,
        });
      } catch (emailError) {
        console.error("Failed to send status update email:", emailError);
        // Do not fail the whole request just because the email failed
      }
    }

    res.status(200).json({ message: `Request ${status}`, request });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Server error" });
  }
};
