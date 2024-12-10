const User = require('../users/User.model.js');

// 1. Request account deletion to be processed in 24 hours.
async function requestAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

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
    res.status(200).json({ message: "Account deletion scheduled within 24 hours." });
  } catch (err) {
    console.log("Failed to schedule user deletion:", err);
    res.status(400).json({ error: err.message });
  }
}

// 2. Cancel account deletion before the 24 hours expire.
async function cancelAccountDeletion(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (!user.isCancellationPending) {
      return res.status(400).json({ message: "No hay eliminación programada para este usuario." });
    }

    user.scheduledForDeletion = null;
    user.isCancellationPending = false;
    user.cancellationRequestedAt = null;

    await user.save();

    console.log("Eliminación cancelada para el usuario: ", user);
    res.status(200).json({ message: "Cancelación de eliminación completada" });
  } catch (err) {
    console.log("Error al cancelar la eliminación del usuario: ", err);
    res.status(400).json({ error: err.message });
  }
}

// 3. Permanently delete the account (after 24 hours).
async function deleteAccount(req, res) {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    const now = new Date();
    if (!user.isCancellationPending || user.scheduledForDeletion > now) {
      return res.status(400).json({ message: "No es el momento para eliminar la cuenta o la eliminación ha sido cancelada." });
    }

    await user.remove();
    console.log("Usuario eliminado: ", user);

    res.status(200).json({ message: "Cuenta eliminada de manera definitiva." });
  } catch (err) {
    console.log("Error al eliminar la cuenta del usuario: ", err);
    res.status(400).json({ error: err.message });
  }
}

module.exports = {
  requestAccountDeletion,
  cancelAccountDeletion,
  deleteAccount,
};
