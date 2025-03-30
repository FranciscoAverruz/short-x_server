const { deleteAccounts } = require("./deleteUserAccount.controller.js");
const User = require("./User.model");
const Subscription = require("../subscriptions/Subscription.model.js");
const { deleteUrlsInBatches } = require("../../utils/urlUtils.js");

async function requestAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const requester = req.user;
    const { deletionScheduled, actionChoice } = req.body;

    console.log("<<<--------- userId Deletion Request ---------------------->>> ", userId);
    console.log("<<<--------- requester Deletion Request ------------------->>> ", requester);
    console.log("<<<--------- deletionScheduled Deletion Request ----------->>> ", deletionScheduled);
    console.log("<<<--------- actionChoice Deletion Request ---------------->>> ", actionChoice);

    if (!userId) {
      return res
        .status(400)
        .json({ error: "InvalidRequest", message: "User ID is required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res
        .status(404)
        .json({ error: "UserNotFound", message: "User not found." });
    }

    let deletionTime;

    if (typeof deletionScheduled === "number"){
      if(deletionScheduled > 0) {
        deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() + deletionScheduled);
      } else if (deletionScheduled <= 0) {
        deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() + 24);
      }
    } else if (!isNaN(Date.parse(deletionScheduled))) {
      deletionTime = new Date(deletionScheduled)
    } else {
      return res.status(400).json({
        error: "INVALID_DELETION_TIIME",
        message: "Invalid deletion time format"
      });
  }

    // ADMIN ************************************************************************************************
    if (requester.isAdmin){
      if (actionChoice === "cancelNow"){
        await deleteAccounts(req, res); // Immediate account deletion
        return;
      }
      user.scheduledForDeletion = deletionTime;
      user.isCancellationPending = true;
      user.cancellationRequestedAt = new Date();
      await user.save();

      return res.status(200).json({
        error: "",
        message: `Account deletion scheduled for ${deletionTime.toISOString()}`,
      });
    }

    // REGULAR USER - DELETION IN 24 HOURS ****************************************************************************
    if (!requester.isAdmin) {
        user.scheduledForDeletion = deletionTime;
        user.isCancellationPending = true;
        user.cancellationRequestedAt = new Date();
      
        await user.save();

      return res.status(200).json({
        error: "",
        message: `Account deletion scheduled for ${deletionTime.toISOString()} (within the specified time).`
      });
  }
} catch (err) {
    console.error("Error scheduling user deletion:");
    return res
      .status(500)
      .json({
        error: "SERVER_ERROR",
        message: "Failed to process account deletion request.",
      });
  }
}

module.exports = { requestAccountDeletion };