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
async function deleteAccount(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    if (!user.isCancellationPending || user.scheduledForDeletion > now) {
      return res.status(400).json({ message: "It is not yet time to delete the account, or the deletion has been canceled." });
    }

    // Eliminar las URLs asociadas en lotes
    let deletedUrlsCount = 0;
    if (user.urls && user.urls.length > 0) {
      deletedUrlsCount = await deleteUrlsInBatches([...user.urls]); // Usar la función desde utils
      console.log(`Total ${deletedUrlsCount} associated URLs deleted.`);
    }

    // Eliminar el usuario de la base de datos
    await user.remove();
    console.log("User account deleted: ", user);

    res.status(200).json({ message: `Account permanently deleted along with ${deletedUrlsCount} associated URLs.` });
  } catch (err) {
    console.log("Error deleting the user's account:", err);
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  cancelAccountDeletion,
  deleteAccount,
};
