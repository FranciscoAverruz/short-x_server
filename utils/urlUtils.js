const Url = require("../features/urls/Url.model"); 

const BATCH_SIZE = 100;

async function deleteUrlsInBatches(urlIds) {
  let totalDeleted = 0;
  const totalUrls = urlIds.length;

  while (urlIds.length > 0) {
    const batch = urlIds.splice(0, BATCH_SIZE);
    const result = await Url.deleteMany({ _id: { $in: batch } });
    totalDeleted += result.deletedCount;

    console.log(`Deleted ${result.deletedCount} URLs. ${totalUrls - totalDeleted} remaining.`);
  }

  return totalDeleted;
}

module.exports = {
  deleteUrlsInBatches,
};
