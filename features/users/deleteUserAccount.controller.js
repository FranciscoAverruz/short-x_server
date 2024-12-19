const User = require('./User.model.js');
const { deleteUrlsInBatches } = require('../../utils/urlUtils.js'); // Importa la función

// Cancel account deletion before the 24 hours expire.
async function cancelAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not Found" });
    }

    if (!user.isCancellationPending) {
      return res.status(400).json({ message: "No scheduled deletion for this user." });
    }

    user.scheduledForDeletion = null;
    user.isCancellationPending = false;
    user.cancellationRequestedAt = null;

    await user.save();

    console.log("Deletion canceled for the user: ", user);
    res.status(200).json({ message: "Deletion canceled successfully." });
  } catch (err) {
    console.log("Error canceling the user's account deletion:", err);
    res.status(400).json({ error: err.message });
  }
}
// Permanently delete the account (after 24 hours).
async function deleteAccounts(req, res) {
  try {
    const batchSize = 10;
    const now = new Date();
    let totalDeletedUrlsCount = 0;
    let totalDeletedUsersCount = 0;

    let usersToDelete = await User.find({
      isCancellationPending: true,
      scheduledForDeletion: { $lte: now },
    }).limit(batchSize);

    while (usersToDelete.length > 0) {
      console.log(`Processing batch of ${usersToDelete.length} users...`);

      for (const user of usersToDelete) {
        let deletedUrlsCount = 0;
        if (user.urls && user.urls.length > 0) {
          deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
          console.log(`Total ${deletedUrlsCount} associated URLs deleted for user ${user._id}.`);
        }

        await user.remove();
        console.log(`User account ${user._id} deleted.`);

        totalDeletedUrlsCount += deletedUrlsCount;
        totalDeletedUsersCount++;
      }

      usersToDelete = await User.find({
        isCancellationPending: true,
        scheduledForDeletion: { $lte: now },
      }).skip(totalDeletedUsersCount).limit(batchSize);
    }

    res.status(200).json({
      message: `${totalDeletedUsersCount} account(s) permanently deleted along with ${totalDeletedUrlsCount} associated URLs.`,
    });
  } catch (err) {
    console.log("Error deleting the users' accounts:", err);
    res.status(500).json({ error: err.message });
  }
}


module.exports = {
  cancelAccountDeletion,
  deleteAccounts,
};
