const User = require('./User.model');
const { deleteUrlsInBatches } = require('../../utils/urlUtils.js');

async function requestAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const requester = req.user;
    const user = await User.findById(userId);
    const { deletionTimeInHours } = req.body;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

     if (deletionTimeInHours < 0) {
      return res.status(400).json({ message: "Invalid deletion time." });
    }

    if (requester.isAdmin) {
      // If the administrator decides to schedule the deletion
      if (deletionTimeInHours && deletionTimeInHours > 0) {
        const deletionTime = new Date();
        deletionTime.setHours(deletionTime.getHours() + deletionTimeInHours);

        user.scheduledForDeletion = deletionTime;
        user.isCancellationPending = true;
        user.cancellationRequestedAt = new Date();
        await user.save();

        console.log("Admin scheduled user account deletion for:", deletionTime);

        // Delete the associated URLs in batches 
        let deletedUrlsCount = 0;
        if (user.urls && user.urls.length > 0) {
          deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
          console.log(`Total ${deletedUrlsCount} associated URLs deleted.`);
        }

        return res.status(200).json({
          message: `Account deletion scheduled for ${deletionTime.toISOString()} along with ${deletedUrlsCount} associated URLs.`,
        });
      } else {
        // If the administrator decides to delete the account immediately.
        let deletedUrlsCount = 0;
        if (user.urls && user.urls.length > 0) {
          deletedUrlsCount = await deleteUrlsInBatches([...user.urls]); // Eliminar en lotes
          console.log(`Total ${deletedUrlsCount} associated URLs deleted.`);
        }

        await user.remove();
        console.log("User account immediately deleted by admin: ", user);

        return res.status(200).json({ message: `Account immediately deleted by admin along with ${deletedUrlsCount} associated URLs.` });
      }
    }

    // scheduled deletion in 24 hours for non-administrator users
    if (user.isCancellationPending) {
      return res.status(400).json({ message: "Account deletion is already in progress." });
    }

    const deletionTime = new Date();
    deletionTime.setHours(deletionTime.getHours() + 24);

    user.scheduledForDeletion = deletionTime;
    user.isCancellationPending = true;
    user.cancellationRequestedAt = new Date();

    await user.save();

    console.log("User account deletion scheduled for: ", user);

    let deletedUrlsCount = 0;
    if (user.urls && user.urls.length > 0) {
      deletedUrlsCount = await deleteUrlsInBatches([...user.urls]);
      console.log(`Total ${deletedUrlsCount} associated URLs deleted.`);
    }

    res.status(200).json({
      message: `Account deletion scheduled within 24 hours along with ${deletedUrlsCount} associated URLs.`,
    });
  } catch (err) {
    console.log("Failed to schedule user deletion:", err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = { requestAccountDeletion };