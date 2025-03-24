const User = require("./User.model.js");
const { deleteUrlsInBatches } = require("../../utils/urlUtils.js");

// Cancels account deletion before the 24 hours expiration ************************
async function cancelAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    if (!user.isCancellationPending) {
      return res
        .status(400)
        .json({ message: "No scheduled deletion for this user." });
    }

    user.scheduledForDeletion = null;
    user.isCancellationPending = false;
    user.cancellationRequestedAt = null;

    await user.save();

    res.status(200).json({ message: "Deletion canceled successfully." });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}
// Permanently deletes the account (after 24 hours) *******************************
async function deleteAccounts(req, res) {
  try {
    const batchSize = 10;
    const now = new Date();
    let totalDeletedUrlsCount = 0;
    let totalDeletedUsersCount = 0;

    let usersToDelete = await User.find({
      isCancellationPending: true,
      scheduledForDeletion: { $lte: now },
    })
      .populate("subscription")
      .limit(batchSize);

    while (usersToDelete.length > 0) {
      for (const user of usersToDelete) {
        let deletedUrlsCount = 0;

        // Handles subscription cancellation if it exists
        if (user.subscription && user.subscription.status !== "cancelled") {
          try {
            await stripe.subscriptions.del(
              user.subscription.stripeSubscriptionId
            );

            await Subscription.findByIdAndUpdate(user.subscription._id, {
              status: "cancelled",
              stripeSubscriptionId: null,
              cancellationDate: now,
            });
          } catch (error) {
            console.error(
              `Error cancelando suscripción de usuario ${user._id}:`,
              error
            );
            continue;
          }
        }

        // Deletes associated URLs
        if (user.urls && user.urls.length > 0) {
          deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
        }

        // Deletes user after subscription cancelation
        await user.remove();

        totalDeletedUrlsCount += deletedUrlsCount;
        totalDeletedUsersCount++;
      }

      usersToDelete = await User.find({
        isCancellationPending: true,
        scheduledForDeletion: { $lte: now },
      })
        .populate("subscription")
        .skip(totalDeletedUsersCount)
        .limit(batchSize);
    }

    res.status(200).json({
      message: `${totalDeletedUsersCount} account(s) permanently deleted along with ${totalDeletedUrlsCount} associated URLs.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  cancelAccountDeletion,
  deleteAccounts,
};
