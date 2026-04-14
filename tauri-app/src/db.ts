import { createRxDatabase, addRxPlugin, RxCollection, RxDatabase } from "rxdb";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBDevModePlugin } from "rxdb/plugins/dev-mode";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { wrappedKeyEncryptionCryptoJsStorage } from "rxdb/plugins/encryption-crypto-js";

addRxPlugin(RxDBDevModePlugin);

const DB_PASSWORD = "d41sy-tub3-l0c4l-encrypt10n-k3y!";

export interface Subscription {
  id: string;
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  isDeleted: boolean;
}

const subscriptionSchema = {
  version: 0,
  primaryKey: "id",
  type: "object" as const,
  properties: {
    id: { type: "string", maxLength: 100 },
    channelId: { type: "string" },
    channelName: { type: "string" },
    channelThumbnail: { type: "string" },
    isDeleted: { type: "boolean" },
  },
  required: ["id", "channelId", "channelName", "channelThumbnail", "isDeleted"],
  encrypted: ["channelId", "channelName", "channelThumbnail"],
};

export type SubscriptionCollection = RxCollection<Subscription>;

type DatabaseCollections = {
  subscriptions: SubscriptionCollection;
};

let dbPromise: Promise<RxDatabase<DatabaseCollections>> | null = null;

export function getDatabase(): Promise<RxDatabase<DatabaseCollections>> {
  if (!dbPromise) {
    dbPromise = createRxDatabase<DatabaseCollections>({
      name: "daisy_invidious_db_v2",
      storage: wrappedKeyEncryptionCryptoJsStorage({
        storage: wrappedValidateAjvStorage({ storage: getRxStorageDexie() }),
      }),
      password: DB_PASSWORD,
      ignoreDuplicate: true,
    }).then(async (db) => {
      await db.addCollections({
        subscriptions: { schema: subscriptionSchema },
      });
      return db;
    });
  }
  return dbPromise;
}
