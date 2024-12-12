const Url = require("../features/urls/Url.model"); // Asegúrate de tener la ruta correcta al modelo

const BATCH_SIZE = 100; // Tamaño del lote

async function deleteUrlsInBatches(urlIds) {
  let totalDeleted = 0;
  const totalUrls = urlIds.length;

  // Mientras queden URLs por eliminar
  while (urlIds.length > 0) {
    const batch = urlIds.splice(0, BATCH_SIZE); // Extrae el siguiente lote de IDs
    const result = await Url.deleteMany({ _id: { $in: batch } });
    totalDeleted += result.deletedCount;

    console.log(`Deleted ${result.deletedCount} URLs. ${totalUrls - totalDeleted} remaining.`);
  }

  return totalDeleted;
}

module.exports = {
  deleteUrlsInBatches,
};
