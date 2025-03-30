const User = require("./User.model.js");
const { deleteUrlsInBatches } = require("../../utils/urlUtils.js");
const stripe = require("../../config/stripe.js")
const Subscription = require('../subscriptions/Subscription.model.js');

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
    res.status(400).json({ error: "Error while completing the process"});
  }
}
// Permanently deletes the account (after 24 hours) *******************************
async function deleteAccounts(req, res) {
  const userId = req.params.id;
  const requester = req.user;
  console.log("<<---- userId definite accCancelation ------->>", userId)
  console.log("<<---- requester definite accCancelation ---->>", requester)

  try {
    const batchSize = 10;
    const now = new Date();
    let totalDeletedUrlsCount = 0;
    let totalDeletedUsersCount = 0;

    if (!requester || !requester.isAdmin) {
      return res.status(403).json({error:"ACCESS_DENIED", message:"Acceso Denegado. no eres Administrador"})
    }

    let usersToDelete = [];

    if (userId) {
      const user = await User.findById(userId).populate("subscription");
      if (!user) {
        return res.status(404).json({error:"USER_NOT_FOUND", message:"Usuario no encontrado"});
      }
      usersToDelete = [user];
    } else {
    usersToDelete = await User.find({
      isCancellationPending: true,
      scheduledForDeletion: { $lte: now },
    })
      .populate("subscription")
      .limit(batchSize);
  }

    while (usersToDelete.length > 0) {
      for (const user of usersToDelete) {
        let deletedUrlsCount = 0;

        // Handles subscription cancellation if it exists
        if (user.subscription && user.subscription.status !== "cancelled") {
          try {
            await stripe.subscriptions.cancel(user.subscription.stripeSubscriptionId);

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
        try {
          await User.deleteOne({ _id: user._id });
        } catch (err) {
          console.error(`Error eliminando usuario ${user._id}:`);
        }

        totalDeletedUrlsCount += deletedUrlsCount;
        totalDeletedUsersCount++;
      }

      if (userId) break;

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
  console.error("Error en deleteAccounts:");
    res.status(500).json({ error: "Error eliminando cuentas" });
  }
}

module.exports = {
  cancelAccountDeletion,
  deleteAccounts,
};
