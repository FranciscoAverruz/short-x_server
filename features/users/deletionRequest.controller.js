const { deleteAccounts } = require('./deleteUserAccount.controller.js');
const User = require('./User.model');
const Subscription = require('../subscriptions/Subscription.model.js');
const { deleteUrlsInBatches } = require('../../utils/urlUtils.js');

async function requestAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const requester = req.user;
    const { deletionTimeInHours, actionChoice } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "InvalidRequest", message: "User ID is required." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "UserNotFound", message: "User not found." });
    }

    const subscription = await Subscription.findOne({ user: userId });
    
    if (subscription && subscription.status === "pending" && actionChoice !== "proceedImmediately") {
      return res.status(400).json({
        error: "CancellationPending",
        message: "The subscription cancellation is pending. You can either wait for the cancellation or choose to delete your account immediately within 24 hours."
      });
    }

    if (deletionTimeInHours !== undefined && deletionTimeInHours < 0) {
      return res.status(400).json({ error: "InvalidDeletionTime", message: "Deletion time must be a positive number." });
    }

    // ADMIN ************************************************************************************************
    if (requester.isAdmin) {
      if (deletionTimeInHours && deletionTimeInHours > 0) {
        // schedules account deletion
        const deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() + deletionTimeInHours);

        user.scheduledForDeletion = deletionTime;
        user.isCancellationPending = true;
        user.cancellationRequestedAt = new Date();
        await user.save();

        let deletedUrlsCount = 0;
        if (Array.isArray(user.urls) && user.urls.length > 0) {
          deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
        }

        return res.status(200).json({
          error: "",
          message: `Account deletion scheduled for ${deletionTime.toISOString()} along with ${deletedUrlsCount} associated URLs.`,
        });
      } else {
        // Immediate account deletion
        await deleteAccounts(req, res);

        return res.status(200).json({
          error: "",
          message: "Account immediately deleted by admin.",
        });
      }
    }

    // REGULAR USER - DELETION IN 24 HOURS ****************************************************************************
    const deletionTime = new Date();
    if (!deletionTimeInHours || deletionTimeInHours <= 0) {
      deletionTime.setHours(deletionTime.getHours() + 24); 
    } else {
      deletionTime.setHours(deletionTime.getHours() + deletionTimeInHours);
    }

    // users decides to procede with cancelation when subscription cancelation is still pending
    if (actionChoice === "proceedImmediately") {
      user.scheduledForDeletion = deletionTime;
      user.isCancellationPending = true;
      user.cancellationRequestedAt = new Date();
      await user.save();

      let deletedUrlsCount = 0;
      if (Array.isArray(user.urls) && user.urls.length > 0) {
        deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
        console.log(`Total ${deletedUrlsCount} associated URLs deleted.`);
      }

      return res.status(200).json({
        error: "",
        message: `Account deletion scheduled for ${deletionTime.toISOString()} (within the specified time).`
      });
    } else {
      // Waits until susbsctiption cancelation is complete (if status pending)
      return res.status(200).json({
        error: "",
        message: "You chose to wait for the cancellation of your subscription. Your account will be deleted once the subscription is cancelled."
      });
    }

  } catch (err) {
    console.error("Error scheduling user deletion:", err);
    return res.status(500).json({ error: "SERVER_ERROR", message: "Failed to process account deletion request." });
  }
}

module.exports = { requestAccountDeletion };