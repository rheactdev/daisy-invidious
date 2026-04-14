import { getDatabase, Subscription } from "./db";
import {
  getCloudSubscriptions,
  addCloudSubscription,
  deleteCloudSubscription,
  CloudSubscription,
} from "./appwrite";

/**
 * Syncs subscriptions between local RxDB and Appwrite cloud.
 * - Pushes local subs not in cloud → cloud
 * - Pulls cloud subs not in local → local
 * - Removes cloud subs that are soft-deleted locally
 */
export async function syncSubscriptions(userId: string) {
  const db = await getDatabase();

  // Get local active + deleted subs
  const localActive = await db.subscriptions
    .find({ selector: { isDeleted: false } })
    .exec();
  const localDeleted = await db.subscriptions
    .find({ selector: { isDeleted: true } })
    .exec();

  const localActiveSubs = localActive.map((d) => d.toMutableJSON());
  const localDeletedSubs = localDeleted.map((d) => d.toMutableJSON());

  // Get cloud subs
  const cloudSubs = await getCloudSubscriptions();

  const cloudByChannel = new Map<string, CloudSubscription>();
  for (const cs of cloudSubs) {
    cloudByChannel.set(cs.channelId, cs);
  }

  const localActiveByChannel = new Map<string, Subscription>();
  for (const ls of localActiveSubs) {
    localActiveByChannel.set(ls.channelId, ls);
  }

  // Push local active subs to cloud if not already there
  for (const ls of localActiveSubs) {
    if (!cloudByChannel.has(ls.channelId)) {
      await addCloudSubscription(
        ls.channelId,
        ls.channelName,
        ls.channelThumbnail,
        userId
      );
    }
  }

  // Remove cloud subs that were locally deleted
  for (const ls of localDeletedSubs) {
    const cloudDoc = cloudByChannel.get(ls.channelId);
    if (cloudDoc) {
      await deleteCloudSubscription(cloudDoc.$id);
    }
  }

  // Pull cloud subs that aren't in local
  for (const cs of cloudSubs) {
    if (
      !localActiveByChannel.has(cs.channelId) &&
      !localDeletedSubs.some((d) => d.channelId === cs.channelId)
    ) {
      await db.subscriptions.upsert({
        id: cs.channelId,
        channelId: cs.channelId,
        channelName: cs.channelName,
        channelThumbnail: cs.channelThumbnail || "",
        isDeleted: false,
      });
    }
  }
}
